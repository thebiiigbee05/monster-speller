/**
 * ระบบเกมหลักบน Canvas (game/engine — ออร์เคสเตรเตอร์)
 * docs/14-architecture-medium-game.md: GameEngine ต่อสายระบบ ไม่ใช่หมีพูห์
 * - core/GameLoop          → เรียก update/render ทุกเฟรม
 * - engine/WaveManager     → คลื่นมอนสเตอร์ตามด่าน
 * - systems/Hints          → คำใบ้ 4 ระดับ
 * - systems/Difficulty     → ความเร็วสัมฤทธิ์ (Settings × ด่าน)
 */
import { GameLoop } from '../../core/GameLoop';
import { WaveManager } from './WaveManager';
import { ParticleSystem, FloatingTexts } from '../render/Effects';
import { SpriteRenderer } from '../render/SpriteRenderer';
import { buildHint } from '../systems/Hints';
import { buildChoices } from '../systems/Options';
import { effectiveSpeed } from '../systems/Difficulty';
import { pickWord } from '../../content/words/wordBank';
import { getLevel, type LevelConfig } from '../../content/levels';
import {
  BASE_X,
  BULLET_SPEED,
  CANVAS_H,
  CANVAS_W,
  HIT_RADIUS,
  MATRA_COLORS,
  MONSTER_H,
  MONSTER_W,
  SHIP,
} from '../constants';
import { WalkerMonster } from '../entities/Monster';
import type { Monster } from '../entities/Monster';
import type { Matra, WordEntry } from '../types';

interface Bullet {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  matra: Matra;
  hit: boolean;
}

export interface EngineEvents {
  onCorrect(points: number, combo: number): void;
  onWrong(): void;
  onHint(text: string): void;
  onEscape(): void;
  /** โหมดเรียนรู้: เปลี่ยนชุดตัวเลือก 3 มาตรา */
  onChoices?(options: Matra[], correctIndex: number): void;
  /** โหมดเรียนรู้: ตอบครบทุกคำ */
  onLearnDone?(): void;
}

export type GameMode = 'challenge' | 'learn';

/** จำนวนคำต่อรอบโหมดเรียนรู้ (docs/04-chapter-4 ข้อ 4.6) */
export const LEARN_WORDS_PER_ROUND = 8;

/** ตำแหน่งที่มอนสเตอร์เดินมาหยุดรอในโหมดเรียนรู้ (กลางจอ) */
export const LEARN_STOP_X = 500;

export class GameEngine {
  readonly width = CANVAS_W;
  readonly height = CANVAS_H;
  monsters: Monster[] = [];
  bullets: Bullet[] = [];

  private ctx: CanvasRenderingContext2D;
  private events: EngineEvents;
  private sprite: SpriteRenderer | null = null;
  private loop: GameLoop;

  private elapsed = 0;
  private spawnTimer = 1;
  private combo = 0;
  private selectedMatra: Matra = 'กก';
  private settingsMult = 1;
  private gentleMode = false;
  private level: LevelConfig = getLevel(1);
  private pointer = { x: SHIP.x, y: SHIP.y - 120 };

  // ------------------------------------------------------- โหมดเรียนรู้
  private mode: GameMode = 'challenge';
  private learnQueue: WordEntry[] = [];
  private learnIndex = 0;
  private choices: Matra[] = [];
  private disabledChoices = new Set<Matra>();

  private wave: WaveManager;
  private particles = new ParticleSystem();
  private texts = new FloatingTexts();
  private shake = 0;
  private muzzleFlash = 0;

  // ดาว 2 ชั้นแบบ parallax (ชั้นไกลช้าเล็ก + ชั้นใกล้เร็วใหญ่)
  private readonly starsFar = this.makeStars(55, 1, 7);
  private readonly starsNear = this.makeStars(20, 2.1, 16);

  constructor(canvas: HTMLCanvasElement, events: EngineEvents) {
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('ไม่สามารถสร้าง 2D context ได้');
    this.ctx = ctx;
    this.events = events;
    this.wave = new WaveManager(this.waveConfigFromLevel(this.level));
    this.loop = new GameLoop((dt) => {
      this.update(dt);
      this.render();
    });
  }

  /** แปลง LevelConfig → WaveConfig (สัดส่วน/คาบ/จำนวน) */
  private waveConfigFromLevel(level: LevelConfig) {
    return {
      spawnBase: level.spawnBase,
      spawnMin: level.spawnMin,
      maxMonsters: level.maxMonsters,
      irregularRatio: level.irregularRatio,
    };
  }

  async start(): Promise<void> {
    if (!this.sprite) {
      this.sprite = await SpriteRenderer.load();
    }
    this.loop.start();
  }

  stop(): void {
    this.loop.stop();
  }

  setBullet(matra: Matra): void {
    this.selectedMatra = matra;
  }

  /** เปลี่ยนด่าน (content/levels) — ความเร็ว/คาบ/สัดส่วนตามด่าน */
  setLevel(level: LevelConfig): void {
    this.level = level;
    this.wave.setConfig(this.waveConfigFromLevel(level));
  }

  /** ความเร็วจาก Modal Settings (docs/06-chapter-6 ข้อ 6.3) */
  setSpeedMultiplier(mult: number): void {
    this.settingsMult = mult;
  }

  /** โหมดผ่อนปรน: ผิดทันทีให้คำใบ้เต็ม */
  setGentleMode(on: boolean): void {
    this.gentleMode = on;
  }

  /** เปลี่ยนโหมดเกม (challenge = ยิง, learn = เลือกคำตอบ) */
  setMode(mode: GameMode): void {
    this.mode = mode;
    if (mode === 'learn') this.initLearnRound();
  }

  /** ตัวเลือกมาตรา 3 ตัวของคำปัจจุบัน (สำหรับ UI ปุ่ม) */
  currentChoices(): readonly Matra[] {
    return this.choices;
  }

  /** ตอบคำในโหมดเรียนรู้ — ถูก = เลเซอร์แปลงมอนสเตอร์, ผิด = คำใบ้ + ปิดตัวเลือก */
  answer(matra: Matra): boolean {
    if (this.mode !== 'learn') return false;
    const m = this.monsters[0];
    if (!m || m.state === 'exploding' || m.state === 'friendly') return false;
    if (this.disabledChoices.has(matra)) return false;

    if (matra === m.word.matra) {
      this.disabledChoices.clear();
      // เลเซอร์ยิงอัตโนมัติ (ถูก) → ระเบิด → เป็นมิตร
      m.hit(matra);
      this.combo += 1;
      this.particles.burst(m.x, m.y, '#39ff14', 30, 300, 3.5, 0.8);
      this.particles.burst(m.x, m.y, MATRA_COLORS[m.word.matra], 18, 200, 3, 0.6);
      this.texts.add(`+${m.points}`, m.x, m.y - 34, '#ffd700', 24);
      this.shake = Math.min(this.shake + 0.4, 1);
      this.events.onCorrect(m.points, this.combo);
      this.events.onHint('');
      return true;
    }

    // ผิด — คำใบ้ + ปิดตัวเลือกนั้น (ไม่มีการลงโทษ/ไม่เสีย HP)
    this.disabledChoices.add(matra);
    m.hintLevel = Math.min(3, m.hintLevel + 1);
    this.combo = 0;
    this.events.onWrong();
    this.events.onHint(buildHint(m, this.gentleMode));
    return false;
  }

  /** คลิก/แตะบน canvas — ยิงไปยังจุดนั้น */
  handlePointer(clientX: number, clientY: number): void {
    const rect = this.canvasRect();
    if (!rect) return;
    const x = (clientX - rect.left) * (this.width / rect.width);
    const y = (clientY - rect.top) * (this.height / rect.height);
    this.pointer = { x, y };
    this.fire();
  }

  /** ยิงไปยังตำแหน่ง pointer ล่าสุด (ใช้กับปุ่ม Space) */
  fireDefault(): void {
    this.fire();
  }

  /** สำหรับเทส E2E — สร้างมอนสเตอร์ที่ตำแหน่งกำหนด (ล้างของเดิมให้เทส deterministic) */
  debugSpawn(word: WordEntry, x = 700, y = 260): void {
    this.monsters = [];
    this.bullets = [];
    this.monsters.push(new WalkerMonster(word, x, y));
  }

  private canvasRect(): DOMRect | null {
    return this.ctx.canvas.getBoundingClientRect();
  }

  // ---------------------------------------------------------------- update

  /** เตรียมคิวคำ 8 คำ (ตรง/ไม่ตรงมาตรา ตามด่าน) + มอนสเตอร์ตัวแรก */
  private initLearnRound(): void {
    this.monsters = [];
    this.bullets = [];
    this.learnQueue = [];
    const used = new Set<string>();
    for (let i = 0; i < LEARN_WORDS_PER_ROUND; i++) {
      const w = pickWord(used, this.level.irregularRatio);
      used.add(w.word);
      this.learnQueue.push(w);
    }
    this.learnIndex = 0;
    this.spawnLearnMonster();
  }

  /** สร้างมอนสเตอร์คำถัดไป + ชุดตัวเลือก 3 มาตรา */
  private spawnLearnMonster(): void {
    const word = this.learnQueue[this.learnIndex];
    const m = new WalkerMonster(word, this.width + 40, this.height / 2 - 10);
    this.monsters = [m];
    this.disabledChoices = new Set();
    const { options, correctIndex } = buildChoices(word.matra, 3);
    this.choices = options;
    this.events.onChoices?.(options, correctIndex);
  }

  /** คำถัดไป หรือจบรอบเรียนรู้ */
  private nextLearnWord(): void {
    this.learnIndex += 1;
    if (this.learnIndex >= this.learnQueue.length) {
      this.events.onLearnDone?.();
      return;
    }
    this.spawnLearnMonster();
  }

  private update(dt: number): void {
    this.elapsed += dt;

    // ดาวเลื่อนซ้าย (ความรู้สึกยานกำลังบิน) + เอฟเฟกต์
    this.updateStars(dt);
    this.particles.update(dt);
    this.texts.update(dt);
    this.shake = Math.max(0, this.shake - dt * 2.2);
    this.muzzleFlash = Math.max(0, this.muzzleFlash - dt * 9);

    // โหมดเรียนรู้: มอนสเตอร์เดินมาหยุดกลางจอ → รอคำตอบ → เป็นมิตรจบ → คำถัดไป
    if (this.mode === 'learn') {
      const m = this.monsters[0];
      if (m) {
        m.update(dt, 1);
        if (m.state === 'walking' && m.x <= LEARN_STOP_X) {
          m.state = 'idle';
          m.stateTimer = 0;
        }
        if (m.state === 'escaped') {
          this.monsters = [];
          this.nextLearnWord();
        }
      }
      return;
    }

    // คลื่นมอนสเตอร์ (WaveManager — คาบตามด่านและเวลาในรอบ)
    this.spawnTimer -= dt;
    if (this.wave.shouldSpawn(dt, this.spawnTimer, this.monsters.length)) {
      this.spawnMonster();
      this.spawnTimer = this.wave.nextTimer(this.elapsed);
    }

    // อัปเดตมอนสเตอร์ — state machine อยู่ใน Monster.update (locality)
    const speed = effectiveSpeed(this.settingsMult, this.level.speedMult);
    for (const m of this.monsters) {
      m.update(dt, speed);
      if (m.state === 'walking' && m.x < BASE_X) {
        m.state = 'escaped';
        this.events.onEscape();
        this.shake = Math.min(this.shake + 0.9, 1.2);
        this.particles.burst(BASE_X, m.y, '#ff3b3b', 14, 150, 3, 0.5);
      }
    }
    this.monsters = this.monsters.filter((m) => m.state !== 'escaped');

    // กระสุน (บันทึกตำแหน่งก่อนหน้าไว้วาดหาง)
    for (const b of this.bullets) {
      b.px = b.x;
      b.py = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }

    // ชน
    for (const b of this.bullets) {
      const target = this.monsters.find(
        (m) =>
          (m.state === 'walking' || m.state === 'stunned') &&
          Math.hypot(b.x - m.x, b.y - m.y) < HIT_RADIUS,
      );
      if (target) {
        b.hit = true;
        const res = target.hit(b.matra);
        if (res.correct) {
          this.combo += 1;
          this.particles.burst(target.x, target.y, '#39ff14', 26, 250, 3.5, 0.7);
          this.particles.burst(target.x, target.y, MATRA_COLORS[target.word.matra], 16, 180, 3, 0.6);
          this.texts.add(`+${target.points}`, target.x, target.y - 34, '#ffd700', 24);
          this.shake = Math.min(this.shake + 0.4, 1);
          this.events.onCorrect(target.points, this.combo);
        } else {
          this.combo = 0;
          this.particles.burst(target.x, target.y, '#ff3b3b', 18, 200, 3, 0.55);
          this.texts.add('ผิด!', target.x, target.y - 34, '#ff3b3b', 22);
          this.shake = Math.min(this.shake + 0.7, 1.1);
          this.events.onWrong();
          this.events.onHint(buildHint(target, this.gentleMode));
        }
        break;
      }
    }

    this.bullets = this.bullets.filter(
      (b) => !b.hit && b.x > -20 && b.x < this.width + 20 && b.y > -20 && b.y < this.height + 20,
    );
  }

  private spawnMonster(): void {
    const exclude = new Set(this.monsters.map((m) => m.word.word));
    const word = pickWord(exclude, this.level.irregularRatio);
    this.monsters.push(this.wave.buildMonster(word, this.width, this.height));
  }

  private fire(): void {
    const dx = this.pointer.x - SHIP.x;
    const dy = this.pointer.y - SHIP.y;
    const len = Math.hypot(dx, dy) || 1;
    this.muzzleFlash = 1;
    this.particles.burst(SHIP.x, SHIP.y - 14, MATRA_COLORS[this.selectedMatra], 6, 130, 2.2, 0.3);
    this.bullets.push({
      x: SHIP.x,
      y: SHIP.y,
      px: SHIP.x,
      py: SHIP.y,
      vx: (dx / len) * BULLET_SPEED,
      vy: (dy / len) * BULLET_SPEED,
      matra: this.selectedMatra,
      hit: false,
    });
  }

  private makeStars(count: number, size: number, speed: number) {
    return Array.from({ length: count }, () => ({
      x: Math.random() * CANVAS_W,
      y: Math.random() * CANVAS_H,
      r: Math.random() * size * 0.7 + size * 0.3,
      s: speed * (0.6 + Math.random() * 0.8),
      tw: Math.random() * Math.PI * 2,
    }));
  }

  private updateStars(dt: number): void {
    for (const layer of [this.starsFar, this.starsNear]) {
      for (const s of layer) {
        s.x -= s.s * dt;
        if (s.x < -4) {
          s.x = CANVAS_W + 4;
          s.y = Math.random() * CANVAS_H;
        }
      }
    }
  }

  // ---------------------------------------------------------------- render

  private render(): void {
    const ctx = this.ctx;
    const t = this.elapsed;

    ctx.save();
    // จอสั่นเมื่อยิงผิด/โดนหลบหนี
    if (this.shake > 0) {
      ctx.translate((Math.random() - 0.5) * this.shake * 13, (Math.random() - 0.5) * this.shake * 13);
    }

    // พื้นหลัง (เผื่อขอบไว้นิดตอนสั่น)
    const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    bg.addColorStop(0, '#0b0f2a');
    bg.addColorStop(1, '#1a1140');
    ctx.fillStyle = bg;
    ctx.fillRect(-24, -24, CANVAS_W + 48, CANVAS_H + 48);

    // ดาว 2 ชั้น parallax + กะพริบ
    this.drawStars(ctx, this.starsFar, t, 0.75);
    this.drawStars(ctx, this.starsNear, t, 1);

    // พื้น
    ctx.fillStyle = '#0d1230';
    ctx.fillRect(0, CANVAS_H - 44, CANVAS_W, 44);
    ctx.fillStyle = 'rgba(0,229,255,0.35)';
    ctx.fillRect(0, CANVAS_H - 44, CANVAS_W, 2);

    // กระสุน (หางเรืองแสง)
    for (const b of this.bullets) {
      const col = MATRA_COLORS[b.matra];
      ctx.strokeStyle = col;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(b.px, b.py);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // มอนสเตอร์ + บัตรคำ
    for (const m of this.monsters) {
      this.sprite?.draw(ctx, m, m.x - MONSTER_W / 2, m.y - MONSTER_H / 2, MONSTER_W, MONSTER_H);
      this.drawWordCard(m);
    }

    // ยานผู้เล่น
    this.drawShip();

    // เอฟเฟกต์ (particle + ข้อความลอย + แฟลชปากกระบอก)
    this.particles.draw(ctx);
    this.texts.draw(ctx);
    if (this.muzzleFlash > 0) {
      ctx.globalAlpha = this.muzzleFlash * 0.55;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(SHIP.x, SHIP.y - 16, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  private drawStars(
    ctx: CanvasRenderingContext2D,
    stars: { x: number; y: number; r: number; tw: number }[],
    t: number,
    alpha: number,
  ): void {
    for (const s of stars) {
      const a = (0.35 + 0.65 * Math.abs(Math.sin(t * 1.4 + s.tw))) * alpha;
      ctx.globalAlpha = a;
      ctx.fillStyle = '#dfe6ff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawShip(): void {
    const ctx = this.ctx;
    const { x, y } = SHIP;
    const flick = 0.7 + 0.3 * Math.sin(this.elapsed * 42);

    // เปลวท้ายยาน (สั่นไหว) + ประกายไฟ
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#39ff14';
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 15);
    ctx.lineTo(x, y + 32 * flick + 6);
    ctx.lineTo(x + 8, y + 15);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffb703';
    ctx.beginPath();
    ctx.moveTo(x - 4, y + 16);
    ctx.lineTo(x, y + 19 * flick + 9);
    ctx.lineTo(x + 4, y + 16);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    if (Math.random() < 0.4) this.particles.emit(x, y + 20, '#39ff14');

    // ลำตัวยาน
    ctx.save();
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.moveTo(x, y - 26);
    ctx.lineTo(x + 22, y + 18);
    ctx.lineTo(x + 8, y + 14);
    ctx.lineTo(x, y + 24);
    ctx.lineTo(x - 8, y + 14);
    ctx.lineTo(x - 22, y + 18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#ff2e97';
    ctx.beginPath();
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x + 6, y + 2);
    ctx.lineTo(x - 6, y + 2);
    ctx.closePath();
    ctx.fill();
  }

  private drawWordCard(m: Monster): void {
    const ctx = this.ctx;
    const w = 116;
    const h = 34;
    const x = m.x - w / 2;
    const y = m.y - MONSTER_H / 2 - h - 8;

    // ตัวการันต์: ทำให้ตัวสะกดกะพริบ (docs/04-chapter-4-game-design.md ข้อ 4.5)
    const blink = Math.floor(this.elapsed * 3) % 2 === 0;

    ctx.fillStyle = 'rgba(20,26,61,0.95)';
    ctx.strokeStyle = MATRA_COLORS[m.word.matra];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 20px "Chakra Petch", "Prompt", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (m.word.matra === 'กา') {
      ctx.fillText(m.word.word, m.x, y + h / 2 + 1);
    } else {
      // แสดงคำโดยตัวสะกดเป็น "?" กะพริบ — ผู้เล่นต้องเดา/นึกมาตรา
      const stem = m.word.word.slice(0, -1);
      const display = blink ? `${stem}?` : m.word.word;
      ctx.fillText(display, m.x, y + h / 2 + 1);
      if (blink) {
        ctx.fillStyle = '#ffd700';
        ctx.fillText(m.word.word.slice(-1), m.x + 30, y + h / 2 + 1);
      }
    }
  }
}
