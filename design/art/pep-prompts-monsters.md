# 👾 พรอมต์ชุด PEP ครบ 4 มอนสเตอร์ — Monster Speller

> ตามสเปก `design/prompt-processability-spec.md` (พื้นสีเดียว + กรอบ + ห้ามเงา/ข้อความ)
> ข้อมูลตัวละคร (สี/เอกลักษณ์/ท่าทาง) ดึงจาก `design/art/character-bibles/*.md` จริง
>
> **วิธีใช้:** คัดลอกพรอมต์ตัวที่ต้องการ (อังกฤษเต็ม) → วางใน AI สร้างภาพ
>
> **📦 ไฟล์:** ไฟล์ที่ AI สร้าง ตั้งชื่อ **`<name>-sheet.png`** (เช่น `walker-sheet.png`)
> วางที่ **`public/assets/ai/`** → รันคำสั่งท้ายแต่ละข้อ
> · ผลลัพธ์: เฟรม `<name>_00.png…15.png` + `<name>.json`
> ใน **`public/assets/sprites/ai/<name>/`**
> → ได้ภาพมา → รันคำสั่ง Python ท้ายแต่ละข้อ (ผ่าน `--expect-grid 4x4` = ตรวจสัญญาอัตโนมัติ)

---

## 🌿 1. วอล์กเกอร์ (WalkerMonster) — เขียวนีออน #39ff14

```
Create a single sprite sheet PNG for a 2D game monster: a round green alien
"Walker Monster" for a kids' space shooter game. Flat 2D, neon sci-fi style.

CHARACTER (MUST match exactly):
- Round oval body (wider than tall), two big round eyes with clear pupils,
  two short legs, two thin antennae with GOLD tips #ffd700 (its signature).
- Friendly, clumsy, cute — NOT scary. Big eyes = 40% of face.
- Skin shades (only these): dark outline #1f8b0d, bottom #2aab14,
  main #39ff14, top highlight #5cff3d, corner highlight #8dff7a,
  belly/face #a5ffa0, antenna tips gold #ffd700, pupils #0a0c1e.

LAYOUT (MUST follow exactly):
- A 4x4 grid = 16 cells, each cell exactly 128x128 px.
- TOTAL IMAGE SIZE MUST BE EXACTLY 512x512 px (4 x 128 = 512,
  with NO extra outer margin).
- The 5 grid lines (left edge, 128, 256, 384, right edge) must be pure
  background color, forming straight borders at exact multiples of 128 px
  from the top-left corner.
- Each cell contains ONE frame of the walk cycle (4 walking poses: left
  leg up / both down / right leg up / both down) repeated in 4 identical rows.
- Draw a thin 4px border around EVERY cell using the background color
  (borders perfectly aligned, forming straight grid lines).
- Characters must NOT touch the cell borders (min 8px clearance).

BACKGROUND (MUST):
- Flat solid color ONLY: pure green #00ff00.
- NO gradient, NO texture, NO vignette, NO clouds, NO grid pattern.
- NO drop shadow, NO ground shadow, NO glow around the character.
- Characters must NOT contain dark shades of the background color
  (NO dark green, NO green-tinted shadows on the character).

FORBIDDEN: NO text, NO letters, NO numbers, NO watermark, NO signature,
NO extra characters, NO UI elements, NO background decoration.
```

**คำสั่ง Python (หลังได้ภาพ):**
```bash
cd monster-speller-src
./.venv-scripts/Scripts/python.exe scripts/ai-sprite-process.py <walker-sheet.png> \
    --name walker --cell 128 --out-dir public/assets/sprites/ai/walker \
    --grid-bg "#00ff00" --expect-grid 4x4 --require-check
```

---

## 🩷 2. รันเนอร์ (RunnerMonster) — ชมพูนีออน #ff2e97

```
Create a single sprite sheet PNG for a 2D game monster: a fast lean pink
alien "Runner Monster" for a kids' space shooter game. Flat 2D, neon sci-fi.

CHARACTER (MUST match exactly):
- SLIM body leaning FORWARD 15 degrees (always running), 3 big eyes
  (middle one smaller), dorsal fin on the back, TWO WHITE sneakers
  #ffffff (its signature), 2 thin legs.
- Speedy, nervous, cute. NOT round, NOT standing straight.
- Skin shades (only these): dark outline #b01463, bottom #d91e7c,
  main #ff2e97, top #ff5cb0, highlight #ff8ccb, sneakers pure white
  #ffffff, fin shades #ff2e97/#d91e7c.

LAYOUT (MUST follow exactly):
- A 4x4 grid = 16 cells, each cell exactly 128x128 px.
- TOTAL IMAGE SIZE MUST BE EXACTLY 512x512 px (4 x 128 = 512,
  with NO extra outer margin).
- The 5 grid lines (left edge, 128, 256, 384, right edge) must be pure
  background color, forming straight borders at exact multiples of 128 px
  from the top-left corner.
- Each cell contains ONE frame of the run cycle (4 running poses:
  legs apart / together / crossed / together) repeated in 4 identical rows.
- Draw a thin 4px border around EVERY cell using the background color
  (borders perfectly aligned, forming straight grid lines).
- Characters must NOT touch the cell borders (min 8px clearance).

BACKGROUND (MUST):
- Flat solid color ONLY: pure green #00ff00.
- NO gradient, NO texture, NO vignette, NO clouds, NO grid pattern.
- NO drop shadow, NO ground shadow, NO glow around the character.
- Characters must NOT contain dark shades of the background color
  (NO dark green, NO green-tinted shadows on the character).

FORBIDDEN: NO text, NO letters, NO numbers, NO watermark, NO signature,
NO extra characters, NO UI elements, NO background decoration.
```

**คำสั่ง Python:**
```bash
./.venv-scripts/Scripts/python.exe scripts/ai-sprite-process.py <runner-sheet.png> \
    --name runner --cell 128 --out-dir public/assets/sprites/ai/runner \
    --grid-bg "#00ff00" --expect-grid 4x4 --require-check
```

---

## 🟣 3. แทงก์ (TankMonster) — ม่วง #a855f7

```
Create a single sprite sheet PNG for a 2D game monster: a heavy wide purple
armored alien "Tank Monster" for a kids' space shooter game. Flat 2D,
neon sci-fi style.

CHARACTER (MUST match exactly):
- WIDEST body of all monsters (rounded rectangle / wide oval, width > height),
  sleepy half-closed droopy eyes, TWO GOLD rivets #ffd700 on top of the head
  (its signature), very short legs almost touching the ground.
- Slow, sleepy, heavy. NOT slim, NOT big round cartoon eyes.
- Skin shades (only these): dark outline #5d2a94, bottom #7a3bc4,
  main #a855f7, top #c47ffa, highlight #e0b0ff, belly/face #cfa8f5,
  head rivets gold #ffd700.

LAYOUT (MUST follow exactly):
- A 4x4 grid = 16 cells, each cell exactly 128x128 px.
- TOTAL IMAGE SIZE MUST BE EXACTLY 512x512 px (4 x 128 = 512,
  with NO extra outer margin).
- The 5 grid lines (left edge, 128, 256, 384, right edge) must be pure
  background color, forming straight borders at exact multiples of 128 px
  from the top-left corner.
- Each cell contains ONE frame of the walk cycle (4 heavy waddling poses:
  sway left / center / sway right / center) repeated in 4 identical rows.
- Draw a thin 4px border around EVERY cell using the background color
  (borders perfectly aligned, forming straight grid lines).
- Characters must NOT touch the cell borders (min 8px clearance).

BACKGROUND (MUST):
- Flat solid color ONLY: pure green #00ff00.
- NO gradient, NO texture, NO vignette, NO clouds, NO grid pattern.
- NO drop shadow, NO ground shadow, NO glow around the character.
- Characters must NOT contain dark shades of the background color
  (NO dark green, NO green-tinted shadows on the character).

FORBIDDEN: NO text, NO letters, NO numbers, NO watermark, NO signature,
NO extra characters, NO UI elements, NO background decoration.
```

**คำสั่ง Python:**
```bash
./.venv-scripts/Scripts/python.exe scripts/ai-sprite-process.py <tank-sheet.png> \
    --name tank --cell 128 --out-dir public/assets/sprites/ai/tank \
    --grid-bg "#00ff00" --expect-grid 4x4 --require-check
```

---

## 👑 4. ราชามอนสเตอร์ (BossMonster) — แดง #ff3b3b

```
Create a single sprite sheet PNG for a 2D game monster: the BIG red boss
"Monster King" for a kids' space shooter game. Flat 2D, neon sci-fi style.

CHARACTER (MUST match exactly):
- The LARGEST monster (taller than the others), two curved GOLD horns
  #ffd700 (its royal signature, curved outward), angry thick eyebrows,
  dark red eyes, 2-3 small sharp teeth, 2 big legs, imposing but still
  cartoon-cute for kids (NOT genuinely scary).
- Skin shades (only these): dark outline #a01212, bottom #cc1f1f,
  main #ff3b3b, top #ff6b5e, highlight #ffa08f, horns/teeth gold
  #ffd700, brows/eyes #1a0508.

LAYOUT (MUST follow exactly):
- A 4x4 grid = 16 cells, each cell exactly 128x128 px.
- TOTAL IMAGE SIZE MUST BE EXACTLY 512x512 px (4 x 128 = 512,
  with NO extra outer margin).
- The 5 grid lines (left edge, 128, 256, 384, right edge) must be pure
  background color, forming straight borders at exact multiples of 128 px
  from the top-left corner.
- Each cell contains ONE frame of the heavy walking cycle (4 big stomping
  poses: left foot forward / stand / right foot forward / stand) repeated
  in 4 identical rows. Horns must stay visible in ALL frames.
- Draw a thin 4px border around EVERY cell using the background color
  (borders perfectly aligned, forming straight grid lines).
- Characters must NOT touch the cell borders (min 8px clearance).

BACKGROUND (MUST):
- Flat solid color ONLY: pure green #00ff00.
- NO gradient, NO texture, NO vignette, NO clouds, NO grid pattern.
- NO drop shadow, NO ground shadow, NO glow around the character.
- Characters must NOT contain dark shades of the background color
  (NO dark green, NO green-tinted shadows on the character).

FORBIDDEN: NO text, NO letters, NO numbers, NO watermark, NO signature,
NO extra characters, NO UI elements, NO background decoration.
```

**คำสั่ง Python:**
```bash
./.venv-scripts/Scripts/python.exe scripts/ai-sprite-process.py <boss-sheet.png> \
    --name boss --cell 128 --out-dir public/assets/sprites/ai/boss \
    --grid-bg "#00ff00" --expect-grid 4x4 --require-check
```

---

## 📋 สรุปชุดทั้งหมด + ตารางจานสี (เทียบ Bible)

| ตัว | เอกลักษณ์เงา | สีหลัก | สีรอง (จุดเด่น) | `--expect-grid` | ไฟล์ manifest |
|---|---|---|---|---|---|
| **วอล์กเกอร์** | ตัวกลมรี + หนวด 2 ปลายทอง | `#39ff14` | ทอง `#ffd700` (หนวด) · ท้อง `#a5ffa0` | `4x4` → 16 เฟรม | `sprites/ai/walker/walker.json` |
| **รันเนอร์** | เพรียวเอียง 15° + รองเท้าขาว | `#ff2e97` | ขาว `#ffffff` (รองเท้า) · ครีบหลัง | `4x4` → 16 เฟรม | `sprites/ai/runner/runner.json` |
| **แทงก์** | กว้างสุด + หมุดทอง 2 บนหัว | `#a855f7` | ทอง `#ffd700` (หมุด) · ท้อง `#cfa8f5` | `4x4` → 16 เฟรม | `sprites/ai/tank/tank.json` |
| **บอส** | ใหญ่สุด + เขาทอง 2 เขาโค้ง | `#ff3b3b` | ทอง `#ffd700` (เขา/ฟัน) · คิ้ว/ตา `#1a0508` | `4x4` → 16 เฟรม | `sprites/ai/boss/boss.json` |

> **เหตุผลเลือก `#00ff00` เป็นพื้นทุกตัว:** เขียวสดจัดจ้าน ไม่มีในจานสีสกิน
> ทั้ง 4 (เขียว `#39ff14` ต่างกันชัด) → key ลบพื้นไม่โดนเนื้อตัว (ดูบทเรียนใน
> `prompt-processability-spec.md` ข้อ 1)

## 🧪 Checklist ตรวจภาพก่อนเอาไปใช้ (ทุกตัวเหมือนกัน)

1. [ ] **รันคำสั่งท้ายข้อ** (มี `--require-check` อยู่แล้ว: ตรวจก่อน → ผ่านจึงตัดเฟรม) → exit `0` = ผ่าน + ได้เฟรม/manifest · exit `1` = ตรวจไม่ผ่าน → gen ใหม่
2. [ ] เปิดภาพ → พื้นเขียว `#00ff00` ล้วน (ไม่มีไล่เฉด/เกรน) + ขนาด 512×512 พอดี
3. [ ] เส้นกริดที่ x/y = 128, 256, 384 ตรงเป็นเส้น bg ล้วน (กรอบตรงพิทช์)
4. [ ] ตัวละครไม่ติดขอบเซลล์ (มีช่องว่างรอบตัว ≥ 8px)
5. [ ] ไม่มีเงาใต้ตัว / ไม่มีสีเขียวเข้มบนตัว / ไม่มีตัวหนังสือ / ไม่มีโลโก้
6. [ ] เปิดเฟรม `_00.png`–`_15.png` → ตัวครบ ไม่มีเฟรมหลอก (ว่าง/ซ้ำกันแปลก ๆ)

## 🔧 ถ้า AI ทำไม่ตรงสัญญา (แก้ยังไง)

| อาการ | แก้ |
|---|---|
| ใส่เงา/พื้นไล่เฉด | ต่อท้ายพรอมต์: `"If you add any shadow, vignette, or non-uniform background, the image will be rejected and regenerated."` แล้ว gen ใหม่ |
| สีตัวปนพื้น (เขียวใกล้ `#00ff00`) | เปลี่ยนพื้นเป็นม่วง `#ff00ff` (magenta) แทน แล้วใช้ `--grid-bg "#ff00ff"` |
| เฟรมไม่เท่ากัน/กริดเบี้ยว | เพิ่ม `"all cells exactly the same size, perfectly aligned"` แล้ว gen ใหม่ |
| เฟรมหลอก (ว่าง/ซ้ำ) | ตรวจด้วยตา + ลด `--threshold` หรือตัดมือ — อย่าใช้เฟรมหลอกในเกม |
| ได้ภาพ 1024px | ขอ `4x4 @ 256 = 1024` (ชาร์ปกว่า) — คำสั่ง Python เหมือนเดิม `--cell 256` |

---

*สร้างจาก character-bibles (walker/runner/tank/boss) + เทมเพลต PEP ข้อ 2 · สิงหาคม 2569*
