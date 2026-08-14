/**
 * ข้อมูลด่านทั้ง 8 (content/ — ข้อมูล ไม่ใช่โค้ด เปลี่ยนได้โดยไม่แตะ engine)
 * อ้างอิง docs/04-chapter-4-game-design.md ข้อ 4.9 (การไต่ระดับความยาก)
 * - ด่านสูงขึ้น: มอนสเตอร์เร็วขึ้น + คำไม่ตรงมาตรามากขึ้น + คลื่นถี่ขึ้น
 */
import type { Matra } from '../game/types';

export interface LevelConfig {
  id: number;
  name: string;
  /** มาตราโฟกัสของด่าน (ใช้แนะนำครู, ยังไม่บังคับในลูป) */
  focusMatras: Matra[];
  /** × ความเร็วมอนสเตอร์ */
  speedMult: number;
  /** สัดส่วนคำไม่ตรงมาตรา 0–1 */
  irregularRatio: number;
  /** คาบการเกิดเริ่มต้น (วิ) */
  spawnBase: number;
  /** คาบต่ำสุด (วิ) */
  spawnMin: number;
  /** มอนสเตอร์สูงสุดบนจอ */
  maxMonsters: number;
  /** ด่านนี้มีบอสหรือไม่ */
  boss: boolean;
  /** คะแนนขั้นต่ำที่ต้องได้เพื่อผ่านด่าน (ใช้กับ Progression อนาคต) */
  unlockScore: number;
}

export const LEVELS: LevelConfig[] = [
  { id: 1, name: 'ด่าน 1 — ฐานฝึก', focusMatras: ['กา', 'กก', 'กด'], speedMult: 1, irregularRatio: 0.1, spawnBase: 2.6, spawnMin: 1.9, maxMonsters: 4, boss: false, unlockScore: 800 },
  { id: 2, name: 'ด่าน 2 — ดาวเคราะห์ กก', focusMatras: ['กก', 'กด'], speedMult: 1.1, irregularRatio: 0.2, spawnBase: 2.4, spawnMin: 1.8, maxMonsters: 4, boss: false, unlockScore: 1200 },
  { id: 3, name: 'ด่าน 3 — วงแหวน กด', focusMatras: ['กด', 'กบ'], speedMult: 1.2, irregularRatio: 0.3, spawnBase: 2.2, spawnMin: 1.6, maxMonsters: 5, boss: false, unlockScore: 1800 },
  { id: 4, name: 'ด่าน 4 — ป้อม กบ', focusMatras: ['กบ', 'กน'], speedMult: 1.3, irregularRatio: 0.4, spawnBase: 2.0, spawnMin: 1.5, maxMonsters: 5, boss: true, unlockScore: 2400 },
  { id: 5, name: 'ด่าน 5 — เนบิวลา กน', focusMatras: ['กน', 'กม'], speedMult: 1.4, irregularRatio: 0.5, spawnBase: 1.9, spawnMin: 1.4, maxMonsters: 5, boss: false, unlockScore: 3000 },
  { id: 6, name: 'ด่าน 6 — มหาสมุทร กม', focusMatras: ['กม', 'เกย'], speedMult: 1.5, irregularRatio: 0.6, spawnBase: 1.8, spawnMin: 1.3, maxMonsters: 6, boss: false, unlockScore: 3600 },
  { id: 7, name: 'ด่าน 7 — เกาะ เกย', focusMatras: ['เกย', 'เกอว'], speedMult: 1.6, irregularRatio: 0.7, spawnBase: 1.7, spawnMin: 1.2, maxMonsters: 6, boss: false, unlockScore: 4200 },
  { id: 8, name: 'ด่าน 8 — ป้อมจอมมาร เกอว', focusMatras: ['เกอว', 'กก', 'กด'], speedMult: 1.8, irregularRatio: 0.8, spawnBase: 1.6, spawnMin: 1.1, maxMonsters: 7, boss: true, unlockScore: 5000 },
];

export function getLevel(id: number): LevelConfig {
  return LEVELS[Math.min(Math.max(id, 1), LEVELS.length) - 1];
}
