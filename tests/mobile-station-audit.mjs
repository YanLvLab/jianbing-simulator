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
  await page.getByRole("button", { name: "先练练手" }).click();
  const draw = async () => {
    const box = await page.locator("canvas").boundingBox();
    if (!box) throw Error("Missing mobile griddle");
    const at = (x, y) => [box.x + x * box.width, box.y + y * box.height];
    await page.mouse.move(...at(0.5, 0.5));
    await page.mouse.down();
    for (let row = 0; row < 11; row++)
      for (let col = 0; col < 11; col++)
        await page.mouse.move(...at(0.16 + col * 0.068, 0.16 + row * 0.068));
    await page.mouse.up();
  };
  await page.getByRole("button", { name: "倒入面糊", exact: true }).click();
  await draw();
  await page.getByRole("button", { name: /下一步：打蛋/ }).click();
  await page.locator(".tool-main").click();
  await draw();
  await page.getByRole("button", { name: /下一步：翻面/ }).click();
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
  await page.getByRole("button", { name: /现在翻面/ }).click();
  await page.waitForTimeout(900);
  const check = async (stage) => {
    const station = await page.locator(".counter-station").boundingBox();
    const button = await page
      .locator(".tool-bottom .primary-button")
      .boundingBox();
    const pan = await page.locator("canvas").boundingBox();
    if (
      !station ||
      !button ||
      !pan ||
      station.y + station.height > 844 ||
      button.y + button.height > 844 ||
      pan.y + pan.height > station.y
    )
      throw Error(`${stage} does not fit with griddle and controls`);
    await page.screenshot({ path: `tests/mobile-${stage}.png` });
    console.log(
      `${stage}: pan ${Math.round(pan.y)}..${Math.round(pan.y + pan.height)}, station ${Math.round(station.y)}..${Math.round(station.y + station.height)}, action ${Math.round(button.y)}..${Math.round(button.y + button.height)}`,
    );
  };
  await check("sauce");
  await page.getByRole("button", { name: /下一步：加料/ }).click();
  await check("fill");
  console.log("PASS: mobile sauce and filling fit in one viewport");
} finally {
  await browser.close();
}
