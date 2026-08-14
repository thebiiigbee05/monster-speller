import type { Matra } from './types';

/** ขนาดฉากภายใน (Canvas ถูก scale ตามจอ) */
export const CANVAS_W = 960;
export const CANVAS_H = 540;

/** ตำแหน่งยานผู้เล่น */
export const SHIP = { x: CANVAS_W / 2, y: CANVAS_H - 60 };

/** มอนสเตอร์ถึงฐาน (ขอบซ้าย) */
export const BASE_X = 70;

/** สีกระสุนตามมาตรา (docs/06-chapter-6-ui-ux-graphics.md) */
export const MATRA_COLORS: Record<Matra, string> = {
  กา: '#00e5ff',
  กก: '#39ff14',
  กด: '#ff2e97',
  กบ: '#ffb703',
  กน: '#a855f7',
  กม: '#2dd4bf',
  เกย: '#ff3b3b',
  เกอว: '#d97706',
};

/** เสียงมาตรฐานของแต่ละมาตรา (ใช้สร้างคำใบ้ — docs/04-chapter-4-game-design.md ข้อ 4.7) */
export const STD_FINAL: Record<Exclude<Matra, 'กา'>, string> = {
  กก: 'ก',
  กด: 'ด',
  กบ: 'บ',
  กน: 'น',
  กม: 'ม',
  เกย: 'ย',
  เกอว: 'ว',
};

/** ความเร็วกระสุน (px/วินาที) */
export const BULLET_SPEED = 700;

/** ระยะชนกระสุน-มอนสเตอร์ (เผื่อมอนสเตอร์เดินหนีระหว่างกระสุนลอย — ยิงให้อภัย เหมาะกับผู้เรียน ป.4-6) */
export const HIT_RADIUS = 60;

/** ขนาดสไปรต์ที่วาดบนฉาก (sheet เซลล์ 64 → ขยาย 1.5×) */
export const SPRITE_W = 96;
export const SPRITE_H = 96;

/** ขนาดมอนสเตอร์ที่วาดบนฉาก */
export const MONSTER_W = 108;
export const MONSTER_H = 108;

/** เวลาชะงักเมื่อยิงผิด (วิ) */
export const STUN_SECONDS = 2;

/** เวลาแอนิเมชันระเบิด (วิ) และระยะเป็นมิตรก่อนหาย (วิ) */
export const EXPLODE_SECONDS = 0.36;
export const FRIENDLY_SECONDS = 0.9;
