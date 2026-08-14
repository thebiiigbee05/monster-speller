/** ยูทิลิตี้คณิตศาสตร์พื้นฐาน (core/) */

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
