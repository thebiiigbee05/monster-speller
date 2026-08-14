import { readFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';

const bank = JSON.parse(readFileSync('src/content/words/wordBank.json', 'utf-8')) as {
  words: Record<string, unknown>[];
};

// ---------------------------------------------------------------------------
// เทส E2E ระบบยิงหลัก (docs/10-chapter-10-testing-qa.md ข้อ 10.1)
// ใช้ debugSpawn ของ GameEngine (เปิดผ่าน window.__monsterSpellerEngine ในโหมด dev)
// เพื่อวางมอนสเตอร์ที่ตำแหน่งแน่นอน → เทส deterministic
// ---------------------------------------------------------------------------

type EngineLike = {
  monsters: { state: string; word: { matra: string } }[];
  debugSpawn: (word: Record<string, unknown>, x?: number, y?: number) => void;
};

interface EngineWindow {
  __monsterSpellerEngine: EngineLike;
}

async function startGameAndGetEngine(page: Page): Promise<EngineLike> {
  await page.goto('/');
  await page.getByTestId('start-button').click();
  await expect(page.getByTestId('game-canvas')).toBeVisible();
  // รอให้ engine ถูกผูกกับ window (โหลดสไปรต์เสร็จ)
  await page.waitForFunction(
    () => Boolean((window as unknown as Partial<EngineWindow>).__monsterSpellerEngine),
  );
  return page.evaluate(() => (window as unknown as EngineWindow).__monsterSpellerEngine);
}

/**
 * คลิกบน canvas ที่พิกัดในเกม (960×540)
 * ใช้ locator.click(position) เพราะเลื่อน element เข้า viewport ให้อัตโนมัติ
 * (mouse.click ตรง ๆ พลาดเมื่อ canvas อยู่นอกจอ — เจอตอนดีบัก)
 */
async function clickArena(page: Page, gx: number, gy: number) {
  const box = (await page.getByTestId('game-canvas').boundingBox())!;
  await page.getByTestId('game-canvas').click({
    position: { x: (gx / 960) * box.width, y: (gy / 540) * box.height },
  });
}

async function pickWord(_page: Page, matra: string): Promise<Record<string, unknown>> {
  const word = bank.words.find((w) => w.matra === matra && w.regular === true)!;
  expect(word).toBeTruthy();
  return word;
}

test('ยิงถูกมาตรา → มอนสเตอร์ระเบิด + ได้คะแนน (Core Loop — docs/04-chapter-4 ข้อ 4.5)', async ({ page }) => {
  await startGameAndGetEngine(page);

  const word = await pickWord(page, 'กก');
  await page.evaluate(
    (w) => (window as unknown as EngineWindow).__monsterSpellerEngine.debugSpawn(w, 700, 260),
    word,
  );

  // เลือกกระสุน "กก" (ตรงมาตรา) แล้วคลิกยิง
  await page.getByTestId('bullet-กก').click();
  await clickArena(page, 700, 260);

  // มอนสเตอร์เข้าสถานะระเบิด + คะแนน > 0 (Walker = 100 + โบนัสคอมโบ)
  await expect
    .poll(async () =>
      page.evaluate(() => (window as unknown as EngineWindow).__monsterSpellerEngine.monsters[0]?.state),
    )
    .toBe('exploding');
  await expect(page.getByTestId('hud-score')).not.toHaveText(/^🏆 0$/);
  await expect(page.getByTestId('hint-banner')).not.toBeVisible();
});

test('ยิงผิดมาตรา → มอนสเตอร์ชะงัก + คำใบ้ + ไม่ได้คะแนน (ระบบช่วยเหลือ 4.7)', async ({ page }) => {
  await startGameAndGetEngine(page);

  const word = await pickWord(page, 'กก');
  await page.evaluate(
    (w) => (window as unknown as EngineWindow).__monsterSpellerEngine.debugSpawn(w, 700, 260),
    word,
  );

  // เลือกกระสุน "กบ" (ผิดมาตรา) แล้วคลิกยิง
  await page.getByTestId('bullet-กบ').click();
  await clickArena(page, 700, 260);

  // คำใบ้ปรากฏ (คำนี้ออกเสียงเหมือน … สะกด) และคะแนนยังเป็น 0
  await expect(page.getByTestId('hint-banner')).toBeVisible();
  await expect(page.getByTestId('hint-banner')).toContainText('สะกด');
  await expect(page.getByTestId('hud-score')).toHaveText(/^🏆 0$/);
  // มอนสเตอร์ชะงัก (ตรวจผ่าน evaluate เอา state สด)
  await expect
    .poll(async () =>
      page.evaluate(() => (window as unknown as EngineWindow).__monsterSpellerEngine.monsters[0]?.state),
    )
    .toBe('stunned');
});
