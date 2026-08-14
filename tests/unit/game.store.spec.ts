import { describe, expect, it, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useGameStore } from '../../src/stores/game';
import { ROUND_SECONDS } from '../../src/game/types';

describe('game store (docs/10-chapter-10-testing-qa.md ข้อ 10.2)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('เริ่มรอบใหม่รีเซ็ตสถานะ', () => {
    const g = useGameStore();
    g.startRound();
    expect(g.status).toBe('playing');
    expect(g.score).toBe(0);
    expect(g.hp).toBe(3);
    expect(g.timeLeft).toBe(ROUND_SECONDS);
    expect(g.timeText).toBe('3:00');
  });

  it('เลือกกระสุนมาตราได้ทุกมาตรา', () => {
    const g = useGameStore();
    g.selectBullet('กด');
    expect(g.selectedMatra).toBe('กด');
    g.selectBullet('เกอว');
    expect(g.selectedMatra).toBe('เกอว');
  });

  it('tick ลดเวลาเฉพาะขณะกำลังเล่น', () => {
    const g = useGameStore();
    g.tick();
    expect(g.timeLeft).toBe(ROUND_SECONDS); // ยังไม่เริ่มเล่น → ไม่ลด

    g.startRound();
    g.tick();
    expect(g.timeLeft).toBe(ROUND_SECONDS - 1);
  });

  it('tick ไม่ลดเวลาเมื่อหมดเวลาแล้ว', () => {
    const g = useGameStore();
    g.startRound();
    g.timeLeft = 0;
    g.tick();
    expect(g.timeLeft).toBe(0);
  });

  it('กลับหน้าหลักได้', () => {
    const g = useGameStore();
    g.startRound();
    g.backToHub();
    expect(g.status).toBe('hub');
  });

  it('addScore บวกคะแนน + คอมโบ (โบนัส), registerWrong รีเซ็ตคอมโบ', () => {
    const g = useGameStore();
    g.startRound();
    g.addScore(100, 1); // คอมโบ 1 → โบนัส 10
    g.addScore(100, 2); // คอมโบ 2 → โบนัส 20
    expect(g.score).toBe(230);
    expect(g.combo).toBe(2);
    expect(g.bestCombo).toBe(2);
    expect(g.correctHits).toBe(2);

    g.registerWrong();
    expect(g.combo).toBe(0);
    expect(g.wrongHits).toBe(1);
  });

  it('registerEscape ลด HP และจบรอบเมื่อ HP=0', () => {
    const g = useGameStore();
    g.startRound();
    g.registerEscape();
    g.registerEscape();
    expect(g.hp).toBe(1);
    expect(g.status).toBe('playing');
    g.registerEscape();
    expect(g.hp).toBe(0);
    expect(g.status).toBe('roundEnd');
  });

  it('tick ถึง 0 → จบรอบอัตโนมัติ (สรุปคะแนน)', () => {
    const g = useGameStore();
    g.startRound();
    g.timeLeft = 1;
    g.tick();
    expect(g.timeLeft).toBe(0);
    expect(g.status).toBe('roundEnd');
  });
});
