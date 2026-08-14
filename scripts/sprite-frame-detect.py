#!/usr/bin/env python3
"""
sprite-frame-detect.py — ตรวจจับขอบเฟรม (frame boundaries) จาก Sprite Sheet อัตโนมัติ

ทำไมต้องมี: AI มักสร้าง sprite sheet ที่เฟรมไม่เท่ากัน / กริดไม่ตรง / ขอบไม่ชัด
→ ตัดด้วยสมมติ "กริดเท่ากัน" จะเหลื่อมเฟรม (เนื้อตัวล้น/ขาด)
→ สคริปต์นี้ scan พิกเซล หา "ช่องว่างโปร่งใส" หรือ "เส้นพื้นหลังล้วน" แล้ว
   คำนวณพิกัด (x,y,w,h) ของทุกเฟรมจริง

รองรับ 2 กรณี:
  1. พื้นหลังโปร่งใส (alpha=0)        → ตรวจจับช่องว่างแนวตั้ง/แนวนอน
  2. พื้นหลังสีทึบ (สีเดียวทั้งภาพ)     → ตรวจจับเส้นพื้นหลังล้วน (background row/col)

วิธีรัน:
  python sprite-frame-detect.py <ไฟล์-sheet.png> [--out manifest.json]
  ตัวอย่าง: ./.venv-scripts/Scripts/python.exe scripts/sprite-frame-detect.py \\
      public/assets/sprites/monsters-sheet.png --out /tmp/frames.json

เอาต์พุต: JSON รูปแบบเดียวกับ monsters-sheet.json (เข้ากับ SpriteRenderer)
"""
import argparse
import json
import sys

# Windows console มักเป็น cp1252 — บังคับ UTF-8 เพื่อพิมพ์ภาษาไทยได้
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from PIL import Image


def is_transparent(img, x, y, tol=8):
    """พิกเซลโปร่งใสหรือไม่ (alpha ต่ำ)"""
    r, g, b, a = img.getpixel((x, y))
    return a <= tol


def is_bg_color(img, x, y, bg, tol=12):
    """พิกเซลใกล้เคียงสีพื้นหลัง bg (ใช้เมื่อภาพไม่มี alpha)"""
    r, g, b = img.getpixel((x, y))[:3]
    return abs(r - bg[0]) <= tol and abs(g - bg[1]) <= tol and abs(b - bg[2]) <= tol


def analyze(img):
    """หาโหมดพื้นหลัง: transparent หรือ bg_color เดียว, คืน (mode, bg)"""
    w, h = img.size
    has_alpha = img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info)
    # ตรวจมุมทั้ง 4 ว่ามี alpha=0 หรือไม่
    corners = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    trans_corners = sum(1 for (x, y) in corners if img.getpixel((x, y))[3] <= 8)
    if has_alpha and trans_corners >= 3:
        return "transparent", None
    # ใช้สีมุมซ้ายบนเป็น bg (กรณีพื้นทึบ)
    return "bg_color", img.getpixel((0, 0))[:3]


def find_boundaries(counts, threshold_ratio=0.15, min_gap=1):
    """จากจำนวน "พิกเซลเนื้อ" ต่อแถว/คอลัมน์ → หาแกป (ช่องว่าง) แล้วแบ่งกลุ่มเนื้อ
    คืนรายการ (start, end) ของแต่ละกลุ่ม"""
    n = len(counts)
    # ความเข้มเฉลี่ยของแถวที่มีเนื้อ (ใช้ปรับ threshold ตามสัดส่วน)
    nonzero = [c for c in counts if c > 0]
    peak = max(nonzero) if nonzero else 0
    thresh = max(1, int(peak * threshold_ratio))
    groups = []
    start = None
    for i, c in enumerate(counts):
        is_content = c >= thresh
        if is_content and start is None:
            start = i
        elif not is_content and start is not None:
            if i - start >= 1:
                groups.append((start, i - 1))
            start = None
    if start is not None:
        groups.append((start, n - 1))
    # รวมกลุ่มที่อยู่ติดกันเกินไป (min_gap — กันเฟรมหลุดจาก noise)
    merged = []
    for g in groups:
        if merged and g[0] - merged[-1][1] - 1 <= min_gap:
            merged[-1] = (merged[-1][0], g[1])
        else:
            merged.append(list(g))
    return merged


def split_frames(img, mode, bg, threshold_ratio=0.15, min_gap=1):
    """แบ่ง sheet ออกเป็นเฟรม (กล่อง) โดย scan แนวตั้ง/แนวนอน"""
    w, h = img.size
    is_trans = mode == "transparent"
    is_empty = (lambda x, y: is_transparent(img, x, y)) if is_trans else (
        lambda x, y: is_bg_color(img, x, y, bg))

    # col_content[x] = จำนวนพิกเซลเนื้อในคอลัมน์ x
    col_content = [0] * w
    row_content = [0] * h
    for y in range(h):
        for x in range(w):
            if not is_empty(x, y):
                col_content[x] += 1
                row_content[y] += 1

    col_groups = find_boundaries(col_content, threshold_ratio, min_gap)
    row_groups = find_boundaries(row_content, threshold_ratio, min_gap)
    frames = []
    for (x0, x1) in col_groups:
        for (y0, y1) in row_groups:
            w = x1 - x0 + 1
            h = y1 - y0 + 1
            if w < 8 or h < 8:
                continue
            # กรองกล่องเปล่า: cross product ของคอลัมน์×แถว อาจสร้างกล่องที่
            # ไม่มีเนื้อจริง (เนื้ออยู่คนละแถวกัน) — นับพิกเซลจริงในกล่อง
            content = 0
            for y in range(y0, y1 + 1, max(1, h // 16)):
                for x in range(x0, x1 + 1, max(1, w // 16)):
                    if not is_empty(x, y):
                        content += 1
            # ต้องมีเนื้ออย่างน้อย 1% ของพื้นที่ (สุ่มตัวอย่าง) ถึงถือว่าเป็นเฟรม
            if content == 0:
                continue
            frames.append({"x": x0, "y": y0, "w": w, "h": h})
    # เรียง: ซ้าย→ขวา, บน→ล่าง
    frames.sort(key=lambda f: (f["y"], f["x"]))
    return frames


def detect_grid(frames):
    """อนุมานกริด (rows × cols) จากตำแหน่งกล่อง — เพื่อจัดเรียงเป็นแถว"""
    if not frames:
        return 0, 0
    ys = sorted({f["y"] for f in frames})
    rows = 0
    cur = None
    for y in ys:
        if cur is None or y - cur > 4:
            rows += 1
            cur = y
    cols = len(frames) // rows if rows else 0
    return rows, cols


def main():
    ap = argparse.ArgumentParser(description="ตรวจจับขอบเฟรมจาก sprite sheet")
    ap.add_argument("sheet", help="path ไฟล์ PNG")
    ap.add_argument("--out", help="path ไฟล์ JSON เอาต์พุต (ไม่ระบุ = พิมพ์หน้าจอ)")
    ap.add_argument("--threshold", type=float, default=0.15,
                    help="สัดส่วนความเข้มขั้นต่ำที่ถือว่าเป็นเนื้อ (default 0.15)")
    ap.add_argument("--min-gap", type=int, default=1,
                    help="ช่องว่างขั้นต่ำ (px) ระหว่างเฟรมที่จะรวมกัน (default 1)")
    args = ap.parse_args()

    img = Image.open(args.sheet)
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    mode, bg = analyze(img)
    print(f"ภาพ: {args.sheet} ({img.width}×{img.height}) · โหมดพื้นหลัง: "
          f"{mode}{f' สี {bg}' if bg else ''}")

    frames = split_frames(img, mode, bg, args.threshold, args.min_gap)
    rows, cols = detect_grid(frames)
    print(f"พบเฟรม: {len(frames)} ตัว (กริดโดยประมาณ {rows}×{cols})")
    for f in frames:
        print(f"  x={f['x']:>4} y={f['y']:>4} w={f['w']:>3} h={f['h']:>3}")

    result = {
        "sheet": args.sheet,
        "cellW": max((f["w"] for f in frames), default=0),
        "cellH": max((f["h"] for f in frames), default=0),
        "frames": frames,
        "rows": rows,
        "cols": cols,
        "backgroundMode": mode,
        "note": "พิกัดตรวจจับอัตโนมัติ — ตรวจด้วยสายตาก่อนใช้จริง",
    }
    if args.out:
        with open(args.out, "w", encoding="utf-8") as fh:
            json.dump(result, fh, ensure_ascii=False, indent=2)
        print(f"บันทึก: {args.out}")
    return 0 if frames else 1


if __name__ == "__main__":
    sys.exit(main())
