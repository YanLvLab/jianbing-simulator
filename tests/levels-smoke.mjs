import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
try {
  await page.goto("http://localhost:5179/");
  await page.evaluate(() => {
    const key = "jianbing-simulator-save-v1";
    const save = JSON.parse(localStorage.getItem(key));
    save.unlockedLevel = 10;
    save.ingredients = [
      "egg",
      "scallion",
      "cilantro",
      "sweet",
      "chili",
      "crispy",
      "ham",
    ];
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.reload();
  for (let level = 1; level <= 10; level++) {
    await page.getByRole("button", { name: /开始营业/ }).click();
    await page
      .locator(".level-card")
      .nth(level - 1)
      .click();
    await page.getByText("今日小票").waitFor();
    const text = await page.locator(".game-hud").innerText();
    if (!text.includes(String(level).padStart(2, "0")))
      throw new Error(`Level ${level} did not start`);
    await page.getByRole("button", { name: /暂停/ }).click();
    await page.getByRole("button", { name: "返回主菜单" }).click();
  }
  console.log("PASS: all 10 level configurations open with a customer order");
} finally {
  await browser.close();
}
