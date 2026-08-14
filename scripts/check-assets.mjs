#!/usr/bin/env node
/**
 * asset-manifest-validator — ตรวจสินทรัพย์ที่เกมโหลดจริง ก่อน build
 *
 * วิธีทำงาน:
 *   1. สแกนไฟล์ src (ts/vue/tsx) หา asset ที่เกมโหลดจริง (fetch / import / img)
 *      — ตามรูปแบบ 'assets/...json' และ 'assets/...png' + relative import
 *   2. ตรวจแต่ละตัว:
 *      - PNG  → ไฟล์มีอยู่จริง
 *      - JSON → schema ตรงที่เกมคาดหวัง (sprite ใหม่ / sprite เก่า / wordBank)
 *        + ไฟล์เฟรมมีอยู่จริง + จำนวนเฟรมตรง + เฟรมครบชุดที่เกมใช้
 *
 * วิธีรัน:
 *   node scripts/check-assets.mjs      # exit 0 = ผ่าน · exit 1 = มีปัญหา
 *
 * ผูกกับ: "check:assets" (package.json) → รันก่อน build (กัน build ผ่านแต่เกมโหลดพัง)
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();

// ชุดเฟรมที่เกมใช้จริง (SpriteRenderer.frameName — src/game/entities/Monster.ts)
const REQUIRED_FRAMES = ['walk1', 'walk2', 'walk3', 'walk4', 'stun',
  'explode1', 'explode2', 'explode3', 'friendly1', 'friendly2'];
const REQUIRED_MONSTERS = ['walker', 'runner', 'tank', 'boss'];
// 8 มาตรา (wordBank.json meta.matras — บทที่ 3)
const REQUIRED_MATRAS = ['กา', 'กก', 'กด', 'กบ', 'กน', 'กม', 'เกย', 'เกอว'];

function findSources() {
  try {
    // ใช้ git ls-files กันพา node_modules/dist เข้ามา (เร็ว + ตรงไฟล์ที่ commit)
    const files = execSync('git ls-files "src/**/*.ts" "src/**/*.vue" "src/**/*.tsx"',
      { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
    return files;
  } catch {
    // ไม่ใช่ git repo — walk เอง
    const out = [];
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.(ts|vue|tsx)$/.test(e.name)) out.push(p);
      }
    };
    walk(path.join(ROOT, 'src'));
    return out;
  }
}

/** หา asset ในโค้ด — คืน (label, absolutePath) */
function extractAssets(src, file) {
  const assets = new Map(); // label -> absolute path
  // 'assets/xxx.json' / "assets/xxx.png" — แบบปกติและต่อ BASE_URL
  const re = /['"`]([^'"`]*assets\/[^'"`]*\.(?:json|png))['"`]/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const raw = m[1];
    if (raw.includes('${')) continue; // dynamic — ข้าม
    const label = raw.replace(/^\/+/, '');
    for (const base of [path.join(ROOT, 'public'), ROOT]) {
      const abs = path.join(base, label);
      if (fs.existsSync(abs)) {
        assets.set(label, abs);
        break;
      }
    }
    if (!assets.has(label)) assets.set(label, path.join(ROOT, 'public', label));
  }
  // import x from './wordBank.json' — relative import (อยู่ใต้ src/)
  const relRe = /from\s+['"](\.[^'"]*\.json)['"]/g;
  while ((m = relRe.exec(src)) !== null) {
    const abs = path.normalize(path.join(path.dirname(file), m[1]));
    if (fs.existsSync(abs)) {
      const label = path.relative(ROOT, abs).replace(/\\/g, '/');
      assets.set(label, abs);
    }
  }
  return [...assets.entries()];
}

/** schema ของ JSON แต่ละประเภท — คืน list ปัญหา (ว่าง = ผ่าน) */
function schemaProblems(json, file) {
  const problems = [];
  const base = path.dirname(file);

  // ประเภท 1: wordBank (src/content/words/wordBank.json)
  if (json.meta && Array.isArray(json.words)) {
    if (typeof json.meta.count !== 'number') {
      problems.push('meta.count ต้องเป็น number');
    } else if (json.meta.count !== json.words.length) {
      problems.push(`meta.count=${json.meta.count} ≠ words.length=${json.words.length}`);
    }
    if (!Array.isArray(json.meta.matras)) {
      problems.push('meta.matras ต้องเป็น array');
    } else {
      for (const m of REQUIRED_MATRAS) {
        if (!json.meta.matras.includes(m)) problems.push(`ขาดมาตราใน meta.matras: ${m}`);
      }
    }
    const requiredWordKeys = ['id', 'word', 'finalConsonant', 'matra', 'regular',
      'difficulty', 'source'];
    for (const w of json.words) {
      for (const k of requiredWordKeys) {
        if (!(k in w)) {
          problems.push(`คำ ${w.id || '?'} ขาดคีย์: ${k}`);
          break;
        }
      }
    }
    // ความยากต้องเป็น 1-3
    const badDiff = json.words.filter((w) => ![1, 2, 3].includes(w.difficulty));
    if (badDiff.length) {
      problems.push(`${badDiff.length} คำมี difficulty ไม่ใช่ 1-3 (เช่น ${badDiff[0].id})`);
    }
    return problems;
  }

  // ประเภท 2: sprite schema ใหม่ (ai-sprite-process — frameFiles)
  if (Array.isArray(json.frameFiles)) {
    if (typeof json.frames !== 'number' || typeof json.frameSize !== 'number') {
      problems.push('schema ใหม่ต้องมี frames (number) + frameSize (number)');
    }
    if (json.frameFiles.length === 0) {
      problems.push('frameFiles ต้องไม่ว่าง');
    } else {
      if (json.frames !== json.frameFiles.length) {
        problems.push(`frames=${json.frames} ≠ frameFiles.length=${json.frameFiles.length}`);
      }
      for (const f of json.frameFiles) {
        if (!fs.existsSync(path.join(base, f))) problems.push(`เฟรมหาย: ${f}`);
      }
    }
    return problems;
  }

  // ประเภท 3: sprite schema เก่า (monsters-sheet.json — frames object)
  if (json.frames && typeof json.frames === 'object') {
    if (typeof json.sheet !== 'string') {
      problems.push('schema เก่าต้องมี sheet (path PNG)');
    } else {
      const sheetClean = json.sheet.replace(/^\/+/, '');
      const candidates = [
        path.join(base, sheetClean.replace(/^assets\//, '')),
        path.join(ROOT, 'public', sheetClean),
        path.join(ROOT, 'public', sheetClean.replace(/^assets\//, 'assets/')),
      ];
      if (!candidates.some((c) => fs.existsSync(c))) {
        problems.push(`sheet PNG หาย: ${json.sheet}`);
      }
    }
    for (const name of REQUIRED_MONSTERS) {
      const mon = json.frames?.[name];
      if (!mon || !mon.frames) {
        problems.push(`ขาดมอนสเตอร์ใน manifest: ${name}`);
        continue;
      }
      for (const f of REQUIRED_FRAMES) {
        if (!mon.frames[f]) problems.push(`${name} ขาดเฟรม: ${f}`);
      }
    }
    return problems;
  }

  return [`schema จำไม่ได้: keys=${Object.keys(json).join(', ')}`];
}

function main() {
  const files = findSources();
  if (!files.length) {
    console.error('ไม่พบไฟล์ src — รันจากโฟลเดอร์ root ของโปรเจกต์');
    process.exit(2);
  }

  const found = new Map(); // label -> {abs, refs[]}
  for (const file of files) {
    const abs = path.join(ROOT, file);
    if (!fs.existsSync(abs)) continue;
    const src = fs.readFileSync(abs, 'utf8');
    for (const [label, assetAbs] of extractAssets(src, file)) {
      if (!found.has(label)) found.set(label, { abs: assetAbs, refs: [] });
      found.get(label).refs.push(file);
    }
  }

  const problems = [];
  for (const [label, { abs, refs }] of [...found.entries()].sort()) {
    if (!fs.existsSync(abs)) {
      problems.push(`❌ ${label} — ไฟล์ไม่มีอยู่จริง (อ้างจาก: ${refs.join(', ')})`);
      continue;
    }
    if (label.endsWith('.json')) {
      let json;
      try {
        json = JSON.parse(fs.readFileSync(abs, 'utf8'));
      } catch (e) {
        problems.push(`❌ ${label} — JSON อ่านไม่ได้: ${e.message}`);
        continue;
      }
      const ps = schemaProblems(json, abs);
      if (ps.length) {
        problems.push(...ps.map((p) => `❌ ${label}: ${p}`));
      }
    }
  }

  console.log(`🔍 asset-manifest-validator — สแกน ${files.length} ไฟล์ src → พบ ${found.size} asset`);
  for (const [label, { refs }] of [...found.entries()].sort()) {
    console.log(`   ${refs.length > 1 ? '⚠' : ' '} ${label}`);
  }
  if (problems.length) {
    console.log('\nปัญหา:');
    for (const p of problems) console.log('  ' + p);
    console.log(`\nผล: ❌ ${problems.length} ปัญหา — แก้ก่อน build`);
    process.exit(1);
  }
  console.log(`\nผล: ✅ สินทรัพย์ที่เกมโหลด ${found.size} รายการตรวจผ่าน`);
}

main();
