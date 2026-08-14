// ชนิดข้อมูลหลักของเกม (docs/14-architecture-medium-game.md — เลเยอร์ game/types)
export type Matra = 'กา' | 'กก' | 'กด' | 'กบ' | 'กน' | 'กม' | 'เกย' | 'เกอว';

export interface WordEntry {
  id: string;
  word: string;
  finalConsonant: string;
  matra: Matra;
  regular: boolean;
  difficulty: 1 | 2 | 3;
  source: string;
  note?: string;
}

/** ลำดับมาตรา = ลำดับแป้น 1–8 (docs/04-chapter-4-game-design.md ข้อ 4.6) */
export const MATRA_ORDER: Matra[] = ['กา', 'กก', 'กด', 'กบ', 'กน', 'กม', 'เกย', 'เกอว'];

/** แป้น 1–8 → มาตรา */
export const MATRA_BULLETS: Record<number, Matra> = Object.fromEntries(
  MATRA_ORDER.map((m, i) => [i + 1, m]),
) as Record<number, Matra>;

/** เวลาต่อรอบ 3 นาที (docs/04-chapter-4-game-design.md) */
export const ROUND_SECONDS = 180;

/** คำใบ้ระดับ 1–4 (docs/04-chapter-4-game-design.md ข้อ 4.7) */
export type HintLevel = 1 | 2 | 3 | 4;

/** ความเร็วเกมจาก Modal Settings (docs/06-chapter-6-ui-ux-graphics.md ข้อ 6.3) */
export type Speed = 'slow' | 'normal' | 'fast';
