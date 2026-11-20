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
const make = async (addExtra = false) => {
  const ticket = await page.locator(".ticket p").innerText();
  await page.getByRole("button", { name: "倒入面糊", exact: true }).click();
  await draw();
  await click(/下一步：打蛋/);
  await page.locator(".tool-main").click();
  await draw();
  await click(/下一步：翻面/);
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
  await click(/现在翻面/);
  const sauceNames = ["甜面酱", "辣椒酱", "蒜蓉酱"];
  if (
    (await page.locator(".counter-station.sauce .station-vessel").count()) !== 3
  )
    throw new Error("Sauces are not all displayed");
  const sauceName = sauceNames.find((name) => ticket.includes(name));
  if (!sauceName) throw new Error(`No sauce on ticket: ${ticket}`);
  await page
    .locator(".counter-station.sauce")
    .getByRole("button", { name: sauceName })
    .click();
  const sauceBox = await page.locator("canvas").boundingBox();
  if (!sauceBox) throw new Error("No griddle for sauce");
  await page.mouse.move(
    sauceBox.x + sauceBox.width * 0.34,
    sauceBox.y + sauceBox.height * 0.48,
  );
  await page.mouse.down();
  await page.mouse.move(
    sauceBox.x + sauceBox.width * 0.66,
    sauceBox.y + sauceBox.height * 0.53,
    { steps: 16 },
  );
  await page.mouse.up();
  await click(/下一步：加料/);
  await page.screenshot({ path: "tests/v6-five-choice.png" });
  if (
    (await page.locator(".counter-station.fill .station-vessel").count()) !== 5
  )
    throw new Error("Five fillings are not displayed");
  if ((await page.locator(".counter-station.fill").innerText()).includes(" / "))
    throw new Error("Ingredient station leaks target counts");
  const fillingNames = ["葱花", "香菜", "薄脆", "火腿肠", "芝麻"].filter(
    (name) => ticket.includes(name),
  );
  if (fillingNames.length !== 2)
    throw new Error(`Level 1 did not request two of five: ${ticket}`);
  for (const name of fillingNames) {
    await page
      .locator(".counter-station.fill")
      .getByRole("button", { name })
      .click();
    await page.mouse.move(
      sauceBox.x + sauceBox.width * 0.35,
      sauceBox.y + sauceBox.height * 0.4,
    );
    await page.mouse.down();
    await page.mouse.move(
      sauceBox.x + sauceBox.width * 0.65,
      sauceBox.y + sauceBox.height * 0.6,
      { steps: 14 },
    );
    await page.mouse.up();
  }
  if (addExtra) {
    const extraName = ["葱花", "香菜", "薄脆", "火腿肠", "芝麻"].find(
      (name) => !fillingNames.includes(name),
    );
    await page
      .locator(".counter-station.fill")
      .getByRole("button", { name: extraName })
      .click();
    await page.mouse.move(
      sauceBox.x + sauceBox.width * 0.38,
      sauceBox.y + sauceBox.height * 0.48,
    );
    await page.mouse.down();
    await page.mouse.move(
      sauceBox.x + sauceBox.width * 0.62,
      sauceBox.y + sauceBox.height * 0.5,
      { steps: 12 },
    );
    await page.mouse.up();
  }
  await click(/下一步：折叠/);
  const b = await page.locator("canvas").boundingBox();
  const pos = (x, y) => [b.x + b.width * x, b.y + b.height * y];
  await click(/折左边/);
  await click(/折右边/);
  await click(/折好了，装袋/);
  await page.mouse.move(...pos(0.31, 0.5));
  await page.mouse.down();
  await page.mouse.move(...pos(0.69, 0.5), { steps: 10 });
  await page.mouse.up();
  await page.mouse.move(...pos(0.5, 0.5));
  await page.mouse.down();
  await page.mouse.move(...pos(0.84, 0.5), { steps: 10 });
  await page.mouse.up();
  await page.locator(".customer-handoff").click();
};
try {
  await page.goto(base);
  await page.screenshot({ path: "tests/menu-desktop.png", fullPage: true });
  await click(/开始营业/);
  await click(/第一炉烟火/);
  await make();
  await page.waitForTimeout(930);
  await page.screenshot({ path: "tests/v2-level-handoff.png" });
  await click(/接待下一位/);
  await make(true);
  const wrongResult = await page.locator(".result-card").innerText();
  if (!wrongResult.includes("多放"))
    throw new Error("Wrong topping did not appear in the result");
  const satisfaction = Number(wrongResult.match(/满意度\s*(\d+)%/)?.[1]);
  if (!Number.isFinite(satisfaction) || satisfaction > 68)
    throw new Error("Wrong topping still gave high satisfaction");
  await page.screenshot({ path: "tests/v6-wrong-order.png" });
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
  const mobilePan = await mobile.locator("canvas").boundingBox();
  const mobilePour = await mobile
    .getByRole("button", { name: "倒入面糊", exact: true })
    .boundingBox();
  const mobileNext = mobile.getByRole("button", { name: /先倒入面糊/ });
  if (
    !mobilePan ||
    !mobilePour ||
    mobilePan.y + mobilePan.height > 844 ||
    mobilePour.y + mobilePour.height > 844
  )
    throw new Error("Mobile pan or pour button is below the viewport");
  if (await mobileNext.isEnabled())
    throw new Error("Next stage should wait for batter");
  await mobile.getByRole("button", { name: "倒入面糊", exact: true }).click();
  const mb = await mobile.locator("canvas").boundingBox();
  if (!mb) throw new Error("Mobile griddle missing");
  await mobile.touchscreen.tap(mb.x + mb.width / 2, mb.y + mb.height / 2);
  if (
    (await mobile.locator(".work-instruction").innerText()).includes("覆盖 0%")
  )
    throw new Error("Touch did not paint");
  await mobile.screenshot({ path: "tests/game-mobile.png" });
  console.log("PASS: mobile touch hits the griddle");
  await mobile.close();
} finally {
  await browser.close();
}
