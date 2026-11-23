import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage();
  await page.goto("http://localhost:5179/");
  const result = await page.evaluate(async () => {
    const { INGREDIENTS, makeOrder } = await import("/src/data/config.ts");
    const { evaluate, newPancake } = await import("/src/game/engine.ts");
    const { defaultSave, loadSave, importSave, SAVE_KEY } =
      await import("/src/systems/save.ts");
    const available = INGREDIENTS.filter((item) => item.cost === 0).map(
      (item) => item.id,
    );
    const seen = new Set();
    for (let i = 0; i < 80; i++) {
      const order = makeOrder(1, i + 1, "level", available);
      const fillings = [
        "scallion",
        "cilantro",
        "crispy",
        "ham",
        "sesame",
      ].filter((id) => order.wants[id] > 0);
      const sauces = ["sweet", "chili", "garlic"].filter(
        (id) => order.wants[id] > 0,
      );
      if (fillings.length !== 2 || sauces.length !== 1)
        throw new Error(
          `Bad five-choice order: ${JSON.stringify(order.wants)}`,
        );
      fillings.forEach((id) => seen.add(id));
    }
    if (seen.size !== 5) throw new Error("Not all five fillings can appear");
    let garlicSeen = false;
    for (let i = 0; i < 200; i++) {
      const order = makeOrder(5, i + 1, "level", [...available, "garlic"]);
      const fillings = [
        "scallion",
        "cilantro",
        "crispy",
        "ham",
        "sesame",
      ].filter((id) => order.wants[id] > 0);
      if (fillings.length !== 3)
        throw new Error(`Bad later order: ${JSON.stringify(order.wants)}`);
      if (order.customer.kind === "cilantroHater" && order.wants.cilantro)
        throw new Error("Cilantro hater received cilantro");
      if (order.customer.kind === "cilantroFan" && order.wants.cilantro !== 2)
        throw new Error("Cilantro fan missing double cilantro");
      garlicSeen ||= order.wants.garlic > 0;
    }
    if (!garlicSeen) throw new Error("Purchased garlic never enters orders");

    const oldSave = defaultSave();
    oldSave.ingredients = ["egg", "sweet", "scallion", "crispy"];
    localStorage.setItem(SAVE_KEY, JSON.stringify(oldSave));
    const restored = loadSave();
    const imported = importSave(JSON.stringify(oldSave));
    for (const id of available)
      if (
        !restored.ingredients.includes(id) ||
        !imported.ingredients.includes(id)
      )
        throw new Error(`Old save did not receive base ingredient ${id}`);
    oldSave.coins = -9;
    localStorage.setItem(SAVE_KEY, JSON.stringify(oldSave));
    if (
      loadSave().coins !== -9 ||
      importSave(JSON.stringify(oldSave)).coins !== -9
    )
      throw new Error("Loss balance did not survive save import and reload");

    const order = makeOrder(1, 99, "level", available);
    const exact = newPancake();
    exact.eggs = order.wants.egg;
    for (const id of ["sweet", "chili", "garlic"])
      if (order.wants[id]) exact.sauces[id] = order.wants[id];
    for (const id of ["scallion", "cilantro", "crispy", "ham", "sesame"])
      if (order.wants[id]) exact.fillings[id] = order.wants[id];
    const correct = evaluate(exact, order, 0, "level", 0, 0);
    const wrongIngredient = [
      "scallion",
      "cilantro",
      "crispy",
      "ham",
      "sesame",
    ].find((id) => !order.wants[id]);
    const extra = {
      ...exact,
      fillings: { ...exact.fillings, [wrongIngredient]: 1 },
    };
    const wrong = evaluate(extra, order, 0, "level", 0, 0);
    if (
      correct.wrong ||
      !wrong.wrong ||
      wrong.revenue >= correct.revenue ||
      wrong.satisfaction > 68
    )
      throw new Error("Wrong topping did not reduce payout");
    if (!wrong.details.some((detail) => detail.includes("多放")))
      throw new Error("Wrong topping was not explained");
    const extraEgg = evaluate(
      { ...exact, eggs: exact.eggs + 1 },
      order,
      0,
      "level",
      0,
      0,
    );
    if (
      correct.eggCost !== exact.eggs * 3 ||
      correct.profit !== correct.revenue - correct.eggCost ||
      extraEgg.revenue !== 0 ||
      extraEgg.profit !== -extraEgg.eggCost ||
      !extraEgg.details.some((detail) => detail.includes("多放鸡蛋"))
    )
      throw new Error("Extra egg did not cause a real monetary loss");
    const doubleEggOrder = {
      ...order,
      wants: { ...order.wants, egg: 2 },
      price: order.price + 3,
    };
    const doubleEgg = evaluate(
      { ...exact, eggs: 2 },
      doubleEggOrder,
      0,
      "level",
      0,
      0,
    );
    if (doubleEgg.wrong || doubleEgg.revenue <= 0 || doubleEgg.eggCost !== 6)
      throw new Error("Requested double egg was wrongly rejected");
    const freeEgg = evaluate({ ...exact, eggs: 5 }, null, 0, "free", 0, 0);
    if (freeEgg.profit !== 0 || freeEgg.revenue !== 0)
      throw new Error("Free practice charged coins");
    return {
      seen: [...seen],
      correct: correct.revenue,
      wrong: wrong.revenue,
      extraEggLoss: extraEgg.profit,
    };
  });
  console.log("PASS: five fillings stay in the order pool", result.seen);
  console.log(
    "PASS: extra ingredient lowers revenue",
    result.correct,
    result.wrong,
  );
  console.log("PASS: extra egg creates loss", result.extraEggLoss);
} finally {
  await browser.close();
}
