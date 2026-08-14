# -*- coding: utf-8 -*-
"""สร้าง sheet ทดสอบ 4×1 (512×128) ตามพรอมต์ PEP ใหม่:
- GOOD: 4 เซลล์ 4 ท่าเดินต่างกัน (วงรี เอียงซ้าย/ตรง/เอียงขวา/สูง) + กรอบ 4px
- BAD:  4 เซลล์แต่ท่าซ้ำ (ท่าเดียวแปะ 4 ครั้ง) — ต้องโดน --check/dedupe จับ

ใช้งาน: python tests/make-pep4x1-sheet-test.py
สร้าง: tests/pep4x1-good.png, tests/pep4x1-bad.png
"""
import io
from PIL import Image, ImageDraw

PITCH = 128
W, H = 512, 128
BORDER = 4
BG = (0, 255, 0)          # #00ff00
OUTLINE = (31, 139, 13)   # #1f8b0d โครงวอล์กเกอร์
BODY = (57, 255, 20)      # #39ff14


def cell_center(i):
    """ศูนย์กลางเซลล์ i (0..3) — ชดเชยกรอบ 4px"""
    return BORDER + i * PITCH + (PITCH - 2 * BORDER) // 2


def draw_pose(draw, i, legs, cy, rx, ry):
    """วาดตัวกลมรีท่าเดียวที่เซลล์ i — legs=(dx_ซ้าย, dx_ขวา), cy=กลางแนวตั้ง
    ท่าต่างกันชัดเจน: contact=กางกว้าง · down=ชิด+ตัวต่ำ · passing=ข้างเดียว · up=สูง+ขาสั้น"""
    cx = cell_center(i)
    # ลำตัว (วงรี)
    draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=BODY, outline=OUTLINE, width=2)
    # ตา 2 ดวง (เอกลักษณ์วอล์กเกอร์)
    for ex in (-rx // 3, rx // 3):
        draw.ellipse([cx + ex - 6, cy - 10, cx + ex + 6, cy + 2], fill=(10, 12, 30))
    # ขาสั้น — legs = (dx_ซ้าย, dx_ขวา): กาง = ไกลจากศูนย์, ชิด = ใกล้ศูนย์
    draw.line([cx - rx // 2 + legs[0], cy + ry - 2, cx - rx // 2 + legs[0] * 2, cy + ry + 10],
              fill=OUTLINE, width=3)
    draw.line([cx + rx // 2 + legs[1], cy + ry - 2, cx + rx // 2 + legs[1] * 2, cy + ry + 10],
              fill=OUTLINE, width=3)
    # หนวดปลายทอง (เอกลักษณ์)
    for ax in (-rx // 2, rx // 2):
        draw.line([cx + ax, cy - ry + 2, cx + ax, cy - ry - 8], fill=OUTLINE, width=2)
        draw.ellipse([cx + ax - 2, cy - ry - 11, cx + ax + 2, cy - ry - 7], fill=(255, 215, 0))


def make(bad=False):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    # กรอบ 4px รอบทุกเซลล์ (เส้นกริด bg)
    for i in range(5):
        d.line([i * PITCH, 0, i * PITCH, H], fill=BG, width=BORDER if i in (0, 4) else 1)
        d.rectangle([BORDER + i * PITCH, 0, (i + 1) * PITCH - BORDER, H - 1], outline=BG, width=1)
    if bad:
        # ละเมิด: ท่าเดียว (ขากางกลาง) แปะครบ 4 เซลล์ — ต่าง 0% ทุกตัว
        for i in range(4):
            draw_pose(d, i, (-6, 6), 64, 30, 34)
    else:
        # 4 ท่าต่างกันชัดเจนทั้งตัว (ความสูง + ขา — เหมือน walk cycle จริง):
        draw_pose(d, 0, (-18, 18), 70, 30, 36)   # contact: ขากางกว้างสุด ตัวต่ำสุด ตัวใหญ่
        draw_pose(d, 1, (-4, 4), 62, 28, 32)     # down: ขาเกือบชิด ตัวสูงขึ้น เล็กลง
        draw_pose(d, 2, (-18, 6), 54, 26, 28)    # passing: ขาซ้ายก้าวไกล ตัวสูงขึ้น เล็กลง
        draw_pose(d, 3, (-6, 18), 46, 24, 26)    # up: ขาขวายกสูง ตัวสูงสุด เล็กสุด
    fn = "tests/pep4x1-bad.png" if bad else "tests/pep4x1-good.png"
    img.save(fn)
    print("สร้าง", fn, f"({W}×{H}, bad={bad})")


if __name__ == "__main__":
    make(False)
    make(True)
