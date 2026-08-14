#!/usr/bin/env node
/**
 * สร้างภาพพื้นหลังอวกาศ (docs/06-chapter-6-ui-ux-graphics.md ข้อ 6.6)
 *
 * เอาต์พุต:
 *   public/assets/bg/space-bg.png   (960×540 — ขนาด Canvas เกม)
 *
 * องค์ประกอบ: ไล่เฉดอวกาศลึก + เนบิวลา 2 ก้อน + ดาวหลายชั้น
 *             + โลกสีน้ำเงิน (ขวาบน) + ดาวเคราะห์วงแหวน (ซ้ายล่าง) + ขอบฟ้านีออน
 * วิธีรัน: node scripts/generate-background.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const W = 960;
const H = 540;

const png = new PNG({ width: W, height: H });
const data = png.data;

function blend(x, y, col, a) {
  const i = (y * W + x) << 2;
  const da = data[i + 3] / 255;
  const outA = a + da * (1 - a);
  if (outA === 0) return;
  for (let c = 0; c < 3; c++) {
    data[i + c] = Math.round((col[c] * a + data[i + c] * da * (1 - a)) / outA);
  }
  data[i + 3] = Math.round(outA * 255);
}

// ---------------------------------------------------------------- rand seeded
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260814);

// ---------------------------------------------------------------- พื้นหลังไล่เฉด
for (let y = 0; y < H; y++) {
  const t = y / H;
  // #0b0f2a → #141238 → #1a1140 (ลึกขึ้นด้านล่าง)
  const r = Math.round(11 + (26 - 11) * t);
  const g = Math.round(15 + (17 - 15) * t);
  const b = Math.round(42 + (64 - 42) * t);
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) << 2;
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }
}

// ---------------------------------------------------------------- เนบิวลา
function drawNebula(cx, cy, radius, col, alpha, seed) {
  const r2 = mulberry32(seed);
  for (let y = Math.floor(cy - radius); y <= cy + radius; y++) {
    for (let x = Math.floor(cx - radius); x <= cx + radius; x++) {
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const dx = (x - cx) / radius;
      const dy = (y - cy) / radius;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 1) continue;
      const noise = r2();
      // ก้อนกลางแน่น + ขอบจาง + noise ปุย
      const falloff = Math.pow(1 - d, 2.2);
      const puff = falloff * (0.35 + 0.65 * noise);
      blend(x, y, col, puff * alpha);
    }
  }
}

drawNebula(150, 90, 240, [70, 40, 140], 0.16, 11);
drawNebula(830, 120, 190, [30, 90, 150], 0.13, 12);
drawNebula(620, 430, 220, [90, 30, 110], 0.11, 13);
drawNebula(330, 300, 150, [20, 60, 120], 0.09, 14);

// ---------------------------------------------------------------- ดาว
// ชั้นไกล: เล็ก + จาง
for (let i = 0; i < 210; i++) {
  const x = Math.floor(rnd() * W);
  const y = Math.floor(rnd() * (H - 60));
  const bright = 0.25 + rnd() * 0.6;
  const s = rnd();
  blend(x, y, [220, 228, 255], s < 0.7 ? 0.3 * bright : 0.65 * bright);
  if (s >= 0.93) {
    // ดาว 4 แฉกเล็ก
    blend(x, y - 1, [220, 228, 255], 0.4 * bright);
    blend(x, y + 1, [220, 228, 255], 0.4 * bright);
    blend(x - 1, y, [220, 228, 255], 0.4 * bright);
    blend(x + 1, y, [220, 228, 255], 0.4 * bright);
  }
}
// ชั้นใกล้: ใหญ่ + สว่าง + สีเหลือง/ฟ้า
for (let i = 0; i < 48; i++) {
  const x = Math.floor(rnd() * W);
  const y = Math.floor(rnd() * (H - 80));
  const pick = rnd();
  const col = pick < 0.6 ? [255, 255, 255] : pick < 0.8 ? [190, 225, 255] : [255, 236, 180];
  const bright = 0.55 + rnd() * 0.45;
  blend(x, y, col, bright);
  blend(x - 1, y, col, bright * 0.4);
  blend(x + 1, y, col, bright * 0.4);
  blend(x, y - 1, col, bright * 0.4);
  blend(x, y + 1, col, bright * 0.4);
}
// ดาวเด่น 4 แฉก (เรืองแสง) 3 ดวง
const sparkle = [
  { x: 120, y: 60, c: [255, 255, 255] },
  { x: 470, y: 130, c: [190, 225, 255] },
  { x: 860, y: 45, c: [255, 236, 180] },
];
for (const s of sparkle) {
  const glow = [s.c[0], s.c[1], s.c[2]];
  for (let r = 1; r <= 3; r++) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      blend(Math.round(s.x + Math.cos(a) * r * 3), Math.round(s.y + Math.sin(a) * r * 3), glow, 0.16 / r);
    }
  }
  blend(s.x, s.y, s.c, 1);
  blend(s.x, s.y - 1, s.c, 1);
  blend(s.x, s.y + 1, s.c, 1);
  blend(s.x - 1, s.y, s.c, 1);
  blend(s.x + 1, s.y, s.c, 1);
  blend(s.x - 2, s.y, s.c, 0.8);
  blend(s.x + 2, s.y, s.c, 0.8);
  blend(s.x, s.y - 2, s.c, 0.8);
  blend(s.x, s.y + 2, s.c, 0.8);
}

// ---------------------------------------------------------------- ดาวเคราะห์
/** ดาวเคราะห์กลม ไล่เฉด + เงานอก */
function drawPlanet(cx, cy, r, base, limb) {
  for (let y = Math.floor(cy - r); y <= cy + r; y++) {
    for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const dx = (x - cx) / r;
      const dy = (y - cy) / r;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 1) continue;
      // ไล่เฉด: สว่างซ้ายบน → เข้มขวาล่าง + ขอบมืด (limb darkening)
      const light = Math.max(0, (-dx + 1) / 2) * 0.45 + 0.28;
      const limbF = 1 - d * d * 0.45;
      const f = Math.max(0.15, Math.min(1, light * limbF));
      const col = [
        Math.round(base[0] * f + limb[0] * (1 - f)),
        Math.round(base[1] * f + limb[1] * (1 - f)),
        Math.round(base[2] * f + limb[2] * (1 - f)),
      ];
      blend(x, y, col, 1);
    }
  }
}

// โลก (ขวาบน): น้ำเงิน + ทวีปเขียว + เมฆขาว
const EARTH = { x: 812, y: 112, r: 78 };
drawPlanet(EARTH.x, EARTH.y, EARTH.r, [36, 92, 168], [8, 20, 52]);
const landR = mulberry32(21);
for (let i = 0; i < 46; i++) {
  const a = landR() * Math.PI * 2;
  const rr = Math.sqrt(landR()) * EARTH.r * 0.82;
  const lx = Math.round(EARTH.x + Math.cos(a) * rr);
  const ly = Math.round(EARTH.y + Math.sin(a) * rr * 0.82);
  const lr = 6 + landR() * 12;
  for (let y = -3; y <= 3; y++) {
    for (let x = -3; x <= 3; x++) {
      const d = Math.sqrt(x * x + y * y);
      if (d > lr / 2) continue;
      const noise = landR();
      if (noise < 0.45) blend(lx + x, ly + y, [44, 140, 92], 0.95);
      else blend(lx + x, ly + y, [34, 110, 74], 0.9);
    }
  }
}
const cloudR = mulberry32(22);
for (let i = 0; i < 20; i++) {
  const a = cloudR() * Math.PI * 2;
  const rr = Math.sqrt(cloudR()) * EARTH.r * 0.88;
  const cx = Math.round(EARTH.x + Math.cos(a) * rr);
  const cy = Math.round(EARTH.y + Math.sin(a) * rr * 0.8);
  for (let y = -2; y <= 2; y++) {
    for (let x = -3; x <= 3; x++) {
      if (x * x + y * y > 9) continue;
      blend(cx + x, cy + y, [235, 244, 255], cloudR() * 0.5 + 0.3);
    }
  }
}

// ดาวเคราะห์วงแหวน (ซ้ายล่าง)
const RING = { x: 180, y: 410, r: 62 };
drawPlanet(RING.x, RING.y, RING.r, [150, 90, 170], [40, 18, 62]);
const ringR = mulberry32(23);
for (let i = 0; i < 2600; i++) {
  const a = ringR() * Math.PI * 2;
  const rr = RING.r * (1.18 + ringR() * 0.5);
  const px = Math.round(RING.x + Math.cos(a) * rr);
  const py = Math.round(RING.y + Math.sin(a) * rr * 0.34);
  if (px < 0 || py < 0 || px >= W || py >= H) continue;
  // วงแหวนด้านหน้า (ใต้ดาว) ถูกบัง — ใช้ระดับความเอียงแยกหน้า/หลัง
  const behind = Math.sin(a) > 0; // ครึ่งบน (หลังดาว)
  if (behind) continue;
  const pick = ringR();
  const col = pick < 0.5 ? [196, 150, 210] : pick < 0.8 ? [150, 110, 170] : [230, 200, 240];
  blend(px, py, col, 0.75);
}
// ครึ่งหลังของวงแหวน (วาดก่อนหน้า เพื่อให้ดาวทับ)
for (let i = 0; i < 2600; i++) {
  const a = ringR() * Math.PI * 2;
  const rr = RING.r * (1.18 + ringR() * 0.5);
  const px = Math.round(RING.x + Math.cos(a) * rr);
  const py = Math.round(RING.y + Math.sin(a) * rr * 0.34);
  if (px < 0 || py < 0 || px >= W || py >= H) continue;
  const behind = Math.sin(a) > 0;
  if (!behind) continue;
  const pick = ringR();
  const col = pick < 0.5 ? [180, 138, 196] : pick < 0.8 ? [140, 100, 160] : [215, 185, 225];
  blend(px, py, col, 0.6);
}
// เงาดาวเคราะห์ทับวงแหวนหลัง
for (let y = Math.floor(RING.y - RING.r); y <= RING.y + RING.r; y++) {
  for (let x = Math.floor(RING.x - RING.r); x <= RING.x + RING.r; x++) {
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const dx = (x - RING.x) / RING.r;
    const dy = (y - RING.y) / RING.r;
    if (dx * dx + dy * dy <= 1) {
      blend(x, y, [150, 90, 170], 0.4); // ทำให้วงแหวนหลังดูจางลงข้างหลังดาว
    }
  }
}

// ดวงจันทร์เล็ก (กลาง)
drawPlanet(505, 210, 26, [205, 208, 220], [90, 92, 110]);
// หลุมอุกกาบาต
const moonR = mulberry32(24);
for (let i = 0; i < 7; i++) {
  const a = moonR() * Math.PI * 2;
  const rr = Math.sqrt(moonR()) * 18;
  const mx = Math.round(505 + Math.cos(a) * rr);
  const my = Math.round(210 + Math.sin(a) * rr * 0.9);
  for (let y = -1; y <= 1; y++) {
    for (let x = -1; x <= 1; x++) {
      blend(mx + x, my + y, [150, 153, 168], 0.5);
    }
  }
}

// ---------------------------------------------------------------- ขอบฟ้า (พื้น)
for (let y = H - 44; y < H; y++) {
  const t = (y - (H - 44)) / 44;
  const r = Math.round(13 - 6 * t);
  const g = Math.round(18 - 6 * t);
  const b = Math.round(48 - 16 * t);
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) << 2;
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }
}
// เส้นนีออนขอบบน
for (let x = 0; x < W; x++) {
  const pulse = 0.55 + 0.25 * Math.sin(x / 34);
  blend(x, H - 45, [0, 229, 255], pulse);
  blend(x, H - 44, [0, 229, 255], pulse * 0.5);
}

// ---------------------------------------------------------------- เขียนไฟล์
const outDir = path.resolve('public/assets/bg');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'space-bg.png');
fs.writeFileSync(outPath, PNG.sync.write(png));
console.log(`สร้างเสร็จ: ${outPath} (${W}×${H})`);
