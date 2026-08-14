# 🎞️ ai-sprite-process.py — เปลี่ยน Sprite Sheet จาก AI → เฟรมโปร่งใส + manifest

> ปัญหา: ภาพที่ AI สร้าง **ไม่ใช่พื้นหลังโปร่งใส** (พื้นขาว/ดำ/ไล่เฉด/มีเงา)
> → JavaScript (Canvas) วาดทับไม่ได้ ต้องประมวลผลก่อน
>
> สคริปต์นี้ทำครบวงจร: ลบพื้น → ตัดเฟรม → normalize 64×64 → manifest JSON
> ให้เกมใช้ต่อได้ทันที

## 2 โหมดการทำงาน

| โหมด | flag | เหมาะกับ | วิธีลบพื้น |
|---|---|---|---|
| **โหมดกริด (PEP)** ⭐ | `--grid-bg #00ff00` | พรอมต์ที่บังคับ "พื้นสีเดียว + ไม่มีเงา" (ดู `design/prompt-processability-spec.md`) | key สีเดียว — เร็ว/แม่น 100% |
| **โหมด flood** | (ไม่ใส่ `--grid-bg`) | ภาพ AI ทั่วไป: ไล่เฉด/เกรน/สีมุมไม่ตรง | flood fill + interpolate มุม 4 มุม + ลบเงา |

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

## ทดสอบแล้ว (ทั้ง 2 โหมด)

| กรณี | โหมด | ผล |
|---|---|---|
| sheet กริด 4×4 พื้น #00ff00 + กรอบ 4px + เงาแอบ | grid | ✅ 16 เฟรมตรง `--expect-grid 4x4` · เงาหาย (key กำจัดพร้อมพื้น) |
| AI sheet พื้นไล่เฉด 4 ตัว + เงา + ตัวมีรูกลาง | flood | ✅ 4 เฟรม · เงา 1078 px ลบ · รูกลางตัวไม่ถูกเจาะ |
| sheet จริงของเกม (โปร่งใส 40 เฟรม) | flood `--dry` | ✅ 4×10 (ผ่าน sprite-frame-detect.py) |

## หมายเหตุ

- **โหมดกริด ดีกว่า flood เสมอ** — ใช้ `design/prompt-processability-spec.md`
  บังคับพรอมต์ "พื้นสีเดียว" แล้วป้อน `--grid-bg` → ไม่ต้องเดาอะไรเลย
- ถ้าภาพ AI ไม่ทำตามสัญญา (พื้นไล่เฉด/มีเงา) → ใช้โหมด flood เป็นแผนสำรอง
- ตรวจผลด้วยสายตาก่อนใช้จริง (เปิดภาพเฟรม + เปรียบเทียบ manifest)
