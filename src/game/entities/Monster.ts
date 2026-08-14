import type { Matra, WordEntry } from '../types';
import { EXPLODE_SECONDS, FRIENDLY_SECONDS, STUN_SECONDS } from '../constants';

export type MonsterState = 'walking' | 'stunned' | 'exploding' | 'friendly' | 'escaped';

export interface HitResult {
  correct: boolean;
  hintLevel: number;
}

/**
 * คลาสแม่ของมอนสเตอร์ (docs/07-chapter-7-architecture-technology.md ข้อ 7.3)
 * มอนสเตอร์ถือบัตรคำ (word) — ผู้เล่นต้องยิงกระสุนมาตราให้ตรงกับ word.matra
 */
export abstract class Monster {
  readonly id: string;
  readonly word: WordEntry;
  readonly spriteId: string;
  readonly row: number;

  abstract readonly speed: number; // px/วินาที
  abstract readonly points: number;

  x: number;
  y: number;
  state: MonsterState = 'walking';
  stateTimer = 0;
  hintLevel = 0;

  private walkPhase = 0;
  private walkTimer = 0;

  constructor(id: string, word: WordEntry, spriteId: string, row: number, x: number, y: number) {
    this.id = id;
    this.word = word;
    this.spriteId = spriteId;
    this.row = row;
    this.x = x;
    this.y = y;
  }

  update(dt: number, speedMultiplier = 1): void {
    this.stateTimer += dt;

    // state machine วงจรชีวิตมอนสเตอร์ (docs/04-chapter-4-game-design.md ข้อ 4.5)
    if (this.state === 'stunned' && this.stateTimer >= STUN_SECONDS) {
      this.state = 'walking';
      this.stateTimer = 0;
    }
    if (this.state === 'exploding' && this.stateTimer >= EXPLODE_SECONDS) {
      this.state = 'friendly';
      this.stateTimer = 0;
    }
    if (this.state === 'friendly' && this.stateTimer >= FRIENDLY_SECONDS) {
      this.state = 'escaped';
      return;
    }

    if (this.state === 'walking') {
      this.x -= this.speed * dt * speedMultiplier;
      this.walkTimer += dt;
      if (this.walkTimer >= 0.3) {
        this.walkTimer = 0;
        this.walkPhase = this.walkPhase === 0 ? 1 : 0;
      }
    }
  }

  /** ถูกยิงด้วยกระสุนมาตรา — ถูก = เริ่มระเบิด, ผิด = ชะงัก + คำใบ้ระดับถัดไป */
  hit(bulletMatra: Matra): HitResult {
    if (this.state !== 'walking' && this.state !== 'stunned') {
      return { correct: false, hintLevel: this.hintLevel };
    }
    if (bulletMatra === this.word.matra) {
      this.state = 'exploding';
      this.stateTimer = 0;
      return { correct: true, hintLevel: this.hintLevel };
    }
    this.hintLevel = Math.min(3, this.hintLevel + 1);
    this.state = 'stunned';
    this.stateTimer = 0;
    return { correct: false, hintLevel: this.hintLevel };
  }

  /** ชื่อเฟรมสำหรับ SpriteRenderer (docs/04-chapter-4-game-design.md) */
  frameName(): string {
    if (this.state === 'exploding') {
      const step = Math.min(3, Math.floor(this.stateTimer / 0.12) + 1);
      return `explode${step}`;
    }
    if (this.state === 'friendly') return 'friendly';
    return this.walkPhase === 0 ? 'walk1' : 'walk2';
  }
}

export class WalkerMonster extends Monster {
  readonly speed = 45;
  readonly points = 100;
  constructor(word: WordEntry, x: number, y: number) {
    super(`w-${Math.random().toString(36).slice(2, 8)}`, word, 'walker', 0, x, y);
  }
}

export class RunnerMonster extends Monster {
  readonly speed = 95;
  readonly points = 150;
  constructor(word: WordEntry, x: number, y: number) {
    super(`r-${Math.random().toString(36).slice(2, 8)}`, word, 'runner', 1, x, y);
  }
}

export class TankMonster extends Monster {
  readonly speed = 30;
  readonly points = 200;
  constructor(word: WordEntry, x: number, y: number) {
    super(`t-${Math.random().toString(36).slice(2, 8)}`, word, 'tank', 2, x, y);
  }
}
