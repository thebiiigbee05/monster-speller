/**
 * สร้างตัวเลือกมาตราในโหมดเรียนรู้ (game/systems — pure function)
 * หลักการ: แสดงตัวเลือกแค่ 3 มาตรา (ถูก 1 + ตัวลวง 2) แทน 8 มาตรา
 * → ลดภาระการตัดสินใจของผู้เรียน (อ้างอิงเกมเลือกคำตอบ: เจาะลูกโป่ง/กระทะเลือกชนิดคำ)
 */
import { MATRA_ORDER, type Matra } from '../types';

export interface ChoiceSet {
  options: Matra[];
  /** ตำแหน่ง (index) ของมาตราที่ถูกต้อง */
  correctIndex: number;
}

/** สุ่มสับลำดับอาร์เรย์ (Fisher–Yates) */
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * สร้างตัวเลือก 3 มาตรา: คำตอบที่ถูก + ตัวลวง 2 (สุ่มจากมาตราใกล้เคียงก่อน แล้วเติมจากที่เหลือ)
 */
export function buildChoices(correct: Matra, count = 3): ChoiceSet {
  const others = MATRA_ORDER.filter((m) => m !== correct);
  // ตัวลวง: มาตราเสียงใกล้เคียง (สะกดคล้ายกัน) ก่อน — ใช้ลำดับ MATRA_ORDER ไล่ข้าง
  const near = others.filter((m) => Math.abs(MATRA_ORDER.indexOf(m) - MATRA_ORDER.indexOf(correct)) <= 2);
  const distractors = shuffle(near.length >= 2 ? near : others).slice(0, count - 1);
  const options = shuffle([correct, ...distractors]);
  return { options, correctIndex: options.indexOf(correct) };
}
