import { describe, expect, it } from 'vitest';
import { buildChoices, shuffle } from '../../src/game/systems/Options';
import { MATRA_ORDER, type Matra } from '../../src/game/types';

describe('Options (โหมดเรียนรู้ — เลือกมาตรา 1 จาก 3)', () => {
  it('มีตัวเลือก 3 มาตราเสมอ', () => {
    for (const m of MATRA_ORDER) {
      const { options } = buildChoices(m);
      expect(options).toHaveLength(3);
    }
  });

  it('ตัวเลือกถูกต้องอยู่ในชุดเสมอ', () => {
    for (const m of MATRA_ORDER) {
      const { options, correctIndex } = buildChoices(m);
      expect(options[correctIndex]).toBe(m);
      expect(options).toContain(m);
    }
  });

  it('ตัวลวงไม่ซ้ำกันและไม่ใช่คำตอบ', () => {
    for (const m of MATRA_ORDER) {
      const { options, correctIndex } = buildChoices(m);
      const distractors = options.filter((_, i) => i !== correctIndex);
      expect(new Set(distractors).size).toBe(2);
      expect(distractors).not.toContain(m);
    }
  });

  it('ตัวลวงไม่ซ้ำคำตอบและเป็นมาตราในระบบ', () => {
    const { options, correctIndex } = buildChoices('กด');
    const distractors = options.filter((_, i) => i !== correctIndex) as Matra[];
    expect(new Set(distractors).size).toBe(2);
    for (const d of distractors) {
      expect(MATRA_ORDER).toContain(d);
    }
  });

  it('shuffle คงสมาชิกครบและสลับลำดับได้', () => {
    const src = [1, 2, 3, 4, 5];
    const out = shuffle(src);
    expect(out).toHaveLength(src.length);
    expect([...out].sort()).toEqual([...src].sort());
    expect(src).toEqual([1, 2, 3, 4, 5]); // ไม่ mutate ต้นฉบับ
  });

  it('สุ่มหลายรอบ: ตัวเลือกถูกอยู่คนละตำแหน่งได้ (ไม่ยึดตำแหน่งตายตัว)', () => {
    const positions = new Set<number>();
    for (let i = 0; i < 60; i++) {
      const { correctIndex } = buildChoices('กก');
      positions.add(correctIndex);
    }
    // โอกาสสุ่ม 3 ตำแหน่งให้ครบทั้ง 3 ใน 60 รอบสูงมาก (ไม่ได้ assert ตายตัวเกินไป)
    expect(positions.size).toBeGreaterThan(1);
  });
});
