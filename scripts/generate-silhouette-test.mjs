#!/usr/bin/env node
/**
 * สร้างภาพ Silhouette Test — เงาดำล้วนของมอนสเตอร์ 4 ชนิดเรียงเทียบกัน
 * (docs/15 · design/art ข้อ 3 — "จำได้จากเงาล้วน")
 *
 * เอาต์พุต:
 *   design/art/silhouette-test.png   (720×320 — 4 ช่อง 180×320, เงาดำบนขาว)
 *
 * วิธีรัน: node scripts/generate-silhouette-test.mjs
 * ใช้หลักการเดียวกับ generate-sprites.mjs (pngjs) แต่วาดเฉพาะเงาร่าง
 * ไม่มีรายละเอียดตา/ปาก/สี — ตรวจว่าเอกลักษณ์ (หนวด/ครีบ/หมุด/เขา) ยังเด่น
 */
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const CELL_W = 180;
const CELL_H = 320;
const COL = 0x0a0c1e; // เงาดำน้ำเงินเข้ม

const png = new PNG({ width: CELL_W * 4, height: CELL_H });
const data = png.data;

// พื้นขาว
for (let i = 0; i < data.length; i += 4) {
  data[i] = 245;
  data[i + 1] = 247;
  data[i + 2] = 252;
  data[i + 3] = 255;
}

function painter(ox) {
  // ox = ดัชนีช่อง (0..3) → พิกเซลจริง = ox * CELL_W
  const oxPx = ox * CELL_W;
  const set = (x, y) => {
    const gx = Math.round(x);
    const gy = Math.round(y);
    if (gx < 0 || gy < 0 || gx >= CELL_W || gy >= CELL_H) return;
    const idx = ((gy * png.width + (oxPx + gx)) << 2);
    data[idx] = COL >> 16 & 255;
    data[idx + 1] = COL >> 8 & 255;
    data[idx + 2] = COL & 255;
    data[idx + 3] = 255;
  };
  const ellipse = (cx, cy, rx, ry) => {
    const rxx = Math.max(0.4, rx);
    const ryy = Math.max(0.4, ry);
    for (let y = Math.floor(cy - ryy); y <= Math.ceil(cy + ryy); y++) {
      for (let x = Math.floor(cx - rxx); x <= Math.ceil(cx + rxx); x++) {
        const dx = (x - cx) / rxx;
        const dy = (y - cy) / ryy;
        if (dx * dx + dy * dy <= 1) set(x, y);
      }
    }
  };
  const rect = (x0, y0, x1, y1) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y);
  };
  const line = (x0, y0, x1, y1, w = 1) => {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      for (let wy = -Math.floor(w / 2); wy <= Math.floor(w / 2); wy++) {
        for (let wx = -Math.floor(w / 2); wx <= Math.floor(w / 2); wx++) set(x + wx, y + wy);
      }
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x += sx; }
      if (e2 <= dx) { err += dx; y += sy; }
    }
  };
  return { set, ellipse, rect, line };
}

// ฐาน (ground) — เส้นเดียวกันทุกช่อง
for (let ox = 0; ox < 4; ox++) {
  const p = painter(ox);
  p.line(24, CELL_H - 18, CELL_W - 24, CELL_H - 18, 3);
}

// ---------------------------------------------------------------- วอล์กเกอร์
{
  const p = painter(0);
  const cx = CELL_W / 2;
  const cy = 150;
  // หนวด 2 เส้นปลายกลม
  p.line(cx - 28, cy - 62, cx - 34, cy - 96, 4);
  p.line(cx + 28, cy - 62, cx + 34, cy - 96, 4);
  p.ellipse(cx - 34, cy - 100, 7, 7);
  p.ellipse(cx + 34, cy - 100, 7, 7);
  // ตัวกลมรี
  p.ellipse(cx, cy, 56, 64);
  // ขาสั้น 2 ขา
  p.ellipse(cx - 20, cy + 62, 14, 12);
  p.ellipse(cx + 20, cy + 62, 14, 12);
}

// ---------------------------------------------------------------- รันเนอร์
{
  const p = painter(1);
  const cx = CELL_W / 2;
  const cy = 150;
  // เอียง 15° — ใช้เลื่อนพิกัด x ตามความสูง
  const lean = (y) => (y - 120) * -0.18;
  // ครีบหลัง (โค้ง)
  p.ellipse(cx + 4 + lean(150), cy - 62, 12, 26);
  // ตัวเพรียวเอียง
  p.ellipse(cx + lean(cy), cy, 34, 74);
  // หางสั้นโค้ง
  p.line(cx - 20 + lean(150), cy + 30, cx - 44 + lean(150), cy + 14, 5);
  // ขา + รองเท้าขาวตัด (เงา = ขาเดียวกับตัว)
  p.ellipse(cx - 10 + lean(210), cy + 72, 10, 9);
  p.ellipse(cx + 14 + lean(210), cy + 72, 10, 9);
}

// ---------------------------------------------------------------- แทงก์
{
  const p = painter(2);
  const cx = CELL_W / 2;
  const cy = 158;
  // หมุดทอง 2 อันบนหัว
  p.rect(cx - 24, cy - 64, cx - 14, cy - 56);
  p.rect(cx + 14, cy + 8 - 72, cx + 24, cy + 16 - 72);
  p.rect(cx - 24, cy - 64, cx - 14, cy - 56);
  p.rect(cx + 14, cy - 64, cx + 24, cy - 56);
  // ตัวอ้วนกลมกว้างสุด
  p.ellipse(cx, cy, 62, 56);
  // ขาสั้นมาก เกือบติดพื้น
  p.ellipse(cx - 22, cy + 54, 12, 8);
  p.ellipse(cx + 22, cy + 54, 12, 8);
}

// ---------------------------------------------------------------- บอส
{
  const p = painter(3);
  const cx = CELL_W / 2;
  const cy = 140;
  // เขาทอง 2 เขาโค้งออก
  p.line(cx - 20, cy - 74, cx - 52, cy - 120, 7);
  p.line(cx + 20, cy - 74, cx + 52, cy - 120, 7);
  p.ellipse(cx - 56, cy - 124, 8, 8);
  p.ellipse(cx + 56, cy - 124, 8, 8);
  // ตัวใหญ่สุด (วงรีตั้ง)
  p.ellipse(cx, cy, 52, 72);
  // แขนสั้นหนา
  p.ellipse(cx - 54, cy + 16, 11, 22);
  p.ellipse(cx + 54, cy + 16, 11, 22);
  // ขาหนัก
  p.ellipse(cx - 20, cy + 68, 14, 12);
  p.ellipse(cx + 20, cy + 68, 14, 12);
  // หางสั้นหนา
  p.line(cx - 30, cy + 40, cx - 56, cy + 30, 8);
}

// ---------------------------------------------------------------- เขียนไฟล์
const outDir = path.resolve('design/art');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'silhouette-test.png');
fs.writeFileSync(outPath, PNG.sync.write(png));
console.log(`สร้างเสร็จ: ${outPath} (${png.width}×${png.height})`);
