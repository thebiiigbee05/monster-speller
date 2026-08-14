import { describe, expect, it } from 'vitest';
import { getWordBank, pickWord } from '../../src/content/words/wordBank';
import { MATRA_ORDER } from '../../src/game/types';

describe('wordBank.json (docs/03-chapter-3 ข้อ 3.4 — ธนาคารคำ 8 มาตรา)', () => {
  const words = getWordBank();

  it('มีอย่างน้อย 200 คำ', () => {
    expect(words.length).toBeGreaterThanOrEqual(200);
  });

  it('ครอบคลุมครบ 8 มาตรา', () => {
    const matras = new Set(words.map((w) => w.matra));
    for (const m of MATRA_ORDER) {
      expect(matras.has(m)).toBe(true);
    }
  });

  it('ทุกคำมีฟิลด์ครบ: word/finalConsonant/matra/regular/difficulty/source', () => {
    for (const w of words) {
      expect(w.word.length).toBeGreaterThan(0);
      expect(w.finalConsonant.length).toBeGreaterThan(0);
      expect(MATRA_ORDER).toContain(w.matra);
      expect(typeof w.regular).toBe('boolean');
      expect([1, 2, 3]).toContain(w.difficulty);
      expect(w.source.length).toBeGreaterThan(0);
    }
  });

  it('ไม่มีคำซ้ำกัน', () => {
    const seen = new Set<string>();
    for (const w of words) {
      expect(seen.has(w.word)).toBe(false);
      seen.add(w.word);
    }
  });

  it('คำในมาตรา กา ไม่มีตัวสะกด', () => {
    for (const w of words.filter((x) => x.matra === 'กา')) {
      expect(w.regular).toBe(true);
    }
  });

  it('pickWord สุ่มคำโดยไม่ซ้ำกับ exclude', () => {
    const w1 = pickWord(new Set());
    const w2 = pickWord(new Set([w1.word]));
    expect(w2.word).not.toBe(w1.word);
  });

  it('pickWord ยังคืนคำได้เมื่อ exclude เกือบหมด (ไม่ค้าง)', () => {
    const all = new Set(words.map((w) => w.word));
    // exclude ทุกคำยกเว้นคำแรก → ต้องได้คำแรก
    const first = words[0];
    const exceptFirst = new Set([...all].filter((x) => x !== first.word));
    const got = pickWord(exceptFirst);
    expect(got.word).toBe(first.word);
  });
});
