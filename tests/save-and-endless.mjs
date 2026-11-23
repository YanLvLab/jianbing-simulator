import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
const base = "http://localhost:5179/";
const key = "jianbing-simulator-save-v1";
try {
  await page.goto(base);
  await page.getByRole("button", { name: /游戏设置/ }).click();
  await page.getByRole("button", { name: /音效：开启/ }).click();
  await page.getByRole("button", { name: /减少动态效果：关闭/ }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出存档" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  const fs = await import("node:fs/promises");
  const exported = JSON.parse(await fs.readFile(path, "utf8"));
  if (
    exported.sound !== false ||
    exported.reducedMotion !== true ||
    exported.version !== 1
  )
    throw new Error("Export mismatch");
  exported.coins = 300;
  exported.unlockedLevel = 10;
  await page.locator("input[type=file]").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(exported)),
  });
  await page.getByText("存档导入成功。").waitFor();
  await page.getByRole("button", { name: "返回摊位" }).click();
  await page.getByRole("button", { name: /摊位商店/ }).click();
  await page.getByRole("button", { name: "升级 · ¥60" }).click();
  await page.getByRole("button", { name: "¥80" }).click();
  await page.getByRole("button", { name: "购买 · ¥90" }).click();
  await page.reload();
  const stored = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)),
    key,
  );
  if (
    stored.coins !== 70 ||
    stored.upgrades.griddle !== 1 ||
    !stored.ingredients.includes("garlic") ||
    !stored.decoration
  )
    throw new Error("Shop or save failed");
  console.log(
    "PASS: export, import, spend, upgrade, ingredient and decoration persisted",
  );
  await page.getByRole("button", { name: /重置进度/ }).click();
  await page.getByRole("alert").getByText(/从第 1 关重新开始/).waitFor();
  await page.getByRole("button", { name: "取消" }).click();
  if (!(await page.locator(".coin-display").innerText()).includes("70"))
    throw new Error("Cancel reset changed progress");
  await page.getByRole("button", { name: "重置游戏进度" }).click();
  await page.getByRole("button", { name: "确认清空进度" }).click();
  const reset = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)),
    key,
  );
  if (
    reset.coins !== 0 ||
    reset.unlockedLevel !== 1 ||
    reset.upgrades.griddle !== 0 ||
    reset.activeRun !== null ||
    reset.sound !== false ||
    reset.reducedMotion !== true
  )
    throw new Error("Reset did not clear progress or preserve settings");
  await page.reload();
  await page.getByText(/已解锁第 1 关/).waitFor();
  if (!(await page.locator(".coin-display").innerText()).includes("0"))
    throw new Error("Reset progress did not survive reload");
  await page.evaluate((k) => localStorage.setItem(k, "{broken"), key);
  await page.reload();
  if (!(await page.locator(".coin-display").innerText()).includes("0"))
    throw new Error("Corrupt save did not recover");
  console.log("PASS: reset and corrupt-save recovery");
  await page.getByRole("button", { name: "先练练手" }).click();
  await page.getByRole("button", { name: "倒入面糊", exact: true }).click();
  const b = await page.locator("canvas").boundingBox();
  await page.mouse.move(b.x + b.width * 0.5, b.y + b.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * 0.6, b.y + b.height * 0.5);
  await page.mouse.up();
  await page.waitForTimeout(1800);
  await page.reload();
  await page.getByText("铁板先关小火。").waitFor();
  await page.getByRole("button", { name: "继续营业" }).click();
  if ((await page.locator(".work-instruction").innerText()).includes("覆盖 0%"))
    throw new Error("Active run did not restore");
  console.log("PASS: active run restored after refresh");
  await page.getByRole("button", { name: /暂停/ }).click();
  await page.getByRole("button", { name: "返回主菜单" }).click();
  await page
    .getByRole("button", { name: /无尽经营/ })
    .first()
    .click();
  await page.waitForTimeout(1800);
  await page.evaluate((k) => {
    const s = JSON.parse(localStorage.getItem(k));
    s.activeRun.missed = 2;
    s.activeRun.served = 2;
    s.activeRun.revenue = 33;
    s.activeRun.bestPerfectStreak = 1;
    s.activeRun.order.patience = 1;
    s.activeRun.customerWait = 0;
    localStorage.setItem(k, JSON.stringify(s));
  }, key);
  await page.reload();
  await page.getByRole("button", { name: "继续营业" }).click();
  await page.getByText("无尽经营结束").waitFor({ timeout: 7000 });
  await page.waitForTimeout(100);
  const high = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)).endless,
    key,
  );
  if (high.revenue !== 33 || high.served !== 2 || high.perfectStreak !== 1)
    throw new Error("Endless highs not stored");
  console.log("PASS: endless failure and records");
} finally {
  await browser.close();
}
