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

**พรอมต์สากลสำหรับตัวละคร (เติมชื่อ/สี/เอกลักษณ์ ต่อท้าย):**
```text
2D game character sprite for a children's educational space game "Monster Speller".
FLAT 2D, NEON SCI-FI style, subtle pixel-art texture, crisp outline.
[ชื่อ + สีหลัก + เอกลักษณ์จากตาราง]. Cute cartoon, kid-friendly, NOT scary.
Background: transparent. No text, no logo, no watermark. Square canvas.
```

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

**พรอมต์:** `8 individual game bullet icons, neon colors on transparent background, glowing energy orbs with Thai alphabet letter shapes, flat 2D, kid-friendly, 64x64 each, no text no watermark`

### 15.4.2 ชิ้นส่วนอัปเกรดยาน (4 ชิ้น — Sprint 4)

| ชิ้นส่วน | รูปร่าง | เอฟเฟกต์ |
|---|---|---|
| เครื่องยนต์เทอร์โบ | ทรงกระบอกมีครีบ | เปลวไฟข้างหลัง |
| ปืนเลเซอร์คู่ | ปืนคู่เรืองแสง | ประกายฟ้า |
| โล่พลังงาน | หกเหลี่ยมโปร่ง | เงาสีเขียว |
| เซนเซอร์แม่นยำ | จานดาวเทียม | จุดเรดาร์กะพริบ |

**พรอมต์:** `4 glowing spaceship upgrade parts (engine, twin laser, energy shield, sensor dish), floating with neon glow, flat 2D sci-fi, transparent background, gold cyan pink accents, kid-friendly, 64x64 each, no text no watermark`

### 15.4.3 ไอเท็มเสริมพลัง (Power-ups — เสนอเพิ่ม)

| ไอเท็ม | ผล | สี |
|---|---|---|
| กระสุนเจาะเกราะ (Pierce) | ยิงทะลุ 1 ตัว | ม่วง-ขาว |
| ชะลอเวลา (Slow-mo) | มอนสเตอร์ช้าลง 50% 5 วิ | ฟ้า-น้ำเงิน |
| กระสุนกระจาย (Spread) | ยิง 3 ทิศ 3 วิ | ส้ม-เหลือง |
| ดาวคะแนน 2× | คะแนนคูณ 2 | ทอง |

**พรอมต์:** `4 collectible power-up icons floating in space (pierce bullet, slow-mo clock, spread shot, 2x score star), neon glowing, flat 2D sci-fi, transparent background, kid-friendly, 64x64 each, no text no watermark`

### 15.4.4 เอฟเฟกต์และวัตถุประกอบฉาก

| รายการ | ใช้ที่ไหน | พร้อมต์ |
|---|---|---|
| ดาว 4 แฉกเรืองแสง | ฉากเกม/Hub | `glowing 4-pointed sparkle star, neon white-gold, transparent background, 32x32` |
| อนุภาคระเบิด (เขียว/แดง) | ตอบถูก/ผิด | `burst explosion particles, neon green + magenta sparks, flat 2D, transparent` |
| คอนเฟตตี้ชนะ | สรุปโหมดเรียนรู้ | `colorful confetti falling, flat 2D, kid-friendly, transparent` |
| หัวใจ/ดาว HUD | HUD | `neon heart icon and star icon, flat 2D, cyan pink gold, 32x32, no text` |
| การ์ดคำศัพท์ | เหนือหัวมอนสเตอร์ | `small rounded game card with Thai word placeholder, neon border, flat 2D` |

---

## 15.5 พรอมต์: พื้นหลังฉากเกม (มีแล้ว — อ้างอิง)

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

## 15.6 พรอมต์: พื้นหลัง Hub (1920×1080)

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

**A. เขตกาแล็กซีวิกฤต (ด่าน 4–6) → `crisis-galaxy-bg.png`:**
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

**B. ป้อมจอมมาร (ด่าน 7–8) → `demon-fortress-bg.png`:**
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

**C. สวรรค์สีทอง (ฉากชนะ/โบนัส) → `golden-heaven-bg.png`:**
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

## 15.8 พรอมต์: สไปรต์มอนสเตอร์เดี่ยว (ใช้แทน pixel-art ได้ — ขนาด 128×128/เฟรม)

```text
2D game monster sprite sheet for "Monster Speller", frame-by-frame animation.
FLAT 2D, NEON SCI-FI, subtle pixel-art texture, crisp dark outline.
[ชื่อมอนสเตอร์ + สี + เอกลักษณ์]. 6 frames in a row: walk1, walk2 (legs
alternating), stun (X eyes + tongue), explode1, explode2 (burst), friendly
(smile + blush). Cute cartoon, kid-friendly, NOT scary. Transparent
background. No text, no logo, no watermark. Each cell 128x128.
```

> ⚠️ **ข้อควรระวัง:** สไปรต์จาก AI มักได้เฟรมไม่ตรงตำแหน่ง/ไม่ loop สมูท
> → ใช้เป็นแนวอ้างอิงแล้ววาดทับด้วย `scripts/generate-sprites.mjs` หรือ
> ใช้ AI วาดภาพนิ่ง 1 ท่า แล้วขอให้ทีมวาดเฟรมที่เหลือตาม (ดูบท 6.6)

---

## 15.9 พรอมต์: ฉากและตัวละครเสริม (Sprint 4–5)

**Hangar (โรงเก็บยาน):**
```text
2D game background for the HANGAR/upgrade screen of "Monster Speller".
A neon repair dock: spaceship service bay with glowing platforms, floating
upgrade parts, holographic display panels, cyan-pink-magenta neon lighting,
flat 2D sci-fi, kid-friendly. Dark navy palette matching #0b0f2a.
No characters, no text, no logo, no watermark. 16:9, 1280x720.
```

**ผู้บัญชาการสถานี (portrait):**
```text
2D game character portrait (bust) of a friendly space station commander for
"Monster Speller". White-gold uniform, transparent helmet, warm smile,
communicator headset. FLAT 2D, NEON SCI-FI, subtle pixel texture, crisp
outline, kid-friendly. Background transparent. No text, no logo, no
watermark. Square 256x256.
```

**หุ่นยนต์ RO-BOT (ผู้ช่วยสอน):**
```text
2D game character of a cute floating tutor robot "RO-BOT" for "Monster
Speller". Round mint-green body, floating, screen face showing a Thai letter,
antenna with glowing tip, small friendly arms. FLAT 2D, NEON SCI-FI,
kid-friendly. Transparent background. No text, no logo, no watermark.
Square 256x256.
```

---

## 15.10 ตารางรวมพรอมต์ทั้งหมด (Quick Copy Sheet)

| สินทรัพย์ | ไฟล์ปลายทาง | พรอมต์ |
|---|---|---|
| พื้นหลังเกม | `bg/space-bg.png` | 15.5 |
| พื้นหลัง Hub | `bg/hub-bg.png` | 15.6 |
| พื้นหลังวิกฤต | `bg/crisis-galaxy-bg.png` | 15.7A |
| พื้นหลังป้อม | `bg/demon-fortress-bg.png` | 15.7B |
| พื้นหลังชนะ | `bg/golden-heaven-bg.png` | 15.7C |
| สไปรต์มอนสเตอร์ (อ้างอิง) | `sprites/monsters-sheet.png` | 15.8 |
| กระสุน 8 มาตรา | `assets/ui/bullets/` | 15.4.1 |
| ชิ้นส่วนยาน 4 ชิ้น | `assets/items/parts/` | 15.4.2 |
| ไอเท็มเสริมพลัง | `assets/items/powerups/` | 15.4.3 |
| ฉาก Hangar | `bg/hangar-bg.png` | 15.9 |
| ผู้บัญชาการ/RO-BOT | `assets/characters/` | 15.9 |

---

## 15.11 ข้อกำหนดการส่งมอบ (DoD สำหรับงานกราฟิก)

- [ ] ขนาด/สัดส่วนตรงตามตาราง 15.1 (บังคับ)
- [ ] พื้นที่ว่างสำหรับเกมเพลย์ (มุมขวาล่าง/กลางล่าง) ยังโล่ง
- [ ] จานสีตรงธีม 6 สี — ไม่มีสีหลุดธีม (เทียบ eyedropper กับตารางสี)
- [ ] ไม่มีตัวหนังสือ/โลโก้/ลายน้ำ (AI ชอบแอบใส่)
- [ ] ภาพไม่บีบ/ยืด — ใช้ native resolution ตรงตาม spec
- [ ] วางไฟล์ในโฟลเดอร์ตามตาราง 15.10 + แจ้งทีม → ผม (developer) จัด manifest/โค้ดให้
- [ ] ผ่านการตรวจในเกมจริง (Canvas scale แล้วดูคมชัด ไม่เบลอ)
