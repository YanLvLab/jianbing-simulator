import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const base = "http://localhost:5179/";
const click = async (name) => page.getByRole("button", { name }).click();
const draw = async () => {
  const b = await page.locator("canvas").boundingBox();
  if (!b) throw new Error("No griddle");
  const pos = (x, y) => [b.x + b.width * x, b.y + b.height * y];
  await page.mouse.move(...pos(0.5, 0.14));
  await page.mouse.down();
  for (let row = 0; row < 13; row++) {
    const y = 0.14 + row * 0.06;
    for (let col = 0; col < 15; col++) {
      const x = row % 2 ? 0.88 - col * 0.054 : 0.12 + col * 0.054;
      await page.mouse.move(...pos(x, y));
    }
  }
  await page.mouse.up();
};
const make = async () => {
  await click(/倒入面糊/);
  await draw();
  await click(/下一步：打蛋/);
  await click(/打一个鸡蛋/);
  await draw();
  await click(/下一步：翻面/);
  await page.waitForTimeout(8200);
  await click(/现在翻面/);
  await click(/甜面酱/);
  await click(/下一步：加料/);
  await click(/葱花/);
  await click(/薄脆/);
  await click(/下一步：折叠/);
  const b = await page.locator("canvas").boundingBox();
  const pos = (x, y) => [b.x + b.width * x, b.y + b.height * y];
  await page.mouse.move(...pos(0.22, 0.5));
  await page.mouse.down();
  await page.mouse.move(...pos(0.48, 0.5), { steps: 5 });
  await page.mouse.up();
  await page.mouse.move(...pos(0.78, 0.5));
  await page.mouse.down();
  await page.mouse.move(...pos(0.52, 0.5), { steps: 5 });
  await page.mouse.up();
  await click(/折好了，装袋/);
  await click(/装袋出餐/);
};
try {
  await page.goto(base);
  await page.screenshot({ path: "tests/menu-desktop.png", fullPage: true });
  await click(/开始营业/);
  await click(/第一炉烟火/);
  await make();
  await click(/接待下一位/);
  await make();
  await click(/查看今日结算/);
  const summary = await page.locator(".summary-card").innerText();
  if (!summary.includes("营业额") || !summary.includes("★"))
    throw new Error("Missing level summary");
  console.log("PASS: completed level 1 with stars");
  await page
    .locator(".summary-card")
    .getByRole("button", { name: "返回摊位" })
    .click();
  await click(/开始营业/);
  if (!(await page.getByRole("button", { name: /早起的邻居/ }).isEnabled()))
    throw new Error("Level 2 stayed locked");
  const coins = (await page.locator(".coin-display").innerText()).match(
    /\d+/,
  )?.[0];
  await page.reload();
  if (
    (await page.locator(".coin-display").innerText()).match(/\d+/)?.[0] !==
    coins
  )
    throw new Error("Coins did not persist");
  await click(/开始营业/);
  if (!(await page.getByRole("button", { name: /早起的邻居/ }).isEnabled()))
    throw new Error("Level 2 lost after reload");
  console.log("PASS: level unlock and coins persisted");
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await mobile.goto(base);
  await mobile.screenshot({ path: "tests/menu-mobile.png", fullPage: true });
  await mobile.getByRole("button", { name: "先练练手" }).click();
  await mobile.getByRole("button", { name: /倒入面糊/ }).click();
  const mb = await mobile.locator("canvas").boundingBox();
  if (!mb) throw new Error("Mobile griddle missing");
  await mobile.touchscreen.tap(mb.x + mb.width / 2, mb.y + mb.height / 2);
  if (
    (await mobile.locator(".work-instruction").innerText()).includes("覆盖 0%")
  )
    throw new Error("Touch did not paint");
  await mobile.screenshot({ path: "tests/game-mobile.png", fullPage: true });
  console.log("PASS: mobile touch hits the griddle");
  await mobile.close();
} finally {
  await browser.close();
}
