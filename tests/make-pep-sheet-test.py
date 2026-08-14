#!/usr/bin/env python3
"""สร้าง sprite sheet ตามสัญญา PEP: พื้น #00ff00 ล้วน + กรอบ 4px + กริด 4×4 + เงาแอบ"""
import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from PIL import Image, ImageDraw

GREEN = (0, 255, 0)
CELL, BORDER, GAP = 64, 4, 0  # เซลล์ 64px, กรอบ 4px, ช่องว่างระหว่างเฟรม 0
COLS = ROWS = 4
W = H = COLS * (CELL + 2 * BORDER) + BORDER  # = 4*72+4 = 292
img = Image.new("RGB", (W, H), GREEN)
d = ImageDraw.Draw(img)

# กรอบ: วาดเส้นสีเขียวหนา BORDER ระหว่างเซลล์ (จริง ๆ พื้นเขียวอยู่แล้ว —
# เราจะวาดเฉพาะเส้นสีเขียวทับเพื่อให้แน่ใจว่ากรอบหนา BORDER)
for i in range(1, COLS):
    x = i * (CELL + 2 * BORDER)
    d.rectangle([x, 0, x + BORDER - 1, H], fill=GREEN)
for j in range(1, ROWS):
    y = j * (CELL + 2 * BORDER)
    d.rectangle([0, y, W, y + BORDER - 1], fill=GREEN)

colors = [(30, 200, 90), (230, 60, 160), (140, 90, 240), (250, 80, 60)]
for j in range(ROWS):
    for i in range(COLS):
        cx = BORDER + i * (CELL + 2 * BORDER) + CELL // 2
        cy = BORDER + j * (CELL + 2 * BORDER) + CELL // 2
        col = colors[(i + j) % 4]
        d.ellipse([cx - 14, cy - 12, cx + 14, cy + 12], fill=col)
        d.ellipse([cx - 16, cy - 20, cx - 8, cy - 8], fill=col)  # หู
        d.ellipse([cx + 8, cy - 20, cx + 16, cy - 8], fill=col)
        # เงาแอบใต้ตัว (ละเมิดสัญญา — ไว้ทดสอบ --remove-shadows)
        d.ellipse([cx - 12, cy + 16, cx + 12, cy + 22], fill=(0, 110, 0))

img.save("tests/pep-sheet.png")
print("สร้าง tests/pep-sheet.png", img.size)
