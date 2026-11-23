import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});
try {
  await page.goto("http://localhost:5179/");
  await page.getByRole("button", { name: "先练练手" }).tap();
  const box = await page.locator("canvas").boundingBox();
  if (!box) throw Error("Missing griddle");
  const at = (x, y) => [box.x + x * box.width, box.y + y * box.height];
  const stroke = async (start, end, steps = 18) => {
    await page.mouse.move(...at(...start));
    await page.mouse.down();
    await page.mouse.move(...at(...end), { steps });
    await page.mouse.up();
  };
  const spread = async () => {
    await page.mouse.move(...at(0.5, 0.5));
    await page.mouse.down();
    for (let row = 0; row < 12; row++)
      for (let col = 0; col < 12; col++)
        await page.mouse.move(...at(0.14 + col * 0.064, 0.14 + row * 0.064));
    await page.mouse.up();
  };
  await page.getByRole("button", { name: "倒入面糊", exact: true }).tap();
  await spread();
  await page.getByRole("button", { name: /下一步：打蛋/ }).tap();
  await page.locator(".tool-main").tap();
  await spread();
  await page.getByRole("button", { name: /下一步：翻面/ }).tap();
  await page.waitForFunction(
    () =>
      Number(
        document
          .querySelector(".heat-meter span")
          ?.textContent?.match(/\d+/)?.[0],
      ) >= 60,
    null,
    { timeout: 12000 },
  );
  await page.getByRole("button", { name: /现在翻面/ }).tap();
  await page
    .locator(".counter-station.sauce")
    .getByRole("button", { name: "甜面酱" })
    .tap();
  await stroke([0.3, 0.48], [0.68, 0.53]);
  await page.screenshot({ path: "tests/v7-mobile-brush.png" });
  await page.getByRole("button", { name: /下一步：加料/ }).tap();
  await page
    .locator(".counter-station.fill")
    .getByRole("button", { name: "葱花" })
    .tap();
  await stroke([0.3, 0.4], [0.68, 0.6]);
  await page.getByRole("button", { name: /下一步：折叠/ }).tap();
  for (const side of ["折左边", "折右边"]) {
    const button = page.getByRole("button", { name: new RegExp(side) });
    const bounds = await button.boundingBox();
    if (!bounds || bounds.y + bounds.height > 844)
      throw Error(`${side} button is outside mobile viewport`);
    await button.tap();
  }
  await page.waitForTimeout(760);
  await page.screenshot({ path: "tests/v5-mobile-folded.png" });
  await page.getByRole("button", { name: /折好了，装袋/ }).tap();
  await stroke([0.31, 0.5], [0.69, 0.5], 12);
  await stroke([0.5, 0.5], [0.84, 0.5], 12);
  await page.waitForTimeout(760);
  const handoff = page.getByRole("button", { name: "完成试吃" });
  const bounds = await handoff.boundingBox();
  if (!bounds || bounds.y < 0 || bounds.y + bounds.height > 844)
    throw Error("Mobile handoff food is outside viewport");
  await page.screenshot({ path: "tests/v5-mobile-handoff.png" });
  await handoff.tap();
  await page.getByText("出餐评价 / ORDER COMPLETE").waitFor();
  console.log("PASS: mobile buttons, folded food, bag, and customer handoff");
} finally {
  await browser.close();
}
