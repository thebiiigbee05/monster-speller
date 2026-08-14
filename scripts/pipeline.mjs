#!/usr/bin/env node
/**
 * Pipeline orchestrator — ตรวจ + ตัดเฟรมสินทรัพย์ AI ทั้งหมดในคำสั่งเดียว
 *
 * ตาม roadmap ใน design/pipeline-process.md (ระยะ 4 VERIFY):
 *   รัน ai-sprite-process.py --require-check --drop-flat --dedupe
 *   กับทุก sheet ใน public/assets/ai/ แบบ parallel → ตารางสรุป pass/fail
 *   → ถ้ามี fail ตัวใดตัวหนึ่ง exit 1 (กันของเสียเข้าสู่ระยะ 5)
 *
 * วิธีรัน:
 *   node scripts/pipeline.mjs                 # 4 มอนสเตอร์ (ค่า default)
 *   node scripts/pipeline.mjs walker tank     # เฉพาะบางตัว (ตามชื่อ)
 *
 * แผนงานอิง pep-prompts-monsters.md: กริด 4×1 (512×128, เซลล์ 128)
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PY = fs.existsSync('.venv-scripts/Scripts/python.exe')
  ? '.venv-scripts/Scripts/python.exe'
  : (process.platform === 'win32' ? 'python' : 'python3');
const SCRIPT = 'scripts/ai-sprite-process.py';
const AI_DIR = 'public/assets/ai';
const OUT_DIR = 'public/assets/sprites/ai';

/** แผนงานสินทรัพย์ — เพิ่ม/แก้ตรงนี้ได้ (name = ชื่อ manifest, cell, grid) */
const PLANS = [
  // poses = ชื่อท่าเรียงตามกริด · mirror = สร้างก้าวที่ 2 (ภาพสะท้อน) → 8 เฟรมลื่น
  // (runner ห้าม mirror — ครีบหลังไม่สมมาตร ดู walk-cycle-spec.md ข้อ 2)
  { name: 'walker', cell: 128, grid: '4x1', poses: 'contact,down,passing,up', mirror: true },
  { name: 'runner', cell: 128, grid: '4x1', poses: 'reach,stride,passing,kick', mirror: false },
  { name: 'tank',   cell: 128, grid: '4x1', poses: 'sway-left,squat,sway-right,rise', mirror: true },
  { name: 'boss',   cell: 128, grid: '4x1', poses: 'stomp-left,low,stomp-right,high', mirror: true },
];

function runProcess(args, cwd = process.cwd()) {
  return new Promise((resolve) => {
    const child = spawn(PY, args, { cwd });
    let out = '', err = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    child.on('close', (code) => resolve({ code, out, err }));
  });
}

function readManifest(name) {
  const p = path.join(OUT_DIR, name, `${name}.json`);
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

async function main() {
  const wanted = process.argv.slice(2);
  const plans = wanted.length
    ? PLANS.filter((p) => wanted.includes(p.name))
    : PLANS;

  if (!plans.length) {
    console.error(`❌ ไม่พบแผนสินทรัพย์: ${wanted.join(', ')}`);
    console.error(`   แผนที่มี: ${PLANS.map((p) => p.name).join(', ')}`);
    process.exit(2);
  }

  const missing = plans.filter((p) => !fs.existsSync(path.join(AI_DIR, `${p.name}-sheet.png`)));
  if (missing.length) {
    console.error('❌ ไม่พบ sheet ใน public/assets/ai/:');
    for (const p of missing) console.error(`   - ${p.name}-sheet.png`);
    console.error('   → วางไฟล์ AI ก่อนแล้วรันใหม่ (ดู 📦 ใน pep-prompts-monsters.md)');
    process.exit(2);
  }

  console.log(`🧪 pipeline: ตรวจ + ตัดเฟรม ${plans.length} sheet (parallel) — ${PY}\n`);

  // ล้าง out-dir เดิมก่อนรัน (ผลลัพธ์มาจากสคริปต์ล้วน ๆ — กันเฟรมเก่าตกค้าง
  // เมื่อรอบนี้ได้เฟรมน้อยกว่ารอบก่อน เช่น walker 11 → 5 เฟรม)
  for (const p of plans) {
    fs.rmSync(path.join(OUT_DIR, p.name), { recursive: true, force: true });
  }

  const results = await Promise.all(plans.map(async (p) => {
    const args = [
      SCRIPT,
      path.join(AI_DIR, `${p.name}-sheet.png`),
      '--name', p.name,
      '--cell', String(p.cell),
      '--out-dir', path.join(OUT_DIR, p.name),
      '--grid-bg', '#00ff00',
      '--expect-grid', p.grid,
      '--pose-names', p.poses,
      ...(p.mirror ? ['--mirror-cycle'] : []),
      '--require-check', '--drop-flat', '--dedupe',
    ];
    const r = await runProcess(args);
    const manifest = (r.code === 0) ? readManifest(p.name) : null;
    return { ...p, ...r, manifest };
  }));

  // ตารางสรุป
  const ok = results.filter((r) => r.code === 0);
  const fail = results.filter((r) => r.code !== 0);
  console.log('ผลลัพธ์:');
  console.log('┌──────────┬────────┬──────────┬────────────────────────────────────┐');
  console.log('│ สินทรัพย์ │ สถานะ │ เฟรม     │ หมายเหตุ                          │');
  console.log('├──────────┼────────┼──────────┼────────────────────────────────────┤');
  for (const r of results) {
    const name = r.name.padEnd(8);
    const status = r.code === 0 ? '✅ PASS' : '❌ FAIL';
    let frames = '—';
    let note = '—';
    if (r.code === 0 && r.manifest) {
      frames = String(r.manifest.frames).padEnd(8);
      note = `${r.manifest.rows}×${r.manifest.cols} กริด · ${r.manifest.source}`;
      if (r.manifest.poseWarning) {
        note += ` ⚠️${r.manifest.frames}/${(r.manifest.poses || []).length} ท่า`;
      }
      if (note.length > 36) note = note.slice(0, 33) + '...';
    } else {
      const lines = (r.out + r.err).split('\n').filter((l) => l.trim());
      const last = lines.filter((l) => /⛔|error|Error|ไม่พบ|หยุด/.test(l)).pop()
        || lines.slice(-1)[0] || 'ดู output เต็ม';
      note = (last || '').trim().slice(0, 36);
    }
    console.log(`│ ${name} │ ${status} │ ${frames} │ ${note.padEnd(34)} │`);
  }
  console.log('└──────────┴────────┴──────────┴────────────────────────────────────┘');
  console.log(`\nสรุป: ${ok.length}/${results.length} ผ่าน · ${fail.length} ไม่ผ่าน`);

  if (fail.length) {
    console.log('\n--- รายละเอียดตัวที่ไม่ผ่าน ---');
    for (const r of fail) {
      console.log(`\n◆ ${r.name}:`);
      console.log((r.out || r.err || '(ไม่มี output)').split('\n').slice(0, 12).join('\n'));
    }
    console.log('\n⛔ มี fail — ตรวจภาพ/gen ใหม่ก่อนเข้า INTEGRATE (pipeline-process.md ระยะ 4)');
    process.exit(1);
  }

  console.log('\n✅ ทุก sheet ผ่าน — เฟรม + manifest พร้อมใช้ (ระยะ 5 INTEGRATE)');
}

main().catch((e) => { console.error(e); process.exit(1); });
