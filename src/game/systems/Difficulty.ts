/**
 * ระบบความยาก (game/systems — pure functions)
 * - เส้นโค้งการเกิดมอนสเตอร์: ถี่ขึ้นตามเวลาในรอบ (docs/04-chapter-4 ข้อ 4.9)
 * - ความเร็วสัมฤทธิ์ = ความเร็วจาก Settings × ตัวคูณระดับด่าน
 */
import type { Speed } from '../types';

/** ความเร็วจาก Modal Settings (docs/06-chapter-6 ข้อ 6.3) */
export const SETTINGS_SPEED: Record<Speed, number> = {
  slow: 0.7,
  normal: 1,
  fast: 1.4,
};

/** ความเร็วสัมฤทธิ์ของมอนสเตอร์ */
export function effectiveSpeed(settingsMult: number, levelMult: number): number {
  return settingsMult * levelMult;
}

/** คาบการเกิดมอนสเตอร์ (วิ) — ถี่ขึ้นตามเวลาในรอบ แต่อย่าต่ำกว่า min */
export function spawnIntervalAt(elapsed: number, base: number, min: number): number {
  return Math.max(min, base - elapsed * 0.01);
}
