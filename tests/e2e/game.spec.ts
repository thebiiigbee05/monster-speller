import { test, expect } from '@playwright/test';

// เทส E2E ตัวอย่าง (docs/10-chapter-10-testing-qa.md ข้อ 10.1)
test('เปิดหน้าเว็บ → เริ่มเกม → เลือกกระสุน → ตรวจผล', async ({ page }) => {
  await page.goto('/');

  // หน้าหลัก (Hub)
  await expect(page.getByTestId('hub-screen')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'MONSTER SPELLER' })).toBeVisible();

  // เลือกโหมดท้าทาย (ยิงกระสุน) แล้วเริ่มเกม → เข้าฉากเกม
  await page.getByTestId('mode-challenge').click();
  await page.getByTestId('start-button').click();
  await expect(page.getByTestId('game-screen')).toBeVisible();

  // HUD: ตัวนับเวลาเริ่มที่ 3:00 (ยอมรับ 3:00–3:09 กันเฟรมเรซ) และคะแนน 0
  await expect(page.getByTestId('hud-timer')).toHaveText(/^⏱ 3:0[0-9]$/);
  await expect(page.getByTestId('hud-score')).toHaveText(/^🏆 0$/);

  // เลือกกระสุนด้วยการคลิกปุ่ม
  await page.getByTestId('bullet-กก').click();
  await expect(page.getByTestId('selected-bullet')).toContainText('กก');

  // เลือกกระสุนด้วยแป้นพิมพ์ (1–8 ผ่าน event.code)
  await page.keyboard.press('Digit4');
  await expect(page.getByTestId('selected-bullet')).toContainText('กบ');
  await page.keyboard.press('Digit8');
  await expect(page.getByTestId('selected-bullet')).toContainText('เกอว');
  await page.keyboard.press('Digit1');
  await expect(page.getByTestId('selected-bullet')).toContainText('กา');

  // กลับหน้าหลัก
  await page.getByTestId('back-button').click();
  await expect(page.getByTestId('hub-screen')).toBeVisible();
});

test('เปิด Modal Settings และปรับเสียง/ความเร็ว', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('settings-button').click();
  await expect(page.getByTestId('settings-modal')).toBeVisible();

  // สลับปิดเสียงเอฟเฟกต์
  const sound = page.getByTestId('setting-sound');
  await expect(sound).toBeChecked();
  await sound.click();
  await expect(sound).not.toBeChecked();

  // เปลี่ยนความเร็วเป็น "ช้า"
  await page.getByTestId('setting-speed-slow').click();
  await expect(page.getByTestId('setting-speed-slow')).toHaveClass(/active/);

  // ปิด Modal
  await page.getByTestId('settings-close').click();
  await expect(page.getByTestId('settings-modal')).not.toBeVisible();
});

test('เลือกด่านใน Hub แล้วเริ่มเกม — HUD แสดงด่านที่เลือก', async ({ page }) => {
  await page.goto('/');

  // เลือกโหมดท้าทาย (เทสนี้ตรวจ HUD กระสุน/เวลา)
  await page.getByTestId('mode-challenge').click();

  // เลือกด่าน 3
  await page.getByTestId('level-3').click();
  await expect(page.getByTestId('start-button')).toContainText('วงแหวน กด');
  await page.getByTestId('start-button').click();
  await expect(page.getByTestId('game-screen')).toBeVisible();
  await expect(page.getByTestId('hud-level')).toContainText('3');

  // กลับแล้วเลือกด่าน 8 (บอส)
  await page.getByTestId('back-button').click();
  await page.getByTestId('level-8').click();
  await expect(page.getByTestId('start-button')).toContainText('ป้อมจอมมาร');
});

test('เปิด Modal หอเกียรติยศ (Hall of Fame 10 อันดับ)', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('hall-of-fame-button').click();
  await expect(page.getByTestId('hof-modal')).toBeVisible();

  // มีแถวอันดับครบ 10
  const rows = page.getByTestId('hof-modal').locator('tbody tr');
  await expect(rows).toHaveCount(10);

  await page.getByTestId('hof-close').click();
  await expect(page.getByTestId('hof-modal')).not.toBeVisible();
});
