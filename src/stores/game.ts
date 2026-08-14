import { defineStore } from 'pinia';
import { ROUND_SECONDS, type Matra } from '../game/types';
import { scoreForHit, verdictForScore } from '../game/systems/Scoring';
import { getLevel } from '../content/levels';

export type GameStatus = 'hub' | 'playing' | 'roundEnd';

interface GameState {
  status: GameStatus;
  score: number;
  hp: number;
  timeLeft: number;
  selectedMatra: Matra;
  level: number;
  combo: number;
  bestCombo: number;
  correctHits: number;
  wrongHits: number;
  escaped: number;
}

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    status: 'hub',
    score: 0,
    hp: 3,
    timeLeft: ROUND_SECONDS,
    selectedMatra: 'กก',
    level: 1,
    combo: 0,
    bestCombo: 0,
    correctHits: 0,
    wrongHits: 0,
    escaped: 0,
  }),

  getters: {
    /** แสดงเวลาแบบ มม:วว เช่น 3:00 */
    timeText(state): string {
      const m = Math.floor(state.timeLeft / 60);
      const s = state.timeLeft % 60;
      return `${m}:${String(s).padStart(2, '0')}`;
    },
    /** config ของด่านปัจจุบัน (content/levels) */
    levelConfig(state) {
      return getLevel(state.level);
    },
    /** ข้อความตัดสินตามคะแนน (game/systems/Scoring) */
    verdict(state): string {
      return verdictForScore(state.score);
    },
  },

  actions: {
    selectLevel(level: number) {
      this.level = level;
    },
    startRound() {
      this.status = 'playing';
      this.score = 0;
      this.hp = 3;
      this.timeLeft = ROUND_SECONDS;
      this.selectedMatra = 'กก';
      this.combo = 0;
      this.bestCombo = 0;
      this.correctHits = 0;
      this.wrongHits = 0;
      this.escaped = 0;
    },
    selectBullet(matra: Matra) {
      this.selectedMatra = matra;
    },
    /** ยิงถูก — คะแนน = แต้มมอนสเตอร์ + โบนัสคอมโบ (ระบบ Scoring) */
    addScore(points: number, combo: number) {
      this.score += scoreForHit(points, combo);
      this.combo = combo;
      this.bestCombo = Math.max(this.bestCombo, combo);
      this.correctHits += 1;
    },
    /** ยิงผิด — รีเซ็ตคอมโบ */
    registerWrong() {
      this.combo = 0;
      this.wrongHits += 1;
    },
    /** มอนสเตอร์หนีถึงฐาน — เสีย HP */
    registerEscape() {
      this.escaped += 1;
      if (this.status === 'playing') {
        this.hp = Math.max(0, this.hp - 1);
        if (this.hp === 0) this.endRound();
      }
    },
    /** เรียกทุก 1 วินาทีจาก GameScreen (docs/04-chapter-4-game-design.md — รอบ 3 นาที) */
    tick() {
      if (this.status === 'playing' && this.timeLeft > 0) {
        this.timeLeft -= 1;
        if (this.timeLeft === 0) this.endRound();
      }
    },
    /** จบรอบ (เวลาหมด / HP=0) — เปลี่ยนเป็นหน้าสรุป */
    endRound() {
      if (this.status !== 'playing') return;
      this.status = 'roundEnd';
    },
    backToHub() {
      this.status = 'hub';
    },
  },
});
