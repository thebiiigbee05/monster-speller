import { test, expect } from '@playwright/test';

// E2E — QA harness ตรวจวอล์กไซเคิล walker 8 เฟรม (docs/10-chapter-10-testing-qa.md)
// Harness: public/sprite-test.html — เล่นวนเฟรมจริงจาก walker.json + PNG (เดียวกับที่เกมจะโหลด)
// ตรวจ 3 อย่าง: manifest ครบ · วนครบ 8 เฟรม + loop · mirror (เฟรม 4-7) สมบูรณ์ + ท่าไม่ซ้ำ

const PAGE = '/sprite-test.html';

async function waitReady(page: import('@playwright/test').Page) {
  await page.goto(PAGE);
  await expect(page.getByTestId('harness-status')).toContainText('พร้อม', { timeout: 15_000 });
}

test('walker.json: ครบ 8 เฟรม + poseMap ครบ 8 ท่า + fps ถูกต้อง', async ({ page }) => {
  await waitReady(page);

  const m = await page.evaluate(() => (window as any).__spriteTest.verifyManifest());
  expect(m.pass).toBe(true);
  expect(m.frames).toBe(8);
  expect(m.fps).toBeGreaterThan(0);

  // ผ่านหน้า DOM ด้วย (เทส UI จริง)
  await expect(page.getByTestId('fps-label')).toHaveText(String(m.fps));
});

test('เกมเล่นวนครบ 8 เฟรม (0–7) แล้ววนกลับรอบใหม่ — ทุกเฟรมเคยปรากฏ', async ({ page }) => {
  await waitReady(page);

  // รอจนกว่าจะเห็นครบ 8 เฟรม และผ่านรอบเต็มอย่างน้อย 1 รอบ (7→0)
  await page.waitForFunction(
    () => {
      const t = (window as any).__spriteTest;
      return t.allSeen() && t.cycles() >= 1;
    },
    undefined,
    { timeout: 10_000 },
  );

  // ยืนยันแคนวาสเปลี่ยนจริง (อนิเมชันกำลังเล่น ไม่ใช่ภาพนิ่ง)
  const hash1 = await page.evaluate(() => (window as any).__spriteTest.canvasHash());
  await page.waitForTimeout(400);
  const hash2 = await page.evaluate(() => (window as any).__spriteTest.canvasHash());
  expect(hash1).not.toBe(hash2);

  // HUD แสดงเฟรม/ท่า/รอบตามจริง
  const idx = await page.evaluate(() => (window as any).__spriteTest.getCurrentFrame());
  await expect(page.getByTestId('frame-idx')).toHaveText(String(idx));
  const pose = await page.evaluate(() => (window as any).__spriteTest.getPoseName());
  await expect(page.getByTestId('pose-name')).toHaveText(pose);
  const cycles = await page.evaluate(() => (window as any).__spriteTest.cycles());
  await expect(page.getByTestId('cycle-count')).toHaveText(String(cycles));
});

test('mirror ไม่เพี้ยน: เฟรม 4–7 = สะท้อนของ 0–3 ระดับพิกเซล + ท่าไม่ซ้ำกัน', async ({ page }) => {
  await waitReady(page);

  const res = await page.evaluate(() => {
    const t = (window as any).__spriteTest;
    return { mirror: t.verifyMirror(), distinct: t.verifyDistinct() };
  });

  // 1) mirror: ทุกคู่ (0↔4, 1↔5, 2↔6, 3↔7) ต่าง 0 พิกเซล (สะท้อนสมบูรณ์)
  expect(res.mirror.pass).toBe(true);
  for (const p of res.mirror.pairs) {
    expect(p.maxDiff).toBe(0);
    expect(p.diffPixels).toBe(0);
  }

  // 2) distinct: ไม่มีท่าไหนซ้ำกันเลย (28 คู่) — กัน AI แปะท่าซ้ำ
  expect(res.distinct.pass).toBe(true);
  expect(res.distinct.identical).toHaveLength(0);
  expect(res.distinct.pairsChecked).toBe(28);
});
