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
const base = process.env.TEST_BASE_URL ?? "http://localhost:5179/";
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
  await page.getByRole("button", { name: "倒入面糊", exact: true }).click();
  await page.waitForTimeout(180);
  await page.screenshot({ path: "tests/v2-anim-pour.png" });
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
  await page.locator(".tool-main").click();
  await page.waitForTimeout(450);
  await page.screenshot({ path: "tests/v2-anim-egg.png" });
  await page.mouse.move(pt(0.5, 0.5).x, pt(0.5, 0.5).y);
  await page.mouse.down();
  let eggMidCaptured = false;
  for (let radius = 0.04; radius <= 0.34; radius += 0.05)
    for (let i = 0; i <= 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      await page.mouse.move(
        pt(0.5 + Math.cos(a) * radius, 0.5 + Math.sin(a) * radius).x,
        pt(0.5 + Math.cos(a) * radius, 0.5 + Math.sin(a) * radius).y,
      );
      if (!eggMidCaptured && radius >= 0.19 && i === 14) {
        await page.screenshot({ path: "tests/v5-egg-mid-stroke.png" });
        eggMidCaptured = true;
      }
    }
  await page.mouse.up();
  await page.screenshot({ path: "tests/v2-egg-spread.png" });
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
  const heat = await page.locator(".heat-meter").boundingBox();
  const toolBar = await page.locator(".tools-panel").boundingBox();
  if (!heat || !toolBar || heat.y + heat.height >= toolBar.y)
    throw Error("Heat meter hidden by toolbar");
  await page.screenshot({ path: "tests/v3-heat-visible.png" });
  await page.getByRole("button", { name: /现在翻面/ }).click();
  await page.waitForTimeout(220);
  await page.screenshot({ path: "tests/v2-anim-flip.png" });
  const frameTimes = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const times = [];
        let start = 0;
        function frame(t) {
          if (!start) start = t;
          times.push(t);
          if (t - start < 500) requestAnimationFrame(frame);
          else resolve(times);
        }
        requestAnimationFrame(frame);
      }),
  );
  const gaps = frameTimes
    .slice(1)
    .map((t, i) => t - frameTimes[i])
    .sort((a, b) => a - b);
  console.log(
    `Flip animation frames: ${frameTimes.length}, median gap ${gaps[Math.floor(gaps.length / 2)].toFixed(1)}ms`,
  );
  await page
    .locator(".counter-station.sauce")
    .getByRole("button", { name: "甜面酱" })
    .click();
  await page.mouse.move(pt(0.35, 0.48).x, pt(0.35, 0.48).y);
  await page.mouse.down();
  for (let i = 1; i <= 28; i++) {
    await page.mouse.move(
      pt(0.35 + (0.3 * i) / 28, 0.48 + (0.04 * i) / 28).x,
      pt(0.35 + (0.3 * i) / 28, 0.48 + (0.04 * i) / 28).y,
    );
    if (i === 14) await page.screenshot({ path: "tests/v7-brush-during.png" });
  }
  await page.mouse.up();
  await page.screenshot({ path: "tests/v2-anim-sauce.png" });
  const remaining = await page
    .locator(".station-load em")
    .evaluate((element) => Number.parseFloat(element.style.width));
  if (remaining >= 40) throw new Error(`Brush did not fade: ${remaining}%`);
  await page
    .locator(".counter-station.sauce")
    .getByRole("button", { name: "甜面酱" })
    .click();
  await page.mouse.move(pt(0.64, 0.57).x, pt(0.64, 0.57).y);
  await page.mouse.down();
  await page.mouse.move(pt(0.37, 0.59).x, pt(0.37, 0.59).y, { steps: 16 });
  await page.mouse.up();
  await page.screenshot({ path: "tests/v7-brush-second-pass.png" });
  if (
    !(await page.locator(".counter-station.sauce").innerText()).includes(
      "已加 2",
    )
  )
    throw new Error("Redipping did not create a second sauce application");
  await page.getByRole("button", { name: /下一步：加料/ }).click();
  await page
    .locator(".counter-station.fill")
    .getByRole("button", { name: "葱花" })
    .click();
  await page.mouse.move(pt(0.33, 0.38).x, pt(0.33, 0.38).y);
  await page.mouse.down();
  await page.mouse.move(pt(0.66, 0.62).x, pt(0.66, 0.62).y, { steps: 18 });
  await page.mouse.up();
  await page.waitForTimeout(150);
  await page.screenshot({ path: "tests/v2-anim-fill.png" });
  for (const name of ["香菜", "薄脆", "火腿肠"]) {
    await page
      .locator(".counter-station.fill")
      .getByRole("button", { name })
      .click();
    await page.mouse.move(pt(0.35, 0.58).x, pt(0.35, 0.58).y);
    await page.mouse.down();
    await page.mouse.move(pt(0.65, 0.38).x, pt(0.65, 0.38).y, { steps: 18 });
    await page.mouse.up();
  }
  await page.screenshot({ path: "tests/v5-herbs-on-pancake.png" });
  await page.getByRole("button", { name: /下一步：折叠/ }).click();
  await page.getByRole("button", { name: /折左边/ }).click();
  await page.waitForTimeout(140);
  await page.screenshot({ path: "tests/v2-anim-fold.png" });
  await page.getByRole("button", { name: /折右边/ }).click();
  await page.waitForTimeout(750);
  await page.screenshot({ path: "tests/v3-folded-final.png" });
  await page.getByRole("button", { name: /折好了，装袋/ }).click();
  await page.screenshot({ path: "tests/v3-before-cut.png" });
  await page.mouse.move(pt(0.31, 0.5).x, pt(0.31, 0.5).y);
  await page.mouse.down();
  await page.mouse.move(pt(0.69, 0.5).x, pt(0.69, 0.5).y, { steps: 12 });
  await page.mouse.up();
  await page.screenshot({ path: "tests/v3-after-cut.png" });
  await page.mouse.move(pt(0.5, 0.5).x, pt(0.5, 0.5).y);
  await page.mouse.down();
  await page.mouse.move(pt(0.84, 0.5).x, pt(0.84, 0.5).y, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(760);
  await page.screenshot({ path: "tests/v3-bagged.png" });
  await page.getByRole("button", { name: "完成试吃" }).click();
  await page.waitForTimeout(180);
  await page.screenshot({ path: "tests/v2-anim-bag.png" });
  await page.waitForTimeout(170);
  await page.screenshot({ path: "tests/v2-anim-handoff.png" });
  await page.getByText("出餐评价 / ORDER COMPLETE").waitFor();
  await page.screenshot({ path: "tests/playthrough.png", fullPage: true });
  const score = await page.locator(".result-score").innerText();
  console.log(`PASS: free playthrough reached score ${score}`);
  await page.getByRole("button", { name: /再做一份/ }).click();
  await page.getByRole("button", { name: /暂停/ }).click();
  await page.getByRole("button", { name: "返回主菜单" }).click();
  await page.getByRole("button", { name: /开始营业/ }).click();
  await page.getByRole("button", { name: /第一炉烟火/ }).click();
  await page.getByText("今日小票").waitFor();
  console.log("PASS: level order and customer loaded");
  await page.reload();
  await page.locator(".app-shell").waitFor();
  console.log("PASS: reload works");
} finally {
  await browser.close();
}
