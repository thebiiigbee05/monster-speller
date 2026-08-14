import { test, expect, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// เทส E2E โหมดเรียนรู้ (docs/04-chapter-4 ข้อ 4.6)
// เกมเริ่มด้วยโหมดเรียนรู้เป็นค่าเริ่มต้น — ไม่มีเวลา/HP/กระสุน
// เลือกมาตรา 1 จาก 3 ตัวเลือก → ถูก = เลเซอร์แปลงมอนสเตอร์, ผิด = คำใบ้ + ปิดปุ่ม
// ---------------------------------------------------------------------------

type EngineLike = {
  monsters: { state: string; word: { matra: string; word: string } }[];
  answer: (m: string) => boolean;
  currentChoices: () => string[];
};

interface EngineWindow {
  __monsterSpellerEngine: EngineLike;
}

async function startLearnMode(page: Page): Promise<EngineLike> {
  await page.goto('/');
  await expect(page.getByTestId('hub-screen')).toBeVisible();
  await page.getByTestId('start-button').click();
  await expect(page.getByTestId('game-screen')).toBeVisible();

  // โหมดเรียนรู้: มีแถบตัวเลือก 3 ปุ่ม ไม่มีแถบกระสุน/ตัวจับเวลา
  await expect(page.getByTestId('learn-choices')).toBeVisible();
  await expect(page.getByTestId('bullets')).not.toBeVisible();
  await expect(page.getByTestId('hud-timer')).not.toBeVisible();

  await page.waitForFunction(
    () => Boolean((window as unknown as Partial<EngineWindow>).__monsterSpellerEngine),
  );
  return page.evaluate(() => (window as unknown as EngineWindow).__monsterSpellerEngine);
}

test('โหมดเรียนรู้: มีตัวเลือก 3 ปุ่ม และตอบถูก → มอนสเตอร์เป็นมิตร + คะแนน', async ({ page }) => {
  await startLearnMode(page);

  // มีปุ่มตัวเลือก 3 ปุ่ม (ทุกปุ่มเป็นมาตรา มาตรา-*)
  const choiceButtons = page.getByTestId('learn-choices').locator('button');
  await expect(choiceButtons).toHaveCount(3);

  // หาคำตอบที่ถูกจากมอนสเตอร์บนจอ แล้วคลิกปุ่มมาตรานั้น
  const matra = await page.evaluate(
    () => (window as unknown as EngineWindow).__monsterSpellerEngine.monsters[0].word.matra,
  );
  const correctBtn = page.getByTestId(`learn-choice-${matra}`);
  await expect(correctBtn).toBeEnabled();
  await correctBtn.click();

  // ถูก → มอนสเตอร์เข้าสถานะระเบิด (เลเซอร์อัตโนมัติ) + คะแนนเพิ่ม
  await expect
    .poll(async () =>
      page.evaluate(() => (window as unknown as EngineWindow).__monsterSpellerEngine.monsters[0]?.state),
    )
    .toBe('exploding');
  await expect(page.getByTestId('hud-score')).not.toHaveText(/^🏆 0$/);
  await expect(page.getByTestId('hint-banner')).not.toBeVisible();
  // ปุ่มคำตอบที่ถูกถูกปิด (ตอบซ้ำไม่ได้)
  await expect(correctBtn).toBeDisabled();
});

test('โหมดเรียนรู้: ตอบผิด → คำใบ้ปรากฏ + ไม่เสีย HP (ไม่มี HP ในโหมดนี้)', async ({ page }) => {
  await startLearnMode(page);

  // หาปุ่มที่ผิด (มาตราไม่ตรง) จากตัวเลือก 3 ปุ่ม
  const wrongMatra = await page.evaluate(() => {
    const engine = (window as unknown as EngineWindow).__monsterSpellerEngine;
    const correct = engine.monsters[0].word.matra;
    const choices = engine.currentChoices();
    return choices.find((c) => c !== correct)!;
  });
  await page.getByTestId(`learn-choice-${wrongMatra}`).click();

  // คำใบ้ปรากฏ + คะแนนยังเป็น 0 (ไม่มีการลงโทษ)
  await expect(page.getByTestId('hint-banner')).toBeVisible();
  await expect(page.getByTestId('hint-banner')).toContainText('สะกด');
  await expect(page.getByTestId('hud-score')).toHaveText(/^🏆 0$/);
  // ไม่มี HUD HP ในโหมดเรียนรู้
  await expect(page.getByTestId('hud-hp')).not.toBeVisible();
  // ยังตอบใหม่ได้ (ปุ่มผิดไม่ปิดถาวร — ปิดเฉพาะตัวที่ตอบถูก)
  await expect(page.getByTestId(`learn-choice-${wrongMatra}`)).not.toBeDisabled();
});
