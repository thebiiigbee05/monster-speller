# 🎞️ ai-sprite-process.py — เปลี่ยน Sprite Sheet จาก AI → เฟรมโปร่งใส + manifest

## 🚀 ใช้กับสินทรัพย์ทั้งหมดในครั้งเดียว (แนะนำ — `pipeline.mjs`)

```bash
node scripts/pipeline.mjs            # 4 มอนสเตอร์ parallel + ตารางสรุป
node scripts/pipeline.mjs walker     # เฉพาะตัว (walker/runner/tank/boss)
```

รัน `--require-check --drop-flat --dedupe` กับทุก sheet ใน `public/assets/ai/`
พร้อมกัน → ตารางสรุป pass/fail · **exit 1 ถ้ามี fail ตัวใดตัวหนึ่ง** (กันของเสีย
เข้าสู่ระยะ INTEGRATE — ดู `design/pipeline-process.md` ระยะ 4)

> ปัญหา: ภาพที่ AI สร้าง **ไม่ใช่พื้นหลังโปร่งใส** (พื้นขาว/ดำ/ไล่เฉด/มีเงา)
> → JavaScript (Canvas) วาดทับไม่ได้ ต้องประมวลผลก่อน
>
> สคริปต์นี้ทำครบวงจร: **ตรวจภาพก่อนใช้ (--check)** → ลบพื้น → ตัดเฟรม →
> normalize → manifest JSON ให้เกมใช้ต่อได้ทันที

## 2 โหมดการทำงาน

| โหมด | flag | เหมาะกับ | วิธีลบพื้น |
|---|---|---|---|
| **โหมดกริด (PEP)** ⭐ | `--grid-bg #00ff00` | พรอมต์ที่บังคับ "พื้นสีเดียว + ไม่มีเงา" (ดู `design/prompt-processability-spec.md`) | key สีเดียว — เร็ว/แม่น 100% |
| **โหมด flood** | (ไม่ใส่ `--grid-bg`) | ภาพ AI ทั่วไป: ไล่เฉด/เกรน/สีมุมไม่ตรง | flood fill + interpolate มุม 4 มุม + ลบเงา |

## 🔍 โหมดตรวจภาพก่อนใช้ (--check)

ตรวจ sheet ว่าตรงสัญญา PEP ไหม **โดยไม่สร้างไฟล์** — ใช้กับภาพ AI ที่เพิ่งได้มา

```bash
# ตรวจก่อน → ผ่านจึงตัดเฟรม (1 บรรทัดจบ):
./.venv-scripts/Scripts/python.exe scripts/ai-sprite-process.py <sheet.png> \
    --name walker --cell 64 --out-dir out/ \
    --grid-bg "#00ff00" --expect-grid 4x4 --require-check
    --drop-flat --dedupe        # ← เพิ่ม: กรองเงาเฟรมหลอก + ลบเฟรมซ้ำ

# ตรวจอย่างเดียว:
./.venv-scripts/Scripts/python.exe scripts/ai-sprite-process.py <sheet.png> \
    --check --grid-bg "#00ff00" --expect-grid 4x4
```

รายงาน 4 อย่าง:

| ตรวจ | เจอเมื่อ | ระดับ |
|---|---|---|
| **เฟรมหลอก/ว่าง** | เซลล์มีเนื้อ < 5% ของพื้นที่ (เช่น เซลล์ว่าง/เฟรมหาย) | ❌ error |
| **ตัวติดขอบ** | เนื้อล้ำเข้าแถบขอบ 10% ของ pitch (ตัวใหญ่เกิน/กรอบ AI หนา) | ⚠️ warn |
| **เงาตกค้าง** | พิกเซลเข้มกว่าพื้น + สีใกล้ bg (เงา/หยดสี) | ⚠️ warn |
| **กริด** | จำนวนเซลล์ ≠ `--expect-grid` | ❌ error |

**Exit code:** `0` = ผ่าน (มีแค่ ok/warn) · `1` = มี error (อย่าเอาไปใช้) · `2` = อาร์กิวเมนต์ผิด

> หมายเหตุ: `--check` ต้องระบุ `--grid-bg` (สีพื้นตามสัญญา) และแนะนำ `--expect-grid`
> เสมอ — กริดคำนวณจากขนาดภาพ/จำนวนเซลล์ที่คาด (deterministic 100%)

## วิธีรัน

```bash
# โหมดกริด (แนะนำ — พรอมต์บังคับพื้น #00ff00, กริด 4x4)
./.venv-scripts/Scripts/python.exe scripts/ai-sprite-process.py <sheet.png> \
    --name walker --cell 64 --out-dir public/assets/sprites/ai/walker \
    --grid-bg "#00ff00" --expect-grid 4x4

# โหมด flood (ภาพ AI พื้นไล่เฉด มีเงา)
./.venv-scripts/Scripts/python.exe scripts/ai-sprite-process.py <sheet.png> \
    --name blob --cell 64 --out-dir out/ \
    --remove-shadows
```

## เอาต์พุต

```
<out-dir>/<name>_00.png, _01.png, ...   # เฟรมเดี่ยว โปร่งใส 64×64 (กลางกล่อง)
<out-dir>/<name>.json                    # manifest: frameSize/frames/rows/cols/frameFiles
```

## พารามิเตอร์หลัก

| flag | default | ความหมาย |
|---|---|---|
| `--name` | `sprite` | ชื่อ asset (ตั้งชื่อไฟล์ + manifest) |
| `--cell` | `64` | ขนาดกล่องเฟรม (normalize ให้กลางกล่อง) |
| `--grid-bg` | — | พื้นสีเดียวตามสัญญา PEP เช่น `#00ff00` → key ลบพื้น |
| `--expect-grid` | — | กริดที่คาด เช่น `4x4` → ตรวจเฟรมตรงสัญญาไหม (จับเฟรมหลอก/หาย) |
| `--check` | off | โหมดตรวจภาพอย่างเดียว (ไม่ตัดเฟรม): รายงานเฟรมหลอก/เงา/กริด/ติดขอบ + exit code |
| `--require-check` | off | ตรวจก่อนตัดเฟรม: มี error → หยุด (exit 1 ไม่สร้างไฟล์) · ผ่าน/เตือน → ตัดเฟรม + manifest ต่อ |
| `--drop-flat` | off | กรองเฟรมหลอก 2 แบบ — แถบแบน/เงา (สูง < median×ratio) **และ** เส้นตั้ง/ขีดลอย (กว้าง < median×strip-ratio) |
| `--flat-ratio` | 0.5 | เกณฑ์เฟรมแบน เทียบ median ความสูงเนื้อ (0.5 = สูงไม่ถึงครึ่งถือว่าแบน) |
| `--strip-ratio` | 0.35 | เกณฑ์เส้นตั้ง/ขีดลอย เทียบ median ความกว้างเนื้อ (AI วาดขีดขาว/แสงแนวตั้งลอยข้างตัว สูงเท่าตัวจริง → ดูความสูงไม่ทัน ต้องดูความกว้าง) |
| `--dedupe` | off | ลบเฟรมซ้ำ (AI แปะท่าเดิมหลายรอบ) — เทียบ normalized ภาพ เก็บท่าที่ต่างกันจริง |
| `--dup-threshold` | 3.0 | เกณฑ์ถือว่า 'ท่าเดียวกัน' (% ต่างของ normalized ภาพ, default 3.0) |
| `--tol` | `28` | tolerance ลบพื้น (มาก = ลบแรงขึ้น) |
| `--remove-shadows` | off | ลบเงาใต้ตัว (แถวล่างที่ไร้สีสัน + เข้มกว่าพื้น) |
| `--threshold` | `0.15` | เกณฑ์ "เนื้อ" ตรวจจับเฟรม |
| `--dry` | off | ข้ามการลบพื้น (ภาพโปร่งใสอยู่แล้ว) |

## Workflow ตาม PEP (อ่าน spec เต็มที่ `design/prompt-processability-spec.md`)

```
พรอมต์ PEP (พื้น #00ff00, กรอบ, ห้ามเงา/ข้อความ)
   → AI สร้างภาพ
   → ตรวจภาพ (พื้นเป็นสีเดียวจริง? เฟรมครบ?)
   → ai-sprite-process.py --grid-bg #00ff00 --expect-grid 4x4
   → เฟรมโปร่งใส + manifest → เกม
```

## ทดสอบแล้ว

| กรณี | โหมด | ผล |
|---|---|---|
| sheet กริด 4×4 พื้น #00ff00 + กรอบ 4px + เงาแอบ | grid | ✅ 16 เฟรมตรง `--expect-grid 4x4` · เงาหาย (key กำจัดพร้อมพื้น) |
| sheet ตามสัญญา (มีเงาแอบ) | **--check** | ⚠️ 3 ✅ + 1 ⚠️ (เงา 2224 px โดนจับ) · exit 0 |
| sheet ละเมิดสัญญา (เซลล์ว่าง + เงา + ตัวใหญ่) | **--check** | ❌ 1 (เฟรมว่าง) + ⚠️ 2 (ติดขอบ + เงา) · exit 1 |
| sheet ทดสอบ 512×512 ตามพรอมต์ PEP ใหม่ (กรอบตรงพิทช์ 128) | **--check** | ✅ 4/4 · exit 0 (สร้างด้วย `tests/make-pep512-sheet-test.py`) |
| sheet ละเมิด 512×512 (ว่าง + เงา + ตัวใหญ่) | **--check** | ❌ 1 + ⚠️ 2 · exit 1 — แยกถูก/ผิดครบทุกข้อ |
| GOOD 512×512 | **--require-check** | ✅ ผ่าน → ตัดเฟรม 16 + manifest · exit 0 |
| BAD 512×512 | **--require-check** | ❌ ตรวจไม่ผ่าน → หยุด ไม่สร้างไฟล์ · exit 1 |
| walker-sheet 1254px จริง (AI ไม่ตรงสัญญา) | **--drop-flat --dedupe** | 32 เฟรม → กรองเงา 16 → dedupe เหลือ 2 ท่าจริง · manifest 2 เฟรม · exit 0 |
| walker-sheet v2 2508×627 (ขีดขาวลอย 2 เส้น) | **--drop-flat --dedupe** | 6 เฟรม (4 ตัว + 2 เส้นตั้งขาว 7×115) → strip กรอง 2 เส้น → เหลือ 4 ท่าจริง · exit 0 |
| GOOD 512×512 (ท่าเดียวแปะ 4×4) | **--drop-flat --dedupe** | ไม่มีเฟรมแบน ✅ · dedupe ลบ 12 ตัวซ้ำ เหลือ 4 ท่าจริง · exit 0 |
| AI sheet พื้นไล่เฉด 4 ตัว + เงา + ตัวมีรูกลาง | flood | ✅ 4 เฟรม · เงา 1078 px ลบ · รูกลางตัวไม่ถูกเจาะ |
| sheet จริงของเกม (โปร่งใส 40 เฟรม) | flood `--dry` | ✅ 4×10 (ผ่าน sprite-frame-detect.py) |

## หมายเหตุ

- **โหมดกริด ดีกว่า flood เสมอ** — ใช้ `design/prompt-processability-spec.md`
  บังคับพรอมต์ "พื้นสีเดียว" แล้วป้อน `--grid-bg` → ไม่ต้องเดาอะไรเลย
- ถ้าภาพ AI ไม่ทำตามสัญญา (พื้นไล่เฉด/มีเงา) → ใช้โหมด flood เป็นแผนสำรอง
- ตรวจผลด้วยสายตาก่อนใช้จริง (เปิดภาพเฟรม + เปรียบเทียบ manifest)
