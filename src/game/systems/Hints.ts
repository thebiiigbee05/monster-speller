/**
 * ระบบคำใบ้เมื่อยิงผิด (game/systems — pure function)
 * ระดับคำใบ้ 1–4 (docs/04-chapter-4-game-design.md ข้อ 4.7):
 *   1 = "คำนี้ออกเสียงเหมือน ก สะกด"
 *   2 = ไม่ตรงมาตรา → บอกตัวสะกดจริง + มาตรา
 *   3 = เฉลยเต็ม
 *   โหมดผ่อนปรน (gentleMode) → ข้ามไปเฉลยเต็มทันที
 */
import type { Monster } from '../entities/Monster';
import { STD_FINAL } from '../constants';

export function buildHint(monster: Monster, gentleMode: boolean): string {
  const { word, hintLevel } = monster;
  if (gentleMode && hintLevel >= 1) {
    return `เฉลย: มาตรา ${word.matra} (ตัวสะกด "${word.finalConsonant}")`;
  }
  if (hintLevel >= 3) {
    return `เฉลย: มาตรา ${word.matra} (ตัวสะกด "${word.finalConsonant}")`;
  }
  if (word.matra === 'กา') {
    return 'คำนี้ไม่มีตัวสะกด (มาตรา กา)';
  }
  const std = STD_FINAL[word.matra];
  if (hintLevel >= 2 && !word.regular) {
    return `ตัวสะกด "${word.finalConsonant}" ออกเสียงเหมือน ${std} → มาตรา ${word.matra}`;
  }
  return `คำนี้ออกเสียงเหมือน ${std} สะกด`;
}
