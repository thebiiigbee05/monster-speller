#!/usr/bin/env python3
"""สร้าง sheet ละเมิดสัญญา PEP: เซลล์ว่าง 1 + เงาใต้ตัว + ตัวติดขอบ 1"""
import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from PIL import Image, ImageDraw

GREEN = (0, 255, 0)
CELL, BORDER = 64, 4
COLS = ROWS = 4
W = H = COLS * (CELL + 2 * BORDER) + BORDER  # 292
img = Image.new("RGB", (W, H), GREEN)
d = ImageDraw.Draw(img)

for j in range(ROWS):
    for i in range(COLS):
        cx = BORDER + i * (CELL + 2 * BORDER) + CELL // 2
        cy = BORDER + j * (CELL + 2 * BORDER) + CELL // 2
        if i == 2 and j == 0:
            continue  # เซลล์ว่าง (เฟรมหลอก)
        col = (30, 200, 90)
        r = 14 if (i, j) != (0, 3) else 26  # ตัวใหญ่เกิน → แตะขอบ
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)
        if (i, j) == (1, 3):
            # เงาใต้ตัว
            d.ellipse([cx - 12, cy + 16, cx + 12, cy + 22], fill=(0, 110, 0))

img.save("tests/pep-sheet-bad.png")
print("สร้าง tests/pep-sheet-bad.png", img.size)
