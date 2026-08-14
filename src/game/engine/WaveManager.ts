/**
 * ผู้ควบคุมคลื่นมอนสเตอร์ (game/engine — แยกจาก GameEngine)
 * รู้ว่า "เมื่อไหร่" และ "ชนิดไหน" ควรเกิด ตาม config ของด่าน (content/levels)
 */
import { WalkerMonster, RunnerMonster, TankMonster } from '../entities/Monster';
import { spawnIntervalAt } from '../systems/Difficulty';
import type { Monster } from '../entities/Monster';
import type { WordEntry } from '../types';

export interface WaveConfig {
  /** คาบการเกิดเริ่มต้น (วิ/ตัว) */
  spawnBase: number;
  /** คาบต่ำสุด (วิ) — กันเกมถี่เกินไป */
  spawnMin: number;
  /** จำนวนมอนสเตอร์สูงสุดบนจอ */
  maxMonsters: number;
  /** สัดส่วนคำไม่ตรงมาตรา 0–1 */
  irregularRatio: number;
}

/** ชนิดคอนสตรักเตอร์ของมอนสเตอร์ */
export type MonsterCtor = new (word: WordEntry, x: number, y: number) => Monster;

/** โอกาสเกิดมอนสเตอร์แต่ละชนิด (docs/04-chapter-4-game-design.md ข้อ 4.5) */
const TYPE_ROLL = [
  { ctor: WalkerMonster, weight: 0.5 },
  { ctor: RunnerMonster, weight: 0.3 },
  { ctor: TankMonster, weight: 0.2 },
];

export class WaveManager {
  private cfg: WaveConfig;

  constructor(cfg: WaveConfig) {
    this.cfg = cfg;
  }

  setConfig(cfg: WaveConfig): void {
    this.cfg = cfg;
  }

  /** คาบการเกิด ณ เวลาปัจจุบันในรอบ */
  currentInterval(elapsed: number): number {
    return spawnIntervalAt(elapsed, this.cfg.spawnBase, this.cfg.spawnMin);
  }

  /** ถึงเวลาต้องเกิดตัวใหม่หรือยัง (timer = เวลาที่เหลือก่อนเกิดครั้งถัดไป) */
  shouldSpawn(dt: number, timer: number, count: number): boolean {
    return timer - dt <= 0 && count < this.cfg.maxMonsters;
  }

  /** เวลาถัดไป (รีเซ็ต timer หลังเกิด) */
  nextTimer(elapsed: number): number {
    return this.currentInterval(elapsed);
  }

  /** สุ่มชนิดมอนสเตอร์ตามน้ำหนัก */
  rollType(): MonsterCtor {
    const roll = Math.random();
    let acc = 0;
    for (const t of TYPE_ROLL) {
      acc += t.weight;
      if (roll < acc) return t.ctor;
    }
    return WalkerMonster;
  }

  /** สร้างมอนสเตอร์ใหม่ที่ขอบขวา (word จากธนาคาร) */
  buildMonster(word: WordEntry, canvasW: number, canvasH: number): Monster {
    const Ctor = this.rollType();
    const x = canvasW + 40;
    const y = 120 + Math.random() * (canvasH - 320);
    return new Ctor(word, x, y);
  }
}
