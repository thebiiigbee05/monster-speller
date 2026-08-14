#!/usr/bin/env python3
"""สร้าง sheet ทดสอบ 512×512 ตามพรอมต์ PEP ใหม่เป๊ะ:
- 4×4 grid, เซลล์ 128×128 → TOTAL 512×512 (ไม่มี outer margin)
- เส้นกริด bg ล้วนที่ x/y = 0, 128, 256, 384, 512 (หนา 4px)
- ตัวละครไม่แตะขอบ (กัน 8px) + ไม่ใช้สีเขียวเข้ม (กัน false positive เงา)
- มีเงาแอบ 1 ตัว (ทดสอบ --check ต้องจับ warn)
"""
import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from PIL import Image, ImageDraw

GREEN = (0, 255, 0)
SIZE = 512          # ขนาดภาพพอดี (ตรงสัญญา)
CELL = 128          # เซลล์
BORDER = 4          # กรอบ 4px
PITCH = 132         # 128 + 2*4 (กรอบทั้ง 2 ด้าน)
# เส้นกริดที่ 0, 128, 256, 384, 512

# สีตัวละคร 4 ตัว (เลียนแบบมอนสเตอร์จริง — ไม่มีเขียวเข้มใกล้ bg)
MONSTERS = [
    (57, 255, 20),   # วอล์กเกอร์ #39ff14
    (255, 46, 151),  # รันเนอร์ #ff2e97
    (168, 85, 247),  # แทงก์ #a855f7
    (255, 59, 59),   # บอส #ff3b3b
]

def make_sheet(path, bad=False):
    img = Image.new("RGB", (SIZE, SIZE), GREEN)
    d = ImageDraw.Draw(img)
    # กรอบ 4px: เส้น bg ล้วนที่ 0-3, 128-131, 256-259, 384-387 (ขอบขวา = 512)
    for x in [0, 128, 256, 384]:
        d.rectangle([x, 0, x + BORDER - 1, SIZE], fill=GREEN)
    for y in [0, 128, 256, 384]:
        d.rectangle([0, y, SIZE, y + BORDER - 1], fill=GREEN)

    r = 28  # ตัวเล็ก ห่างขอบ ~19px (กัน false positive เกณฑ์ 12px)
    for j in range(4):
        for i in range(4):
            cx = BORDER + i * PITCH + CELL // 2  # = 66, 198, 330, 462
            cy = BORDER + j * PITCH + CELL // 2
            col = MONSTERS[(i + j) % 4]
            if bad and i == 2 and j == 0:
                continue  # เซลล์ว่าง (เฟรมหลอก)
            rr = r
            if bad and i == 0 and j == 3:
                # ใหญ่เกิน → แตะขอบล่าง (cy=464 → 464+59=523 คลิปที่ 511)
                # แต่ต้องไม่ล้ำเซลล์ข้าง (cx=68 → ขอบขวา 68+59=127 อยู่
                # ในเซลล์ตัวเอง 1..127 พอดี — ถ้า rr=61 ขอบขวา=129
                # จะโดนนับติดขอบของเซลล์ (1,3) ด้วย → false positive)
                rr = 59
            d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=col)
            # หู 2 ข้าง (เฉพาะไม่ใช่อันที่แตะขอบ) — ยื่น 3px (กัน ~16px)
            if not (bad and i == 0 and j == 3):
                d.ellipse([cx - rr - 3, cy - rr - 3, cx - rr + 1, cy + 3], fill=col)
                d.ellipse([cx + rr - 1, cy - rr - 3, cx + rr + 3, cy + 3], fill=col)
            if bad and i == 1 and j == 2:
                # เงาเขียวเข้มใต้ตัว (ละเมิดข้อ 6) — อยู่ห่างขอบล่าง ~17px
                d.ellipse([cx - 16, cy + 26, cx + 16, cy + 34], fill=(0, 110, 0))
    img.save(path)
    print(f"สร้าง {path} ({SIZE}×{SIZE}, bad={bad})")

if __name__ == "__main__":
    make_sheet("tests/pep512-good.png", bad=False)
    make_sheet("tests/pep512-bad.png", bad=True)
