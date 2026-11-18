import { chromium } from "playwright";
const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  args: ["--no-sandbox"],
});
try {
  for (const [name, width, height] of [
    ["desktop", 1440, 900],
    ["mobile", 390, 844],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      hasTouch: name === "mobile",
      isMobile: name === "mobile",
    });
    await page.goto("http://localhost:5179/");
    await page.screenshot({
      path: `tests/v2-menu-${name}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "先练练手" }).click();
    await page.screenshot({
      path: `tests/v2-game-${name}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: /倒入面糊/ }).click();
    const b = await page.locator("canvas").boundingBox();
    if (!b) throw Error("No canvas");
    await page.mouse.move(b.x + b.width * 0.5, b.y + b.height * 0.5);
    await page.mouse.down();
    for (let i = 0; i < 60; i++) {
      const a = i * 0.39,
        r = 0.02 + i * 0.005;
      await page.mouse.move(
        b.x + b.width * (0.5 + Math.cos(a) * r),
        b.y + b.height * (0.5 + Math.sin(a) * r),
      );
    }
    await page.mouse.up();
    await page.screenshot({
      path: `tests/v2-spread-${name}.png`,
      fullPage: true,
    });
    await page.goto("http://localhost:5179/");
    if (await page.getByRole("button", { name: "继续营业" }).count())
      await page.getByRole("button", { name: "返回主菜单" }).click();
    await page.getByRole("button", { name: /开始营业/ }).click();
    await page.locator(".level-card").first().click();
    await page.screenshot({
      path: `tests/v2-customer-${name}.png`,
      fullPage: true,
    });
    console.log(`PASS: ${name} scene, griddle and spread rendered`);
    await page.close();
  }
} finally {
  await browser.close();
}
