#!/usr/bin/env python3
"""
ai-sprite-process.py — Pipeline เปลี่ยน Sprite Sheet จาก AI → เฟรมโปร่งใส + manifest สำหรับเกม

ปัญหาที่แก้: ภาพที่ AI สร้างมักเป็นพื้นหลังทึบ (ขาว/ดำ/ไล่เฉด/มี noise) ไม่ใช่
พื้นโปร่งใส → JavaScript (Canvas) วาดทับไม่ได้ ต้องลบพื้นก่อน

ขั้นตอน (pipe):
  1. วิเคราะห์ภาพ: โปร่งใสแล้ว? พื้นทึบ? (ดูมุมทั้ง 4)
  2. ลบพื้นหลังทึบด้วย FLOOD FILL จากขอบภาพ (กันเส้นขอบ) + ปรับ Anti-aliasing
     → รองรับทั้งสีเดียวล้วน, ไล่เฉด, เกรน noise (เผื่อ tolerance)
  3. ตรวจจับขอบเฟรมจากช่องว่าง (ใช้ logic เดียวกับ sprite-frame-detect.py)
  4. ตัดเฟรม → ปรับขนาดสม่ำเสมอ (normalize: ย่อ/ใส่ padding กลางกล่อง)
  5. บันทึกเฟรมเดี่ยวเป็น PNG โปร่งใส + manifest JSON (พิกัด/กริด/ชื่อ) ให้ JS ใช้

วิธีรัน:
  ./.venv-scripts/Scripts/python.exe scripts/ai-sprite-process.py <sheet.png> \
      --name walker --cell 64 --out-dir public/assets/sprites/ai/walker

เอาต์พุต:
  <out-dir>/<name>_00.png, _01.png, ...   (เฟรมเดี่ยว โปร่งใส)
  <out-dir>/<name>.json                    (manifest — เข้ากับ SpriteRenderer)
"""
import argparse
import json
import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from PIL import Image

# ----------------------------------------------------------------------------
# 1) วิเคราะห์พื้นหลัง
# ----------------------------------------------------------------------------

def analyze_bg(img):
    """คืนโหมด: 'transparent' (มี alpha มุมโปร่ง) | 'opaque' (พื้นทึบ ใช้สีมุม)"""
    w, h = img.size
    has_alpha = img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info)
    if not has_alpha:
        return "opaque", None
    corners = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    trans = sum(1 for (x, y) in corners if img.getpixel((x, y))[3] <= 8)
    if trans >= 3:
        return "transparent", None
    # มี alpha แต่ขอบทึบ — เช่น AI วาดพื้นสีแล้ว export ไม่มีช่องโปร่ง
    return "opaque", img.getpixel((0, 0))[:3]

# ----------------------------------------------------------------------------
# 2) ลบพื้นหลัง (flood fill จากขอบ)
# ----------------------------------------------------------------------------

def flood_remove_bg(img, tol=28, feather=2):
    """
    ลบพื้นหลังทึบโดย flood fill จากพิกเซลขอบภาพ

    วิธี: ประมาณสีพื้น ณ ทุกพิกเซลด้วย BILINEAR INTERPOLATION จากสีมุมทั้ง 4
    (รองรับพื้นไล่เฉด/gradient ได้) → กันพื้นที่ต่อเนื่องจากขอบภาพที่ "สีใกล้
    ค่าประมาณพื้น" ออกไป (flood fill กันเข้าไปในตัวละครที่มีรู/ช่องว่าง)
    → feather ขอบ 1-2px กัน halo ขาว

    พารามิเตอร์: tol = ค่าเฉลี่ย |diff| สูงสุด (0-255) ที่ถือว่าเป็นพื้น
    """
    img = img.convert("RGBA")
    w, h = img.size
    src = img.load()

    # สีมุมทั้ง 4 (ใช้เป็นจุดอ้างอิง interpolation)
    c00 = src[0, 0][:3]
    cW0 = src[w - 1, 0][:3]
    c0H = src[0, h - 1][:3]
    cWH = src[w - 1, h - 1][:3]

    def approx_bg(x, y):
        """ประมาณสีพื้น ณ (x,y) โดย bilinear ระหว่างมุม 4 มุม"""
        fx = x / max(1, w - 1)
        fy = y / max(1, h - 1)
        out = []
        for i in range(3):
            top = c00[i] + (cW0[i] - c00[i]) * fx
            bot = c0H[i] + (cWH[i] - c0H[i]) * fx
            out.append(top + (bot - top) * fy)
        return out

    # กัน flood เข้าตัวละคร: ใช้ flood fill จากขอบ แต่เฉพาะพิกเซลที่สีใกล้
    # ค่าประมาณพื้น (diff <= tol) ถึงจะขยายต่อ — พื้น gradient ผ่านตลอด
    visited = bytearray(w * h)
    is_bg = bytearray(w * h)
    queue = [(0, 0)]
    visited[0] = 1
    while queue:
        x, y = queue.pop()
        pr, pg, pb = src[x, y][:3]
        ar, ag, ab = approx_bg(x, y)
        diff = (abs(pr - ar) + abs(pg - ag) + abs(pb - ab)) / 3.0
        if diff <= tol:
            is_bg[y * w + x] = 1
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and not visited[ny * w + nx]:
                    visited[ny * w + nx] = 1
                    queue.append((nx, ny))

    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    dst = out.load()
    for y in range(h):
        for x in range(w):
            pr, pg, pb, pa = src[x, y]
            if is_bg[y * w + x]:
                dst[x, y] = (pr, pg, pb, 0)
            else:
                dst[x, y] = (pr, pg, pb, pa)

    # feather: ไล่ alpha 1px รอบพิกเซลที่เหลือ (กันขอบแข็ง/รัศมีขาว)
    if feather > 0:
        for y in range(h):
            for x in range(w):
                if dst[x, y][3] == 0:
                    continue
                clear = 0
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and dst[nx, ny][3] == 0:
                        clear += 1
                if clear:
                    pr, pg, pb, _ = dst[x, y]
                    dst[x, y] = (pr, pg, pb, 120)
    return out

# ----------------------------------------------------------------------------
# 2b) ลบเงาใต้ตัว (เป็นพิกเซลที่เข้มกว่าพื้น แต่ไม่ต่อเนื่องกับเนื้อหลัก)
# ----------------------------------------------------------------------------

def remove_shadows(img, darken=30, sat_thresh=40, bottom_frac=0.35):
    """
    ลบเงาใต้ตัว (รองรับเงาที่ติดกับตัว/แยกจากตัว):
    - หลังลบพื้นแล้ว หา connected components (ตัวละคร = 1 ก้อนใหญ่)
    - ในแต่ละก้อน ลบพิกเซลที่เข้าเงื่อนไขครบ 3 ข้อ:
        (ก) อยู่บริเวณแถวล่างของก้อน (ล่างสุด bottom_frac ของความสูงก้อน)
        (ข) ไร้สีสัน (saturation ต่ำ — เงาเทา ไม่ใช่สีตัว)
        (ค) เข้มกว่าค่าประมาณพื้น ณ จุดนั้น (darken)
    - กันการลบตา/ปากเข้ม: มักมีสีสัน หรืออยู่กลางก้อน ไม่ใช่แถวล่างสุด
    """
    img = img.convert("RGBA")
    w, h = img.size
    src = img.load()
    c00 = src[0, 0][:3]
    cW0 = src[w - 1, 0][:3]
    c0H = src[0, h - 1][:3]
    cWH = src[w - 1, h - 1][:3]

    def approx_bg(x, y):
        fx = x / max(1, w - 1)
        fy = y / max(1, h - 1)
        out = []
        for i in range(3):
            top = c00[i] + (cW0[i] - c00[i]) * fx
            bot = c0H[i] + (cWH[i] - c0H[i]) * fx
            out.append(top + (bot - top) * fy)
        return out

    def sat(r, g, b):
        return max(r, g, b) - min(r, g, b)

    # label components ของพิกเซลทึบ (alpha > 0)
    visited = bytearray(w * h)
    comps = []
    queue = []
    for y in range(h):
        for x in range(w):
            idx = y * w + x
            if visited[idx] or src[x, y][3] == 0:
                continue
            comp = []
            queue.append((x, y))
            visited[idx] = 1
            while queue:
                cx, cy = queue.pop()
                comp.append((cx, cy))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < w and 0 <= ny < h and not visited[ny * w + nx] \
                            and src[nx, ny][3] > 0:
                        visited[ny * w + nx] = 1
                        queue.append((nx, ny))
            if len(comp) >= 24:
                ys0 = min(p[1] for p in comp)
                ys1 = max(p[1] for p in comp)
                comps.append((ys0, ys1, comp))

    if not comps:
        return img

    remove_px = set()
    for (ys0, ys1, comp) in comps:
        bottom = ys0 + int((ys1 - ys0) * (1 - bottom_frac))
        for (x, y) in comp:
            if y < bottom:
                continue
            pr, pg, pb = src[x, y][:3]
            if sat(pr, pg, pb) > sat_thresh:
                continue  # มีสี — เนื้อตัว
            ar, ag, ab = approx_bg(x, y)
            if (ar - pr) + (ag - pg) + (ab - pb) < darken * 3:
                continue  # ไม่เข้มพอ — ไม่ใช่เงา
            remove_px.add((x, y))

    if not remove_px:
        print("ลบเงา: 0 px (ไม่พบพิกเซลเงา)")
        return img
    out = img.copy()
    dst = out.load()
    for (x, y) in remove_px:
        pr, pg, pb, _ = dst[x, y]
        dst[x, y] = (pr, pg, pb, 0)
    print(f"ลบเงา: {len(remove_px)} px")
    return out


# ----------------------------------------------------------------------------
# 3) ตรวจจับเฟรม (จาก sprite-frame-detect.py)
# ----------------------------------------------------------------------------

def is_near(c1, c2, tol=10):
    """สีใกล้กัน (ทุกช่องต่างไม่เกิน tol) — ใช้ใน grid-bg key"""
    return (abs(c1[0] - c2[0]) <= tol and abs(c1[1] - c2[1]) <= tol
            and abs(c1[2] - c2[2]) <= tol)


def hue_sat(r, g, b):
    """hue (0-360) + saturation (0-1) แบบ HSV โดยประมาณ — ใช้แยก
    "เงา" (สีเดียวกันกับ bg แต่เข้ม) ออกจาก "เนื้อตัว" (สีต่าง hue)"""
    mx, mn = max(r, g, b), min(r, g, b)
    d = mx - mn
    sat = (d / mx) if mx else 0.0
    if d == 0:
        return 0.0, sat
    if mx == r:
        h = 60 * (((g - b) / d) % 6)
    elif mx == g:
        h = 60 * ((b - r) / d + 2)
    else:
        h = 60 * ((r - g) / d + 4)
    return h, sat

def is_clear(img, x, y, tol=8):
    return img.getpixel((x, y))[3] <= tol

def find_boundaries(counts, threshold_ratio=0.15, min_gap=1):
    n = len(counts)
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
    merged = []
    for g in groups:
        if merged and g[0] - merged[-1][1] - 1 <= min_gap:
            merged[-1] = (merged[-1][0], g[1])
        else:
            merged.append(list(g))
    return merged

def detect_frames(img, threshold_ratio=0.15, min_gap=1):
    w, h = img.size
    col_content = [0] * w
    row_content = [0] * h
    for y in range(h):
        for x in range(w):
            if not is_clear(img, x, y):
                col_content[x] += 1
                row_content[y] += 1
    col_groups = find_boundaries(col_content, threshold_ratio, min_gap)
    row_groups = find_boundaries(row_content, threshold_ratio, min_gap)
    frames = []
    for (x0, x1) in col_groups:
        for (y0, y1) in row_groups:
            fw, fh = x1 - x0 + 1, y1 - y0 + 1
            if fw < 8 or fh < 8:
                continue
            content = 0
            for y in range(y0, y1 + 1, max(1, fh // 16)):
                for x in range(x0, x1 + 1, max(1, fw // 16)):
                    if not is_clear(img, x, y):
                        content += 1
            if content == 0:
                continue
            frames.append({"x": x0, "y": y0, "w": fw, "h": fh})
    frames.sort(key=lambda f: (f["y"], f["x"]))
    return frames

# ----------------------------------------------------------------------------
# 3b) โหมด --check: รายงานตรวจภาพก่อนใช้ (ไม่ตัดเฟรม ไม่สร้างไฟล์)
# ----------------------------------------------------------------------------

def check_sheet(img, bg_rgb, expect=None, tol=28, expected_grid=None):
    """
    ตรวจ sheet ว่าตรงสัญญา PEP ไหม — คืน (issues, summary)
    issues: รายการ dict {level: 'ok'|'warn'|'error', check, detail}
    summary: dict นับผล

    ตรวจ 5 อย่าง:
      1. พื้นเป็นสีเดียว (bg_rgb) จริงไหม — นอกขอบเขตเนื้อ
      2. กริด: จำนวนเซลล์ตรง --expect-grid ไหม + ตรวจเจอเซลล์ว่าง/หลายตัว
      3. ตัวติดขอบเซลล์ (เนื้อล้ำเข้าแถบขอบ)
      4. เฟรมหลอก (เนื้อน้อยเกินสัดส่วน)
      5. เงาตกค้าง (แถวล่างที่ไร้สีสัน + เข้มกว่าพื้น)
    """
    img = img.convert("RGBA")  # กันภาพ RGB (ไม่มี alpha)
    w, h = img.size
    src = img.load()
    issues = []
    def add(level, check, detail):
        issues.append({"level": level, "check": check, "detail": detail})

    # ---- ก) ลบพื้นแบบ key (คัดลอก ไม่แตะต้นฉบับ) + flood กันเนื้อ --------
    keyed = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    kdst = keyed.load()
    for y in range(h):
        for x in range(w):
            pr, pg, pb, pa = src[x, y]
            if is_near((pr, pg, pb), bg_rgb, tol):
                kdst[x, y] = (pr, pg, pb, 0)
            else:
                kdst[x, y] = (pr, pg, pb, pa)

    visited = bytearray(w * h)
    bg_flagged = bytearray(w * h)
    # พื้นที่เปิด (ถึงขอบภาพ) = พื้นหลัง
    stack = [(0, 0)]
    visited[0] = 1
    while stack:
        x, y = stack.pop()
        idx = y * w + x
        if kdst[x, y][3] > 0:
            continue  # เจอเนื้อ → หยุด (ไม่ flood เข้าไป)
        bg_flagged[idx] = 1
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not visited[ny * w + nx]:
                visited[ny * w + nx] = 1
                stack.append((nx, ny))

    # ---- ข) เส้นกริด: หาแบบ คาบ (pitch) จากแถว/คอลัมน์ที่มีเนื้อครบ --------
    # พื้นว่างในเซลล์ (เหนือ/ใต้ตัว) เป็น bg บางแถวเท่านั้น → ใช้เฉพาะแถวที่
    # มีเนื้อทุกคอลัมน์ (ข้ามเซลล์) เพื่อหาแถบกริดจริง แล้วสร้างกริดตามคาบ
    col_content = [0] * w
    row_content = [0] * h
    for y in range(h):
        for x in range(w):
            if kdst[x, y][3] > 0 and not bg_flagged[y * w + x]:
                col_content[x] += 1
                row_content[y] += 1

    def bands_of_row(flags):
        """แถบ bg ติดกันในแถว/คอลัมน์ (1 มิติ) — คืนรายการ (start, end)"""
        runs = []
        start = None
        for i, f in enumerate(flags + [False]):
            if f and start is None:
                start = i
            elif not f and start is not None:
                runs.append((start, i - 1))
                start = None
        return runs

    def grid_from_contract(dim, n_expected):
        """
        กริดจากสัญญา PEP โดยตรง: pitch = dim / n_expected, anchor ที่ 0
        (ขอบซ้าย/บนของภาพ) — ไม่ infer จากเนื้อ (เนื้อมี padding ไม่แน่นอน)
        คืน (strips, pitch)
        """
        if not n_expected or n_expected < 2:
            return [], 0
        pitch = dim / n_expected
        npitch = int(round(pitch))
        # สร้าง n_expected+1 เส้น (รวมขอบขวา/ล่าง) — คลิปให้อยู่ในภาพ
        strips = [(min(k * npitch, dim - 1), min(k * npitch, dim - 1))
                  for k in range(n_expected + 1)]
        return strips, pitch

    # คอลัมน์ bg ในแต่ละแถว (สำหรับหาเส้นแนวตั้ง)
    col_zero_lines = []
    for y in range(h):
        col_zero_lines.append([kdst[x, y][3] == 0 or bg_flagged[y * w + x]
                               for x in range(w)])
    row_zero_lines = []
    for x in range(w):
        row_zero_lines.append([kdst[x, y][3] == 0 or bg_flagged[y * w + x]
                               for y in range(h)])

    # จำนวนเซลล์ที่คาด (จาก --expect-grid ถ้ามี) — กริดจากสัญญาโดยตรง
    ex_cols = ex_rows = 0
    if expected_grid:
        ex_cols, ex_rows = (int(v) for v in expected_grid.lower().split("x"))

    col_strips, pitch_x = grid_from_contract(w, ex_cols)
    row_strips, pitch_y = grid_from_contract(h, ex_rows)
    ncols = len(col_strips) - 1 if col_strips else 0
    nrows = len(row_strips) - 1 if row_strips else 0
    # ขอบจริง ≈ (pitch − เซลล์)/2 แต่เซลล์ไม่รู้ → ใช้ 10% ของ pitch เป็น
    # เกณฑ์ "เนื้อล้ำใกล้ขอบเกินไป" (กันตัวติดขอบจริง แต่ไม่รบกวน padding ปกติ)
    border_w = max(3, int(pitch_x * 0.10)) if pitch_x else 3
    border_h = max(3, int(pitch_y * 0.10)) if pitch_y else 3

    # ---- ค) เซลล์ (ระหว่างเส้นกริด) — ใช้คาบตรงจาก strips ---------------
    cells = []
    for r in range(nrows):
        y0 = row_strips[r][0] + 1
        y1 = row_strips[r + 1][0] - 1
        for c in range(ncols):
            x0 = col_strips[c][0] + 1
            x1 = col_strips[c + 1][0] - 1
            cells.append((x0, y0, x1, y1))

    if cells:
        cell_areas = [(x1 - x0 + 1) * (y1 - y0 + 1) for (x0, y0, x1, y1) in cells]
        median_area = sorted(cell_areas)[len(cell_areas) // 2]

        fake = 0
        touch = []
        real_shadow = 0
        for (x0, y0, x1, y1) in cells:
            # ความหนาแน่นเนื้อ (อัตราส่วนพิกเซลเนื้อจริงต่อพื้นที่เซลล์)
            # — ไม่ขึ้นกับขนาดตัวอย่าง: เซลล์ปกติต้องมีเนื้อ ≥ 5%
            cw_, ch_ = x1 - x0 + 1, y1 - y0 + 1
            content = 0
            total_s = 0
            for y in range(y0, y1 + 1, max(1, ch_ // 16)):
                for x in range(x0, x1 + 1, max(1, cw_ // 16)):
                    total_s += 1
                    if kdst[x, y][3] > 0 and not bg_flagged[y * w + x]:
                        content += 1
            if content / max(1, total_s) < 0.05:
                fake += 1
            # ตัวติดขอบ: ตรวจจากภาพต้นฉบับ (src) ตรง ๆ — มีเนื้อล้ำเข้า
            # แถบกรอบจริง (border_h/w px จากมุมเซลล์) ด้านใดด้านหนึ่งไหม
            def edge_content(xs_, ys_):
                return any(not is_near(src[px_, py_][:3], bg_rgb, tol)
                           for py_ in ys_ for px_ in xs_)
            touching = (
                edge_content(range(x0, x1 + 1), range(y0, y0 + border_h))
                or edge_content(range(x0, x1 + 1),
                                range(y1 - border_h + 1, y1 + 1))
                or edge_content(range(x0, x0 + border_w), range(y0, y1 + 1))
                or edge_content(range(x1 - border_w + 1, x1 + 1),
                                range(y0, y1 + 1))
            )
            if touching:
                touch.append((x0, y0, x1, y1))
            # เงาตกค้าง: ตรวจทั้งครึ่งล่างของเซลล์จากภาพต้นฉบับ — พิกเซลที่
            # (ก) สว่างรวมต่ำกว่าพื้นมาก และ
            # (ข) hue + saturation ใกล้ bg (เงา = สีเดียวกันแต่เข้ม;
            #     เนื้อตัว = สีต่าง hue เช่น โครง #1f8b0d ของวอล์กเกอร์)
            bg_h, bg_s = hue_sat(*bg_rgb)
            bg_lum = sum(bg_rgb)
            for yy in range(y0 + (y1 - y0) // 2, y1 + 1):
                for xx in range(x0, x1 + 1):
                    pr, pg, pb = src[xx, yy][:3]
                    lum = pr + pg + pb
                    h, s = hue_sat(pr, pg, pb)
                    d_hue = min(abs(h - bg_h), 360 - abs(h - bg_h))
                    same_hue = d_hue <= 12 and abs(s - bg_s) <= 0.35
                    darker = lum < bg_lum - 120
                    if darker and same_hue:
                        real_shadow += 1

        if fake:
            add("error", "เฟรมหลอก/ว่าง",
                f"{fake}/{len(cells)} เซลล์มีเนื้อน้อยเกิน (< 5% ของพื้นที่)")
        else:
            add("ok", "เฟรมหลอก/ว่าง", f"ไม่มี — {len(cells)} เซลล์มีเนื้อครบ")
        if touch:
            add("warn", "ตัวติดขอบ",
                f"{len(touch)}/{len(cells)} เซลล์มีเนื้อล้ำเข้าแถบขอบ "
                f"(เช่น {touch[0]}) — กันเผื่อกรอบ AI วาดหนาเกิน/ตัวใหญ่เกิน")
        else:
            add("ok", "ตัวติดขอบ", "ไม่มี — ทุกตัวมีช่องว่างรอบตัว")

        if real_shadow:
            add("warn", "เงาตกค้าง",
                f"เจอพิกเซลเงา {real_shadow} px (เข้มกว่าพื้น + สีใกล้ bg) — "
                f"รัน --remove-shadows หรือ gen ใหม่")
        else:
            add("ok", "เงาตกค้าง", "ไม่พบ")

    # ---- จ) ตรวจกริดรวม --------------------------------------------------
    if expect:
        ex_cols, ex_rows = expect.lower().split("x")
        ex = int(ex_cols) * int(ex_rows)
        if not cells:
            add("error", "กริด", "ไม่พบเส้นกริด — พื้นไม่ใช่สีเดียวตามสัญญา?")
        elif len(cells) != ex:
            add("error", "กริด", f"พบ {len(cells)} เซลล์ ≠ คาด {ex} ({expect})")
        else:
            add("ok", "กริด", f"ตรงสัญญา {expect} ({len(cells)} เซลล์)")
    else:
        if cells:
            add("ok", "กริด", f"พบ {ncols}×{nrows} = {len(cells)} เซลล์ (ไม่ระบุ --expect-grid)")
        else:
            add("error", "กริด", "ไม่พบเส้นกริด — ระบุ --grid-bg ถูกต้องไหม?")

    # ---- รายงาน ----------------------------------------------------------
    summary = {"ok": 0, "warn": 0, "error": 0}
    print("\n═══ รายงานตรวจภาพ (--check) ═══")
    for it in issues:
        summary[it["level"]] += 1
        icon = {"ok": "✅", "warn": "⚠️", "error": "❌"}[it["level"]]
        print(f"  {icon} [{it['check']}] {it['detail']}")
    print(f"═══════════════════════════════")
    print(f"  สรุป: ✅ {summary['ok']} · ⚠️ {summary['warn']} · ❌ {summary['error']}")
    if summary["error"]:
        print("  ผล: ❌ ไม่ผ่าน — อย่าเอาไปใช้ ตรวจภาพ/gen ใหม่")
    elif summary["warn"]:
        print("  ผล: ⚠️ ผ่านแบบมีข้อควรระวัง — ดู warn ก่อนใช้")
    else:
        print("  ผล: ✅ ผ่าน — พร้อมตัดเฟรมใช้จริง")
    return issues, summary


# ----------------------------------------------------------------------------
# 4) ตัด + normalize เฟรม
# ----------------------------------------------------------------------------

def normalize_frame(img, box, cell, margin_ratio=0.06):
    """
    ตัดเฟรมจาก box → ย่อ/ใส่ padding ให้อยู่กลางกล่อง cell×cell
    margin_ratio: พื้นที่ว่างรอบตัวละคร (เศษส่วนของ cell)
    คืน (ภาพโปร่งใส cell×cell, scale ที่ใช้)
    """
    x0, y0, w, h = box["x"], box["y"], box["w"], box["h"]
    frame = img.crop((x0, y0, x0 + w, y0 + h))
    # ลบแถว/คอลัมน์โปร่งใสขอบ (trim) — AI มักมี padding ไม่เท่ากัน
    bbox = frame.getbbox()
    if bbox:
        frame = frame.crop(bbox)
        w, h = frame.size
    margin = max(2, int(cell * margin_ratio))
    avail = cell - margin * 2
    scale = min(avail / w, avail / h, 1.0)
    nw, nh = max(1, int(round(w * scale))), max(1, int(round(h * scale)))
    if scale < 1.0:
        frame = frame.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
    canvas.paste(frame, ((cell - nw) // 2, (cell - nh) // 2), frame)
    return canvas

# ----------------------------------------------------------------------------
# main
# ----------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description="AI sprite sheet → เฟรมโปร่งใส + manifest")
    ap.add_argument("sheet", help="path ไฟล์ sprite sheet จาก AI")
    ap.add_argument("--name", default="sprite", help="ชื่อ asset (ใช้ตั้งชื่อเฟรม + manifest)")
    ap.add_argument("--cell", type=int, default=64, help="ขนาดกล่องเฟรม (default 64)")
    ap.add_argument("--out-dir", default="out", help="โฟลเดอร์บันทึกเฟรม + manifest")
    ap.add_argument("--tol", type=int, default=28,
                    help="tolerance ลบพื้น (0-255; มาก = ลบแรงขึ้น เผื่อ gradient/noise)")
    ap.add_argument("--feather", type=int, default=2, help="px ไล่ alpha ขอบ (กัน halo)")
    ap.add_argument("--remove-shadows", action="store_true",
                    help="ลบเงาใต้ตัว (แถวล่างที่ไร้สีสัน + เข้มกว่าพื้น)")
    ap.add_argument("--shadow-darken", type=int, default=30,
                    help="ความเข้มขั้นต่ำของเงา เทียบพื้น (default 30)")
    ap.add_argument("--shadow-sat", type=int, default=40,
                    help="ความอิ่มตัวสูงสุดที่ถือว่าเป็นเงา (default 40)")
    ap.add_argument("--shadow-bottom", type=float, default=0.35,
                    help="เศษส่วนแถวล่างของก้อนที่ตรวจเงา (default 0.35)")
    ap.add_argument("--threshold", type=float, default=0.15, help="เกณฑ์ 'เนื้อ' ตรวจจับเฟรม")
    ap.add_argument("--min-gap", type=int, default=1, help="gap ขั้นต่ำระหว่างเฟรม")
    ap.add_argument("--dry", action="store_true", help="ไม่ลบพื้น (ภาพโปร่งใสอยู่แล้ว)")
    ap.add_argument("--grid-bg", default=None,
                    help="พื้นสีเดียวตามสัญญา PEP เช่น #00ff00 → ลบพื้นแบบ key + ตรวจกริด")
    ap.add_argument("--expect-grid", default=None,
                    help="กริดที่คาดจากพรอมต์ เช่น 4x4 — ตรวจว่าเฟรมตรงสัญญาไหม")
    ap.add_argument("--check", action="store_true",
                    help="โหมดตรวจภาพอย่างเดียว: รายงานเฟรมหลอก/เงา/กริด/ติดขอบ — ไม่สร้างไฟล์")
    ap.add_argument("--require-check", action="store_true",
                    help="รัน --check ก่อนตัดเฟรม: ถ้ามี error หยุด (exit 1 ไม่สร้างไฟล์) ถ้าผ่าน/เตือน → ตัดเฟรม + manifest ต่อ")
    args = ap.parse_args()

    img = Image.open(args.sheet)
    mode, bg = analyze_bg(img)
    print(f"ภาพ: {args.sheet} ({img.width}×{img.height}) · พื้นหลัง: {mode}"
          f"{f' {bg}' if bg else ''}")

    # โหมด --check: รายงานตรวจภาพอย่างเดียว (ไม่ตัดเฟรม ไม่สร้างไฟล์)
    if args.check:
        if not args.grid_bg:
            print("--check ต้องระบุ --grid-bg (สีพื้นตามสัญญา PEP เช่น #00ff00)")
            return 2
        hexv = args.grid_bg.lstrip("#")
        gbg = tuple(int(hexv[i:i + 2], 16) for i in (0, 2, 4))
        issues, summary = check_sheet(img, gbg, expect=args.expect_grid,
                                      tol=args.tol,
                                      expected_grid=args.expect_grid)
        return 1 if summary["error"] else 0

    # โหมด --require-check: ตรวจภาพก่อนตัดเฟรม (ผ่าน/เตือน → ต่อ, error → หยุด)
    if args.require_check:
        if not args.grid_bg:
            print("--require-check ต้องระบุ --grid-bg (สีพื้นตามสัญญา PEP เช่น #00ff00)")
            return 2
        hexv = args.grid_bg.lstrip("#")
        gbg = tuple(int(hexv[i:i + 2], 16) for i in (0, 2, 4))
        issues, summary = check_sheet(img, gbg, expect=args.expect_grid,
                                      tol=args.tol,
                                      expected_grid=args.expect_grid)
        if summary["error"]:
            print("\n⛔ ตรวจไม่ผ่าน — หยุด ไม่สร้างเฟรม/manifest ไป gen ใหม่")
            return 1
        print("\n▶ ตรวจผ่าน — ตัดเฟรม + manifest ต่อ")
    # โหมดกริดบังคับ (PEP): พื้นสีเดียว → ลบพื้น (key) ก่อน แล้วตรวจจับเซลล์
    # จากช่องว่างเนื้อ (วิธีเดียวกับ flood-fill mode) + ตรวจกริดว่าตรงสัญญาไหม
    if args.grid_bg:
        hexv = args.grid_bg.lstrip("#")
        gbg = tuple(int(hexv[i:i + 2], 16) for i in (0, 2, 4))
        img_rgba = img.convert("RGBA")
        src = img_rgba.load()
        for y in range(img_rgba.height):
            for x in range(img_rgba.width):
                pr, pg, pb, pa = src[x, y]
                if is_near((pr, pg, pb), gbg, args.tol):
                    src[x, y] = (pr, pg, pb, 0)
        img = img_rgba
        if args.remove_shadows:
            img = remove_shadows(img, darken=args.shadow_darken,
                                 sat_thresh=args.shadow_sat,
                                 bottom_frac=args.shadow_bottom)
        frames = detect_frames(img, args.threshold, args.min_gap)
        print(f"โหมดกริด: bg {args.grid_bg} (ลบพื้น tol={args.tol}) → "
              f"เฟรม {len(frames)} ตัว")
        # ตรวจยืนยันกริดถ้าระบุ --expect-grid
        if args.expect_grid and frames:
            ex_cols, ex_rows = args.expect_grid.lower().split("x")
            ex = int(ex_cols) * int(ex_rows)
            if len(frames) != ex:
                print(f"⚠️  เฟรมที่พบ ({len(frames)}) ไม่ตรงที่คาดจากพรอมต์ "
                      f"({ex}) — ตรวจภาพว่าตรงสัญญา PEP ไหม")
            else:
                print(f"✅ เฟรมตรงกับกริดที่คาด ({args.expect_grid})")
        if not frames:
            print("ไม่พบเฟรม — พื้นไม่ใช่สีเดียวตามสัญญา? ตรวจภาพด้วยสายตา")
            return 1
    else:
        if mode == "opaque" and not args.dry:
            img = flood_remove_bg(img, tol=args.tol, feather=args.feather)
            print(f"ลบพื้นหลังแล้ว (flood fill tol={args.tol}, feather={args.feather})")
        else:
            img = img.convert("RGBA")
            print("ภาพโปร่งใสอยู่แล้ว / --dry — ข้ามการลบพื้น")

        if args.remove_shadows:
            img = remove_shadows(img, darken=args.shadow_darken,
                                 sat_thresh=args.shadow_sat,
                                 bottom_frac=args.shadow_bottom)

        frames = detect_frames(img, args.threshold, args.min_gap)
        if not frames:
            print("ไม่พบเฟรม — ลองลด --threshold หรือตรวจภาพว่ามีเนื้อจริงไหม")
            return 1
        print(f"พบเฟรม {len(frames)} ตัว")

    # คำนวณกริดโดยประมาณ (แถวจาก y ที่ใกล้กัน)
    ys = sorted({f["y"] for f in frames})
    rows, cur = 0, None
    for y in ys:
        if cur is None or y - cur > 4:
            rows += 1
            cur = y
    cols = len(frames) // rows if rows else 0

    os.makedirs(args.out_dir, exist_ok=True)
    frame_files = []
    for i, box in enumerate(frames):
        canvas = normalize_frame(img, box, args.cell)
        fname = f"{args.name}_{i:02d}.png"
        canvas.save(os.path.join(args.out_dir, fname))
        frame_files.append(fname)
        print(f"  {fname}: กล่อง {box} → {args.cell}×{args.cell}")

    manifest = {
        "asset": args.name,
        "source": os.path.basename(args.sheet),
        "frameSize": args.cell,
        "frames": len(frames),
        "rows": rows,
        "cols": cols,
        "frameFiles": frame_files,
        "animationFps": 8,
        "loop": True,
        "note": "สร้างโดย ai-sprite-process.py — ตรวจด้วยสายตาก่อนใช้",
    }
    mpath = os.path.join(args.out_dir, f"{args.name}.json")
    with open(mpath, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=2)
    print(f"manifest: {mpath}")
    return 0


if __name__ == "__main__":
    sys.exit(main())


