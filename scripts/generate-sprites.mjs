#!/usr/bin/env node
/**
 * สร้าง Sprite sheet มอนสเตอร์ (pixel-art คุณภาพสูง) — docs/06-chapter-6-ui-ux-graphics.md ข้อ 6.6
 *
 * เอาต์พุต:
 *   public/assets/sprites/monsters-sheet.png   (640×256 — 4 แถว × 10 คอลัมน์, เซลล์ 64×64)
 *   public/assets/sprites/monsters-sheet.json  (manifest: ตำแหน่งเฟรม สำหรับ Canvas)
 *
 * เฟรมต่อมอนสเตอร์: walk1..walk4 (เดิน 4 เฟรม) → stun (ตะลึง) → explode1..3 → friendly1..2
 * วาดที่กริด 32×32 แล้ว scale ×2 (nearest-neighbor) → 64×64
 * วิธีรัน: node scripts/generate-sprites.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const GRID = 32;
const SCALE = 2;
const CELL = GRID * SCALE;
const COLS = 10;
const ROWS = 4;
const FRAMES = ['walk1', 'walk2', 'walk3', 'walk4', 'stun', 'explode1', 'explode2', 'explode3', 'friendly1', 'friendly2'];

// ---------------------------------------------------------------- สี

function shade([r, g, b], f) {
  const t = f < 0 ? 0 : f > 1 ? 1 : f;
  return [Math.round(r * t), Math.round(g * t), Math.round(b * t), 255];
}
function mix([r1, g1, b1], [r2, g2, b2], f) {
  return [Math.round(r1 + (r2 - r1) * f), Math.round(g1 + (g2 - g1) * f), Math.round(b1 + (b2 - b1) * f), 255];
}

function makePalette(base) {
  return {
    outline: shade(base, 0.32),
    darkest: shade(base, 0.52),
    dark: shade(base, 0.72),
    base,
    light: mix(base, [255, 255, 255], 0.34),
    highlight: mix(base, [255, 255, 255], 0.62),
    belly: mix(base, [255, 255, 255], 0.5),
    eyeWhite: [240, 248, 255, 255],
    pupil: [10, 12, 30, 255],
    eyeGlow: [255, 255, 255, 255],
    accent: [255, 215, 0, 255],
    blush: [255, 130, 160, 255],
    tongue: [255, 90, 120, 255],
  };
}

// ---------------------------------------------------------------- painter

function makePainter(png, ox, oy) {
  const setPx = (x, y, col) => {
    const gx = Math.round(x);
    const gy = Math.round(y);
    if (gx < 0 || gy < 0 || gx >= GRID || gy >= GRID) return;
    for (let sy = 0; sy < SCALE; sy++) {
      for (let sx = 0; sx < SCALE; sx++) {
        const px = ox + gx * SCALE + sx;
        const py = oy + gy * SCALE + sy;
        const idx = (py * png.width + px) << 2;
        png.data[idx] = col[0];
        png.data[idx + 1] = col[1];
        png.data[idx + 2] = col[2];
        png.data[idx + 3] = col[3] ?? 255;
      }
    }
  };
  const fillEllipse = (cx, cy, rx, ry, col) => {
    const rxx = Math.max(0, rx - 0.5);
    const ryy = Math.max(0, ry - 0.5);
    for (let y = Math.floor(cy - ryy); y <= Math.ceil(cy + ryy); y++) {
      for (let x = Math.floor(cx - rxx); x <= Math.ceil(cx + rxx); x++) {
        const dx = (x - cx) / (rxx || 1);
        const dy = (y - cy) / (ryy || 1);
        if (dx * dx + dy * dy <= 1) setPx(x, y, col);
      }
    }
  };
  const fillRect = (x0, y0, x1, y1, col) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) setPx(x, y, col);
  };
  const line = (x0, y0, x1, y1, col) => {
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
      setPx(x, y, col);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x += sx; }
      if (e2 <= dx) { err += dx; y += sy; }
    }
  };
  // ดาว 4 แฉก
  const star = (cx, cy, col) => {
    setPx(cx, cy, col);
    setPx(cx, cy - 1, col);
    setPx(cx, cy + 1, col);
    setPx(cx - 1, cy, col);
    setPx(cx + 1, cy, col);
    setPx(cx - 1, cy - 1, col);
    setPx(cx + 1, cy - 1, col);
    setPx(cx - 1, cy + 1, col);
    setPx(cx + 1, cy + 1, col);
  };
  return { setPx, fillEllipse, fillRect, line, star };
}

// ---------------------------------------------------------------- ตัวมอนสเตอร์

const MONSTERS = [
  { id: 'walker', name: 'Walker (แม่กก)', color: [57, 255, 20], shape: { cx: 16, cy: 17, rx: 8, ry: 10 }, eyes: 'round2', mouth: 'o', antenna: 'two' },
  { id: 'runner', name: 'Runner (แม่กด)', color: [255, 46, 151], shape: { cx: 16, cy: 16, rx: 7, ry: 11 }, eyes: 'triple', mouth: 'grin', antenna: 'fin', lean: 1 },
  { id: 'tank', name: 'Tank (แม่กบ)', color: [168, 85, 247], shape: { cx: 16, cy: 17, rx: 10, ry: 9 }, eyes: 'sleepy', mouth: 'flat', antenna: 'studs' },
  { id: 'boss', name: 'Boss (แม่กน)', color: [255, 59, 59], shape: { cx: 16, cy: 16, rx: 9, ry: 11 }, eyes: 'angry', mouth: 'teeth', antenna: 'horns' },
];

function drawBody(p, pal, cfg, opts) {
  const { cx, cy, rx, ry } = cfg.shape;
  const bob = opts.bob ?? 0;
  const lean = (cfg.lean ?? 0) * (opts.leanSign ?? 1);
  const bodyCx = cx + lean;
  const bodyCy = cy + bob;

  // เงาน้อยใต้ตัว
  p.fillEllipse(bodyCx, bodyCy + ry + 2, rx * 0.85, 1.6, pal.outline);

  // โครงร่าง (silhouette)
  p.fillEllipse(bodyCx, bodyCy, rx + 1.2, ry + 1.2, pal.outline);

  // ตัวไล่เฉด (บนสว่าง → ล่างเข้ม) ให้ความรู้สึก 3D
  for (let y = Math.floor(bodyCy - ry); y <= Math.ceil(bodyCy + ry); y++) {
    const t = (y - (bodyCy - ry)) / (ry * 2);
    const col = t < 0.3 ? pal.light : t < 0.62 ? pal.base : t < 0.86 ? pal.dark : pal.darkest;
    const half = rx * Math.sqrt(Math.max(0, 1 - ((y - bodyCy) / ry) ** 2));
    for (let x = Math.floor(bodyCx - half); x <= Math.ceil(bodyCx + half); x++) p.setPx(x, y, col);
  }

  // ท้องสีอ่อน
  p.fillEllipse(bodyCx, bodyCy + ry * 0.38, rx * 0.5, ry * 0.32, pal.belly);

  // ไฮไลต์มุมบนซ้าย
  p.fillEllipse(bodyCx - rx * 0.32, bodyCy - ry * 0.44, rx * 0.26, ry * 0.2, pal.highlight);

  return { bodyCx, bodyCy };
}

function drawEyes(p, pal, cfg, opts, bodyCx, bodyCy) {
  const ey = bodyCy - 3;
  const blink = opts.blink;
  const stun = opts.stun;
  const eye = (ex, r) => {
    if (stun) {
      p.line(ex - 1.4, ey - 1.4, ex + 1.4, ey + 1.4, pal.pupil);
      p.line(ex + 1.4, ey - 1.4, ex - 1.4, ey + 1.4, pal.pupil);
      return;
    }
    if (blink) {
      p.line(ex - 2, ey, ex + 2, ey, pal.pupil);
      return;
    }
    p.fillEllipse(ex, ey, 2.2, 2.2, pal.eyeWhite);
    p.fillEllipse(ex, ey, 1.1, 1.1, pal.pupil);
    p.setPx(ex - 0.6, ey - 0.6, pal.eyeGlow);
  };
  const brow = (ex, dx) => p.line(ex - 2 + dx, ey - 3.6, ex + 2 + dx, ey - 3.6, pal.pupil);

  switch (cfg.eyes) {
    case 'round2':
      eye(bodyCx - 4, 1);
      eye(bodyCx + 4, 1);
      break;
    case 'triple':
      eye(bodyCx - 5, 0.9);
      eye(bodyCx, 0.9);
      eye(bodyCx + 5, 0.9);
      break;
    case 'sleepy': {
      // ตาปิดครึ่ง (เปลือกตาลง)
      p.fillEllipse(bodyCx - 3.4, ey + 0.8, 1.9, 1.9, pal.eyeWhite);
      p.fillEllipse(bodyCx + 3.4, ey + 0.8, 1.9, 1.9, pal.eyeWhite);
      p.fillRect(Math.round(bodyCx - 5.4), Math.round(ey - 1), Math.round(bodyCx - 1.4), Math.round(ey + 1), pal.base);
      p.fillRect(Math.round(bodyCx + 1.4), Math.round(ey - 1), Math.round(bodyCx + 5.4), Math.round(ey + 1), pal.base);
      break;
    }
    case 'angry': {
      const exL = bodyCx - 4;
      const exR = bodyCx + 4;
      p.fillEllipse(exL, ey + 0.4, 2.1, 1.8, pal.eyeWhite);
      p.fillEllipse(exR, ey + 0.4, 2.1, 1.8, pal.eyeWhite);
      p.fillEllipse(exL, ey + 0.6, 1, 1, pal.accent);
      p.fillEllipse(exR, ey + 0.6, 1, 1, pal.accent);
      brow(exL, 1.2);
      brow(exR, -1.2);
      break;
    }
    default:
      eye(bodyCx - 4, 1);
      eye(bodyCx + 4, 1);
  }
}

function drawMouth(p, pal, cfg, bodyCx, bodyCy, opts) {
  const my = bodyCy + 5;
  switch (cfg.mouth) {
    case 'o':
      p.fillEllipse(bodyCx, my, 1.2, 1.4, pal.pupil);
      break;
    case 'grin':
      p.fillRect(Math.round(bodyCx - 3), Math.round(my), Math.round(bodyCx + 3), Math.round(my + 2), pal.pupil);
      p.fillRect(Math.round(bodyCx - 3), Math.round(my), Math.round(bodyCx - 2), Math.round(my + 1), pal.eyeWhite);
      p.fillRect(Math.round(bodyCx - 1), Math.round(my), Math.round(bodyCx), Math.round(my + 1), pal.eyeWhite);
      p.fillRect(Math.round(bodyCx + 1), Math.round(my), Math.round(bodyCx + 2), Math.round(my + 1), pal.eyeWhite);
      break;
    case 'flat':
      p.line(bodyCx - 3, my, bodyCx + 3, my, pal.pupil);
      break;
    case 'teeth': {
      p.fillRect(Math.round(bodyCx - 4), Math.round(my), Math.round(bodyCx + 4), Math.round(my + 2), pal.pupil);
      p.fillRect(Math.round(bodyCx - 4), Math.round(my), Math.round(bodyCx - 3), Math.round(my + 1), pal.eyeWhite);
      p.fillRect(Math.round(bodyCx - 1), Math.round(my), Math.round(bodyCx), Math.round(my + 1), pal.eyeWhite);
      p.fillRect(Math.round(bodyCx + 2), Math.round(my), Math.round(bodyCx + 3), Math.round(my + 1), pal.eyeWhite);
      break;
    }
    default:
      p.line(bodyCx - 2, my, bodyCx + 2, my, pal.pupil);
  }
  if (opts.tongue) p.fillRect(Math.round(bodyCx - 1), Math.round(my + 2), Math.round(bodyCx + 1), Math.round(my + 3), pal.tongue);
}

function drawFeet(p, pal, cfg, bodyCx, bodyCy, ry, legs) {
  const ground = bodyCy + ry + 1;
  const step = (side, forward, lift) => {
    const x = bodyCx + (side === 'L' ? -1 : 1) * (forward ? 4 : 2);
    const y = ground + (lift ? -1 : 1);
    p.fillEllipse(x, y, 2.4, 1.7, pal.outline);
    p.fillEllipse(x, y - 0.3, 2.1, 1.4, pal.dark);
    if (cfg.id === 'runner') p.fillEllipse(x, y + 0.4, 2.1, 0.8, pal.eyeWhite); // รองเท้าสีขาว
  };
  switch (legs) {
    case 0: step('L', true, true); step('R', false, false); break;
    case 1: step('L', false, false); step('R', true, false); break;
    case 2: step('L', false, false); step('R', true, true); break;
    default: step('L', true, false); step('R', false, false); break;
  }
}

function drawAntenna(p, pal, cfg, bodyCx, bodyCy, ry, wiggle) {
  const top = bodyCy - ry;
  switch (cfg.antenna) {
    case 'two': {
      const a = Math.sin(wiggle) * 1.5;
      p.line(bodyCx - 4 + a * 0.5, top, bodyCx - 5 + a, top - 3, pal.dark);
      p.line(bodyCx + 4 + a * 0.5, top, bodyCx + 5 + a, top - 3, pal.dark);
      p.fillEllipse(bodyCx - 5 + a, top - 3.5, 1.3, 1.3, pal.accent);
      p.fillEllipse(bodyCx + 5 + a, top - 3.5, 1.3, 1.3, pal.accent);
      break;
    }
    case 'fin': {
      const a = Math.sin(wiggle) * 1;
      for (let y = 0; y <= 4; y++) {
        const half = 3 - y * 0.5 + (y === 2 ? a * 0.6 : 0);
        for (let x = Math.round(bodyCx - half); x <= Math.round(bodyCx + half); x++) p.setPx(x, top - y, y % 2 ? pal.dark : pal.base);
      }
      p.fillEllipse(bodyCx, top - 4.5, 1, 1.2, pal.accent);
      break;
    }
    case 'studs':
      p.fillRect(Math.round(bodyCx - 5), Math.round(top - 1), Math.round(bodyCx - 3), Math.round(top), pal.accent);
      p.fillRect(Math.round(bodyCx + 3), Math.round(top - 1), Math.round(bodyCx + 5), Math.round(top), pal.accent);
      break;
    case 'horns': {
      const a = Math.sin(wiggle) * 0.8;
      p.line(bodyCx - 4, top, bodyCx - 7 + a, top - 4, pal.dark);
      p.line(bodyCx + 4, top, bodyCx + 7 + a, top - 4, pal.dark);
      p.fillEllipse(bodyCx - 7 + a, top - 4.4, 1.4, 1.4, pal.accent);
      p.fillEllipse(bodyCx + 7 + a, top - 4.4, 1.4, 1.4, pal.accent);
      break;
    }
    default:
      break;
  }
}

/** วาดมอนสเตอร์ท่าเดิน (4 เฟรม) — bob + ขาสลับ + หนวดแกว่ง */
function drawWalk(p, pal, cfg, frame) {
  const legs = frame % 4;
  const bob = legs === 1 || legs === 3 ? -1 : 0;
  const wiggle = frame * 0.9;
  const { bodyCx, bodyCy } = drawBody(p, pal, cfg, { bob, leanSign: legs === 2 ? -1 : 1 });
  drawAntenna(p, pal, cfg, bodyCx, bodyCy, cfg.shape.ry, wiggle);
  drawEyes(p, pal, cfg, { blink: frame === 1 }, bodyCx, bodyCy);
  drawMouth(p, pal, cfg, bodyCx, bodyCy, {});
  drawFeet(p, pal, cfg, bodyCx, bodyCy, cfg.shape.ry, legs);
}

/** ท่าตะลึง: ตา X + ลิ้นห้อย + ดาววนรอบหัว */
function drawStun(p, pal, cfg) {
  const { bodyCx, bodyCy } = drawBody(p, pal, cfg, { bob: 0 });
  drawAntenna(p, pal, cfg, bodyCx, bodyCy, cfg.shape.ry, 2);
  drawEyes(p, pal, cfg, { stun: true }, bodyCx, bodyCy);
  drawMouth(p, pal, cfg, bodyCx, bodyCy, { tongue: true });
  drawFeet(p, pal, cfg, bodyCx, bodyCy, cfg.shape.ry, 1);
  const top = bodyCy - cfg.shape.ry;
  p.star(bodyCx - 8, top - 2, pal.accent);
  p.star(bodyCx + 8, top - 2, pal.accent);
  p.star(bodyCx, top - 6, pal.accent);
}

/** ระเบิด 3 เฟรม: ร้าว → ขยาย + เศษ → แฟลชเต็ม */
function drawExplode(p, pal, cfg, level) {
  const { cx, cy } = cfg.shape;
  const c = { 1: 6, 2: 9, 3: 13 }[level];
  const r = { 1: 9, 2: 11.5, 3: 14 }[level];
  const debris = { 1: 6, 2: 10, 3: 14 }[level];
  // แฟลชขาวตรงกลาง
  p.fillEllipse(cx, cy, r * 0.75, r * 0.75, [255, 255, 255, 255]);
  if (level >= 2) {
    // วงแหวนสีมอนสเตอร์
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const px = cx + Math.cos(a) * (r - 0.6);
      const py = cy + Math.sin(a) * (r - 0.6);
      p.setPx(px, py, i % 3 === 0 ? pal.highlight : pal.base);
    }
  }
  // เศษกระเด็น (สีมอนสเตอร์/ขาว/เหลือง)
  for (let i = 0; i < debris; i++) {
    const a = (i / debris) * Math.PI * 2 + 0.4;
    const d = r * (0.7 + (level - 1) * 0.35);
    const col = i % 3 === 0 ? pal.accent : i % 3 === 1 ? [255, 255, 255, 255] : pal.base;
    p.fillRect(Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d), Math.round(cx + Math.cos(a) * d) + (i % 2), Math.round(cy + Math.sin(a) * d) + (i % 2), col);
  }
  // เส้นรัศมีจากศูนย์กลาง (แบบลานตา)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    p.line(cx, cy, Math.round(cx + Math.cos(a) * c * 0.8), Math.round(cy + Math.sin(a) * c * 0.8), i % 2 ? pal.highlight : [255, 255, 255, 255]);
  }
}

/** เป็นมิตร: ยิ้มกว้าง + แก้มแดง + ประกาย + เด้ง (friendly2 = เด้งขึ้น) */
function drawFriendly(p, pal, cfg, bounce) {
  const { bodyCx, bodyCy } = drawBody(p, pal, cfg, { bob: bounce ? -1.5 : 0 });
  drawAntenna(p, pal, cfg, bodyCx, bodyCy, cfg.shape.ry, 3);
  drawEyes(p, pal, cfg, {}, bodyCx, bodyCy);
  drawMouth(p, pal, cfg, bodyCx, bodyCy, {});
  // ยิ้มกว้าง
  p.fillEllipse(bodyCx, bodyCy + 4.5, 3.2, 1.6, pal.pupil);
  p.fillRect(Math.round(bodyCx - 3), Math.round(bodyCy + 4), Math.round(bodyCx + 3), Math.round(bodyCy + 4), pal.eyeWhite);
  // แก้มแดง
  p.fillEllipse(bodyCx - 5.4, bodyCy + 2, 1.3, 1, pal.blush);
  p.fillEllipse(bodyCx + 5.4, bodyCy + 2, 1.3, 1, pal.blush);
  drawFeet(p, pal, cfg, bodyCx, bodyCy, cfg.shape.ry, 1);
  // ประกายรอบตัว
  const top = bodyCy - cfg.shape.ry;
  p.star(bodyCx - 9, top + 2, pal.accent);
  p.star(bodyCx + 9, top + 2, pal.accent);
  p.star(bodyCx - 7, top - 3, [255, 255, 255, 255]);
  p.star(bodyCx + 7, top - 3, [255, 255, 255, 255]);
  if (bounce) {
    // หัวใจเล็กเหนือหัว
    p.setPx(bodyCx, top - 7, pal.blush);
    p.fillEllipse(bodyCx - 1, top - 7.4, 1, 0.9, pal.blush);
    p.fillEllipse(bodyCx + 1, top - 7.4, 1, 0.9, pal.blush);
  }
}

// ---------------------------------------------------------------- สร้าง sheet

const outDir = path.resolve('public/assets/sprites');
fs.mkdirSync(outDir, { recursive: true });

const png = new PNG({ width: CELL * COLS, height: CELL * ROWS });
const manifest = {
  sheet: '/assets/sprites/monsters-sheet.png',
  cell: CELL,
  grid: GRID,
  frames: {},
};

MONSTERS.forEach((cfg, mi) => {
  const pal = makePalette(cfg.color);
  FRAMES.forEach((name, fi) => {
    const p = makePainter(png, fi * CELL, mi * CELL);
    if (name.startsWith('walk')) {
      drawWalk(p, pal, cfg, Number(name.slice(4)) - 1);
    } else if (name === 'stun') {
      drawStun(p, pal, cfg);
    } else if (name.startsWith('explode')) {
      drawExplode(p, pal, cfg, Number(name.slice(7)));
    } else {
      drawFriendly(p, pal, cfg, name === 'friendly2');
    }
  });

  manifest.frames[cfg.id] = {
    name: cfg.name,
    row: mi,
    frames: Object.fromEntries(FRAMES.map((name, fi) => [
      name,
      { x: fi * CELL, y: mi * CELL, w: CELL, h: CELL },
    ])),
  };
  console.log(`  ${cfg.id.padEnd(7)} (${cfg.name}) → ${FRAMES.length} เฟรม @แถว ${mi}`);
});

const sheetPath = path.join(outDir, 'monsters-sheet.png');
fs.writeFileSync(sheetPath, PNG.sync.write(png));
fs.writeFileSync(path.join(outDir, 'monsters-sheet.json'), JSON.stringify(manifest, null, 2));

const check = PNG.sync.read(fs.readFileSync(sheetPath));
console.log(`\nสร้างเสร็จ: ${sheetPath} (${check.width}×${check.height})`);
console.log(`manifest: ${path.join(outDir, 'monsters-sheet.json')}`);
