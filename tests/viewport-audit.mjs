import { chromium } from "playwright";
const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  await page.goto("http://localhost:5179/");
  await page.getByRole("button", { name: "先练练手" }).click();
  const pan = await page.locator(".griddle-wrap").boundingBox();
  const tools = await page.locator(".tools-panel").boundingBox();
  const instruction = await page.locator(".work-instruction").boundingBox();
  const viewport = await page.evaluate(() => ({
    height: innerHeight,
    scrollHeight: document.documentElement.scrollHeight,
  }));
  if (!pan || !tools || !instruction) throw Error("Missing game layout");
  if (pan.y + pan.height > tools.y - 4)
    throw Error(`Pan covered by tools: ${JSON.stringify({ pan, tools })}`);
  if (instruction.y + instruction.height > tools.y - 4)
    throw Error(
      `Cooking hint covered by tools: ${JSON.stringify({ instruction, tools })}`,
    );
  if (viewport.scrollHeight > viewport.height + 5)
    throw Error(`Desktop game scrolls: ${JSON.stringify(viewport)}`);
  await page.screenshot({ path: "tests/viewport-1440x900.png" });
  console.log(
    "PASS: 1440x900 pan and instruction clear of tools; no page scroll",
    { pan, tools, instruction },
  );
} finally {
  await browser.close();
}
