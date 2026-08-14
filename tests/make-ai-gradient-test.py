#!/usr/bin/env python3
"""สร้าง sprite sheet ทดสอบเลียนแบบผลงาน AI: พื้นหลังไล่เฉด (gradient) + เงาใต้ตัว"""
import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from PIL import Image, ImageDraw

W, H = 260, 130
CELL = 65
img = Image.new("RGB", (W, H))
px = img.load()
# พื้นหลังไล่เฉดแนวนอน: ขาว → เทาอ่อน (เลียนแบบ AI ที่ใส่ gradient)
for x in range(W):
    t = x / W
    r = int(245 - t * 40)
    g = int(245 - t * 40)
    b = int(250 - t * 45)
    for y in range(H):
        px[x, y] = (r, g, b)

d = ImageDraw.Draw(img)

def blob(cx, cy, r, color, spikes=0):
    """วาดตัวละครกลมๆ มีแขน/หู (ขอบไม่คม)"""
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)
    if spikes:
        # หนวด/เขา
        d.ellipse([cx - r - 8, cy - r - 6, cx - r, cy + 6], fill=color)
        d.ellipse([cx + r, cy - r - 6, cx + r + 8, cy + 6], fill=color)

# 4 ตัวละคร: ตัวที่ 2 มี "รู" ตรงกลาง (สีเดียวกับพื้น)
blob(32, 60, 18, (30, 200, 90), spikes=1)
blob(32 + 65, 60, 18, (230, 60, 160), spikes=1)
blob(32 + 130, 60, 18, (140, 90, 240), spikes=1)
blob(32 + 195, 60, 18, (250, 80, 60), spikes=1)
# รูตรงกลางตัวที่ 3 (สีเดียวกับพื้นบริเวณนั้น)
hole_r = int(245 - 0.5 * 195 * 40 / 260)
hole_g = int(245 - 0.5 * 195 * 40 / 260)
hole_b = int(250 - 0.5 * 195 * 45 / 260)
d.ellipse([32 + 130 - 5, 60 - 5, 32 + 130 + 5, 60 + 5], fill=(hole_r, hole_g, hole_b))
# เงาใต้ตัว (เทาเข้มกว่าพื้นนิดเดียว — ท้าทายการลบพื้น)
for i, cx in enumerate([32, 32 + 65, 32 + 130, 32 + 195]):
    d.ellipse([cx - 20, 78, cx + 20, 88], fill=(180, 180, 190))

img.save("tests/ai-sheet-gradient.png")
print("สร้าง tests/ai-sheet-gradient.png", img.size)
