import bank from './wordBank.json';
import type { WordEntry } from '../../game/types';

const WORDS = bank.words as WordEntry[];

/** คำทั้งหมดในธนาคาร */
export function getWordBank(): WordEntry[] {
  return WORDS;
}

/**
 * สุ่มคำที่ไม่ซ้ำกับคำที่ระบุ (exclude)
 * - irregularRatio (0–1): โอกาสได้คำไม่ตรงมาตรา (ใช้กับด่านสูง — docs/04-chapter-4 ข้อ 4.9)
 * - ถ้าเหลือน้อยจนไม่มีคำใหม่ จะสุ่มจากทั้งหมด (กันเกมค้าง)
 */
export function pickWord(excludeWords: ReadonlySet<string>, irregularRatio = 0): WordEntry {
  const pool = WORDS.filter((w) => !excludeWords.has(w.word));
  const source = pool.length > 0 ? pool : WORDS;

  if (irregularRatio > 0) {
    const irregular = source.filter((w) => !w.regular);
    if (irregular.length > 0 && Math.random() < irregularRatio) {
      return irregular[Math.floor(Math.random() * irregular.length)];
    }
  }
  return source[Math.floor(Math.random() * source.length)];
}
