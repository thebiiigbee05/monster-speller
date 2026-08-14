import { describe, expect, it } from 'vitest';
import { WalkerMonster, RunnerMonster, TankMonster } from '../../src/game/entities/Monster';
import { STUN_SECONDS, EXPLODE_SECONDS, FRIENDLY_SECONDS } from '../../src/game/constants';
import type { WordEntry } from '../../src/game/types';

// คำตัวอย่าง (ตรวจจาก wordBank แล้ว): "รัก" = แม่กก ตรงมาตรา, "กบ" = แม่กบ ตรงมาตรา
const WORD_KK: WordEntry = {
  id: 't1',
  word: 'รัก',
  finalConsonant: 'ก',
  matra: 'กก',
  regular: true,
  difficulty: 1,
  source: 'test',
};
const WORD_KB: WordEntry = {
  id: 't2',
  word: 'กบ',
  finalConsonant: 'บ',
  matra: 'กบ',
  regular: true,
  difficulty: 1,
  source: 'test',
};

describe('Monster OOP (docs/07-chapter-7 ข้อ 7.3 + docs/10-chapter-10 ข้อ 10.2)', () => {
  it('มอนสเตอร์แต่ละชนิดมีความเร็ว/คะแนน/สไปรต์ต่างกัน', () => {
    const walker = new WalkerMonster(WORD_KK, 0, 0);
    const runner = new RunnerMonster(WORD_KK, 0, 0);
    const tank = new TankMonster(WORD_KK, 0, 0);
    expect(runner.speed).toBeGreaterThan(walker.speed);
    expect(runner.points).toBeGreaterThan(walker.points);
    expect(tank.points).toBeGreaterThan(runner.points);
    expect(walker.spriteId).toBe('walker');
    expect(runner.spriteId).toBe('runner');
    expect(tank.spriteId).toBe('tank');
  });

  it('ยิงกระสุนมาตราไม่ตรง → ชะงัก + คำใบ้ระดับถัดไป ไม่ได้คะแนน', () => {
    const m = new WalkerMonster(WORD_KK, 100, 100);
    const res = m.hit('กบ');
    expect(res.correct).toBe(false);
    expect(res.hintLevel).toBe(1);
    expect(m.state).toBe('stunned');

    // ชะงักครบเวลา → เดินต่อ
    m.update(STUN_SECONDS + 0.01, 1);
    expect(m.state).toBe('walking');
  });

  it('ยิงผิดซ้ำ 4 ครั้ง → คำใบ้ระดับสูงสุดที่ 3 (ไม่เกินขีดจำกัด)', () => {
    const m = new WalkerMonster(WORD_KK, 100, 100);
    m.hit('กบ');
    m.hit('กด');
    m.hit('กน');
    m.hit('กม');
    expect(m.hintLevel).toBe(3);
  });

  it('ยิงถูกมาตรา → ระเบิด → เป็นมิตร → หนีออกจากฉาก', () => {
    const m = new WalkerMonster(WORD_KK, 100, 100);
    const res = m.hit('กก');
    expect(res.correct).toBe(true);
    expect(m.state).toBe('exploding');

    m.update(EXPLODE_SECONDS + 0.01, 1);
    expect(m.state).toBe('friendly');

    m.update(FRIENDLY_SECONDS + 0.01, 1);
    expect(m.state).toBe('escaped');
  });

  it('ยิงมอนสเตอร์ที่ระเบิดอยู่แล้ว → ไม่มีผล (ไม่เปลี่ยนสถานะ)', () => {
    const m = new WalkerMonster(WORD_KK, 100, 100);
    m.hit('กก'); // ระเบิด
    const res = m.hit('กก');
    expect(res.correct).toBe(false);
    expect(m.state).toBe('exploding');
  });

  it('เดินช้าลงเมื่อโดนคำสั่ง speedMultiplier (Settings ความเร็ว)', () => {
    const m = new WalkerMonster(WORD_KK, 1000, 100);
    m.update(1, 2); // ความเร็ว x2
    expect(m.x).toBe(1000 - m.speed * 2);
  });

  it('เฟรมแอนิเมชัน: เดินวน walk1→4, ตะลึง stun, ระเบิด explode1→2→3, เป็นมิตร friendly1/2', () => {
    const m = new WalkerMonster(WORD_KK, 100, 100);
    // walk cycle 4 เฟรม (0.3 วิ/เฟรม)
    const seen = new Set([m.frameName()]);
    for (let i = 0; i < 4; i += 1) {
      m.update(0.31, 1);
      seen.add(m.frameName());
    }
    expect([...seen].sort()).toEqual(['walk1', 'walk2', 'walk3', 'walk4']);

    // ยิงผิด → ตะลึง (เฟรม stun)
    m.hit('กบ');
    expect(m.frameName()).toBe('stun');

    // ยิงถูก → ระเบิด explode1→2→3
    m.update(2.1, 1); // เลิกชะงัก
    m.hit('กก');
    expect(m.frameName()).toBe('explode1');
    m.stateTimer = 0.13;
    expect(m.frameName()).toBe('explode2');
    m.stateTimer = 0.25;
    expect(m.frameName()).toBe('explode3');

    // เป็นมิตร → สลับ friendly1/friendly2
    m.update(0.2, 1);
    expect(['friendly1', 'friendly2']).toContain(m.frameName());
  });

  it('คำไม่ตรงมาตรา (ไม่ตรง) เก็บ flag regular ตาม wordBank', () => {
    const m = new WalkerMonster({ ...WORD_KK, regular: false }, 100, 100);
    expect(m.word.regular).toBe(false);
  });

  it('WORD_KB ตัวอย่างใช้ในเทส — มาตรา กบ ตรง', () => {
    expect(WORD_KB.matra).toBe('กบ');
  });
});
