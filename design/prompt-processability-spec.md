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
| 4 | **ขนาดเฟรมเท่ากันทุกตัว (grid) + กรอบตรงพิทช์** | `--check` คำนวณ pitch = ขนาดภาพ÷จำนวนคอลัมน์ แล้วตรวจที่ตำแหน่งคาบ (0, pitch, 2×pitch…) — ต้องบังคับให้ AI วาดกรอบ **ที่ตำแหน่งทวีคูณของขนาดเซลล์พอดี** ไม่งั้นเซลล์เลื่อน | `all cells exactly the same size, evenly spaced; borders must fall at exact multiples of the cell size, starting at the very edge of the image (no extra margin)` |
| 5 | **ห้ามข้อความ/โลโก้/ลายน้ำ** | ตัวหนังสือ = กลายเป็นเฟรมหลอกในขั้นตรวจจับ | `NO text, NO letters, NO watermark, NO signature` |
| 6 | **ห้ามใช้สีเข้มของ bg ในตัวละคร** | `--check` ตรวจจับเงา = "เข้มกว่าพื้น + hue เดียวกับ bg" — ถ้าโครงตัวเป็นเขียวเข้ม (เช่น `#1f8b0d`) จะ false positive เป็นเงา | `NO dark shades of the background color on the character (e.g. NO dark green #1f8b0d) — the character must not contain the background hue darkened` |

> **สีพื้นแนะนำ:** เขียว `#00ff00` หรือม่วง `#ff00ff` (magenta) — สีจัดจ้านที่ตัวละคร
> เกมแทบไม่ใช้ และต่างจากสีสกินมอนสเตอร์ชัดเจน → กัน AI เผลอใช้ซ้ำ
> (หลีกเลี่ยงขาว/ดำ — AI มักวาดรายละเอียดจาง ๆ สีใกล้ขาว-ดำปนพื้น)

### 🔲 แผนผังกริด 5 เส้น — ทำไมต้อง "ตรงพิทช์"

หัวใจของข้อ 4: `--check` **ไม่เดา** — คำนวณ pitch จากสัญญา (ขนาดภาพ ÷
จำนวนคอลัมน์) แล้ว anchor ที่ขอบภาพ (x = 0) ตรวจเนื้อที่ตำแหน่งคาบของ pitch
(0, 128, 256, 384, 512) — ถ้า AI วาดกรอบเลื่อน/เพิ่ม margin ต้นทาง
เซลล์ที่ตรวจจะเยื้องจากเซลล์จริง → เฟรมหลอก/ติดขอบ/กริดเพี้ยนทันที

```text
ภาพ 512×512 · เซลล์ 128×128 · กริด 4×4 (16 เซลล์)
กรอบ = สีพื้น #00ff00 ล้วน (หนา 4px)

     x = 0       128        256        384        512   ← เส้นกริดแนวตั้ง 5 เส้น
  │          │          │          │          │    (พิทช์ = 512÷4 = 128)
  │          │          │          │          │ 
  ┌──────────┬──────────┬──────────┬──────────┐   ← y = 0   (เส้นบน)
  │ (0,0)    │ (1,0)    │ (2,0)    │ (3,0)    │
  ├──────────┼──────────┼──────────┼──────────┤   ← y = 128
  │ (0,1)    │ (1,1)    │ (2,1)    │ (3,1)    │
  ├──────────┼──────────┼──────────┼──────────┤   ← y = 256
  │ (0,2)    │ (1,2)    │ (2,2)    │ (3,2)    │
  ├──────────┼──────────┼──────────┼──────────┤   ← y = 384
  │ (0,3)    │ (1,3)    │ (2,3)    │ (3,3)    │
  └──────────┴──────────┴──────────┴──────────┘   ← y = 512 (เส้นล่าง)

✅ ถูก (ตรงพิทช์): เส้นกริดที่ 0, 128, 256, 384, 512 — anchor ที่ 0
   → `--check` ตรวจเจอ 16 เซลล์ตรงพิกัด · exit 0
❌ ผิด (AI เผลอเพิ่ม margin 8px ซ้าย/บน): เส้นกริดจริงที่ 8, 136, 264,
   392, 520 → เซลล์สุดท้าย (392..520) ล้นภาพ 520 > 512 · `--check`
   anchor ที่ 0 → ตรวจพิกัดเยื้อง → รายงานเฟรมหลอก/ติดขอบ · exit 1
   (ถูกต้อง — reject ภาพนั้นก่อนเอาไปใช้)
```

**3 เหตุผลที่ต้องยึดพิทช์ตายตัว (ไม่ให้ AI เลือกเอง):**

| เกิดอะไรขึ้นถ้า... | ผลต่อ `--check` | ผลต่อเกม |
|---|---|---|
| AI เพิ่ม margin นอก (เช่น 512+8) | กริด anchor ที่ 0 → เซลล์ตรวจเยื้อง 8px | ตัดเฟรมกาก ๆ / หัว-เท้าขาด |
| AI เลือก pitch เอง (เช่น 130) | จำนวนคอลัมน์ไม่ลงตัว → เฟรมหลอก | เฟรมขนาดไม่เท่ากัน → animate กระตุก |
| AI วาดกรอบบางเซลล์หนาไม่เท่ากัน | ติดขอบ false positive บางเซลล์ | ขอบเฟรมมี bg ปนเนื้อตัว |

> **วิธีกัน AI ทำผิด:** พรอมต์ข้อ 4 ระบุเลขเป๊ะ "5 grid lines at
> x/y = 0, 128, 256, 384, 512" + "TOTAL IMAGE SIZE MUST BE EXACTLY
> 512×512, NO extra outer margin" — ย้ำ 2 บรรทัดนี้ทุกครั้ง

---

## 2. เทมเพลตพรอมต์ที่ "ประมวลผลง่าย" (ใช้ได้ทุกตัวละคร)

```
Create a single sprite sheet PNG for a 2D game character: <CHARACTER>.

LAYOUT (MUST follow exactly):
- A 4x1 grid = 4 cells in ONE horizontal row, each cell exactly 128x128 px.
- TOTAL IMAGE SIZE MUST BE EXACTLY 512x128 px (4 x 128 = 512 wide,
  128 tall, with NO extra outer margin).
- The 4 cells MUST be 4 DISTINCT animation poses (e.g. walk cycle:
  contact / down / passing / up) — NO duplicate cells.
- The 5 grid lines (left, 128, 256, 384, right edge) must be pure
  background color, forming straight full-height/full-width borders
  at exact multiples of 128 px from the top-left corner.
- Each cell contains ONE frame of the character's walk cycle (4 poses,
  repeated in 4 identical rows).
- Draw a thin 4px border around EVERY cell using the background color.

BACKGROUND (MUST):
- Flat solid color ONLY: pure green #00ff00.
- NO gradient, NO texture, NO vignette, NO clouds, NO grid pattern.
- NO drop shadow, NO ground shadow, NO glow around the character.
- Characters must NOT touch the cell borders (min 8px clearance).
- Characters must NOT contain dark shades of the background color
  (NO dark green, NO green-tinted shadows on the character).

ART STYLE: flat 2D, crisp shapes, <STYLE>, colors: <PALETTE HEX>.

FORBIDDEN: NO text, NO letters, NO numbers, NO watermark, NO signature,
NO extra characters, NO UI elements, NO background decoration.
```

> ตัวแปรที่ต้องเติม: `<CHARACTER>` (ชื่อ + เอกลักษณ์), `<STYLE>` (เช่น
> neon sci-fi), `<PALETTE HEX>` (สีสกิน 3-5 สีจาก character bible)

---

## 3. วิธีตรวจผล (Checklist — เปิดภาพ + รัน `--check`)

**ขั้นแรก (เร็วสุด):** รันโหมดตรวจภาพอัตโนมัติ

```bash
# 1 บรรทัดจบ: ตรวจก่อน (--require-check) → ผ่านจึงตัดเฟรม + manifest
./.venv-scripts/Scripts/python.exe scripts/ai-sprite-process.py <sheet.png> \
    --name walker --cell 128 --out-dir out/ \
    --grid-bg "#00ff00" --expect-grid 4x1 --pose-names contact,down,passing,up \
    --require-check --drop-flat --dedupe --mirror-cycle   # 8 เฟรม (ก้าว 2 = mirror)

# หรือตรวจอย่างเดียว (ไม่สร้างไฟล์)
./.venv-scripts/Scripts/python.exe scripts/ai-sprite-process.py <sheet.png> \
    --check --grid-bg "#00ff00" --expect-grid 4x1
```

| ตรวจ | วิธี | ผ่านเมื่อ |
|---|---|---|
| พื้นเป็นสีเดียวจริง | `--check` → กริด | กริดครบ 4×1 (แถวเดียว), เฟรม 4 (หรือ 8 หลัง `--mirror-cycle`) |
| ไม่มีเงา | `--check` → เงาตกค้าง | ไม่มี warn เงา |
| กรอบตรง/ตรงพิทช์ | `--check` → กริด + ตัวติดขอบ | ตรง 4x1 + ไม่มี warn ติดขอบ |
| ไม่มีเฟรมหลอก/ข้อความ | `--check` → เฟรมหลอก | ไม่มี error |
| ขนาดภาพตรงสัญญา | เปิดภาพ / `file` | 512×128 พอดี (ไม่มี margin พิเศษ) |

**exit code:** `0` = ผ่าน (มีแค่ ok/warn) · `1` = มี error → **อย่าเอาไปใช้ ไป gen ใหม่**

> ยังต้องเปิดภาพดูด้วยสายตาครั้งเดียวเสมอ — `--check` กันพลาดขั้นหยาบ
> (เฟรมว่าง/เงา/กริดเบี้ยว) แต่ความสวยงาม/สัดส่วนตัวละครต้องตาคนตัดสิน

---

## 4. ผังการทำงาน (Workflow)

```
พรอมต์ (PEP) ──▶ AI สร้างภาพ ──▶ [ตรวจ PEP Checklist]
                                        │
                               ผ่าน?  ──┤ ไม่ผ่าน → gen ใหม่ / i2i
                                        ▼
                ai-sprite-process.py --grid-bg #00ff00 --require-check
                (ตรวจอัตโนมัติก่อน — ไม่ผ่าน หยุด ไม่สร้างไฟล์)
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
