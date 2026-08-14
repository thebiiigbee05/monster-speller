# 🎨 พรอมต์ AI: เทิร์นอราวด์ 4 มุม (Turnaround) — มอนสเตอร์ 4 ชนิด (PEP)

> **ชั้นที่ 2.5** (Bible → **Turnaround** → Sheet → Sprite) · สำหรับ AI ภาพ
> อ้างอิงข้อมูลจาก `character-bibles/*.md` — ห้ามขัดแย้งกับ Bible
> **วิธีใช้:** คัดลอกพรอมต์ → วางใน AI → นำผลกลับมา **รัน `--check` ก่อนใช้**
>
> ⚠️ **เวอร์ชัน PEP** — เปลี่ยนจาก "transparent background" (AI ทำไม่ได้จริง
> ได้พื้นขาว/เทามา → สคริปต์ต้องเดา) เป็น **พื้น `#00ff00` ล้วน + กริด 2×2**
> (ตามสเปก `design/prompt-processability-spec.md`) → ประมวลผลได้ 100% แน่นอน

---

## 0. เทมเพลตสากล (ใช้เติมสำหรับตัวละครใหม่)

```
Character turnaround sheet for a children's educational space game
"Monster Speller". ONE character shown FOUR TIMES in a 2x2 grid,
same scale, same proportions: FRONT / SIDE / BACK / THREE-QUARTER (3/4).
FLAT 2D, NEON SCI-FI, subtle pixel-art texture, crisp dark outline,
kid-friendly cartoon, cute NOT scary.

LAYOUT (MUST follow exactly):
- A 2x2 grid = 4 cells, each cell exactly 256x256 px.
- TOTAL IMAGE SIZE MUST BE EXACTLY 512x512 px
  (2 x 256 = 512, with NO extra outer margin).
- The 3 grid lines (left, 256, right edge) must be pure background
  color, forming straight full-height/full-width borders at exact
  multiples of 256 px from the top-left corner.
- Cell order: top-left FRONT, top-right SIDE, bottom-left BACK,
  bottom-right THREE-QUARTER (3/4).
- Draw a thin 4px border around EVERY cell using the background color.

BACKGROUND (MUST):
- Flat solid color ONLY: pure green #00ff00.
- NO gradient, NO texture, NO vignette, NO grid pattern.
- NO drop shadow, NO ground shadow, NO glow around the character.
- Character must NOT touch the cell borders (min 8px clearance).
- Character must NOT contain dark shades of the background color
  (NO dark green, NO green-tinted shadows on the character).

ART STYLE: flat 2D, neon sci-fi, <STYLE>, colors: <PALETTE HEX>.

FORBIDDEN: NO text, NO letters, NO numbers, NO watermark, NO signature,
NO extra characters, NO UI elements, NO background decoration.
```

> **ตัวแปรที่ต้องเติม:** `<STYLE>` (เช่น subtle pixel texture) + `<PALETTE HEX>`
> (สีจาก bible — ข้อ 6 ของ PEP: **ห้ามสีเข้มของ bg บนตัว** ดูตารางแต่ละตัว)

---

## 1. วอล์กเกอร์ (Walker) 🟢 — แม่กก

```
Character turnaround sheet for a children's educational space game
"Monster Speller". ONE character shown FOUR TIMES in a 2x2 grid:
top-left FRONT, top-right SIDE, bottom-left BACK, bottom-right 3/4.
Same scale, same proportions, same height, evenly spaced.
FLAT 2D, NEON SCI-FI, subtle pixel texture, crisp dark outline,
cute cartoon, NOT scary.

CHARACTER: a round cute alien monster with a round/oval body (wider than
tall, height = 1.2x width), TWO thin antennas with small GOLD tips on top,
TWO big round eyes, small O-shaped mouth, light-colored belly, two short
stubby legs. Silhouette: round body + two antennas.

Palette: body neon green #39ff14 with gradient (light top #5cff3d,
dark bottom #2aab14, outline DARK NAVY #1a2333 — NOT green, to avoid
false shadow detection on green background), light belly #a5ffa0,
antenna tips gold #ffd700, eyes white #ffffff with dark pupils #0a0c1e.
No extra colors.

LAYOUT (MUST follow exactly):
- A 2x2 grid = 4 cells, each cell exactly 256x256 px.
- TOTAL IMAGE SIZE MUST BE EXACTLY 512x512 px
  (2 x 256 = 512, with NO extra outer margin).
- Grid lines at x/y = 0, 256, 512, pure background color, full-height/
  full-width, at exact multiples of 256 px from the top-left corner.
- Draw a thin 4px border around EVERY cell using the background color.

BACKGROUND (MUST):
- Flat solid color ONLY: pure green #00ff00.
- NO gradient, NO texture, NO vignette, NO clouds, NO grid pattern.
- NO drop shadow, NO ground shadow, NO glow around the character.
- Character must NOT touch the cell borders (min 8px clearance).

FORBIDDEN: NO text, NO letters, NO numbers, NO watermark, NO signature,
NO extra characters, NO UI elements, NO background decoration.
```

**ไทย (ย่อ):**
```
เทิร์นอราวด์ 4 มุม (หน้า/ข้าง/หลัง/¾) ในกริด 2×2 (512×512, เซลล์ 256×256)
พื้นเขียว #00ff00 ล้วน (ห้ามไล่เฉด/เงา/ข้อความ) กรอบ 4px สีพื้น
สไตล์ 2D แบน นีออนไซไฟ เนื้อพิกเซลนิด ๆ โครงเข้ม น่ารัก ไม่น่ากลัว
ตัวละคร: เอเลี่ยนตัวกลมรี (กว้าง>สูง) หนวด 2 เส้นปลายทอง ตากลมโต 2 ดวง
ปากเล็ก ท้องสีอ่อน ขาสั้น 2 ขา
สี: เขียวนีออน #39ff14 ไล่เฉด (บน #5cff3d ล่าง #2aab14)
โครงเข้มใช้ #1a2333 (น้ำเงินเข้ม — ห้ามใช้เขียวเข้ม #1f8b0d เดิม
เพราะจะโดน --check จับเป็นเงาบนพื้นเขียว!)
ท้อง #a5ffa0 ปลายหนวดทอง #ffd700 ตาขาว #ffffff ม่านตาดำ #0a0c1e
```

**คำสั่งตรวจ + ตัด (1 บรรทัดจบ):**
```bash
./.venv-scripts/Scripts/python.exe scripts/ai-sprite-process.py <walker-turnaround.png> \
    --name walker-turnaround --cell 256 --out-dir public/assets/sprites/ai/walker-turnaround \
    --grid-bg "#00ff00" --expect-grid 2x2 --require-check
```

---

## 2. รันเนอร์ (Runner) 🩷 — แม่กด

```
Character turnaround sheet for a children's educational space game
"Monster Speller". ONE character shown FOUR TIMES in a 2x2 grid:
top-left FRONT, top-right SIDE, bottom-left BACK, bottom-right 3/4.
Same scale, same proportions, same height, evenly spaced.
FLAT 2D, NEON SCI-FI, subtle pixel texture, crisp dark outline,
cute cartoon, NOT scary.

CHARACTER: a SLIM stream-lined alien monster leaning FORWARD 15 degrees
(running pose), tall slender body (height = 1.6x width), dorsal fin on
the back, THREE big eyes (middle one slightly smaller), white sneakers
on both feet, small short tail curling up.

Palette: body neon pink #ff2e97 with gradient (light top #ff5cb0,
dark bottom #d91e7c, outline DARK NAVY #1a2333 — NOT green), sneakers
pure white #ffffff, fin alternating #ff2e97/#d91e7c. No extra colors.

LAYOUT (MUST follow exactly):
- A 2x2 grid = 4 cells, each cell exactly 256x256 px.
- TOTAL IMAGE SIZE MUST BE EXACTLY 512x512 px
  (2 x 256 = 512, with NO extra outer margin).
- Grid lines at x/y = 0, 256, 512, pure background color, full-height/
  full-width, at exact multiples of 256 px from the top-left corner.
- Draw a thin 4px border around EVERY cell using the background color.

BACKGROUND (MUST):
- Flat solid color ONLY: pure green #00ff00.
- NO gradient, NO texture, NO vignette, NO clouds, NO grid pattern.
- NO drop shadow, NO ground shadow, NO glow around the character.
- Character must NOT touch the cell borders (min 8px clearance).
- Lean angle 15 degrees forward must be CONSTANT in every view.

FORBIDDEN: NO text, NO letters, NO numbers, NO watermark, NO signature,
NO extra characters, NO UI elements, NO background decoration.
```

**ไทย (ย่อ):**
```
เทิร์นอราวด์ 4 มุม (หน้า/ข้าง/หลัง/¾) ในกริด 2×2 (512×512, เซลล์ 256×256)
พื้นเขียว #00ff00 ล้วน (ห้ามไล่เฉด/เงา/ข้อความ) กรอบ 4px สีพื้น
สไตล์ 2D แบน นีออนไซไฟ พิกเซลนิด ๆ โครงเข้ม น่ารัก ไม่น่ากลัว
ตัวละคร: เอเลี่ยนเพรียวสูง (สูง = 1.6×กว้าง) ท่าพุ่งวิ่งเอียง 15° คงที่ทุกมุม
ครีบหลัง 3 ตาโต (ตากลางเล็กกว่า) รองเท้าผ้าใบขาว 2 ข้าง หางสั้นโค้งขึ้น
สี: ชมพูนีออน #ff2e97 ไล่เฉด (บน #ff5cb0 ล่าง #d91e7c)
โครงเข้ม #1a2333 (น้ำเงินเข้ม) รองเท้าขาวล้วน #ffffff ครีบสลับ #ff2e97/#d91e7c
```

**คำสั่งตรวจ + ตัด (1 บรรทัดจบ):**
```bash
./.venv-scripts/Scripts/python.exe scripts/ai-sprite-process.py <runner-turnaround.png> \
    --name runner-turnaround --cell 256 --out-dir public/assets/sprites/ai/runner-turnaround \
    --grid-bg "#00ff00" --expect-grid 2x2 --require-check
```

---

## 3. แทงก์ (Tank) 🟣 — แม่กบ

```
Character turnaround sheet for a children's educational space game
"Monster Speller". ONE character shown FOUR TIMES in a 2x2 grid:
top-left FRONT, top-right SIDE, bottom-left BACK, bottom-right 3/4.
Same scale, same proportions, same height, evenly spaced.
FLAT 2D, NEON SCI-FI, subtle pixel texture, crisp dark outline,
cute cartoon, NOT scary.

CHARACTER: a WIDE heavy tank-like alien monster, round body WIDER than
tall (widest of all monsters), TWO small gold bolts/studs on top of head,
SLEEPY half-closed eyes (horizontal eyelid line), flat straight mouth,
two very short legs almost touching ground, armor lines on body.
Silhouette: widest round body + two gold studs on top.

Palette: body neon purple #a855f7 with gradient (light top #c47ffa,
dark bottom #7a3bc4, outline DARK NAVY #1a2333 — NOT green), belly #cfa8f5,
studs gold #ffd700. No extra colors.

LAYOUT (MUST follow exactly):
- A 2x2 grid = 4 cells, each cell exactly 256x256 px.
- TOTAL IMAGE SIZE MUST BE EXACTLY 512x512 px
  (2 x 256 = 512, with NO extra outer margin).
- Grid lines at x/y = 0, 256, 512, pure background color, full-height/
  full-width, at exact multiples of 256 px from the top-left corner.
- Draw a thin 4px border around EVERY cell using the background color.

BACKGROUND (MUST):
- Flat solid color ONLY: pure green #00ff00.
- NO gradient, NO texture, NO vignette, NO clouds, NO grid pattern.
- NO drop shadow, NO ground shadow, NO glow around the character.
- Character must NOT touch the cell borders (min 8px clearance).

FORBIDDEN: NO text, NO letters, NO numbers, NO watermark, NO signature,
NO extra characters, NO UI elements, NO background decoration.
```

**ไทย (ย่อ):**
```
เทิร์นอราวด์ 4 มุม (หน้า/ข้าง/หลัง/¾) ในกริด 2×2 (512×512, เซลล์ 256×256)
พื้นเขียว #00ff00 ล้วน (ห้ามไล่เฉด/เงา/ข้อความ) กรอบ 4px สีพื้น
สไตล์ 2D แบน นีออนไซไฟ พิกเซลนิด ๆ โครงเข้ม น่ารัก ไม่น่ากลัว
ตัวละคร: เอเลี่ยนอ้วนกลมกว้างที่สุดในฝูง (กว้าง>สูง) หัวมีน็อต/หมุดทอง 2 อัน
ตาหงอยครึ่งหลับ (เปลือกตาแนวนอน) ปากตรงแบน ขาสั้นมากเกือบติดพื้น มีเส้นเกราะบนตัว
สี: ม่วงนีออน #a855f7 ไล่เฉด (บน #c47ffa ล่าง #7a3bc4)
โครงเข้ม #1a2333 (น้ำเงินเข้ม) ท้อง #cfa8f5 หมุดทอง #ffd700
```

**คำสั่งตรวจ + ตัด (1 บรรทัดจบ):**
```bash
./.venv-scripts/Scripts/python.exe scripts/ai-sprite-process.py <tank-turnaround.png> \
    --name tank-turnaround --cell 256 --out-dir public/assets/sprites/ai/tank-turnaround \
    --grid-bg "#00ff00" --expect-grid 2x2 --require-check
```

---

## 4. ราชามอนสเตอร์ (Boss) 👑 — แม่กน

```
Character turnaround sheet for a children's educational space game
"Monster Speller". ONE character shown FOUR TIMES in a 2x2 grid:
top-left FRONT, top-right SIDE, bottom-left BACK, bottom-right 3/4.
Same scale, same proportions, same height, evenly spaced.
FLAT 2D, NEON SCI-FI, subtle pixel texture, crisp dark outline,
dramatic but still cute cartoon — villain lair boss, NOT truly scary.

CHARACTER: the BIGGEST monster — large upright oval body, TWO curved
GOLD horns spreading outward from the head (horns may exceed the body
bounding box but MUST stay inside the cell), angry thick eyebrows angled
inward, RED glowing eyes, 3 small sharp gold teeth, thick short arms,
heavy legs, short thick tail.
Silhouette: biggest + two horns = unmistakable.

Palette: body neon red #ff3b3b with gradient (light top #ff6b5e,
dark bottom #cc1f1f, outline DARK NAVY #1a2333 — NOT green), horns &
teeth gold #ffd700, eyebrows/pupils very dark #1a0508. No extra colors.

LAYOUT (MUST follow exactly):
- A 2x2 grid = 4 cells, each cell exactly 256x256 px.
- TOTAL IMAGE SIZE MUST BE EXACTLY 512x512 px
  (2 x 256 = 512, with NO extra outer margin).
- Grid lines at x/y = 0, 256, 512, pure background color, full-height/
  full-width, at exact multiples of 256 px from the top-left corner.
- Draw a thin 4px border around EVERY cell using the background color.

BACKGROUND (MUST):
- Flat solid color ONLY: pure green #00ff00.
- NO gradient, NO texture, NO vignette, NO clouds, NO grid pattern.
- NO drop shadow, NO ground shadow, NO glow around the character.
- Character must NOT touch the cell borders (min 8px clearance).
- Horns visible in EVERY view but must not cross into another cell.

FORBIDDEN: NO text, NO letters, NO numbers, NO watermark, NO signature,
NO extra characters, NO UI elements, NO background decoration.
```

**ไทย (ย่อ):**
```
เทิร์นอราวด์ 4 มุม (หน้า/ข้าง/หลัง/¾) ในกริด 2×2 (512×512, เซลล์ 256×256)
พื้นเขียว #00ff00 ล้วน (ห้ามไล่เฉด/เงา/ข้อความ) กรอบ 4px สีพื้น
สไตล์ 2D แบน นีออนไซไฟ พิกเซลนิด ๆ โครงเข้ม ดราม่าแต่ยังการ์ตูนน่ารัก
ตัวละคร: ราชามอนสเตอร์ตัวใหญ่สุด วงรีตั้ง เขาทอง 2 เขาโค้งออก (เกินกรอบตัวได้
แต่ต้องไม่ออกนอกเซลล์!) คิ้วหนาโกรธเอียงเข้าหากัน ตาแดงเรืองแสง ฟันแหลมทอง 3 ซี่
แขนสั้นหนา ขาหนัก หางสั้นหนา
สี: แดงนีออน #ff3b3b ไล่เฉด (บน #ff6b5e ล่าง #cc1f1f)
โครงเข้ม #1a2333 (น้ำเงินเข้ม) เขาและฟันทอง #ffd700 คิ้ว/ม่านตาดำ #1a0508
```

**คำสั่งตรวจ + ตัด (1 บรรทัดจบ):**
```bash
./.venv-scripts/Scripts/python.exe scripts/ai-sprite-process.py <boss-turnaround.png> \
    --name boss-turnaround --cell 256 --out-dir public/assets/sprites/ai/boss-turnaround \
    --grid-bg "#00ff00" --expect-grid 2x2 --require-check
```

---

## 5. Checklist ตรวจผลจาก AI (ทุกชุด) — ใช้ `--check` + ตาดู

**ขั้นแรก (อัตโนมัติ — รันคำสั่งท้ายแต่ละข้อ):**
```bash
./.venv-scripts/Scripts/python.exe scripts/ai-sprite-process.py <sheet.png> \
    --check --grid-bg "#00ff00" --expect-grid 2x2
```

| ตรวจ | ผ่านเมื่อ |
|---|---|
| พื้นเป็นสีเดียวจริง | กริดครบ 2×2, เฟรม 4 (exit 0) |
| ไม่มีเงา | ไม่มี warn เงา |
| กรอบตรง/ตรงพิทช์ | ตรง 2x2 + ไม่มี warn ติดขอบ |
| ไม่มีเฟรมหลอก/ข้อความ | ไม่มี error |
| ขนาดภาพตรงสัญญา | 512×512 พอดี (ไม่มี margin พิเศษ) |

**exit code:** `0` = ผ่าน · `1` = มี error → **อย่าเอาไปใช้ ไป gen ใหม่**

**ขั้นสอง (ตาดู — ยังต้องทำเสมอ):**
- [ ] **4 มุมครบ** เรียงตามกริด: ซ้ายบน = หน้า, ขวาบน = ข้าง, ซ้ายล่าง = หลัง, ขวาล่าง = ¾
- [ ] **สัดส่วนตรง Bible** (กลม/เพรียว/อ้วน/ใหญ่) — เทียบกับภาพอื่นไม่ได้สลับตัว
- [ ] **เอกลักษณ์ครบทุกมุม**: หนวด 2 (วอล์กเกอร์) · ครีบ+รองเท้าขาว (รันเนอร์) · หมุดทอง (แทงก์) · เขาคู่ (บอส)
- [ ] **สีตรง hex** — ใช้ eyedropper ตรวจสีหลัก (โครงต้องเป็น `#1a2333` ไม่ใช่เขียวเข้ม)
- [ ] ทุกมุมยืนบนเส้นฐานเดียวกัน (กัน jitter เวลาทำแอนิเมชัน)
- [ ] ตัวละครไม่แตะขอบเซลล์ (กัน `--check` ติดขอบ false positive)

## 6. ถ้า AI ทำไม่ตรง (แนวทางแก้)

| ปัญหา | แก้ |
|---|---|
| พื้นไม่ใช่ `#00ff00` ล้วน (ไล่เฉด/ขาว/เทา) | เพิ่ม `"background MUST be flat solid pure green #00ff00, NO gradient"` หรือเปลี่ยนพื้นเป็นม่วง `#ff00ff` แล้วใช้ `--grid-bg "#ff00ff"` |
| แต่ละมุมขนาดไม่เท่ากัน | เพิ่ม `"all four views EXACTLY same size"` หรือ `"model sheet with uniform scale"` |
| ตัวละครต่างกันระหว่างมุม | เพิ่ม `"same character, same features, only angle changes"` |
| มีป้าย/ตัวหนังสือแทรก | เพิ่ม `"NO text, NO labels, NO letters anywhere"` เน้นอีกครั้ง |
| หลัง (back) วาดผิด | เพิ่ม `"back view: same body, no face, antennas/horns visible from behind"` |
| ได้ภาพเดียวไม่ใช่ 4 มุม | เพิ่ม `"as a single 2x2 grid sheet with 4 views"` หรือวาดแยก 4 ครั้งด้วยพรอมต์เดียวกัน |
| เอียงต่างกัน (รันเนอร์) | เพิ่ม `"lean angle 15 degrees forward in every view"` |
| `--check` เตือนเงา | ตรวจว่าตัวมีสีเขียวเข้มปนไหม → เปลี่ยนโครงเป็น `#1a2333` (น้ำเงินเข้ม) แล้ว gen ใหม่ |
| `--check` บอกติดขอบ | ตัวใหญ่เกินไป → เพิ่ม `"character must be smaller, min 40px clearance from cell edges"` |
| เขาบอสล้ำเข้าเซลล์ข้าง | เพิ่ม `"horns must stay inside their own cell"` |

---

## 7. เหตุผลที่เปลี่ยนเป็น PEP (เทียบเวอร์ชันเก่า)

| หัวข้อ | ก่อน (เวอร์ชันเก่า) | หลัง (PEP) |
|---|---|---|
| พื้นหลัง | `transparent background` — AI ทำไม่ได้จริง (ได้พื้นขาว/เทา) | **พื้น `#00ff00` ล้วน** → key ลบ 100% แน่นอน |
| เรียงมุม | แนวนอน 1 แถว | **กริด 2×2** (512×512, เซลล์ 256) → `--expect-grid 2x2` ตรวจได้ |
| สัดส่วน | `fills 70% of height` — ขัดกับกริด | **min 8px clearance** + ไม่แตะขอบ |
| โครงวอล์กเกอร์ | เขียวเข้ม `#1f8b0d` — false positive เงา | **น้ำเงินเข้ม `#1a2333`** — ต่าง hue จาก bg ชัด |
| ตรวจผล | ดูด้วยตาเท่านั้น | **`--check`/`--require-check`** → exit code 0/1 |
