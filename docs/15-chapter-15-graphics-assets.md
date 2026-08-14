# บทที่ 15 สเปกกราฟิกและพรอมต์สร้างสินทรัพย์ (Graphics Asset Spec & AI Prompts)

> **ไฟล์:** `docs/15-chapter-15-graphics-assets.md` · **ผู้รับผิดชอบ:** Graphic Designer + Game Developer + AI Prompt Engineer
> **จุดประสงค์:** เอกสารกลางรายการสินทรัพย์กราฟิกทั้งหมดของเกม (งานกราฟิก ฉาก ตัวละคร วัตถุ-ไอเท็ม)
> พร้อม **พรอมต์ (Prompt) สำเร็จรูป** สำหรับสร้างด้วย AI — ใครก็ตามในทีมคัดลอกไปใช้ได้ทันที
> **ธีมเดียวทั้งเกม:** 2D Neon Sci-Fi — พื้นไล่เฉด `#0b0f2a → #1a1140` · นีออน 4 สี (ฟ้า `#00e5ff` / ชมพู `#ff2e97` / เขียว `#39ff14` / ทอง `#ffd700`)

---

## 15.1 สรุปสถานะสินทรัพย์กราฟิก (Asset Inventory)

| # | สินทรัพย์ | ไฟล์ | ขนาด/สัดส่วน | สถานะ |
|---|---|---|---|---|
| 1 | พื้นหลังฉากเกม | `public/assets/bg/space-bg.png` | 960×540 | ✅ ทำแล้ว (สคริปต์/AI) |
| 2 | สไปรต์มอนสเตอร์ 4 ชนิด (10 เฟรม/ตัว) | `public/assets/sprites/monsters-sheet.png` | 640×256 (4×10 เซลล์ 64×64) | ✅ ทำแล้ว |
| 3 | Manifest สไปรต์ | `monsters-sheet.json` | — | ✅ ทำแล้ว |
| 4 | พื้นหลัง Hub | `public/assets/bg/hub-bg.png` | 1920×1080 | ⏳ รอ AI |
| 5 | พื้นหลังด่านพิเศษ (วิกฤต/ป้อม/ทอง) | `public/assets/bg/*-bg.png` | 960×540 ×3 | ⏳ รอ AI |
| 6 | สไปรต์ยานผู้เล่น "ผู้พิทักษ์-1" | `assets/ship/` | 128×128 | ⏳ Sprint 4 (วาดด้วยโค้ดชั่วคราว) |
| 7 | ไอคอนกระสุน 8 มาตรา | `assets/ui/bullets/` | 48×48 ×8 | ⏳ Sprint 3 |
| 8 | ชิ้นส่วนอัปเกรดยาน (4 ชิ้น) | `assets/items/parts/` | 64×64 ×4 | ⏳ Sprint 4 |
| 9 | ไอคอน HUD/UI (หัวใจ/ดาว/เวลา/ฯลฯ) | `assets/ui/icons/` | 32×32 | ⏳ Sprint 3 |
| 10 | การ์ด AR มอนสเตอร์ (8 แบบ) | `public/assets/ar-cards/` | ตามสเปก AR | ⏳ Sprint 5 |
| 11 | Portrait ตัวละครเสริม (ผู้บัญชาการ/RO-BOT) | `assets/characters/` | 256×256 | ⏳ Sprint 5 |

> **กฎ:** สินทรัพย์ทุกชิ้นต้องเข้ากับ **จานสีธีม 6 สี** และสไตล์ flat-2D เส้นคม — ใช้พรอมต์ในบทนี้เป็นตัวบังคับสไตล์

---

## 15.2 ฉาก (Scenes)

| ฉาก | ใช้ที่ไหน | ขนาด | องค์ประกอบบังคับ | พรอมต์ |
|---|---|---|---|---|
| **ฉากเกมหลัก** | Canvas เกม | 960×540 | โลก/ดวงจันทร์/ดาวเคราะห์วงแหวน/ดาว 2 ชั้น + เส้นนีออนขอบฟ้า | ✅ มี (ดู 15.5) |
| **Hub (เมนูหลัก)** | หน้าแรก | 1920×1080 | วิวอวกาศกว้าง กลางล่างโล่ง (วางปุ่ม) ไม่มีเส้นขอบฟ้า | ✅ มี (ดู 15.6) |
| **ด่านวิกฤต (4–6)** | ฉากเกมด่านกลาง | 960×540 | เนบิวลาแดง-ชมพู + เศษดาวเคราะห์น้อย + เส้นพลังงานบานเย็น | ✅ มี (ดู 15.7) |
| **ป้อมจอมมาร (7–8)** | ฉากเกมด่านบอส | 960×540 | ดวงอาทิตย์แดง + ป้อมเงาดำหนามแหลม + ถ่านไฟลอย | ✅ มี (ดู 15.7) |
| **สรุปชนะ/โบนัส** | ฉากจบ | 960×540 | เนบิวลาทอง-ชมพู สงบสุข + วงแหวนทองลอย | ✅ มี (ดู 15.7) |
| **Hangar (โรงเก็บยาน)** | Sprint 4 | 1280×720 | แท่นซ่อมยาน + ชิ้นส่วนลอย + ไฟนีออน | 🔜 มีใน 15.9 |
| **ฉาก AR** | Sprint 5 | จอกล้อง | พื้นโปร่งใส (มอนสเตอร์ลอยบนการ์ด) | 🔜 มีใน 15.9 |

---

## 15.3 รายการตัวละคร (Characters)

> ดูโปรไฟล์เต็ม (สถิติ/บุคลิก/แอนิเมชัน) ใน [`design/characters.md`](../design/characters.md) — บทนี้สรุปเฉพาะข้อมูลที่พรอมต์ต้องใช้
> 🔗 **เอกสารอาร์ต 3 ชั้น** (Bible + Sheet + Sprite spec) ครอบคลุมทุกตัวที่ [`design/art/`](../design/art/README.md)

| ตัวละคร | สีหลัก | เอกลักษณ์ (บังคับใส่ในพรอมต์) | สถานะสไปรต์ |
|---|---|---|---|
| **วอล์กเกอร์** 🟢 | เขียว #39ff14 | ตัวกลม · หนวด 2 เส้นปลายทอง · ตากลม | ✅ มี |
| **รันเนอร์** 🩷 | ชมพู #ff2e97 | ลำตัวเพรียวเอียง · ครีบหลัง · 3 ตา · รองเท้าขาว | ✅ มี |
| **แทงก์** 🟣 | ม่วง #a855f7 | ตัวอ้วนกลม · หัวแป๊กทอง 2 อัน · ตาหงอย | ✅ มี |
| **บอส** 👑 | แดง #ff3b3b | เขาทอง 2 เขา · คิ้วโกรธ · ตาแดง · ฟันแหลม | ✅ มี |
| **ยานผู้พิทักษ์-1** | ฟ้า #00e5ff | ปีก 3 เหลี่ยม · แกนชมพู · เปลวท้ายเขียว | ⏳ รอวาด |
| **ผู้บัญชาการสถานี** | ขาว-ทอง | เครื่องแบบอวกาศ · หมวกโปร่ง · อินเทอร์คอม | ⏳ Sprint 5 |
| **หุ่นยนต์ RO-BOT** | เขียวมิ้นต์ | หุ่นกลมลอยได้ · หน้าจอแสดงตัวสะกด · หนวดเสาอากาศ | ⏳ Sprint 5 |

**พรอมต์สากลสำหรับตัวละคร (PEP — เติมชื่อ/สี/เอกลักษณ์ ต่อท้าย):**
```text
2D game character sprite sheet for a children's educational space game "Monster Speller".
FLAT 2D, NEON SCI-FI style, subtle pixel-art texture, crisp outline.
[ชื่อ + สีหลัก + เอกลักษณ์จากตาราง]. Cute cartoon, kid-friendly, NOT scary.
LAYOUT: 2x2 grid = 4 cells (256x256 each), TOTAL IMAGE 512x512, NO extra margin.
Grid lines at x/y = 0, 256, 512 must be pure background color at exact multiples
of 256 px. 4px border around every cell using the background color.
BACKGROUND: flat solid pure green #00ff00 ONLY (NO gradient, NO shadow, NO glow).
Character must NOT touch cell borders (min 8px clearance) and must NOT contain
dark shades of green. FORBIDDEN: NO text, NO letters, NO logo, NO watermark,
NO extra characters, NO UI elements.
```
> **คำสั่งตรวจ + ตัด (1 บรรทัดจบ):**
> `ai-sprite-process.py <sheet.png> --name char --cell 256 --out-dir out/ --grid-bg "#00ff00" --expect-grid 2x2 --require-check`

---

## 15.4 รายการวัตถุและไอเท็ม (Objects & Items)

### 15.4.1 กระสุนมาตราตัวสะกด (8 ชนิด — สีประจำมาตรา)

| มาตรา | สี | เอกลักษณ์ |
|---|---|---|
| กา | ฟ้า #00e5ff | กลมเรืองแสง |
| กก | เขียว #39ff14 | สี่เหลี่ยมจัตุรัส |
| กด | ชมพู #ff2e97 | หยดน้ำ |
| กบ | ส้ม #ffb703 | สามเหลี่ยม |
| กน | ม่วง #a855f7 | ห้าเหลี่ยม |
| กม | เขียวน้ำทะเล #2dd4bf | วงรี |
| เกย | แดง #ff3b3b | ดาว 4 แฉก |
| เกอว | น้ำตาลส้ม #d97706 | หกเหลี่ยม |

**พรอมต์ (PEP — กริด 4×2):**
```text
8 individual game bullet icons for "Monster Speller" (Thai alphabet reading game).
NEON glowing energy orbs, one per Thai consonant class letter shape, flat 2D,
kid-friendly. LAYOUT: 4x2 grid = 8 cells (64x64 each), TOTAL 256x128 px,
NO margin. Grid lines at exact multiples of 64 px, pure background color.
4px border per cell. BACKGROUND: flat solid pure green #00ff00 ONLY.
NO shadow, NO text, NO letters, NO watermark, NO glow outside the orb.
```
> **คำสั่ง:** `ai-sprite-process.py <bullets.png> --name bullet --cell 64 --out-dir assets/ui/bullets/ --grid-bg "#00ff00" --expect-grid 4x2 --require-check`
>
> **📦 ไฟล์:** AI สร้าง → ตั้งชื่อ **`bullets-sheet.png`** วางที่ **`public/assets/ai/`**
> · ผลลัพธ์: เฟรม `bullet_00.png…07.png` + `bullet.json` ใน **`public/assets/ui/bullets/`**

### 15.4.2 ชิ้นส่วนอัปเกรดยาน (4 ชิ้น — Sprint 4)

| ชิ้นส่วน | รูปร่าง | เอฟเฟกต์ |
|---|---|---|
| เครื่องยนต์เทอร์โบ | ทรงกระบอกมีครีบ | เปลวไฟข้างหลัง |
| ปืนเลเซอร์คู่ | ปืนคู่เรืองแสง | ประกายฟ้า |
| โล่พลังงาน | หกเหลี่ยมโปร่ง | เงาสีเขียว |
| เซนเซอร์แม่นยำ | จานดาวเทียม | จุดเรดาร์กะพริบ |

**สีจริงต่อชิ้น (ใช้ในพรอมต์):**

| ชิ้นส่วน | เซลล์ (คอลัมน์,แถว) | สีหลัก | สีรอง |
|---|---|---|---|
| เครื่องยนต์เทอร์โบ | (0,0) ซ้ายบน | ฟ้า `#00e5ff` | เปลวทอง `#ffd700` |
| ปืนเลเซอร์คู่ | (1,0) ขวาบน | ชมพู `#ff2e97` | ปลายฟ้า `#00e5ff` |
| โล่พลังงาน | (0,1) ซ้ายล่าง | เขียวน้ำทะเล `#2dd4bf` | โครงฟ้า `#00e5ff` |
| เซนเซอร์แม่นยำ | (1,1) ขวาล่าง | ทอง `#ffd700` | จุดเรดาร์ชมพู `#ff2e97` |

**พรอมต์ (PEP — กริด 2×2):**
```text
4 glowing spaceship upgrade parts for "Monster Speller".
Cell (0,0): turbo engine — neon cyan #00e5ff body, gold #ffd700 flame nozzle.
Cell (1,0): twin laser — neon pink #ff2e97 barrels, cyan #00e5ff tips.
Cell (0,1): energy shield — teal #2dd4bf hexagon, cyan #00e5ff outline.
Cell (1,1): targeting sensor — gold #ffd700 dish, pink #ff2e97 radar dot.
All cells: flat 2D sci-fi, neon glow, kid-friendly, same size 64x64.
LAYOUT: 2x2 grid = 4 cells (64x64 each), TOTAL 128x128 px, NO margin.
Grid lines at 0/64/128, pure background color. 4px border per cell.
BACKGROUND: flat solid pure green #00ff00 ONLY. NO shadow, NO glow outside
the part, NO text, NO watermark.
```
> **คำสั่ง:** `ai-sprite-process.py <parts.png> --name part --cell 64 --out-dir assets/items/parts/ --grid-bg "#00ff00" --expect-grid 2x2 --require-check`
>
> **📦 ไฟล์:** AI สร้าง → ตั้งชื่อ **`ship-parts-sheet.png`** วางที่ **`public/assets/ai/`**
> · ผลลัพธ์: เฟรม `part_00.png…03.png` + `part.json` ใน **`public/assets/items/parts/`**

### 15.4.3 ไอเท็มเสริมพลัง (Power-ups — เสนอเพิ่ม)

| ไอเท็ม | ผล | สี |
|---|---|---|
| กระสุนเจาะเกราะ (Pierce) | ยิงทะลุ 1 ตัว | ม่วง-ขาว |
| ชะลอเวลา (Slow-mo) | มอนสเตอร์ช้าลง 50% 5 วิ | ฟ้า-น้ำเงิน |
| กระสุนกระจาย (Spread) | ยิง 3 ทิศ 3 วิ | ส้ม-เหลือง |
| ดาวคะแนน 2× | คะแนนคูณ 2 | ทอง |

**สีจริงต่อไอเท็ม (ใช้ในพรอมต์):**

| ไอเท็ม | เซลล์ (คอลัมน์,แถว) | สีหลัก | สีรอง |
|---|---|---|---|
| กระสุนเจาะเกราะ (Pierce) | (0,0) ซ้ายบน | ม่วง `#a855f7` | ขาว `#ffffff` |
| ชะลอเวลา (Slow-mo) | (1,0) ขวาบน | ฟ้า `#00e5ff` | น้ำเงิน `#2563eb` |
| กระสุนกระจาย (Spread) | (0,1) ซ้ายล่าง | ส้ม `#ffb703` | เหลือง `#ffd700` |
| ดาวคะแนน 2× | (1,1) ขวาล่าง | ทอง `#ffd700` | ขาว `#fff6e8` |

**พรอมต์ (PEP — กริด 2×2):**
```text
4 collectible power-up icons for "Monster Speller".
Cell (0,0): pierce bullet — purple #a855f7 orb, white #ffffff core.
Cell (1,0): slow-mo clock — cyan #00e5ff clock face, navy #2563eb hands.
Cell (0,1): spread shot — orange #ffb703 three-way arrow, gold #ffd700 tips.
Cell (1,1): 2x score star — gold #ffd700 star, soft white #fff6e8 glow.
All cells: neon glowing, flat 2D sci-fi, kid-friendly, same size 64x64.
LAYOUT: 2x2 grid = 4 cells (64x64 each), TOTAL 128x128 px, NO margin.
Grid lines at 0/64/128, pure background color. 4px border per cell.
BACKGROUND: flat solid pure green #00ff00 ONLY. NO shadow, NO glow outside
the icon, NO text, NO watermark.
```
> **คำสั่ง:** `ai-sprite-process.py <powerups.png> --name powerup --cell 64 --out-dir assets/items/powerups/ --grid-bg "#00ff00" --expect-grid 2x2 --require-check`
>
> **📦 ไฟล์:** AI สร้าง → ตั้งชื่อ **`powerups-sheet.png`** วางที่ **`public/assets/ai/`**
> · ผลลัพธ์: เฟรม `powerup_00.png…03.png` + `powerup.json` ใน **`public/assets/items/powerups/`**

### 15.4.4 เอฟเฟกต์และวัตถุประกอบฉาก

| รายการ | ใช้ที่ไหน | พร้อมต์ |
|---|---|---|
| ดาว 4 แฉกเรืองแสง | ฉากเกม/Hub | `glowing 4-pointed sparkle star, neon white-gold, flat 2D, on pure green #00ff00 background, 32x32, no shadow, no text` |
| อนุภาคระเบิด (เขียว/แดง) | ตอบถูก/ผิด | `burst explosion particles, neon green + magenta sparks, flat 2D, on pure green #00ff00 background, no text` |
| คอนเฟตตี้ชนะ | สรุปโหมดเรียนรู้ | `colorful confetti falling, flat 2D, kid-friendly, on pure green #00ff00 background` |
| หัวใจ/ดาว HUD | HUD | `neon heart icon and star icon, flat 2D, cyan pink gold, 32x32, on pure green #00ff00 background, no text` |
| การ์ดคำศัพท์ | เหนือหัวมอนสเตอร์ | `small rounded game card with Thai word placeholder, neon border, flat 2D, on pure green #00ff00 background` |
>
> **คำสั่ง (รวมเอฟเฟกต์เป็นชุด — กริดตามจำนวนไอเท็ม เช่น 5 ในแถวเดียว):**
> `ai-sprite-process.py <fx.png> --name fx --cell 32 --out-dir assets/ui/fx/ --grid-bg "#00ff00" --expect-grid 1x5 --require-check`
>
> **📦 ไฟล์:** AI สร้าง → ตั้งชื่อ **`fx-sheet.png`** วางที่ **`public/assets/ai/`**
> · ผลลัพธ์: เฟรม `fx_00.png…` + `fx.json` ใน **`public/assets/ui/fx/`**

---

### 15.4.5 เทมเพลตสากล PEP — สินทรัพย์เล็ก (ชิ้นส่วน/ไอเท็ม/ไอคอน)

ใช้กับของเล็ก ๆ ที่ต้องตัดเป็น sprite เดี่ยว (ไม่เกิน 4–8 ชิ้น/ชุด)
— เติม `<รายการ>` `<สีต่อชิ้น>` ตามตารางด้านล่าง แล้วคัดลอกไป AI

```text
<N> game items for "Monster Speller", one per cell, same size, same style.
<รายการ + สี hex ต่อชิ้น — ระบุชัดว่าเซลล์ไหนคืออะไร>
Flat 2D sci-fi, neon glow, kid-friendly, cute, crisp dark outline.
LAYOUT: <COLS>x<ROWS> grid = <N> cells (<SIZE>x<SIZE> each), TOTAL
<W>x<H> px, NO margin. Grid lines at exact multiples of <SIZE> px, pure
background color. 4px border per cell.
BACKGROUND: flat solid pure green #00ff00 ONLY. NO shadow, NO glow outside
the item, NO text, NO letters, NO watermark.
```

**ตัวแปรที่ต้องเติม (ตามจำนวนชิ้น):**

| ชุด | `<N>` | กริด | เซลล์ | ขนาดรวม | `--expect-grid` |
|---|---|---|---|---|---|
| ชิ้นส่วนยาน 4 ชิ้น | 4 | 2×2 | 64 | 128×128 | `2x2` |
| ไอเท็ม 4 ชิ้น | 4 | 2×2 | 64 | 128×128 | `2x2` |
| กระสุน 8 มาตรา | 8 | 4×2 | 64 | 256×128 | `4x2` |
| ไอคอน HUD/เอฟเฟกต์ | 5 | 1×5 | 32 | 160×32 | `1x5` |

**คำสั่ง (เปลี่ยน `<name>` + กริดตามตาราง):**
```bash
./.venv-scripts/Scripts/python.exe scripts/ai-sprite-process.py <sheet.png> \
    --name <name> --cell <SIZE> --out-dir assets/<ที่เก็บ>/ \
    --grid-bg "#00ff00" --expect-grid <COLS>x<ROWS> --require-check
```

> **📦 ไฟล์ (กฎการตั้งชื่อ):** ไฟล์ที่ AI สร้าง ตั้งชื่อ **`<name>-sheet.png`**
> วางที่ **`public/assets/ai/`** เสมอ · ผลลัพธ์ (เฟรม + manifest) ไปที่
> **`public/assets/<ที่เก็บ>/`** ตาม `--out-dir` — อย่าใส่ไฟล์ AI ดิบลง
> `public/assets/` โดยตรง (ต้องผ่านสคริปต์ก่อน)

**Checklist ตรวจผล (ทุกชุด):**

- [ ] จำนวนชิ้นครบตามกริด (ตรวจด้วย `--check` → `--expect-grid` ตรงกัน)
- [ ] ชิ้นไหนอยู่เซลล์ไหนตรงตามตารางแมป (ดูผล manifest + ตาดู)
- [ ] ทุกชิ้นขนาดเท่ากัน กลางเซลล์ (กันตอน normalize เอียง)
- [ ] สีตรง hex ที่ระบุ — ไม่มีสีเขียวเข้มปน (กัน false positive เงา)
- [ ] ไม่มีข้อความ/โลโก้/ลายน้ำ (AI ชอบแอบใส่)
- [ ] ผ่าน `--check` → exit `0` ก่อนเอาไปใช้

**ถ้า AI ทำไม่ตรง (แนวทางแก้):**

| ปัญหา | แก้ |
|---|---|
| ชิ้นเกิน/ขาด (ได้ 5 จาก 4) | เพิ่ม `"exactly <N> cells, no duplicates, no extra items"` |
| สลับตำแหน่งชิ้น | ระบุ `"Cell (x,y) must be <ชื่อ>"` ซ้ำทุกชิ้นในพรอมต์ |
| พื้นไม่เขียวล้วน | เพิ่ม `"background MUST be flat solid pure green #00ff00, NO gradient"` หรือเปลี่ยนเป็นม่วง `#ff00ff` + `--grid-bg "#ff00ff"` |
| `--check` เตือนเงา | ตรวจสีเขียวเข้มบนชิ้น → เปลี่ยนเป็นโครงน้ำเงินเข้ม `#1a2333` แล้ว gen ใหม่ |
| ชิ้นติดขอบ | เพิ่ม `"each item must be smaller, min 8px clearance from cell edges"` |

---

## 15.5 พรอมต์: พื้นหลังฉากเกม (มีแล้ว — อ้างอิง)

> **📦 ไฟล์:** ตั้งชื่อ **`space-bg.png`** วางที่ **`public/assets/bg/`** (ใช้เต็มจอ ไม่ต้องผ่านสคริปต์)

```text
2D game background for a children's educational space shooter "Monster Speller".
FLAT 2D side-view space scene, NEON SCI-FI style.
Lower-left: purple planet with tilted pink-violet particle ring.
Upper-center: small gray moon with craters. Upper-right: blue planet with
green continents + soft clouds. Deep nebulas (purple/blue/magenta) +
two star layers. Bottom: thin glowing cyan neon horizon line + dark ground.
Palette: #0b0f2a→#1a1140 gradient, neon #00e5ff #ff2e97 #39ff14 #ffd700.
CLEAR center-right (gameplay area). No characters, no monsters, no ship,
no text, no logo, no watermark. 16:9, 960x540.
```

---

## 15.6 พร้อมต์: พื้นหลัง Hub (1920×1080)

> **📦 ไฟล์:** ตั้งชื่อ **`hub-bg.png`** วางที่ **`public/assets/bg/`** (ใช้เต็มจอ ไม่ต้องผ่านสคริปต์)

```text
Wide 2D game background for the MAIN MENU of "Monster Speller".
FLAT 2D panoramic space vista, NEON SCI-FI style.
Left: large purple ringed planet entering from left edge.
Center-left: gray moon with craters. Upper-right: blue planet with green
continents + clouds. Far right: glowing gold-orange sun or galaxy spiral.
3 layered nebulas (purple/blue/magenta) + two star layers.
NO horizon line. CENTER-LOWER area clear and dark (menu buttons go there).
Palette: #0b0f2a→#1a1140, neon #00e5ff #ff2e97 #39ff14 #ffd700,
stars white/pale blue/warm yellow.
No characters, no text, no logo, no watermark. 16:9, 1920x1080.
```

---

## 15.7 พรอมต์: พื้นหลังด่านพิเศษ 3 แบบ (960×540)

**A. เขตกาแล็กซีวิกฤต (ด่าน 4–6):**
> **📦 ไฟล์:** ตั้งชื่อ **`crisis-galaxy-bg.png`** วางที่ **`public/assets/bg/`**
```text
2D game background for levels 4-6 of "Monster Speller". DANGEROUS CRISIS
SECTOR: swirling red-pink nebulas, floating purple asteroid chunks, a jagged
glowing magenta energy crack crossing the space. Large red-orange spiral
nebula upper half, purple asteroids, magenta lightning vein, two star layers.
LOWER RIGHT clear and dark. Bottom: thin cyan neon horizon + dark ground.
Palette: #120a1e→#2a0d22, red #ff3b3b, magenta #ff2e97, violet #a855f7,
cyan #00e5ff (horizon). Kid-friendly cartoon danger. No characters/monsters/
ship/text/logo/watermark. 16:9, 960x540.
```

**B. ป้อมจอมมาร (ด่าน 7–8):**
> **📦 ไฟล์:** ตั้งชื่อ **`demon-fortress-bg.png`** วางที่ **`public/assets/bg/`**
```text
2D game background for FINAL BOSS levels 7-8 of "Monster Speller". THE DEMON
FORTRESS: red-black space with a HUGE red sun + solar flares (upper-left),
a dark spiky gothic fortress silhouette with glowing magenta windows
(upper-right), dark crimson nebulas, floating ember particles, fewer stars.
LOWER RIGHT clear and dark. Bottom: thin cyan neon horizon + dark ground.
Palette: #1a0508→#2d0a10, red #ff3b3b, ember #ff7b00, magenta #ff2e97,
cyan #00e5ff. Dramatic but kid-friendly cartoon villain lair. No characters/
monsters/ship/text/logo/watermark. 16:9, 960x540.
```

**C. สวรรค์สีทอง (ฉากชนะ/โบนัส):**
> **📦 ไฟล์:** ตั้งชื่อ **`golden-heaven-bg.png`** วางที่ **`public/assets/bg/`**
```text
2D game background for a VICTORY/bonus scene of "Monster Speller". GOLDEN
CELESTIAL SANCTUARY: warm gold-pink nebulas, small radiant white-gold sun
(upper-center), floating golden ring arcs, soft glowing stars, golden
sparkles floating up. LOWER RIGHT clear and dark. Bottom: thin cyan neon
horizon + dark ground. Palette: #2a1030→#3d1638, gold #ffd700, warm pink
#ffb3d1, soft white #fff6e8, cyan #00e5ff. Joyful, peaceful, kid-friendly.
No characters/monsters/text/logo/watermark. 16:9, 960x540.
```

---

## 15.8 พรอมต์: สไปรต์มอนสเตอร์เดี่ยว (PEP — ใช้แทน pixel-art ได้)

> 🔗 **พรอมต์ PEP ครบ 4 มอนสเตอร์ + คำสั่ง Python พร้อมใช้:
> [`design/art/pep-prompts-monsters.md`](../design/art/pep-prompts-monsters.md)**
> (พื้น `#00ff00` · กริด 4×1 แถวเดียว 128px = ภาพ 512×128 · `--expect-grid 4x1 --require-check --drop-flat --dedupe`)

```text
2D game monster sprite sheet for "Monster Speller", frame-by-frame animation.
FLAT 2D, NEON SCI-FI, subtle pixel-art texture, crisp dark outline.
[ชื่อมอนสเตอร์ + สี + เอกลักษณ์]. 6 frames in a row: walk1, walk2 (legs
alternating), stun (X eyes + tongue), explode1, explode2 (burst), friendly
(smile + blush). Cute cartoon, kid-friendly, NOT scary.
LAYOUT: 1x6 grid = 6 cells (128x128 each), TOTAL 768x128 px, NO margin.
Grid lines at exact multiples of 128 px, pure background color. 4px border
per cell. BACKGROUND: flat solid pure green #00ff00 ONLY. NO shadow,
NO glow, NO text, NO logo, NO watermark. Character must NOT touch cell
borders (min 8px clearance).
```
> **คำสั่ง:** `ai-sprite-process.py <monster-sheet.png> --name monster --cell 128 --out-dir out/ --grid-bg "#00ff00" --expect-grid 1x6 --require-check`
>
> **📦 ไฟล์:** AI สร้าง → ตั้งชื่อ **`monster-<ชื่อ>-sheet.png`** วางที่ **`public/assets/ai/`**
> · ผลลัพธ์: เฟรม + `<ชื่อ>.json` ใน **`public/assets/sprites/ai/<ชื่อ>/`**

> ⚠️ **ข้อควรระวัง:** สไปรต์จาก AI มักได้เฟรมไม่ตรงตำแหน่ง/ไม่ loop สมูท
> → ใช้เป็นแนวอ้างอิงแล้ววาดทับด้วย `scripts/generate-sprites.mjs` หรือ
> ใช้ AI วาดภาพนิ่ง 1 ท่า แล้วขอให้ทีมวาดเฟรมที่เหลือตาม (ดูบท 6.6)

---

## 15.9 พรอมต์: ฉากและตัวละครเสริม (Sprint 4–5)

**Hangar (โรงเก็บยาน):**
> **📦 ไฟล์:** ตั้งชื่อ **`hangar-bg.png`** วางที่ **`public/assets/bg/`** (ใช้เต็มจอ)
```text
2D game background for the HANGAR/upgrade screen of "Monster Speller".
A neon repair dock: spaceship service bay with glowing platforms, floating
upgrade parts, holographic display panels, cyan-pink-magenta neon lighting,
flat 2D sci-fi, kid-friendly. Dark navy palette matching #0b0f2a.
No characters, no text, no logo, no watermark. 16:9, 1280x720.
```

**ผู้บัญชาการสถานี (portrait) — PEP:**
```text
2D game character portrait (bust) of a friendly space station commander for
"Monster Speller". White-gold uniform, transparent helmet, warm smile,
communicator headset. FLAT 2D, NEON SCI-FI, subtle pixel texture, crisp
outline, kid-friendly. Square 256x256. LAYOUT: single character centered,
4px border, TOTAL 256x256 px. BACKGROUND: flat solid pure green #00ff00 ONLY.
NO shadow, NO text, NO logo, NO watermark. Character must NOT touch edges.
```
> **คำสั่ง:** `ai-sprite-process.py <commander.png> --name commander --cell 256 --out-dir assets/characters/ --grid-bg "#00ff00" --expect-grid 1x1 --require-check`
>
> **📦 ไฟล์:** AI สร้าง → ตั้งชื่อ **`commander-sheet.png`** วางที่ **`public/assets/ai/`**
> · ผลลัพธ์: `commander_00.png` + `commander.json` ใน **`public/assets/characters/`**

**หุ่นยนต์ RO-BOT (ผู้ช่วยสอน) — PEP:**
```text
2D game character of a cute floating tutor robot "RO-BOT" for "Monster
Speller". Round mint-green body, floating, screen face showing a Thai letter,
antenna with glowing tip, small friendly arms. FLAT 2D, NEON SCI-FI,
kid-friendly. Square 256x256. LAYOUT: single character centered, 4px border,
TOTAL 256x256 px. BACKGROUND: flat solid pure green #00ff00 ONLY. NO shadow,
NO text, NO logo, NO watermark. Character must NOT touch edges.
```
> **คำสั่ง:** `ai-sprite-process.py <robot.png> --name robot --cell 256 --out-dir assets/characters/ --grid-bg "#00ff00" --expect-grid 1x1 --require-check`
>
> **📦 ไฟล์:** AI สร้าง → ตั้งชื่อ **`robot-sheet.png`** วางที่ **`public/assets/ai/`**
> · ผลลัพธ์: `robot_00.png` + `robot.json` ใน **`public/assets/characters/`**

---

## 15.10 ตารางรวมพรอมต์ทั้งหมด (Quick Copy Sheet)

| สินทรัพย์ | ไฟล์ปลายทาง | พรอมต์ | ประเภท | PEP? |
|---|---|---|---|---|
| พื้นหลังเกม | `bg/space-bg.png` | 15.5 | background | — |
| พื้นหลัง Hub | `bg/hub-bg.png` | 15.6 | background | — |
| พื้นหลังวิกฤต | `bg/crisis-galaxy-bg.png` | 15.7A | background | — |
| พื้นหลังป้อม | `bg/demon-fortress-bg.png` | 15.7B | background | — |
| พื้นหลังชนะ | `bg/golden-heaven-bg.png` | 15.7C | background | — |
| สไปรต์มอนสเตอร์ (อ้างอิง) | `sprites/monsters-sheet.png` | 15.8 / pep-prompts | sprite | ✅ ต้อง PEP |
| กระสุน 8 มาตรา | `assets/ui/bullets/` | 15.4.1 | sprite | ✅ ต้อง PEP |
| ชิ้นส่วนยาน 4 ชิ้น | `assets/items/parts/` | 15.4.2 | sprite | ✅ ต้อง PEP |
| ไอเท็มเสริมพลัง | `assets/items/powerups/` | 15.4.3 | sprite | ✅ ต้อง PEP |
| เอฟเฟกต์/ไอคอน HUD | `assets/ui/fx/` | 15.4.4 | sprite | ✅ ต้อง PEP |
| ฉาก Hangar | `bg/hangar-bg.png` | 15.9 | background | — |
| ผู้บัญชาการ/RO-BOT | `assets/characters/` | 15.9 | sprite | ✅ ต้อง PEP |

---

## 15.11 ข้อกำหนดการส่งมอบ (DoD สำหรับงานกราฟิก)

- [ ] ขนาด/สัดส่วนตรงตามตาราง 15.1 (บังคับ)
- [ ] **งาน sprite ทุกชิ้นผ่าน `--check`** (พื้น `#00ff00` + `--expect-grid`) → exit 0 (ดู PEP spec)
- [ ] พื้นที่ว่างสำหรับเกมเพลย์ (มุมขวาล่าง/กลางล่าง) ยังโล่ง
- [ ] จานสีตรงธีม 6 สี — ไม่มีสีหลุดธีม (เทียบ eyedropper กับตารางสี)
- [ ] ไม่มีตัวหนังสือ/โลโก้/ลายน้ำ (AI ชอบแอบใส่)
- [ ] ภาพไม่บีบ/ยืด — ใช้ native resolution ตรงตาม spec
- [ ] วางไฟล์ในโฟลเดอร์ตามตาราง 15.10 + แจ้งทีม → ผม (developer) จัด manifest/โค้ดให้
- [ ] ผ่านการตรวจในเกมจริง (Canvas scale แล้วดูคมชัด ไม่เบลอ)

### 15.11.1 สเปกการสร้างภาพที่ "ประมวลผลง่าย" (PEP)

> ภาพที่ AI สร้าง**ไม่ใช่พื้นหลังโปร่งใส** — ต้องผ่าน Python ก่อนเข้าเกม
> อ่านสเปกเต็ม + เทมเพลตพรอมต์ + วิธีตรวจ: **`design/prompt-processability-spec.md`**
>
> หลักสั้น ๆ: พรอมต์ต้องบังคับ **พื้นหลังสีเดียวล้วน** (เช่น `#00ff00`)
> + **ห้ามเงา** + **ห้ามข้อความ/โลโก้** → สคริปต์ `scripts/ai-sprite-process.py`
> (โหมด `--grid-bg`) ลบพื้นและตัดเฟรมได้แม่น 100% ไม่ต้องเดา
>
> **พรอมต์สำเร็จรูปครบ 4 มอนสเตอร์ (สี/เอกลักษณ์จาก Bible + คำสั่ง Python
> พร้อมใช้):** `design/art/pep-prompts-monsters.md`
---

> ⬆️ [กลับไปสารบัญ](00-cover-and-toc.md)
