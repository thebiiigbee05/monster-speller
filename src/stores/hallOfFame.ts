/**
 * Hall of Fame (stores/ — ผ่าน services/storage)
 * บันทึก 10 อันดับลง localStorage (docs/04-chapter-4-game-design.md ข้อ 4.8)
 * และ Docs/Dev ระบุ Modal Hall of Fame 10 อันดับ
 */
import { defineStore } from 'pinia';
import { loadJSON, saveJSON } from '../services/storage';

export interface HofEntry {
  name: string;
  score: number;
  correctHits: number;
  wrongHits: number;
  level: number;
  date: string;
}

const KEY = 'monster-speller:hall-of-fame';
const MAX_ENTRIES = 10;

export const useHallOfFameStore = defineStore('hallOfFame', {
  state: () => ({
    entries: loadJSON<HofEntry[]>(KEY, []),
  }),

  getters: {
    /** คะแนนนี้ติดท็อป 10 ได้หรือไม่ (ต้อง > 0 และ ดีกว่า/เท่าอันดับสุดท้าย) */
    qualifies: (state) => (score: number): boolean => {
      if (score <= 0) return false;
      if (state.entries.length < MAX_ENTRIES) return true;
      const last = state.entries[state.entries.length - 1];
      return score > last.score;
    },
  },

  actions: {
    /** เพิ่มคะแนน → เรียงใหม่ → ตัดเหลือ 10 → บันทึก คืนอันดับ (1-10) หรือ null ถ้าไม่ติด */
    addEntry(entry: Omit<HofEntry, 'date'>): number | null {
      if (!this.qualifies(entry.score)) return null;
      const full: HofEntry = { ...entry, date: new Date().toISOString() };
      this.entries = [...this.entries, full]
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_ENTRIES);
      saveJSON(KEY, this.entries);
      return this.entries.findIndex((e) => e.date === full.date) + 1;
    },

    reset(): void {
      this.entries = [];
      saveJSON(KEY, this.entries);
    },
  },
});
