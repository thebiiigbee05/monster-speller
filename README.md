# 👾 MONSTER SPELLER — กองกำลังพิทักษ์ตัวสะกด

**ชื่อโครงการ:** กองกำลังพิทักษ์ตัวสะกด (Monster Speller)
**หัวข้อการเรียนรู้:** มาตราตัวสะกด (ภาษาไทย)
**รูปแบบ:** เกมยิงมอนสเตอร์เชิงกลยุทธ์ (Shooter Defense) เพื่อการเรียนรู้ — Game-Based Learning + AR
**กลุ่มเป้าหมาย:** นักเรียนชั้นประถมศึกษาปีที่ 3–4 (อายุ 8–10 ปี)
**แพลตฟอร์ม:** เว็บเบราว์เซอร์ (PWA) — คอมพิวเตอร์ / แท็บเล็ต / สมาร์ตโฟน
**เทคโนโลยีหลัก:** Vue 3 · Pinia · Canvas/CSS Sprite · AR.js · TypeScript · Vite
**เวลาเล่นต่อรอบ:** 3 นาที · **การจัดการโครงการ:** Agile + Kanban

---

> ✅ **สถานะเอกสาร:** เอกสารทั้งเล่มได้รับการปรับปรุงเป็น **v1.1** ให้สอดคล้องกับข้อความต้นฉบับที่ได้รับจากผู้ใช้
> (แนวคิดเกม, กลไก Shooter Defense, การควบคุม Mouse/Keyboard/AR, ระบบช่วยเหลือ คำใบ้, ระบบรางวัลชิ้นส่วนยานอวกาศ,
> เทคโนโลยี Vue3 + Pinia + Canvas/CSS Sprite + OOP คลาส Monster, Modal Settings และ Modal Hall of Fame)

## เรื่องย่อ (High Concept)

> เอเลี่ยนมอนสเตอร์ที่มีคำศัพท์แต่ **ขาดตัวสะกด** บุกโลก 👾
> ผู้เล่นรับบทเป็นนักบินกองกำลังพิทักษ์ ต้อง **ยิงกระสุนมาตราตัวสะกด** (แป้น 1–8) ให้ถูกต้อง
> เพื่อเปลี่ยนมอนสเตอร์ให้เป็นมิตร ก่อนที่พวกมันจะถึงฐานทัพ — ภายในเวลา 3 นาทีต่อรอบ

## 🎯 เป้าหมายการเรียนรู้

ระบุมาตราตัวสะกดได้ทั้ง **ตัวสะกดตรงมาตรา** และ **ตัวสะกดไม่ตรงมาตรา** (8 มาตรา: กา กก กด กบ กน กม เกย เกอว)

## 📚 โครงสร้างหนังสือ (1 บท = 1 ไฟล์)

| ลำดับ | รายการ | ไฟล์ |
|---|---|---|
| — | หน้าปกและสารบัญ | [`docs/00-cover-and-toc.md`](docs/00-cover-and-toc.md) |
| 1 | บทที่ 1 บทนำ | [`docs/01-chapter-1-introduction.md`](docs/01-chapter-1-introduction.md) |
| 2 | บทที่ 2 ทบทวนวรรณกรรมและทฤษฎีที่เกี่ยวข้อง | [`docs/02-chapter-2-literature-review.md`](docs/02-chapter-2-literature-review.md) |
| 3 | บทที่ 3 การวิเคราะห์ผู้เรียนและเนื้อหา | [`docs/03-chapter-3-learner-analysis.md`](docs/03-chapter-3-learner-analysis.md) |
| 4 | บทที่ 4 การออกแบบเกม | [`docs/04-chapter-4-game-design.md`](docs/04-chapter-4-game-design.md) |
| 5 | บทที่ 5 การออกแบบการเรียนรู้และการประเมินผล | [`docs/05-chapter-5-instructional-design.md`](docs/05-chapter-5-instructional-design.md) |
| 6 | บทที่ 6 การออกแบบ UI/UX และกราฟิก | [`docs/06-chapter-6-ui-ux-graphics.md`](docs/06-chapter-6-ui-ux-graphics.md) |
| 7 | บทที่ 7 สถาปัตยกรรมระบบและเทคโนโลยี | [`docs/07-chapter-7-architecture-technology.md`](docs/07-chapter-7-architecture-technology.md) |
| 8 | บทที่ 8 แผนการพัฒนาซอฟต์แวร์ | [`docs/08-chapter-8-software-development-plan.md`](docs/08-chapter-8-software-development-plan.md) |
| 9 | บทที่ 9 การจัดการโครงการด้วย Agile Kanban | [`docs/09-chapter-9-agile-kanban.md`](docs/09-chapter-9-agile-kanban.md) |
| 10 | บทที่ 10 การทดสอบและประกันคุณภาพ | [`docs/10-chapter-10-testing-qa.md`](docs/10-chapter-10-testing-qa.md) |
| 11 | บทที่ 11 การประเมินผลโครงการและความเสี่ยง | [`docs/11-chapter-11-evaluation-risks.md`](docs/11-chapter-11-evaluation-risks.md) |
| 12 | บทที่ 12 บทสรุปและแนวทางต่อยอด | [`docs/12-chapter-12-conclusion-future.md`](docs/12-chapter-12-conclusion-future.md) |
| — | บรรณานุกรม | [`docs/13-bibliography.md`](docs/13-bibliography.md) |

## 🧭 วิธีการใช้งานเอกสาร

1. **อ่านตามลำดับ** เริ่มจากหน้าปก/สารบัญ แล้วอ่านบทที่ 1 → 12
2. **ทีมพัฒนา** เน้นบทที่ 4, 6, 7, 8 (เกม–กราฟิก–สถาปัตยกรรม Vue/Canvas–แผนพัฒนา)
3. **ทีมจัดการโครงการ** เน้นบทที่ 8, 9, 11
4. **ครู/นักวิชาการภาษาไทย** เน้นบทที่ 3, 5, 11 (ผู้เรียน–การเรียนรู้–การประเมินผล)
5. ทุกงานต้องมีการ์ดบน **บอร์ด Kanban** (บทที่ 9)

## 💻 การพัฒนาโปรเจกต์ (Vue 3 + Vite + TypeScript)

```bash
npm install          # ติดตั้ง dependencies
npm run dev          # dev server http://localhost:5173
npm run typecheck    # ตรวจชนิด (vue-tsc)
npm run build        # build production → dist/
npm run test:unit   # เทส Unit (Vitest) — tests/unit/
npm run test:e2e    # เทส E2E (Playwright) — tests/e2e/ (เปิด dev server อัตโนมัติ)
npm test             # ทั้ง Unit + E2E
```

- โครงสร้างโปรเจกต์ตาม docs/07-chapter-7 (ข้อ 7.3/7.4): `src/stores` (Pinia), `src/screens`, `src/components`, `src/game` (OOP Monster — เติมในขั้นถัดไป)
- ธนาคารคำศัพท์: `src/data/wordBank.json` + `src/data/types.ts` (Matra/MATRA_BULLETS)
- E2E: เปิดหน้า → เริ่มเกม → เลือกกระสุน (ปุ่ม/แป้น 1–8) → ตรวจผล · Playwright config: `playwright.config.ts` (port 5173)

## 🐙 GitHub + Deploy (GitHub Pages)

- **Repo:** https://github.com/thebiiigbee05/BIIIGBEE-EDU-GAME.git
- **URL เกม (หลัง deploy):** https://thebiiigbee05.github.io/BIIIGBEE-EDU-GAME/
- **การ deploy:** อัตโนมัติผ่าน GitHub Actions (`.github/workflows/deploy.yml`) — push ขึ้น `main` → build (`npm run build`) → อัปโหลด `dist/` → Pages
- **ตั้งค่าครั้งเดียว:** Repo → Settings → Pages → Source: **GitHub Actions**
- **Assets เกม:** `public/assets/monsters/*.svg` (สไปรต์ SVG) · `public/assets/sprites/monsters-sheet.png` (Sprite sheet 384×256: 4 มอนสเตอร์ × 6 เฟรม — เดิน×2/ระเบิด×3/เป็นมิตร, เซลล์ 64×64) + `monsters-sheet.json` (manifest ตำแหน่งเฟรม)
- **สร้าง assets ใหม่:** `node scripts/generate-sprites.mjs` (วาด pixel-art 16×16 → scale ×4 เป็น PNG 64×64)
- **Preview สไปรต์:** เปิด `design/sprites-preview.html` (หรือ `node scripts/build-preview.mjs` เพื่อ rebuild)

**คำสั่งเชื่อม repo (ครั้งแรก):**
```bash
git remote add origin https://github.com/thebiiigbee05/BIIIGBEE-EDU-GAME.git
git branch -M main
git push -u origin main
```

## 📋 บอร์ด Kanban (ใช้งานได้ทันที)

- `kanban/monster-speller-kanban.csv` — นำเข้า GitHub Projects ได้ (คอลัมน์: Title/Description/Status/Sprint/Priority/Labels)
- `kanban/monster-speller-kanban-board.md` — บอร์ดภาพรวม + WIP limits + วิธีนำเข้า (บทที่ 8–9)

## 📚 ธนาคารคำศัพท์

- `src/data/wordBank.json` — **232 คำ ครบ 8 มาตรา** (ตรง 186 / ไม่ตรง 46) พร้อมฟิลด์: คำเต็ม, ตัวสะกด, มาตรา, ตรง/ไม่ตรง, ระดับความยาก 1–3, แหล่งอ้างอิง
- `src/data/README.md` — คำอธิบายฟิลด์ + วิธีใช้ในเกม + ข้อควรปฏิบัติ (ตรวจ IOC, การสุ่ม, สัดส่วนตามด่าน)

## 🎨 Quick Start: เริ่มงานกราฟิกยังไง (ทุกงาน sprite ต้องทำตาม PEP)

> **หลักการ:** ภาพที่ AI สร้าง**ไม่ใช่พื้นหลังโปร่งใส** → ต้องประมวลผลผ่าน Python
> ก่อนเข้าเกม สเปกเต็ม: [`design/prompt-processability-spec.md`](design/prompt-processability-spec.md)

**4 ขั้นตอน (ทุกงาน sprite):**

```
1. คัดลอกพรอมต์ PEP → วางใน AI (ChatGPT/runcomfy/ฯลฯ) → สร้างภาพ
2. วาง PNG ลงโปรเจกต์ (เช่น public/assets/ai/<name>.png)
3. รันคำสั่ง 1 บรรทัดจบ (ตรวจก่อน → ผ่านจึงตัดเฟรม + manifest):
   ./.venv-scripts/Scripts/python.exe scripts/ai-sprite-process.py <sheet.png> \
       --name <name> --cell <SIZE> --out-dir <ปลายทาง>/ \
       --grid-bg "#00ff00" --expect-grid <COLS>x<ROWS> --require-check
   (exit 0 = ผ่าน + ได้เฟรม · exit 1 = ตรวจไม่ผ่าน → gen ใหม่)
4. เปิดภาพเฟรมด้วยตา 1 ครั้ง → โหลด manifest ในเกม (SpriteRenderer บท 7.6)
```

**ไฟล์พรอมต์ PEP ทั้งหมด (คัดลอกไป AI ได้ทันที):**

| งาน | ไฟล์ | กริด (`--expect-grid`) |
|---|---|---|
| สไปรต์มอนสเตอร์ 4 ชนิด | [`design/art/pep-prompts-monsters.md`](design/art/pep-prompts-monsters.md) | `4x1` (4 ท่าเดิน) |
| เทิร์นอราวด์ 4 มุม | [`design/art/turnaround-prompts.md`](design/art/turnaround-prompts.md) | `2x2` |
| กระสุน 8 มาตรา / ชิ้นส่วน / ไอเท็ม / ไอคอน | [`docs/15-chapter-15-graphics-assets.md`](docs/15-chapter-15-graphics-assets.md) (15.4) | `4x2` / `2x2` / `1x5` |
| เทมเพลตสินทรัพย์เล็ก (เติมเอง) | docs/15 → 15.4.5 | ตามตาราง |
| พื้นหลัง / ฉาก | docs/15 → 15.5–15.7 | — (ไม่ต้อง PEP) |
| Workflow ตรวจภาพเต็ม | [`docs/06-chapter-6-ui-ux-graphics.md`](docs/06-chapter-6-ui-ux-graphics.md) → 6.7 | — |
| **Pipeline กระบวนการ (6 ระยะ + HITL)** | [`design/pipeline-process.md`](design/pipeline-process.md) | — |

**เครื่องมือตรวจ:**
- `scripts/ai-sprite-process.py` — ลบพื้น → ตัดเฟรม → manifest (`--check`/`--require-check`/`--remove-shadows`)
- `scripts/sprite-frame-detect.py` — ตรวจจับขอบเฟรมจากช่องว่าง (ภาพไม่มีกริด)
- `tests/check-links.py` — ตรวจลิงก์เอกสาร (รันหลังแก้ docs)

---

## 🃏 การ์ด AR (โหมดสแกน)

- `design/ar-cards/ar-cards-spec.md` — สเปกฉบับเต็ม (ขนาด/มาร์กเกอร์ AR.js/พิมพ์/แสง/QA)
- `design/ar-cards/printable-card-sheet.html` — เทมเพลตพิมพ์ A4 (2 การ์ด A5/แผ่น, 8 แบบ)
- `design/ar-cards/generate-markers.py` — สคริปต์สร้างมาร์กเกอร์ ArUco (ต้องติดตั้ง opencv-python-headless)

## 📏 ข้อตกลงการเขียนโค้ด

- **ทุกไฟล์โค้ดต้องไม่เกิน 800 บรรทัด** — ใกล้ถึงขีดจำกัดให้แตกโมดูล/คลาส/คอมโพเนนต์ย่อยทันที
- ตรวจสอบอัตโนมัติใน CI + อยู่ใน Definition of Done (บทที่ 8.3 และ 8.6)

## 📊 สถานะโครงการ ณ ปัจจุบัน (Kanban ภาพรวม)

| คอลัมน์ | สถานะ |
|---|---|
| 📥 Backlog | — |
| 🟡 Ready | — |
| 🟠 In Progress | — |
| 🔵 Review | — |
| ✅ Done | เอกสารกราฟิกครบวงจร PEP (สเปก + พรอมต์มอนสเตอร์/เทิร์นอราวด์/สินทรัพย์เล็ก + workflow 6.7 + ตรวจลิงก์) |

*ดูรายละเอียดบอร์ดเต็มในบทที่ 9*
