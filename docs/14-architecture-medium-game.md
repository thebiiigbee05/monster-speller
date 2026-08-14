# บทที่ 14 สถาปัตยกรรมเกมขนาดกลาง (Medium-Scale Architecture)

> **ไฟล์:** `docs/14-architecture-medium-game.md` · **ผู้รับผิดชอบ:** Tech Lead + ทีมพัฒนา
> **จุดประสงค์:** ยกระดับโครงสร้างจากโปรโตไทป์ → เกมขนาดกลาง ที่รองรับการเพิ่ม
> ฟีเจอร์โดยไม่ต้องแก้แกนเกม: ด่าน/บอส, AR, โรงเก็บยาน, Dashboard ครู, หลายภาษา

---

## 14.1 หลักการออกแบบ (Design Principles)

1. **Game Logic แยกจาก Vue อย่างเด็ดขาด** — ระบบเกม (คะแนน, คลื่น, คำใบ้, ความยาก)
   เป็น **pure TypeScript** เทสได้ด้วย Vitest โดยไม่ต้องเปิดเบราว์เซอร์
   Vue = เปลือกแสดงผล (thin UI layer) เท่านั้น
2. **เนื้อหา (Content) แยกจากโค้ด** — ด่าน/ธนาคารคำ/รางวัล เป็นไฟล์ข้อมูล (config)
   → ครู/นักออกแบบเนื้อหาแก้ได้โดยไม่แตะโค้ด และไม่ทำให้เทสพัง
3. **หนึ่งเลเยอร์หนึ่งหน้าที่** — `game/` ไม่รู้จัก Vue, `ui/` ไม่มีตรรกะเกม,
   `services/` มี interface สลับ backend ได้
4. **ต่อยอดโดยการเพิ่ม ไม่ใช่การแก้** — ฟีเจอร์ใหม่ = เพิ่ม content + screen + service
   ไม่ต้องเปิดไฟล์เก่าแกนกลาง
5. **ทุกโมดูลเล็กพอ** (≤ 800 บรรทัด/ไฟล์) — ถ้าใกล้ถึงขีดจำกัดให้แตกตามแนวตั้ง
   (ระบบย่อย) ไม่ใช่แตกแนวนอน (ชั้นบาง ๆ ที่ไร้ความหมาย)

---

## 14.2 โครงสร้างโฟลเดอร์เป้าหมาย

```
src/
├── main.ts / App.vue / style.css      # จุดเริ่ม + ธีม
│
├── core/                              # ── พื้นฐานเอนจิน (ไม่รู้จักเกมนี้)
│   ├── GameLoop.ts                    #    loop + fixed timestep + start/stop/pause
│   └── math.ts                        #    clamp / lerp / randRange
│
├── game/                              # ── โดเมนเกม (pure TS, ไม่ import Vue)
│   ├── types.ts                       #    Matra, WordEntry, Speed, HintLevel …
│   ├── constants.ts                   #    ขนาดฉาก/สี/ความเร็ว (ค่าทางกายภาพ)
│   ├── engine/                        #    ผู้ประสานงาน (orchestrator)
│   │   ├── GameEngine.ts              #      ต่อสายระบบทั้งหมด + input + render
│   │   └── WaveManager.ts             #      คลื่นมอนสเตอร์ + สเกลตามด่าน
│   ├── entities/                      #    เอนทิตี OOP
│   │   └── Monster.ts                 #      Monster + Walker/Runner/Tank/Boss
│   ├── systems/                       #    ตรรกะบริสุทธิ์ (pure functions/classes)
│   │   ├── Scoring.ts                 #      คะแนน/คอมโบ
│   │   ├── Hints.ts                   #      คำใบ้ 4 ระดับ
│   │   └── Difficulty.ts              #      เส้นโค้งความยาก + ความเร็วจาก Settings
│   └── render/                        #    การวาด (Canvas)
│       ├── SpriteRenderer.ts
│       └── Effects.ts
│
├── content/                           # ── เนื้อหาเกม (ข้อมูล ไม่ใช่โค้ด)
│   ├── levels.ts                      #    8 ด่าน: ความเร็ว/สัดส่วนไม่ตรง/บอส
│   ├── rewards.ts                     #    ชิ้นส่วนอัปเกรดยาน (Hangar)
│   └── words/                         #    ธนาคารคำ + picker
│       ├── wordBank.json
│       └── wordBank.ts
│
├── services/                          # ── บริการภายนอก (มี interface, สลับได้)
│   ├── storage.ts                     #    localStorage/IndexedDB (บันทึกเกม, HOF, settings)
│   ├── audio.ts                       #    WebAudio (SFX/BGM) — สลับเป็นไฟล์เสียงได้
│   └── ar.ts                          #    AR.js (มี fallback เมื่อไม่มีกล้อง)
│
├── stores/                            # ── Pinia: สถานะ UI + สะพานสู่ game/services
│   ├── game.ts                        #    รอบปัจจุบัน/คะแนน/HP/ด่าน
│   ├── settings.ts                    #    เสียง/ความเร็ว/ผ่อนปรน
│   ├── hallOfFame.ts                  #    10 อันดับ (ผ่าน services/storage)
│   └── progression.ts                 #    ด่านที่ปลดล็อก/ชิ้นส่วนยาน (อนาคต)
│
└── ui/                                # ── Vue layer (ผอม — render + event เท่านั้น)
    ├── screens/
    │   ├── HubScreen.vue              #    เมนู + เลือกด่าน
    │   ├── GameScreen.vue             #    Canvas + HUD + สรุป
    │   ├── HangarScreen.vue           #    โรงเก็บยาน (อนาคต)
    │   └── ArScreen.vue               #    โหมด AR (อนาคต)
    └── components/
        ├── modals/                    #    SettingsModal, HallOfFameModal
        ├── hud/                       #    TimerHud, ScoreHud, BulletBar (อนาคต)
        └── common/                    #    NeonButton ฯลฯ (อนาคต)
```

---

## 14.3 กฎการไหลของข้อมูล (Data Flow Rules)

```
Vue UI (ui/)  ──อ่าน──▶  Pinia stores (stores/)
     │                      │  เรียก pure logic
     ▼                      ▼
   event        game systems (pure TS) ──ใช้──▶ services/ (storage, audio, ar)
 (click, key)        ▲
     │              │  ส่ง event (คะแนน, คำใบ้, จบรอบ)
     ▼              │
 GameEngine (game/engine) ──สร้าง/อัปเดต──▶ entities + render
```

**กฎบังคับ:**
- `game/`, `core/`, `content/` **ห้าม** import จาก `ui/`, `stores/`, `vue`
- `stores/` เรียก **pure functions** จาก `game/systems` — ไม่ฝังสูตรใน store
- `ui/` ไม่เขียนตรรกะเกม — ส่ง event ให้ store/engine ทำงาน
- `services/` ผ่าน interface — ตัวจริง (localStorage/WebAudio/AR.js) สลับได้ในไฟล์เดียว

**เหตุผล:** เทส unit วิ่งบน `game/systems` + `game/engine` โดยไม่ต้องมี Vue/Canvas
(engine สร้างได้ด้วย canvas stub) → จับบั๊กตรรกะก่อนถึง UI

---

## 14.4 แผนผังโมดูลสำคัญ

### GameEngine = ผู้ประสานงาน (ไม่ใช่หมีพูห์)

```
GameEngine
├── GameLoop (core)          → เรียก update(dt) + render() ทุกเฟรม
├── WaveManager (engine)     → เมื่อไหร่ควรเกิดมอนสเตอร์ (ตามด่าน) + ชนิด
├── Scoring (systems)        → คะแนน/คอมโบ (store เรียกด้วย)
├── Hints (systems)          → ข้อความคำใบ้ (pure function)
├── Difficulty (systems)     → ความเร็วสัมฤทธิ์ = settings × ระดับด่าน
├── SpriteRenderer (render)  → วาดเฟรมตามสถานะมอนสเตอร์
└── Effects (render)         → particle / ข้อความลอย / จอสั่น
```

### WaveManager (ตัวอย่างการแตกแนวตั้ง)

```ts
// game/engine/WaveManager.ts — ไม่รู้จัก Vue/Canvas
export interface WaveConfig {
  spawnBase: number;      // วินาที/ตัว ตอนเริ่มด่าน
  spawnMin: number;       // ค่าต่ำสุด (ด่านสูง = ถี่ขึ้น)
  maxMonsters: number;    // จำกัดมอนสเตอร์บนจอ
  irregularRatio: number; // สัดส่วนคำไม่ตรงมาตรา 0–1
}

export class WaveManager {
  constructor(private cfg: WaveConfig) {}
  setConfig(cfg: WaveConfig): void { this.cfg = cfg; }
  /** คืน true เมื่อถึงเวลาต้องเกิดตัวใหม่ */
  shouldSpawn(dt: number, elapsed: number, count: number): boolean { … }
  /** เลือกชนิดมอนสเตอร์ตามโอกาส (Walker 50% / Runner 30% / Tank 20%) */
  rollType(): MonsterCtor { … }
}
```

### ตัวอย่าง: ด่านเป็นข้อมูล (content/levels.ts)

```ts
export interface LevelConfig {
  id: number;
  name: string;
  speedMult: number;      // × ความเร็วมอนสเตอร์
  irregularRatio: number; // 0 = ตรงมาตราเท่านั้น → 1 = ไม่ตรงเยอะ
  spawnBase: number;      // คาบการเกิด
  spawnMin: number;
  maxMonsters: number;
  boss: boolean;
  unlockScore: number;    // คะแนนขั้นต่ำผ่านด่าน
}
```

---

## 14.5 แผนการอพยพจากโปรโตไทป์ → โครงสร้างใหม่ (Migration)

| งาน | จาก | ไป | เสร็จ |
|---|---|---|---|
| ย้าย types/constants | `data/types.ts` | `game/types.ts` + `game/constants.ts` | ✅ |
| แยกคะแนน/คอมโบ | ฝังใน store | `game/systems/Scoring.ts` | ✅ |
| แยกคำใบ้ | ฝังใน GameEngine | `game/systems/Hints.ts` | ✅ |
| แยกความยาก/ความเร็ว | ฝังใน GameScreen | `game/systems/Difficulty.ts` | ✅ |
| แยกคลื่นมอนสเตอร์ | ฝังใน GameEngine | `game/engine/WaveManager.ts` | ✅ |
| loop | ฝังใน GameEngine | `core/GameLoop.ts` | ✅ |
| เนื้อหาด่าน | (ไม่มี) | `content/levels.ts` | ✅ |
| Hall of Fame จริง | placeholder | `services/storage.ts` + `stores/hallOfFame.ts` | ✅ |
| แยกกระสุน/การชน | ฝังใน GameEngine | `game/engine/BulletManager.ts` | ⏳ ถัดไป |
| โรงเก็บยาน (Hangar) | (ไม่มี) | `content/rewards.ts` + `ui/screens/HangarScreen.vue` + `stores/progression.ts` | ⏳ Sprint 4 |
| AR | สเปกการ์ด | `services/ar.ts` + `ui/screens/ArScreen.vue` | ⏳ Sprint 5 |
| เสียง | (ไม่มี) | `services/audio.ts` (WebAudio) | ⏳ Sprint 5 |
| Dashboard ครู | (ไม่มี) | `services/analytics.ts` + export CSV | ⏳ Sprint 6 |

---

## 14.6 ฟีเจอร์ใหม่ใส่ตรงไหน (Feature Placement Guide)

| ฟีเจอร์ใหม่ | ไฟล์ที่เพิ่ม/แก้ |
|---|---|
| ด่านใหม่/ปรับสมดุล | `content/levels.ts` เท่านั้น |
| คำศัพท์เพิ่ม | `content/words/wordBank.json` |
| มอนสเตอร์ชนิดใหม่ | `game/entities/Monster.ts` (+ sprite sheet) |
| ระบบยาน/อัปเกรด | `content/rewards.ts` + `stores/progression.ts` + `ui/screens/HangarScreen.vue` |
| โหมด AR | `services/ar.ts` + `ui/screens/ArScreen.vue` (engine ใช้ซ้ำได้เลย) |
| เสียง/BGM | `services/audio.ts` + ผูก toggle ใน `stores/settings.ts` |
| ภาษาที่ 2 | แยก string ทั้งหมดไป `content/i18n/` |
| หลายรอบ/ประวัติครู | `services/analytics.ts` |

> **กฎเหล็ก:** ถ้าต้องแก้ `GameEngine.ts` เพื่อเพิ่มฟีเจอร์ → ถามก่อนว่า
> "ฟีเจอร์นี้ควรเป็น system/service/content ใหม่หรือเปล่า"

---

## 14.7 มาตรฐานการเทสตามสถาปัตยกรรม

| เลเยอร์ | เทสด้วย | ตัวอย่าง |
|---|---|---|
| `game/systems`, `content` | Vitest (เร็ว, ไม่มีเบราว์เซอร์) | Scoring, Hints, Difficulty, wordBank, levels |
| `game/engine` | Vitest + canvas stub | WaveManager, วงจรมอนสเตอร์ |
| `stores` | Vitest + Pinia | hallOfFame, game |
| `ui/` | Playwright E2E | เลือกด่าน → ยิง → บันทึกคะแนน → HOF |

**หลักการ:** ตรรกะหนัก ๆ อยู่ชั้นล่าง (เทส unit ครอบคลุม) → E2E เหลือแค่ยืนยัน
"เส้นทางผู้ใช้ทำงาน" ไม่ต้องเล่นเกม 3 นาทีเพื่อทดสอบสูตรคะแนน
---

> ⬆️ [กลับไปสารบัญ](00-cover-and-toc.md)
