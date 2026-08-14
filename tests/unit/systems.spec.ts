import { describe, expect, it, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { comboBonus, scoreForHit, verdictForScore } from '../../src/game/systems/Scoring';
import { SETTINGS_SPEED, effectiveSpeed, spawnIntervalAt } from '../../src/game/systems/Difficulty';
import { LEVELS, getLevel } from '../../src/content/levels';
import { useHallOfFameStore } from '../../src/stores/hallOfFame';
import { setStorageBackend } from '../../src/services/storage';

describe('Scoring (game/systems)', () => {
  it('คอมโบโบนัส: ×10 ต่อคอมโบ สูงสุดคอมโบ 10', () => {
    expect(comboBonus(1)).toBe(10);
    expect(comboBonus(5)).toBe(50);
    expect(comboBonus(10)).toBe(100);
    expect(comboBonus(99)).toBe(100); // cap
  });

  it('scoreForHit = แต้มมอนสเตอร์ + โบนัสคอมโบ', () => {
    expect(scoreForHit(100, 1)).toBe(110);
    expect(scoreForHit(150, 2)).toBe(170);
  });

  it('verdict แบ่งตามช่วงคะแนน', () => {
    expect(verdictForScore(6000)).toContain('ยอดเยี่ยม');
    expect(verdictForScore(3000)).toContain('เก่งมาก');
    expect(verdictForScore(500)).toContain('สู้ต่อ');
  });
});

describe('Difficulty (game/systems)', () => {
  it('ความเร็วจาก Settings: ช้า/ปกติ/เร็ว', () => {
    expect(SETTINGS_SPEED.slow).toBeLessThan(1);
    expect(SETTINGS_SPEED.normal).toBe(1);
    expect(SETTINGS_SPEED.fast).toBeGreaterThan(1);
  });

  it('ความเร็วสัมฤทธิ์ = settings × ระดับด่าน', () => {
    expect(effectiveSpeed(1, 1)).toBe(1);
    expect(effectiveSpeed(1.4, 1.6)).toBeCloseTo(2.24);
  });

  it('คาบการเกิดถี่ขึ้นตามเวลา แต่ไม่ต่ำกว่า min', () => {
    expect(spawnIntervalAt(0, 2.5, 1.2)).toBe(2.5);
    expect(spawnIntervalAt(100, 2.5, 1.2)).toBeLessThan(2.5);
    expect(spawnIntervalAt(10000, 2.5, 1.2)).toBe(1.2); // clamp
  });
});

describe('Levels (content)', () => {
  it('มี 8 ด่าน ครบ 1–8', () => {
    expect(LEVELS).toHaveLength(8);
    LEVELS.forEach((l, i) => expect(l.id).toBe(i + 1));
  });

  it('ด่านสูงขึ้น: เร็วขึ้น + ไม่ตรงมาตรามากขึ้น + คลื่นถี่ขึ้น', () => {
    for (let i = 1; i < LEVELS.length; i += 1) {
      expect(LEVELS[i].speedMult).toBeGreaterThanOrEqual(LEVELS[i - 1].speedMult);
      expect(LEVELS[i].irregularRatio).toBeGreaterThanOrEqual(LEVELS[i - 1].irregularRatio);
      expect(LEVELS[i].spawnBase).toBeLessThanOrEqual(LEVELS[i - 1].spawnBase);
    }
  });

  it('getLevel กันค่าเกิน/ต่ำกว่า (clamp)', () => {
    expect(getLevel(0).id).toBe(1);
    expect(getLevel(99).id).toBe(8);
    expect(getLevel(3).id).toBe(3);
  });

  it('ด่าน 4 และ 8 มีบอส', () => {
    expect(getLevel(4).boss).toBe(true);
    expect(getLevel(8).boss).toBe(true);
  });
});

describe('Hall of Fame store (ผ่าน services/storage)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    // backend ใหม่ทุกเทส (memory) → ไม่ติดกันระหว่างเทส
    const store = new Map<string, string>();
    setStorageBackend({
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => {
        store.set(k, v);
      },
      removeItem: (k) => {
        store.delete(k);
      },
    });
  });

  it('เริ่มต้นว่าง และคะแนน > 0 ติดท็อป 10', () => {
    const h = useHallOfFameStore();
    expect(h.entries).toHaveLength(0);
    expect(h.qualifies(0)).toBe(false);
    expect(h.qualifies(100)).toBe(true);
  });

  it('addEntry เรียงคะแนนมากไปน้อย + ตัดเหลือ 10 + คืนอันดับ', () => {
    const h = useHallOfFameStore();
    expect(h.addEntry({ name: 'A', score: 500, correctHits: 5, wrongHits: 0, level: 1 })).toBe(1);
    expect(h.addEntry({ name: 'B', score: 900, correctHits: 9, wrongHits: 1, level: 2 })).toBe(1);
    expect(h.entries[0].name).toBe('B');
    expect(h.entries[1].name).toBe('A');
  });

  it('เมื่อเต็ม 10 คะแนนต่ำกว่าอันดับสุดท้ายไม่ติด', () => {
    const h = useHallOfFameStore();
    for (let i = 0; i < 10; i += 1) {
      h.addEntry({ name: `P${i}`, score: 1000 - i * 10, correctHits: 1, wrongHits: 0, level: 1 });
    }
    expect(h.entries).toHaveLength(10);
    expect(h.qualifies(500)).toBe(false);
    expect(h.qualifies(950)).toBe(true);
    expect(h.addEntry({ name: 'X', score: 500, correctHits: 1, wrongHits: 0, level: 1 })).toBeNull();
  });
});
