# บทที่ 7 สถาปัตยกรรมระบบและเทคโนโลยี

> **ไฟล์:** `docs/07-chapter-7-architecture-technology.md` · **ผู้รับผิดชอบ:** Game Developer + AR Engineer
> **ตามข้อกำหนด Dev/Tech:** Vue 3 + Pinia · OOP คลาส Monster · Sprite ด้วย CSS/Canvas · Modal Settings + Hall of Fame

---

## 7.1 สถาปัตยกรรมโดยรวม

**รูปแบบ: เว็บแอป SPA (Vue 3) — เกมหลักบน Canvas, UI/Modal เป็น Vue Components**

```
┌─────────────────────────────── เบราว์เซอร์ ───────────────────────────────┐
│                                                                           │
│  UI LAYER (Vue 3 Components)                                              │
│  ┌──────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────────────┐ │
│  │ Hub / Menu   │ │ Settings    │ │ Hall of Fame│ │ Hangar (อัปเกรด)    │ │
│  │ (Vue)        │ │ (Modal)     │ │ (Modal)     │ │ (Vue)              │ │
│  └──────────────┘ └─────────────┘ └─────────────┘ └────────────────────┘ │
│                                                                           │
│  GAME LAYER (Canvas 2D + rAF Game Loop)                                   │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │ GameEngine → WaveManager → Monster[] (OOP) + Bullet[] + HUD       │   │
│  │  • Sprite Renderer (Sprite sheet: เดิน/ระเบิด/มิตร)                │   │
│  │  • Input: Mouse (เล็ง/ยิง) · Keyboard 1–8 (เลือกกระสุน) · Touch    │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  STATE LAYER (Pinia Stores)                                               │
│  ┌──────────────┐ ┌──────────────┐ ┌───────────────┐ ┌────────────────┐  │
│  │ useGameStore │ │ usePlayerStore│ │ useSettings   │ │ useHallOfFame  │  │
│  │ (คะแนน/คลื่น) │ │ (ความคืบหน้า/ │ │ (เสียง/ความเร็ว)│ │ (10 อันดับ)    │  │
│  │              │ │ ชิ้นส่วน/ดาว) │ │               │ │                │  │
│  └──────────────┘ └──────────────┘ └───────────────┘ └────────────────┘  │
│                                                                           │
│  DATA: LocalStorage (state) + IndexedDB (ประวัติ/analytics)               │
│  AR MODE (AR.js + camera) — สแกนการ์ดมอนสเตอร์บนโต๊ะ (โหมดเสริม)         │
│  BUILD: Vite + TypeScript + PWA                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

**หลักการสำคัญ:**
- **UI แยกจากเกม:** Canvas รับผิดชอบการเล่น (เร็ว, 60fps) ส่วน Vue รับผิดชอบเมนู/Modal/ผลสรุป —
  สื่อสารผ่าน Pinia store (ไม่ยุ่งกัน)
- **Game Loop แบบ rAF (requestAnimationFrame)** — อัปเดต/เรนเดอร์มอนสเตอร์+กระสุน
- **State อยู่ที่ Pinia เสมอ** — การบันทึก/โหลด/ทดสอบ (Unit Test) ทำได้ง่าย

## 7.2 เทคโนโลยีและเหตุผลการเลือกใช้

| เทคโนโลยี | บทบาท | เหตุผลการเลือก |
|---|---|---|
| **Vue 3 (Composition API)** | SPA, UI, Modal, เราควบคุมวงจรชีวิต | ตามข้อกำหนด Dev/Tech; เรียนรู้ง่าย, reactivity แข็งแรง |
| **Pinia** | State management กลาง | ตามข้อกำหนด; เก็บคะแนน/ความคืบหน้า/การตั้งค่า/อันดับ, DevTools, TypeScript-friendly |
| **Canvas 2D API** | เรนเดอร์เกมหลัก/สไปรต์/เอฟเฟกต์ | ควบคุมได้ละเอียด รองรับ 60fps สไปรต์จำนวนมาก |
| **CSS Animation** | แอนิเมชัน UI/Modal เรียบง่าย (กะพริบ, เปิดปิด) | เบา ไม่เปลือง Canvas สำหรับ UI |
| **AR.js** | โหมด AR: สแกนการ์ดมอนสเตอร์ | ตามข้อกำหนด; AR บนเว็บ ไม่ต้องติดตั้งแอป |
| **TypeScript** | ภาษาโปรแกรม | ปลอดภัยกับ OOP คลาส Monster, ลดบั๊ก |
| **Vite** | Build/Dev server | เร็ว, รองรับ Vue/TS/PWA plugin |
| **Vitest + Playwright** | Unit + E2E | ครอบคลุม test pyramid (บทที่ 10) |
| **Git + GitHub/GitLab** | ควบคุมเวอร์ชัน + Kanban | Boards/Issues = บอร์ด Kanban (บทที่ 9) |

## 7.3 การออกแบบเชิงวัตถุ (OOP): คลาส Monster และระบบเกม

```ts
// src/game/Monster.ts
export type Matra = 'กา'|'กก'|'กด'|'กบ'|'กน'|'กม'|'เกย'|'เกอว';

export abstract class Monster {
  id: string;
  word: WordEntry;            // { text, missingConsonant, matra, difficulty }
  hp: number;
  speed: number;
  x: number; y: number;
  state: 'walking'|'stunned'|'hit'|'friendly'|'exploding'|'escaped';
  sprite: Sprite;             // ชุดเฟรมเดิน/ระเบิด

  abstract get points(): number;
  hit(bulletMatra: Matra): HitResult { ... }   // ถูก/ผิด/ชะงัก+คำใบ้
  update(dt: number): void { ... }             // เดิน/แอนิเมชัน
  onStun(hintLevel: number): void { ... }      // ระบบคำใบ้ (บทที่ 4.7)
}

export class WalkerMonster extends Monster { ... }  // เดินช้า HP ต่ำ
export class RunnerMonster extends Monster { ... }  // เดินเร็ว
export class TankMonster  extends Monster { ... }   // HP สูง ยิงซ้ำ
export class BossMonster  extends Monster { ... }   // ท้าทายหลายคำติดต่อ

// ระบบรอบเกม
export class GameEngine {
  loop(dt: number): void;          // rAF loop: update + render
  spawnWave(level: LevelConfig): void;
  onBulletFired(bulletMatra: Matra, target: Monster): void;
}
```

```ts
// กระสุนมาตรา — แผนที่แป้น 1–8 (บทที่ 3.3)
export const MATRA_BULLETS: Record<number, Matra> = {
  1:'กา', 2:'กก', 3:'กด', 4:'กบ', 5:'กน', 6:'กม', 7:'เกย', 8:'เกอว',
};
```

## 7.4 โครงสร้างโปรเจกต์ (Folder Structure)

```
monster-speller/
├── public/
│   ├── assets/           # sprite sheets, backgrounds, audio, cards (AR markers)
│   └── manifest.webmanifest
├── src/
│   ├── main.ts / App.vue
│   ├── components/       # HubMenu, GameScreen, SettingsModal, HallOfFameModal, Hangar, HUD…
│   ├── stores/
│   │   ├── game.ts       # useGameStore — คะแนน/คลื่น/เวลารอบ/ผลลัพธ์
│   │   ├── player.ts     # usePlayerStore — ด่านที่ปลดล็อก/ดาว/ชิ้นส่วน/เหรียญ
│   │   ├── settings.ts   # useSettingsStore — เสียง/ความเร็ว/โหมดผ่อนปรน/ลดเอฟเฟกต์
│   │   └── hallOfFame.ts # useHallOfFameStore — 10 อันดับ (LocalStorage)
│   ├── game/
│   │   ├── Monster.ts / monsters/ (Walker, Runner, Tank, Boss)
│   │   ├── Bullet.ts / GameEngine.ts / WaveManager.ts / SpriteRenderer.ts
│   │   ├── input/ (MouseInput.ts, KeyboardInput.ts, TouchInput.ts)
│   │   └── config/ (levelConfig.ts, matraBullets.ts)
│   ├── ar/               # AR.js setup + marker handlers (โหมด AR)
│   ├── data/             # wordBank.json (ธนาคารคำศัพท์ 8 มาตรา), types.ts
│   └── utils/
├── tests/                # unit (Vitest) + e2e (Playwright)
├── docs/                 # เอกสารโครงการเล่มนี้ (1 บท = 1 ไฟล์)
└── package.json
```

## 7.5 โมเดลข้อมูลหลัก (Pinia State)

```ts
// game store
interface GameState {
  roundTimeLeft: number;        // 3 นาที/รอบ
  score: number; multiplier: number;
  wave: number; monstersAlive: Monster[];
  shipHp: number;
  bullets: Matra[];             // กระสุนที่เลือกปัจจุบัน
  result: RoundResult | null;   // คะแนน/ความแม่นยำ/ดาว/ชิ้นส่วน
}

// player store
interface PlayerState {
  name: string; unlockedLevel: number;
  stars: Record<number, number>;        // 1–3 ดาวต่อด่าน
  shipParts: { engine: number; gun: number; shield: number; sensor: number };
  badges: string[];
  analytics: AnalyticsEntry[];          // ต่อรอบ → IndexedDB
}

// settings store
interface SettingsState {
  bgm: boolean; sfx: boolean; subtitles: boolean;
  speed: 'slow'|'normal'|'fast';
  gentleMode: boolean; lowFX: boolean;   // โหมดผ่อนปรน/ลดเอฟเฟกต์
}

// hall of fame store
interface ScoreEntry {
  id: string; name: string; score: number;
  maxLevel: number; accuracy: number; achievedAt: number;
}
// เก็บ 10 อันดับสูงสุด — ชื่อในเกมเท่านั้น (ไม่ใช้ข้อมูลระบุตัวตน)
```

**จัดเก็บ:** LocalStorage (Player/Settings/Hall of Fame) + IndexedDB (Analytics ต่อรอบ เพื่อ Dashboard ครู)

## 7.6 การเรนเดอร์ Sprite: Canvas / CSS

| งาน | เทคโนโลยี | เหตุผล |
|---|---|---|
| มอนสเตอร์ (เดิน/โจมตี/ระเบิด/มิตร) | **Canvas** + Sprite sheet (ชุดเฟรม, animation frame ควบคุมโดย GameEngine) | ต้องเรนเดอร์จำนวนมาก/เร็ว + เอฟเฟกต์ particle |
| กระสุน/เลเซอร์/ระเบิด | **Canvas** (particle system) | เอฟเฟกต์ต่อเนื่อง 60fps |
| ยานผู้เล่น/เอฟเฟกต์ช่อง | Canvas หรือ CSS (เลือกตามความซับซ้อน) | ยืดหยุ่น |
| UI: ปุ่ม/Modal/HUD ตัวอักษร | **Vue + CSS** | DOM ดูแลง่าย, ตรวจสอบได้, ปรับสไตล์เร็ว |
| แอนิเมชัน Modal (เปิด/ปิด) | CSS transition/animation | เบา เรียบง่าย |

> **หลักการ:** "Canvas สำหรับโลกเกม, Vue/CSS สำหรับอินเทอร์เฟซ" — กัน DOM เยอะในเกม loop

## 7.7 ประสิทธิภาพและข้อจำกัดของอุปกรณ์

| ข้อจำกัด | แนวทางจัดการ |
|---|---|
| คอมพิวเตอร์ห้องเรียนรุ่นเก่า | Canvas เบา (Sprite atlas เดียว, จำกัด particle ≤ 200), 60fps พื้นฐาน, โหมดลดเอฟเฟกต์ |
| แท็บเล็ต/สมาร์ตโฟน | Touch input + ปุ่มกระสุนใหญ่; ปรับขนาด Canvas ตามจอ (devicePixelRatio) |
| แป้นพิมพ์ไทย (IME) | จัดการ keydown ด้วย `event.code` (Digit1–Digit8) ไม่ขึ้นกับภาษา |
| กล้อง/แสง (โหมด AR) | แจ้งเงื่อนไขแสง; Fallback เล่นโหมดจอปกติ |
| อินเทอร์เน็ตช้า | PWA cache ทรัพยากร; เกมหลักเล่นออฟไลน์ได้ |
| ประสิทธิภาพ AR.js | แยกเฟรม AR ออกจากเกม loop; จำกัดความละเอียดกล้อง |

**เกณฑ์ขั้นต่ำ (Min Spec):** CPU 2-core, RAM 2GB, Canvas 2D support, Chrome/Edge/Safari เวอร์ชันล่าสุด; กล้อง ≥ 480p (เฉพาะโหมด AR)

## 7.8 ความปลอดภัยและความเป็นส่วนตัว

1. **กล้อง (AR) ประมวลผลในเครื่อง** — ไม่ส่งภาพออกนอกอุปกรณ์
2. **Hall of Fame ใช้ชื่อในเกมเท่านั้น** — ไม่เก็บชื่อจริง/รูป/ข้อมูลระบุตัวตน
3. **ปฏิบัติตาม PDPA** — แจ้งนโยบายก่อนขอสิทธิ์กล้อง; ผู้ปกครองยินยอมสำหรับการทดลองใช้จริง
4. **ข้อมูลผู้เรียน** — เก็บในเครื่อง; การส่งออกผลการเรียน (Dashboard) ต้องได้รับความยินยอม
5. **ความปลอดภัยโค้ด** — npm audit, ไม่ฝัง secret ในไคลเอ็นต์

> 🔗 **เชื่อมโยง:** User Stories ของสถาปัตยกรรมนี้ → บทที่ 8 · การทดสอบ → บทที่ 10
---

> ⬆️ [กลับไปสารบัญ](00-cover-and-toc.md)
