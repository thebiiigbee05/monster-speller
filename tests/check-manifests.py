# -*- coding: utf-8 -*-
"""ตรวจ manifest สไปรต์ทั้งหมดใน public/assets/sprites — ใช้ใน CI และ dev

ตรวจ 3 อย่างต่อ manifest:
  1. Schema ถูกต้อง (asset/frameSize/frames/frameFiles มีครบ, ชนิดถูก)
  2. ไฟล์เฟรมทุกตัวใน frameFiles มีอยู่จริง (ไม่ broken reference)
  3. จำนวนไฟล์จริงในโฟลเดอร์ = จำนวนใน frameFiles (ไม่มี orphan/หาย)

วิธีรัน:
  ./.venv-scripts/Scripts/python.exe tests/check-manifests.py   # หรือ python3
  exit 0 = ผ่าน · exit 1 = มีปัญหา

ข้ามโฟลเดอร์ที่ขึ้นต้นด้วย '.' (เช่น .git) และโฟลเดอร์ซ่อนอื่น ๆ
"""
import json
import os
import sys

# บังคับ utf-8 สำหรับ stdout/stderr — กัน UnicodeEncodeError (cp1252 บน Windows)
try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

# กัน UnicodeEncodeError บนคอนโซล cp1252 (Windows) — ถ้า encode ไทย/emoji ไม่ได้
# ให้ถอยไปใช้ ASCII แทน (ผลการตรวจไม่เปลี่ยน)
_ENC = getattr(sys.stdout, 'encoding', None) or 'utf-8'
if _ENC.lower().replace('-', '') in ('cp1252', 'latin1', 'iso88591'):
    _OK, _BAD, _WARN = '[OK]', '[FAIL]', '[WARN]'
else:
    _OK, _BAD, _WARN = '✅', '❌', '⚠'

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPRITES_DIR = os.path.join(ROOT, "public", "assets", "sprites")

REQUIRED = {
    "asset": str,
    "source": str,
    "frameSize": int,
    "frames": int,
    "frameFiles": list,
}


def find_manifests():
    """หา <name>.json ทุกตัวใต้ sprites/ (ลึกสุด 3 ชั้น, ข้ามโฟลเดอร์ซ่อน)"""
    found = []
    for dirpath, dirnames, filenames in os.walk(SPRITES_DIR):
        dirnames[:] = [d for d in dirnames if not d.startswith(".")]
        for fn in filenames:
            if fn.endswith(".json"):
                found.append(os.path.join(dirpath, fn))
    return sorted(found)


def check_one(path):
    """คืน (errors, warnings) สำหรับ manifest ไฟล์เดียว"""
    errors, warnings = [], []
    try:
        with open(path, "r", encoding="utf-8") as fh:
            m = json.load(fh)
    except (OSError, json.JSONDecodeError) as e:
        return [f"JSON อ่านไม่ได้: {e}"], []

    if not isinstance(m, dict):
        return ["manifest ต้องเป็น JSON object"], []

    if "frameFiles" not in m:
        return [], ["ไม่ใช่ schema AI (ไม่มี frameFiles) — ข้าม (sheet เก่า)"]

    for key, typ in REQUIRED.items():
        if key not in m:
            errors.append(f"ขาดคีย์ '{key}'")
        elif not isinstance(m[key], typ):
            errors.append(f"คีย์ '{key}' ต้องเป็น {typ.__name__} (ได้ {type(m[key]).__name__})")

    if errors:
        return errors, warnings

    # frameFiles ต้องเป็น list ของ str
    bad = [f for f in m["frameFiles"] if not isinstance(f, str)]
    if bad:
        errors.append(f"frameFiles มีสมาชิกไม่ใช่ string: {bad[:3]}")

    # ไฟล์เฟรมทุกตัวต้องมีอยู่จริง
    base = os.path.dirname(path)
    missing = [f for f in m["frameFiles"] if not os.path.isfile(os.path.join(base, f))]
    if missing:
        errors.append(f"อ้างไฟล์ที่ไม่มีอยู่: {missing[:5]}")
    elif len(m["frameFiles"]) != m["frames"]:
        errors.append(f"frames={m['frames']} แต่ frameFiles มี {len(m['frameFiles'])} ตัว")

    # ไม่มี orphan: ไฟล์ png ในโฟลเดอร์ต้องถูกอ้างใน frameFiles หมด
    name = m["asset"]
    expected = set(m["frameFiles"])
    pngs = {f for f in os.listdir(base) if f.endswith(".png")}
    orphan = sorted(pngs - expected)
    if orphan:
        warnings.append(f"เฟรม orphan (manifest ไม่ได้อ้าง): {orphan[:5]}")

    # rows×cols ควรสอดคล้อง (อนุญาต 1×N เมื่อ dedupe ตัดเหลือท่าจริง)
    if m["rows"] and m["cols"] and m["rows"] * m["cols"] != m["frames"]:
        warnings.append(f"rows×cols ({m['rows']}×{m['cols']}={m['rows']*m['cols']}) "
                        f"ไม่เท่า frames ({m['frames']}) — หลัง dedupe/กรองได้")

    # poseMap (ถ้ามี): ทุกท่าอ้างเฟรมที่อยู่จริง + จำนวนท่าครบ/เตือน
    if "poseMap" in m:
        pm = m["poseMap"]
        if not isinstance(pm, dict):
            errors.append("poseMap ต้องเป็น object {ชื่อท่า: ไฟล์เฟรม}")
        else:
            not_in = [v for v in pm.values() if v not in m["frameFiles"]]
            if not_in:
                errors.append(f"poseMap อ้างเฟรมที่ไม่อยู่ใน frameFiles: {not_in[:5]}")
            if "poses" in m and set(pm.keys()) != set(m["poses"]):
                warnings.append("poseMap keys ไม่ตรงกับ poses")
            if len(pm) < len(m["poses"]):
                warnings.append(f"ท่าไม่ครบ: {len(pm)}/{len(m['poses'])} "
                                f"({', '.join(m['poses'])[:40]}...)")

    return errors, warnings


def main():
    manifests = find_manifests()
    if not manifests:
        print(f"ไม่พบ manifest ใต้ {SPRITES_DIR}")
        return 0

    total_err = total_warn = 0
    for path in manifests:
        rel = os.path.relpath(path, ROOT)
        errors, warnings = check_one(path)
        total_err += len(errors)
        total_warn += len(warnings)
        status = _OK if not errors else _BAD
        print(f"{status} {rel}")
        for e in errors:
            print(f"    {_BAD} {e}")
        for w in warnings:
            print(f"    {_WARN} {w}")

    print(f"\nmanifest ที่ตรวจ: {len(manifests)} · ข้อผิดพลาด: {total_err} · เตือน: {total_warn}")
    if total_err:
        print("ผล: " + _BAD + " ไม่ผ่าน — แก้ก่อน push")
        return 1
    print("ผล: " + _OK + " ผ่าน")
    return 0


if __name__ == "__main__":
    sys.exit(main())
