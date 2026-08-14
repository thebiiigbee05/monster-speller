# 🧪 Prompt Engineering for Processability (PEP)

> **หลักการ:** พรอมต์ = สัญญาระหว่าง AI กับสคริปต์ประมวลผล (Python)
> ถ้าพรอมต์บังคับเงื่อนไข "ประมวลผลง่าย" ไว้ → สคริปต์ไม่ต้องเดา
> ถ้าปล่อยให้ AI กำหนดเอง (พื้นไล่เฉด/เงา/กรอบแอบแฝง/ขอบไม่ตรง) → สคริปต์
> ต้องเดาแบบที่เพิ่งเจอ (เงาใต้ตัว ไล่เฉด) — ใช้ได้แต่เปราะบาง
>
> **กฎทอง:** "What the AI can't break, the pipeline doesn't have to fix."

---

## 1. หลักการ 5 ข้อที่พรอมต์ทุกชุดต้องบังคับ

| # | หลักการ | ทำไม Python ประมวลผลง่าย | วิธีบังคับในพรอมต์ |
|---|---|---|---|
| 1 | **พื้นหลังสีเดียวล้วน (flat, exact hex)** | ตรวจจับเส้นกริด = หาแถว/คอลัมน์ที่เป็นสีนั้นล้วน (O(w+h)) ไม่ต้อง flood fill | ระบุ hex ชัด: `background: solid #00ff00` + `NO gradient, NO texture, NO vignette, NO shadow` |
| 2 | **ไม่มีเงาใต้ตัว** | เงา = ขอบล่างบวม → bbox ตัดสูงเกิน / ติดมากับตัว | `NO drop shadow, NO ground shadow, characters float on flat background` |
| 3 | **กรอบ (border) รอบเฟรม** | เส้นกรอบ = แถว/คอลัมน์พื้นล้วนทั้งแถว → หาเส้นกริดได้แม่น 100% แม้เฟรมขนาดต่างกัน | `draw a thin 4px border around each cell using the background color` (กรอบ = สีพื้น) |
| 4 | **ขนาดเฟรมเท่ากันทุกตัว (grid)** | ตัดด้วยกริดตรง ไม่ต้องปรับขนาดต่างกัน | `all cells exactly the same size, evenly spaced, aligned to a perfect grid` |
| 5 | **ห้ามข้อความ/โลโก้/ลายน้ำ** | ตัวหนังสือ = กลายเป็นเฟรมหลอกในขั้นตรวจจับ | `NO text, NO letters, NO watermark, NO signature` |

> **สีพื้นแนะนำ:** เขียว `#00ff00` หรือม่วง `#ff00ff` (magenta) — สีจัดจ้านที่ตัวละคร
> เกมแทบไม่ใช้ และต่างจากสีสกินมอนสเตอร์ชัดเจน → กัน AI เผลอใช้ซ้ำ
> (หลีกเลี่ยงขาว/ดำ — AI มักวาดรายละเอียดจาง ๆ สีใกล้ขาว-ดำปนพื้น)

---

## 2. เทมเพลตพรอมต์ที่ "ประมวลผลง่าย" (ใช้ได้ทุกตัวละคร)

```
Create a single sprite sheet PNG for a 2D game character: <CHARACTER>.

LAYOUT (MUST follow exactly):
- A 4x4 grid = 16 cells, each cell exactly 128x128 px (total 512x512 px).
- Each cell contains ONE frame of the character's walk cycle (4 poses,
  repeated in 4 identical rows).
- Draw a thin 4px border around EVERY cell using the background color
  (borders must be perfectly aligned, forming straight grid lines).

BACKGROUND (MUST):
- Flat solid color ONLY: pure green #00ff00.
- NO gradient, NO texture, NO vignette, NO clouds, NO grid pattern.
- NO drop shadow, NO ground shadow, NO glow around the character.
- Characters must NOT touch the cell borders (min 8px clearance).

ART STYLE: flat 2D, crisp shapes, <STYLE>, colors: <PALETTE HEX>.

FORBIDDEN: NO text, NO letters, NO numbers, NO watermark, NO signature,
NO extra characters, NO UI elements, NO background decoration.
```

> ตัวแปรที่ต้องเติม: `<CHARACTER>` (ชื่อ + เอกลักษณ์), `<STYLE>` (เช่น
> neon sci-fi), `<PALETTE HEX>` (สีสกิน 3-5 สีจาก character bible)

---

## 3. วิธีตรวจผล (Checklist — เปิดภาพ + รันสคริปต์)

| ตรวจ | วิธี | ผ่านเมื่อ |
|---|---|---|
| พื้นเป็นสีเดียวจริง | รัน `--grid-bg #00ff00` | กริดครบ 4×4, เฟรม 16 |
| ไม่มีเงา | ดูภาพ / ตรวจ bbox ล่าง | ตัวไม่ติดขอบล่างเฟรม |
| กรอบตรง | เส้นกริดเป็นเส้นตรงทั้งแถว | ทุกเฟรมมีขนาดเท่ากัน ±2px |
| ไม่มีข้อความ | สบตา | ไม่พบเฟรมหลอก |

**ถ้าตรวจไม่ผ่านข้อไหน → อย่าเอาไปใช้ ไป gen ใหม่หรือใช้ i2i แก้** —
สคริปต์จะรายงานเฟรมหลอก/กริดไม่ตรงให้

---

## 4. ผังการทำงาน (Workflow)

```
พรอมต์ (PEP) ──▶ AI สร้างภาพ ──▶ [ตรวจ PEP Checklist]
                                        │
                               ผ่าน?  ──┤ ไม่ผ่าน → gen ใหม่ / i2i
                                        ▼
                          ai-sprite-process.py --grid-bg #00ff00
                                        │
                    (1) ตรวจกริดตรง  (2) ลบ bg (ลบง่าย: สีเดียว)
                    (3) ตัดเฟรมตามกริด  (4) normalize + manifest
                                        ▼
                        เฟรมโปร่งใส + manifest.json → เกม
```

## 5. กติกาเพิ่มเติม (ตอนขอ AI ใหม่)

- ขอ **ชุดละ 2-3 แบบ** แล้วเลือกแบบที่ "กรอบตรง + พื้นสีเดียวเป๊ะ"
- ถ้า AI ดื้อไม่ทำตาม (เช่น ใส่เงา) → ต่อท้ายพรอมต์:
  `"If you add any shadow, vignette, or non-uniform background, the image
  will be rejected and regenerated."`
- ภาพใหญ่สุดที่ AI ทำได้ (1024) → ขอ 4×4 @ 128 = 512; ถ้า AI ทำ 1024 ได้
  ให้ขยายเป็น 4×4 @ 256 = 1024 (ชาร์ปกว่า)

---

## 6. เครื่องมือประมวลผล (Python)

| ไฟล์ | บทบาท | ใช้เมื่อ |
|---|---|---|
| `scripts/ai-sprite-process.py` | รับ sheet → ลบพื้น → ตัดเฟรม → normalize → manifest JSON | ภาพตามสัญญา PEP (โหมด `--grid-bg` + `--expect-grid`) หรือภาพ AI ทั่วไป (โหมด flood + `--remove-shadows`) |
| `scripts/sprite-frame-detect.py` | ตรวจจับขอบเฟรมจากช่องว่าง (ไม่มีกริด) | ภาพโปร่งใสอยู่แล้ว / ขั้นตรวจ |
| `scripts/README-ai-sprite-process.md` | วิธีใช้ + ตัวอย่างคำสั่ง | — |

## 7. ทำไมวิธีนี้ดีกว่า flood fill เดา

| กรณี | flood fill เดา | กริดบังคับ (PEP) |
|---|---|---|
| พื้นไล่เฉด | ต้อง interpolate มุม → ผิดพลาดได้ | ใช้ไม่ได้ (พื้นห้ามไล่เฉด) |
| เงาใต้ตัว | ต้องเดา component + สี | ห้ามมีตั้งแต่ต้น |
| เฟรมขนาดต่างกัน | จับ bbox เอง | กริดตายตัว |
| กรอบ AI แอบใส่ | ติดมากับเฟรม | กรอบ = สีพื้น → เป็นเส้นกริดให้เรา |

> สรุป: PEP ย้ายงานจาก "ซ่อมภาพที่พัง" ไปเป็น "ตรวจภาพว่าตรงสัญญาไหม"
> — ถูกกว่า รวดเร็ว และ deterministic 100%
