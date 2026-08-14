/**
 * ตรรกะคะแนน/คอมโบ (game/systems — pure functions)
 * ใช้จากทั้ง store และเทส โดยไม่ต้องมี Vue
 * อ้างอิง docs/04-chapter-4-game-design.md ข้อ 4.8 (รางวัล/คะแนน)
 */

/** โบนัสคอมโบ: ยิงติดต่อกันมากสุด ×10 (คอมโบ 10 = +100) */
export function comboBonus(combo: number): number {
  return Math.min(combo, 10) * 10;
}

/** คะแนนรวมเมื่อยิงถูก 1 ครั้ง = ค่ามอนสเตอร์ + โบนัสคอมโบ */
export function scoreForHit(points: number, combo: number): number {
  return points + comboBonus(combo);
}

/** ระดับคำตัดสินตามคะแนน (ใช้กับหน้าสรุป/ Hall of Fame) */
export function verdictForScore(score: number): string {
  if (score >= 5000) return '🏅 ยอดเยี่ยม! พิทักษ์โลกได้อย่างสมบูรณ์';
  if (score >= 2500) return '👍 เก่งมาก ฝึกอีกนิดก็สมบูรณ์แบบ';
  return '💪 สู้ต่อ! เปิดบทเรียนมาตราแล้วกลับมาใหม่';
}
