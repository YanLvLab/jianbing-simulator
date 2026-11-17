import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const base = "http://localhost:5179/";
try {
  await page.goto(base);
  await page.getByRole("button", { name: "先练练手" }).click();
  await page.getByRole("button", { name: "杂粮面糊" }).click();
  if (
    !(
      await page.getByRole("button", { name: "杂粮面糊" }).getAttribute("class")
    )?.includes("selected")
  )
    throw new Error("Batter selection failed");
  await page.getByRole("button", { name: /倒入面糊/ }).click();
  const canvas = page.locator("canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas missing");
  const pt = (x, y) => ({
    x: box.x + box.width * x,
    y: box.y + box.height * y,
  });
  await page.mouse.move(pt(0.5, 0.5).x, pt(0.5, 0.5).y);
  await page.mouse.down();
  for (let radius = 0.04; radius <= 0.39; radius += 0.045)
    for (let i = 0; i <= 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      await page.mouse.move(
        pt(0.5 + Math.cos(a) * radius, 0.5 + Math.sin(a) * radius).x,
        pt(0.5 + Math.cos(a) * radius, 0.5 + Math.sin(a) * radius).y,
      );
    }
  await page.mouse.up();
  await page.getByRole("button", { name: /下一步：打蛋/ }).click();
  await page.getByRole("button", { name: /打一个鸡蛋/ }).click();
  await page.mouse.move(pt(0.5, 0.5).x, pt(0.5, 0.5).y);
  await page.mouse.down();
  for (let radius = 0.04; radius <= 0.34; radius += 0.05)
    for (let i = 0; i <= 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      await page.mouse.move(
        pt(0.5 + Math.cos(a) * radius, 0.5 + Math.sin(a) * radius).x,
        pt(0.5 + Math.cos(a) * radius, 0.5 + Math.sin(a) * radius).y,
      );
    }
  await page.mouse.up();
  await page.getByRole("button", { name: /下一步：翻面/ }).click();
  await page.waitForTimeout(8500);
  await page.getByRole("button", { name: /现在翻面/ }).click();
  await page.getByRole("button", { name: /甜面酱/ }).click();
  await page.getByRole("button", { name: /下一步：加料/ }).click();
  for (const name of ["葱花", "香菜", "薄脆", "火腿肠"])
    await page.getByRole("button", { name: new RegExp(name) }).click();
  await page.getByRole("button", { name: /下一步：折叠/ }).click();
  await page.mouse.move(pt(0.22, 0.5).x, pt(0.22, 0.5).y);
  await page.mouse.down();
  await page.mouse.move(pt(0.48, 0.5).x, pt(0.48, 0.5).y, { steps: 8 });
  await page.mouse.up();
  await page.mouse.move(pt(0.78, 0.5).x, pt(0.78, 0.5).y);
  await page.mouse.down();
  await page.mouse.move(pt(0.52, 0.5).x, pt(0.52, 0.5).y, { steps: 8 });
  await page.mouse.up();
  await page.getByRole("button", { name: /折好了，装袋/ }).click();
  await page.getByRole("button", { name: /装袋出餐/ }).click();
  await page.getByText("出餐评价 / ORDER COMPLETE").waitFor();
  await page.screenshot({ path: "tests/playthrough.png", fullPage: true });
  const score = await page.locator(".result-score").innerText();
  console.log(`PASS: free playthrough reached score ${score}`);
  await page.getByRole("button", { name: /再做一份/ }).click();
  await page
    .getByRole("button", { name: /返回摊位/ })
    .first()
    .click();
  await page.getByRole("button", { name: /开始营业/ }).click();
  await page.getByRole("button", { name: /第一炉烟火/ }).click();
  await page.getByText("今日小票").waitFor();
  console.log("PASS: level order and customer loaded");
  await page.reload();
  await page.getByText("开张了！").waitFor();
  console.log("PASS: reload works");
} finally {
  await browser.close();
}
