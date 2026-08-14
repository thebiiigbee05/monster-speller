#!/usr/bin/env python3
"""ตรวจลิงก์ Markdown ทั้งหมด (README + docs + design) ว่าไฟล์/anchor ปลายทางมีอยู่จริงไหม."""
import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MD_PAT = re.compile(r"\[[^\]]*\]\(([^)]+)\)")
ANCHOR_PAT = re.compile(r"^#{1,6}\s+(.*)$")

# ไฟล์ "ต้นทาง" ที่มีลิงก์ข้ามไฟล์ (จำกัด — ไม่สแกนโฟลเดอร์โค้ด)
SCAN_FILES = [
    "README.md",
    "docs/00-cover-and-toc.md",
    "docs/01-chapter-1-introduction.md",
    "docs/02-chapter-2-literature-review.md",
    "docs/03-chapter-3-learner-analysis.md",
    "docs/04-chapter-4-game-design.md",
    "docs/05-chapter-5-instructional-design.md",
    "docs/06-chapter-6-ui-ux-graphics.md",
    "docs/07-chapter-7-architecture-technology.md",
    "docs/08-chapter-8-software-development-plan.md",
    "docs/09-chapter-9-agile-kanban.md",
    "docs/10-chapter-10-testing-qa.md",
    "docs/11-chapter-11-evaluation-risks.md",
    "docs/12-chapter-12-conclusion-future.md",
    "docs/13-bibliography.md",
    "docs/15-chapter-15-graphics-assets.md",
    "design/prompt-processability-spec.md",
    "design/characters.md",
    "design/art/README.md",
    "design/art/pep-prompts-monsters.md",
    "design/art/turnaround-prompts.md",
    "design/ar-cards/markers/README.md",
]

# ไฟล์ md ทั้งหมด (เก็บ anchor) — ข้ามโฟลเดอร์ที่ไม่เกี่ยวข้อง
MD_FILES = []
for dirpath, dirnames, files in os.walk(ROOT):
    dirnames[:] = [d for d in dirnames
                   if d not in ("node_modules", ".git", ".venv-scripts", "dist",
                                "public", "coverage", "test-results")]
    for f in files:
        if f.endswith(".md"):
            MD_FILES.append(os.path.join(dirpath, f))


def slugify(title):
    s = title.strip().lower()
    for ch in ['(', ')', ':', ',', '.', "'", '"', '’', '“', '”', '×', '\\', '*', '!']:
        s = s.replace(ch, '')
    s = s.replace('–', '-').replace('—', '-').replace('/', '-').replace(' ', '-')
    return '#' + s


anchors = {}
for fp in MD_FILES:
    rel = os.path.relpath(fp, ROOT).replace("\\", "/")
    hs = set()
    with open(fp, encoding="utf-8") as fh:
        for ln in fh:
            m = ANCHOR_PAT.match(ln.strip())
            if m:
                hs.add(slugify(m.group(1)))
    anchors[rel] = hs

issues = []
checked = 0
for rel in SCAN_FILES:
    fp = os.path.join(ROOT, rel)
    if not os.path.exists(fp):
        issues.append((rel, "(ไฟล์ต้นทาง)", "ต้นทางไม่มีอยู่จริง"))
        continue
    with open(fp, encoding="utf-8") as fh:
        text = fh.read()
    for m in MD_PAT.finditer(text):
        target = m.group(1).strip()
        checked += 1
        if not target or target.startswith(("http://", "https://", "mailto:")):
            continue
        path_part, _, anchor = target.partition("#")
        if not path_part:
            # anchor ในไฟล์เดียวกัน
            if anchor and anchor not in anchors.get(rel, set()):
                issues.append((rel, target, "anchor ไม่พบในไฟล์เดียวกัน"))
            continue
        tpath = os.path.normpath(os.path.join(os.path.dirname(fp), path_part))
        if not os.path.exists(tpath):
            issues.append((rel, target, "ไฟล์ปลายทางไม่มีอยู่จริง"))
            continue
        if anchor:
            trel = os.path.relpath(tpath, ROOT).replace("\\", "/")
            if trel not in anchors:
                # ปลายทางไม่ใช่ md (เช่น .py/.png) — anchor ตรวจไม่ได้
                pass
            elif anchor not in anchors[trel]:
                issues.append((rel, target, "anchor ไม่พบใน " + trel))

print(f"ลิงก์ที่ตรวจ: {checked}")
if not issues:
    print("✅ ไม่พบลิงก์เสีย")
else:
    print(f"❌ พบ {len(issues)} ลิงก์เสีย:")
    for src, target, why in issues:
        print(f"  [{src}] → `{target}` : {why}")
