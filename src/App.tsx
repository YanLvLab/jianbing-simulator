import { useEffect, useRef, useState } from "react";
import {
  Customer,
  EGG_UNIT_COST,
  INGREDIENTS,
  Ingredient,
  LEVELS,
  makeOrder,
  Mode,
  STAGES,
  STAGE_NAMES,
  unlockedByLevel,
} from "./data/config";
import Griddle from "./components/Griddle";
import CustomerPortrait from "./components/CustomerPortrait";
import IngredientArt from "./components/IngredientArt";
import CounterProps from "./components/CounterProps";
import CounterStation from "./components/CounterStation";
import FinishedJianbing from "./components/FinishedJianbing";
import {
  batterCoverage,
  eggCoverage,
  evaluate,
  getStars,
  newPancake,
  Point,
  Result,
  Run,
} from "./game/engine";
import {
  defaultSave,
  exportSave,
  importSave,
  loadSave,
  persistSave,
  Save,
  SAVE_KEY,
} from "./systems/save";
import { playSound, startMusic, Sound } from "./systems/sound";
import { getStepGate } from "./game/workflow";

type Screen = "menu" | "levels" | "shop" | "settings" | "achievements" | "game";
const ACHIEVEMENTS = [
  { id: "cilantro", title: "香菜毁灭者", hint: "连续给10位顾客加错香菜" },
  { id: "dark", title: "黑暗料理大师", hint: "一份饼加入全部已开放食材" },
  { id: "warrior", title: "铁锅战神", hint: "连续完成20个完美订单" },
  { id: "lastsecond", title: "老板别急", hint: "顾客剩余耐心不足5秒时出餐" },
  { id: "eggs", title: "鸡蛋自由", hint: "一份饼打入5个鸡蛋" },
];
const UPGRADE_INFO = [
  {
    id: "griddle" as const,
    name: "宽心铁板",
    desc: "最佳火候窗口更宽，容错更高",
    base: 60,
    icon: "◉",
  },
  {
    id: "scraper" as const,
    name: "顺手刮板",
    desc: "每次拖动覆盖更多面糊",
    base: 55,
    icon: "◒",
  },
  {
    id: "service" as const,
    name: "利落出餐台",
    desc: "顾客耐心增加，计时更宽松",
    base: 65,
    icon: "▱",
  },
];
const SAUCES: Ingredient[] = ["sweet", "chili", "garlic"];
const FILLINGS: Ingredient[] = [
  "scallion",
  "cilantro",
  "crispy",
  "ham",
  "sesame",
];
const formatTime = (s: number) =>
  `${Math.floor(Math.max(0, s) / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(Math.max(0, s) % 60)
    .toString()
    .padStart(2, "0")}`;
const signedYuan = (amount: number) =>
  `${amount < 0 ? "-" : "+"}¥${Math.abs(amount)}`;

function ticketText(wants: Partial<Record<Ingredient, number>>) {
  return Object.entries(wants)
    .filter(([, count]) => count && count > 0)
    .map(
      ([id, count]) =>
        `${INGREDIENTS.find((i) => i.id === id)?.name ?? id}${count! > 1 ? ` ×${count}` : ""}`,
    )
    .join(" · ");
}

function startRun(mode: Mode, level: number, save: Save): Run {
  const config = LEVELS[level - 1];
  const first =
    mode === "free" ? null : makeOrder(level, 1, mode, save.ingredients);
  const boosted = first
    ? { ...first, patience: first.patience + save.upgrades.service * 8 }
    : null;
  return {
    mode,
    level,
    secondsLeft: mode === "level" ? config.seconds : Infinity,
    elapsed: 0,
    maxCustomers: mode === "level" ? config.customers : Infinity,
    order: boosted,
    customerWait: 0,
    sequence: 1,
    served: 0,
    missed: 0,
    revenue: 0,
    eggCostTotal: 0,
    profit: 0,
    perfect: 0,
    wrong: 0,
    satisfactionTotal: 0,
    perfectStreak: 0,
    bestPerfectStreak: 0,
    pancake: newPancake(),
    paused: false,
    finished: false,
    lastResult: null,
    message: "先倒面糊，再按住铁板拖动刮板。",
  };
}

export default function App() {
  const [save, setSave] = useState<Save>(loadSave);
  const [screen, setScreen] = useState<Screen>(
    save.activeRun ? "game" : "menu",
  );
  const [run, setRun] = useState<Run | null>(save.activeRun);
  const [toast, setToast] = useState<Result | null>(null);
  const [notice, setNotice] = useState("");
  const [serving, setServing] = useState(false);
  const [leavingCustomer, setLeavingCustomer] = useState<Customer | null>(null);
  const [lastServedCustomer, setLastServedCustomer] = useState<Customer | null>(
    null,
  );
  const [batterPoured, setBatterPoured] = useState(
    !!save.activeRun?.pancake.batter.length,
  );
  const [resetFirst, setResetFirst] = useState(false);
  const [resetSecond, setResetSecond] = useState(false);
  const importInput = useRef<HTMLInputElement>(null);
  const completed = useRef(false);
  const lastTick = useRef(performance.now());
  const runRef = useRef(run);
  const previousOrder = useRef(run?.order ?? null);
  const previousMissed = useRef(run?.missed ?? 0);
  runRef.current = run;
  const sound = (kind: Sound) => playSound(kind, save.sound);
  useEffect(
    () =>
      screen === "game"
        ? startMusic(save.music && !run?.paused && !run?.finished)
        : undefined,
    [screen, save.music, run?.paused, run?.finished],
  );
  useEffect(() => persistSave(save), [save]);
  useEffect(() => {
    if (run && run.missed > previousMissed.current && previousOrder.current) {
      setLeavingCustomer(previousOrder.current.customer);
      const timer = window.setTimeout(
        () => setLeavingCustomer(null),
        save.reducedMotion ? 150 : 750,
      );
      previousOrder.current = run.order;
      previousMissed.current = run.missed;
      return () => window.clearTimeout(timer);
    }
    previousOrder.current = run?.order ?? null;
    previousMissed.current = run?.missed ?? 0;
  }, [run?.order?.id, run?.missed, save.reducedMotion]);
  useEffect(() => {
    const timer = setInterval(() => {
      const current = runRef.current;
      setSave((s) =>
        s.activeRun === current ? s : { ...s, activeRun: current },
      );
    }, 1500);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = performance.now();
      const delta = Math.min(0.3, (now - lastTick.current) / 1000);
      lastTick.current = now;
      setRun((current) => {
        if (!current || current.paused || current.finished) return current;
        const secondsLeft =
          current.mode === "level" ? current.secondsLeft - delta : Infinity;
        const wait = current.order ? current.customerWait + delta : 0;
        const pancake = {
          ...current.pancake,
          elapsed: current.pancake.elapsed + delta,
          heat:
            current.pancake.stage === "flip"
              ? current.pancake.heat + delta * 11.5
              : ["spread", "egg"].includes(current.pancake.stage) &&
                  current.pancake.batter.length > 0
                ? Math.min(45, current.pancake.heat + delta * 4.5)
                : current.pancake.heat,
        };
        if (secondsLeft <= 0)
          return {
            ...current,
            secondsLeft: 0,
            elapsed: current.elapsed + delta,
            pancake,
            finished: true,
            message: "营业时间到！",
          };
        if (current.order && wait >= current.order.patience) {
          const missed = current.missed + 1,
            sequence = current.sequence + 1;
          const finished =
            current.mode === "level"
              ? missed + current.served >= current.maxCustomers
              : missed >= 3;
          const next = finished
            ? null
            : makeOrder(
                current.mode === "endless"
                  ? Math.min(10, 1 + Math.floor(sequence / 3))
                  : current.level,
                sequence,
                current.mode,
                save.ingredients,
              );
          return {
            ...current,
            secondsLeft,
            elapsed: current.elapsed + delta,
            missed,
            sequence,
            order: next
              ? { ...next, patience: next.patience + save.upgrades.service * 8 }
              : null,
            customerWait: 0,
            pancake: newPancake(),
            perfectStreak: 0,
            finished,
            message: finished
              ? "收摊了，看看今天的成绩。"
              : "顾客等不及走了！下一位已经排上。",
          };
        }
        return {
          ...current,
          secondsLeft,
          elapsed: current.elapsed + delta,
          customerWait: wait,
          pancake,
        };
      });
    }, 100);
    return () => clearInterval(timer);
  }, [save.upgrades.service, save.ingredients]);

  useEffect(() => {
    if (!run?.finished || completed.current) return;
    completed.current = true;
    if (run.mode === "level") {
      const stars = getStars(run);
      setSave((s) => ({
        ...s,
        unlockedLevel:
          stars > 0
            ? Math.min(10, Math.max(s.unlockedLevel, run.level + 1))
            : s.unlockedLevel,
        stars: {
          ...s.stars,
          [run.level]: Math.max(s.stars[run.level] ?? 0, stars),
        },
        ingredients: Array.from(
          new Set([
            ...s.ingredients,
            ...unlockedByLevel(
              stars > 0 ? Math.min(10, run.level + 1) : s.unlockedLevel,
            ),
          ]),
        ),
      }));
    }
    if (run.mode === "endless")
      setSave((s) => ({
        ...s,
        endless: {
          revenue: Math.max(s.endless.revenue, run.revenue),
          served: Math.max(s.endless.served, run.served),
          perfectStreak: Math.max(
            s.endless.perfectStreak,
            run.bestPerfectStreak,
          ),
        },
      }));
  }, [run?.finished]);

  const launch = (mode: Mode, level: number) => {
    completed.current = false;
    setToast(null);
    setBatterPoured(false);
    const started = startRun(mode, level, save);
    runRef.current = started;
    setRun(started);
    setScreen("game");
    lastTick.current = performance.now();
  };
  const backToMenu = () => {
    runRef.current = null;
    setRun(null);
    setSave((s) => ({ ...s, activeRun: null }));
    setToast(null);
    setScreen("menu");
  };
  const paint = (point: Point) =>
    setRun((r) => {
      if (!r || r.paused) return r;
      const p = r.pancake;
      if (p.stage === "spread" && batterPoured)
        return { ...r, pancake: { ...p, batter: [...p.batter, point] } };
      if (p.stage === "egg" && p.eggs > 0)
        return { ...r, pancake: { ...p, eggPaint: [...p.eggPaint, point] } };
      if (p.stage === "sauce" && p.activeSauce && p.brushLoad > 0) {
        if (Math.hypot(point.x - 0.5, point.y - 0.5) > 0.4) return r;
        const previous = p.saucePaint[p.activeSauce] ?? [];
        if (
          previous.length &&
          !point.strokeStart &&
          Math.hypot(
            point.x - previous.at(-1)!.x,
            point.y - previous.at(-1)!.y,
          ) < 0.009
        )
          return r;
        return {
          ...r,
          pancake: {
            ...p,
            sauces: p.brushFresh
              ? {
                  ...p.sauces,
                  [p.activeSauce]: Math.min(
                    3,
                    (p.sauces[p.activeSauce] ?? 0) + 1,
                  ),
                }
              : p.sauces,
            saucePaint: {
              ...p.saucePaint,
              [p.activeSauce]: [
                ...previous,
                { ...point, strength: p.brushLoad },
              ],
            },
            brushLoad: Math.max(0, p.brushLoad - 0.026),
            brushFresh: false,
          },
        };
      }
      if (p.stage === "fill" && p.activeFilling && p.fillLoad > 0) {
        if (Math.hypot(point.x - 0.5, point.y - 0.5) > 0.39) return r;
        const previous = p.fillingDrops[p.activeFilling] ?? [];
        if (
          previous.length &&
          Math.hypot(
            point.x - previous.at(-1)!.x,
            point.y - previous.at(-1)!.y,
          ) < 0.026
        )
          return r;
        return {
          ...r,
          pancake: {
            ...p,
            fillings: p.fillFresh
              ? {
                  ...p.fillings,
                  [p.activeFilling]: Math.min(
                    3,
                    (p.fillings[p.activeFilling] ?? 0) + 1,
                  ),
                }
              : p.fillings,
            fillingDrops: {
              ...p.fillingDrops,
              [p.activeFilling]: [...previous, { ...point, at: Date.now() }],
            },
            fillLoad: Math.max(0, p.fillLoad - 0.055),
            fillFresh: false,
          },
        };
      }
      return r;
    });
  const fold = (side: "left" | "right") =>
    setRun((r) =>
      r && r.pancake.stage === "fold" && !r.pancake.folds.includes(side)
        ? {
            ...r,
            pancake: { ...r.pancake, folds: [...r.pancake.folds, side] },
            message:
              side === "left"
                ? "左边收好了，再折右边。"
                : "右边收好了，再折左边。",
          }
        : r,
    );
  const cut = () => {
    updatePancake({ cut: true }, "沿中线切开了。把两半拖到右侧纸袋。", "cut");
  };
  const bag = () => {
    updatePancake(
      { bagged: true },
      "纸袋装好了，点击顾客头顶的煎饼交餐！",
      "bag",
    );
  };
  const updatePancake = (
    patch: Partial<Run["pancake"]>,
    message: string,
    sfx?: Sound,
  ) => {
    setRun((r) =>
      r ? { ...r, pancake: { ...r.pancake, ...patch }, message } : r,
    );
    if (sfx) sound(sfx);
  };
  const nextStage = () => {
    if (!run) return;
    const p = run.pancake,
      index = STAGES.indexOf(p.stage);
    const gate = getStepGate(p, batterPoured, save.upgrades.scraper);
    if (!gate.ready) {
      setNotice(gate.notice);
      return;
    }
    if (p.stage === "flip") {
      updatePancake(
        { stage: "sauce", flipHeat: p.heat },
        "点击搪瓷缸蘸酱，再沿饼面拖动刷开。",
        "flip",
      );
      return;
    }
    const next = STAGES[index + 1];
    if (next)
      updatePancake(
        { stage: next },
        {
          spread: "倒入面糊，在铁板上摊开。",
          egg: "点鸡蛋打入铁板，再拖动蛋液。",
          flip: "观察火候条，在绿色区间翻面。",
          sauce: "点击搪瓷缸蘸酱，再沿饼面拖动刷开。",
          fill: "点击簸箕抓料，沿饼面拖动撒开。",
          fold: "依次点击折左边、折右边，收住配料。",
          bag: "横划中线切断，再把煎饼拖入右侧纸袋。",
        }[next],
        next === "fold" ? "fold" : undefined,
      );
  };
  const addIngredient = (id: Ingredient) => {
    if (!run) return;
    if (run.mode !== "free" && !save.ingredients.includes(id)) {
      setNotice("这味食材还没解锁。");
      return;
    }
    const p = run.pancake;
    if (p.stage === "egg" && id === "egg") {
      if (p.eggs >= 5) return;
      updatePancake(
        { eggs: p.eggs + 1 },
        `已打入 ${p.eggs + 1} 个鸡蛋，拖动涂匀。`,
        "egg",
      );
      return;
    }
    if (p.stage === "sauce" && SAUCES.includes(id)) {
      if ((p.sauces[id] ?? 0) >= 3) {
        setNotice("这一味已经够多了。");
        return;
      }
      updatePancake(
        {
          activeSauce: id,
          brushLoad: 1,
          brushFresh: true,
        },
        `刷子已蘸${INGREDIENTS.find((i) => i.id === id)?.name}，在饼上拖动；刷淡了再蘸。`,
        "sauce",
      );
      return;
    }
    if (p.stage === "fill" && FILLINGS.includes(id)) {
      if ((p.fillings[id] ?? 0) >= 3) {
        setNotice("这一味已经够多了。");
        return;
      }
      updatePancake(
        {
          activeFilling: id,
          fillLoad: 1,
          fillFresh: true,
        },
        `抓一把${INGREDIENTS.find((i) => i.id === id)?.name}，在饼上拖动撒开。`,
        "scrape",
      );
    }
  };
  const serve = () => {
    if (!run || run.pancake.stage !== "bag" || !run.pancake.bagged || serving)
      return;
    setLastServedCustomer(run.order?.customer ?? null);
    setServing(true);
    setRun((current) => (current ? { ...current, paused: true } : current));
    const result = evaluate(
      run.pancake,
      run.order,
      run.customerWait,
      run.mode,
      save.upgrades.griddle,
      save.upgrades.scraper,
    );
    sound(result.wrong ? "sad" : "happy");
    sound("bag");
    const allAvailable = INGREDIENTS.filter(
      (i) => save.ingredients.includes(i.id) || run.mode === "free",
    ).map((i) => i.id);
    const actual = {
      ...run.pancake.fillings,
      ...run.pancake.sauces,
      egg: run.pancake.eggs,
    };
    const newAchievements = new Set(save.achievements);
    const cilantroStreak = result.cilantroError
      ? save.cilantroMistakeStreak + 1
      : 0;
    const perfectStreak = result.perfect ? save.perfectStreak + 1 : 0;
    if (cilantroStreak >= 10) newAchievements.add("cilantro");
    if (allAvailable.every((id) => (actual[id] ?? 0) > 0))
      newAchievements.add("dark");
    if (perfectStreak >= 20) newAchievements.add("warrior");
    if (run.order && run.order.patience - run.customerWait < 5)
      newAchievements.add("lastsecond");
    if (run.pancake.eggs >= 5) newAchievements.add("eggs");
    setSave((s) => ({
      ...s,
      coins: s.coins + result.profit,
      achievements: [...newAchievements],
      cilantroMistakeStreak: cilantroStreak,
      perfectStreak,
    }));
    const served = run.served + 1,
      sequence = run.sequence + 1;
    const finished =
      run.mode === "level" && served + run.missed >= run.maxCustomers;
    const next =
      finished || run.mode === "free"
        ? null
        : makeOrder(
            run.mode === "endless"
              ? Math.min(10, 1 + Math.floor(sequence / 3))
              : run.level,
            sequence,
            run.mode,
            save.ingredients,
          );
    const nextRun: Run = {
      ...run,
      served,
      sequence,
      revenue: run.revenue + result.revenue,
      eggCostTotal:
        run.eggCostTotal + (run.mode === "free" ? 0 : result.eggCost),
      profit: run.profit + result.profit,
      perfect: run.perfect + (result.perfect ? 1 : 0),
      wrong: run.wrong + (result.wrong ? 1 : 0),
      satisfactionTotal: run.satisfactionTotal + result.satisfaction,
      perfectStreak: result.perfect ? run.perfectStreak + 1 : 0,
      bestPerfectStreak: Math.max(
        run.bestPerfectStreak,
        result.perfect ? run.perfectStreak + 1 : 0,
      ),
      order: next
        ? { ...next, patience: next.patience + save.upgrades.service * 8 }
        : null,
      customerWait: 0,
      pancake: newPancake(),
      paused: true,
      finished,
      lastResult: result,
      message: "新的一份，从倒面糊开始。",
    };
    window.setTimeout(
      () => {
        setRun(nextRun);
        setBatterPoured(false);
        setServing(false);
        setToast(result);
      },
      save.reducedMotion ? 220 : 1050,
    );
  };
  const continueAfterResult = () => {
    setToast(null);
    if (run?.mode === "free") {
      setRun((r) => (r ? { ...r, paused: false, pancake: newPancake() } : r));
    } else setRun((r) => (r ? { ...r, paused: false } : r));
  };
  const buyUpgrade = (id: "griddle" | "scraper" | "service", base: number) => {
    const level = save.upgrades[id],
      price = base * (level + 1);
    if (level >= 3 || save.coins < price) {
      setNotice(level >= 3 ? "已经升级到最高级。" : "金币不够，再多卖几份！");
      return;
    }
    setSave((s) => ({
      ...s,
      coins: s.coins - price,
      upgrades: { ...s.upgrades, [id]: level + 1 },
    }));
    sound("bag");
  };
  const buyIngredient = (id: Ingredient, cost: number) => {
    if (save.coins < cost) {
      setNotice("金币不够，再多卖几份！");
      return;
    }
    setSave((s) => ({
      ...s,
      coins: s.coins - cost,
      ingredients: [...s.ingredients, id],
    }));
    sound("bag");
  };
  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      const imported = importSave(await file.text());
      setSave(imported);
      if (imported.activeRun) {
        setRun(imported.activeRun);
        setBatterPoured(!!imported.activeRun.pancake.batter.length);
        setScreen("game");
      }
      setNotice("存档导入成功。");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "导入失败");
    }
    if (importInput.current) importInput.current.value = "";
  };
  const confirmReset = () => {
    if (!resetFirst) {
      setResetFirst(true);
      return;
    }
    if (!resetSecond) {
      setResetSecond(true);
      return;
    }
    localStorage.removeItem(SAVE_KEY);
    setSave(defaultSave());
    setResetFirst(false);
    setResetSecond(false);
    setNotice("存档已重置。");
  };

  const stepRequirement = run
    ? getStepGate(run.pancake, batterPoured, save.upgrades.scraper).label
    : "";

  return (
    <div className={`app-shell ${save.reducedMotion ? "reduce-motion" : ""}`}>
      <header className="topbar">
        <button className="brand" onClick={backToMenu}>
          <span className="brand-stamp">饼</span>
          <span>
            <strong>煎饼果子模拟器</strong>
            <small>JIANBING SIMULATOR · 早市开张</small>
          </span>
        </button>
        <div className="topbar-right">
          <span className="coin-display">
            <span className="coin-icon">¥</span> {save.coins}{" "}
            <small>金币</small>
          </span>
          {screen !== "menu" && (
            <button className="subtle-button" onClick={backToMenu}>
              返回摊位
            </button>
          )}
        </div>
      </header>
      {screen === "menu" && (
        <main className="menu-page">
          <div className="menu-hero">
            <div className="hero-text">
              <p className="eyebrow">一张饼，一座城的清晨</p>
              <h1>
                趁热乎，
                <br />
                <em>开张了！</em>
              </h1>
              <p className="hero-description">
                倒面糊、摊圆饼、看火候、听顾客催单。
                <br />
                从街边小摊开始，练成街角的煎饼传说。
              </p>
              <div className="hero-actions">
                <button
                  className="primary-button"
                  onClick={() => setScreen("levels")}
                >
                  开始营业 <span>↗</span>
                </button>
                <button
                  className="outline-button"
                  onClick={() => launch("free", save.unlockedLevel)}
                >
                  先练练手
                </button>
              </div>
              <p className="hero-note">
                已解锁第 {save.unlockedLevel} 关 · 累计{" "}
                {Object.values(save.stars).reduce((a, b) => a + b, 0)} 颗星
              </p>
            </div>
            <div className="hero-art" aria-hidden="true">
              {save.decoration && <div className="red-lantern">福</div>}
              <div className="awning">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <div className="signboard">
                老张煎饼铺 <small>现摊现做 · 香飘一条街</small>
              </div>
              <div className="hero-pan">
                <div className="hero-pancake">
                  <div className="hero-egg" />
                  <span className="hero-herbs">✳ ✳ ✳</span>
                  <div className="hero-crisp" />
                </div>
              </div>
              <div className="hero-steam">⌇　⌇　⌇</div>
              <div className="art-counter" />
            </div>
          </div>
          <div className="mode-grid">
            <button onClick={() => setScreen("levels")}>
              <b>01 / 主线闯关</b>
              <strong>从小摊到商业街</strong>
              <span>十个清晨，十场硬仗　→</span>
            </button>
            <button onClick={() => launch("endless", save.unlockedLevel)}>
              <b>02 / 无尽经营</b>
              <strong>今天能卖多少份？</strong>
              <span>顾客会越来越没耐心　→</span>
            </button>
            <button onClick={() => launch("free", save.unlockedLevel)}>
              <b>03 / 自由制作</b>
              <strong>想加什么就加什么</strong>
              <span>没有计时，只有手艺　→</span>
            </button>
          </div>
          <nav className="menu-links">
            <button onClick={() => setScreen("shop")}>摊位商店 ↗</button>
            <button onClick={() => setScreen("achievements")}>
              隐藏成就 ↗
            </button>
            <button onClick={() => setScreen("settings")}>游戏设置 ↗</button>
          </nav>
        </main>
      )}
      {screen === "levels" && (
        <main className="page-container">
          <div className="page-heading">
            <p className="eyebrow">营业日程 / 10 个关卡</p>
            <h1>每个清晨，都有新故事。</h1>
            <p>完成营业额目标即可通关。更高营业额与零流失，能拿到更多星星。</p>
          </div>
          <div className="levels-grid">
            {LEVELS.map((level) => {
              const locked = level.id > save.unlockedLevel;
              return (
                <button
                  key={level.id}
                  disabled={locked}
                  className={`level-card ${locked ? "locked" : ""}`}
                  onClick={() => launch("level", level.id)}
                >
                  <span className="level-num">
                    {String(level.id).padStart(2, "0")}
                  </span>
                  <span className="level-area">{level.area}</span>
                  <strong>{level.title}</strong>
                  <span className="level-meta">
                    {level.customers} 位顾客 · {formatTime(level.seconds)} ·
                    目标 ¥{level.target}
                  </span>
                  <span className="level-special">
                    {locked ? "🔒 尚未解锁" : level.special}
                  </span>
                  <span className="stars">
                    {Array.from({ length: 3 }, (_, i) =>
                      i < (save.stars[level.id] ?? 0) ? "★" : "☆",
                    ).join("")}
                  </span>
                </button>
              );
            })}
          </div>
        </main>
      )}
      {screen === "shop" && (
        <main className="page-container">
          <div className="page-heading">
            <p className="eyebrow">摊位商店 / COINS ¥{save.coins}</p>
            <h1>好手艺，也需要好家伙。</h1>
            <p>升级设备，让忙碌的早晨从容一点。每项最多升级三级。</p>
          </div>
          <div className="shop-grid">
            {UPGRADE_INFO.map((item) => {
              const level = save.upgrades[item.id],
                price = item.base * (level + 1);
              return (
                <article className="shop-card" key={item.id}>
                  <div className="shop-icon">{item.icon}</div>
                  <small>设备升级 · {level}/3</small>
                  <h2>{item.name}</h2>
                  <p>{item.desc}</p>
                  <button
                    onClick={() => buyUpgrade(item.id, item.base)}
                    disabled={level >= 3}
                  >
                    {level >= 3 ? "已升满" : `升级 · ¥${price}`}
                  </button>
                </article>
              );
            })}
            <article className="shop-card">
              <div className="shop-icon">❖</div>
              <small>摊位装饰</small>
              <h2>红灯笼</h2>
              <p>给小摊添点喜气。菜单摊位将挂起一盏灯笼。</p>
              <button
                disabled={save.decoration}
                onClick={() => {
                  if (save.coins < 90) return setNotice("金币不够。");
                  setSave((s) => ({
                    ...s,
                    coins: s.coins - 90,
                    decoration: true,
                  }));
                }}
              >
                {save.decoration ? "已装饰" : "购买 · ¥90"}
              </button>
            </article>
          </div>
          <h2 className="section-title">新食材</h2>
          <div className="ingredient-shop">
            {INGREDIENTS.filter((i) => i.cost > 0).map((i) => (
              <article key={i.id}>
                <span
                  className="ingredient-icon"
                  style={{ background: i.color }}
                >
                  {i.icon}
                </span>
                <div>
                  <strong>{i.name}</strong>
                  <small>通关第 {i.unlockLevel - 1} 关后开放购买</small>
                </div>
                <button
                  disabled={
                    save.ingredients.includes(i.id) ||
                    save.unlockedLevel < i.unlockLevel
                  }
                  onClick={() => buyIngredient(i.id, i.cost)}
                >
                  {save.ingredients.includes(i.id) ? "已解锁" : `¥${i.cost}`}
                </button>
              </article>
            ))}
          </div>
        </main>
      )}
      {screen === "achievements" && (
        <main className="page-container">
          <div className="page-heading">
            <p className="eyebrow">街角传闻 / {save.achievements.length} / 5</p>
            <h1>总有些事，值得贴在摊位上。</h1>
          </div>
          <div className="achievement-grid">
            {ACHIEVEMENTS.map((a, i) => (
              <article
                className={save.achievements.includes(a.id) ? "earned" : ""}
                key={a.id}
              >
                <span>{save.achievements.includes(a.id) ? "★" : "◇"}</span>
                <small>成就 {String(i + 1).padStart(2, "0")}</small>
                <h2>{a.title}</h2>
                <p>{a.hint}</p>
                <b>
                  {save.achievements.includes(a.id) ? "已达成" : "尚未达成"}
                </b>
              </article>
            ))}
          </div>
        </main>
      )}
      {screen === "settings" && (
        <main className="page-container settings-page">
          <div className="page-heading">
            <p className="eyebrow">摊主手册 / SETTINGS</p>
            <h1>开摊前，再看一眼。</h1>
          </div>
          <section className="settings-panel">
            <h2>音效</h2>
            <p>铁板的滋滋声与顾客反馈由浏览器合成。</p>
            <button
              className="outline-button"
              onClick={() => setSave((s) => ({ ...s, sound: !s.sound }))}
            >
              音效：{save.sound ? "开启" : "关闭"}
            </button>
          </section>
          <section className="settings-panel">
            <h2>动态效果</h2>
            <p>减少角色待机、热气和镜头过渡。拖动与出餐反馈仍然保留。</p>
            <button
              className="outline-button"
              onClick={() =>
                setSave((s) => ({ ...s, reducedMotion: !s.reducedMotion }))
              }
            >
              减少动态效果：{save.reducedMotion ? "开启" : "关闭"}
            </button>
          </section>
          <section className="settings-panel">
            <h2>摊位音乐</h2>
            <p>轻柔的五声音阶旋律，营业时播放。</p>
            <button
              className="outline-button"
              onClick={() => setSave((s) => ({ ...s, music: !s.music }))}
            >
              音乐：{save.music ? "开启" : "关闭"}
            </button>
          </section>
          <section className="settings-panel">
            <h2>本地存档</h2>
            <p>
              进度自动保存在当前浏览器。可导出 JSON 备份，并在其他浏览器导入。
            </p>
            <div className="settings-actions">
              <button
                className="outline-button"
                onClick={() => exportSave(save)}
              >
                导出存档
              </button>
              <button
                className="outline-button"
                onClick={() => importInput.current?.click()}
              >
                导入存档
              </button>
              <input
                ref={importInput}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(e) => void importFile(e.target.files?.[0])}
              />
            </div>
            <button className="danger-button" onClick={confirmReset}>
              {resetSecond
                ? "第二次确认：永久清空存档"
                : resetFirst
                  ? "确认重置？请再点一次"
                  : "重置存档"}
            </button>
            {(resetFirst || resetSecond) && (
              <button
                className="text-button"
                onClick={() => {
                  setResetFirst(false);
                  setResetSecond(false);
                }}
              >
                取消重置
              </button>
            )}
          </section>
          <section className="settings-panel">
            <h2>怎么做一份饼</h2>
            <ol>
              <li>倒面糊，在铁板上按住拖动刮板，尽量摊满圆面。</li>
              <li>
                点击鸡蛋，再拖动涂开。每颗鸡蛋成本 ¥{EGG_UNIT_COST}
                ；多打了顾客拒收，鸡蛋成本照扣。
              </li>
              <li>盯住火候，在绿色区间翻面。</li>
              <li>点击酱料和配料；加倍要求需要点两次。</li>
              <li>点击「折左边」「折右边」，收住配料后再装袋。</li>
            </ol>
          </section>
        </main>
      )}
      {screen === "game" && run && (
        <main className="game-page">
          <div className="game-hud">
            <div>
              <small>当前营业</small>
              <strong>
                {run.mode === "level"
                  ? `${String(run.level).padStart(2, "0")} · ${LEVELS[run.level - 1].title}`
                  : run.mode === "endless"
                    ? "无尽经营"
                    : "自由制作"}
              </strong>
            </div>
            <div>
              <small>营业倒计时</small>
              <strong className={run.secondsLeft < 30 ? "urgent" : ""}>
                {run.mode === "level"
                  ? formatTime(run.secondsLeft)
                  : run.mode === "endless"
                    ? formatTime(run.elapsed)
                    : "不限时"}
              </strong>
            </div>
            <div>
              <small>今日营业额</small>
              <strong>
                ¥{run.revenue}{" "}
                {run.mode === "level" && (
                  <span className="hud-sub">
                    / ¥{LEVELS[run.level - 1].target}
                  </span>
                )}
              </strong>
            </div>
            <div>
              <small>完成 / 流失</small>
              <strong>
                {run.served} / {run.missed}
              </strong>
            </div>
            <div className="game-coins">
              <small>金币</small>
              <strong>¥{save.coins}</strong>
            </div>
            <button
              className="pause-button"
              onClick={() =>
                setRun((r) => (r ? { ...r, paused: !r.paused } : r))
              }
            >
              {run.paused ? "继续" : "暂停"} Ⅱ
            </button>
          </div>
          {run.order && !serving && (
            <div className="mobile-order-ribbon" aria-label="当前订单速览">
              <b>{run.order.customer.name}</b>
              <span>{ticketText(run.order.wants)}</span>
              {run.order.notes.length > 0 && (
                <em>{run.order.notes.join(" · ")}</em>
              )}
            </div>
          )}
          <div className="game-layout">
            <CounterProps side="left" />
            <CounterProps side="right" />
            {leavingCustomer && (
              <div className="leaving-customer">
                <CustomerPortrait customer={leavingCustomer} angry />
              </div>
            )}
            <aside className="customer-panel">
              {serving && lastServedCustomer ? (
                <div className="customer-stage serving-customer">
                  <CustomerPortrait
                    customer={lastServedCustomer}
                    angry={false}
                    happy
                  />
                  <div className="speech">“好香！这份是我的吧？”</div>
                </div>
              ) : run.order ? (
                <>
                  <div className="customer-stage">
                    <CustomerPortrait
                      customer={run.order.customer}
                      angry={run.customerWait / run.order.patience > 0.72}
                    />
                    <div className="speech">“{run.order.customer.line}”</div>
                  </div>
                  <div className="customer-details">
                    <small>正在等待 · 第 {run.sequence} 位</small>
                    <h2>{run.order.customer.name}</h2>
                    <div className="patience-label">
                      <span>耐心</span>
                      <b>
                        {Math.ceil(
                          Math.max(0, run.order.patience - run.customerWait),
                        )}{" "}
                        秒
                      </b>
                    </div>
                    <div className="patience-bar">
                      <i
                        style={{
                          width: `${Math.max(0, 100 * (1 - run.customerWait / run.order.patience))}%`,
                        }}
                      />
                    </div>
                    <div className="ticket">
                      <div className="ticket-top">
                        <b>今日小票</b>
                        <span>NO. {String(run.order.id).padStart(3, "0")}</span>
                      </div>
                      <p>{ticketText(run.order.wants)}</p>
                      {run.order.notes.map((note) => (
                        <strong key={note}>⚑ {note}</strong>
                      ))}
                      <div className="ticket-price">
                        应收 <b>¥{run.order.price}</b>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="free-customer">
                  <span>◌</span>
                  <h2>自由发挥</h2>
                  <p>没有催单，尽情研究你的招牌配方。</p>
                </div>
              )}
              {run.pancake.stage === "bag" &&
                run.pancake.bagged &&
                !serving && (
                  <button
                    type="button"
                    className="customer-handoff"
                    onClick={serve}
                    aria-label={
                      run.order
                        ? `将煎饼递给${run.order.customer.name}`
                        : "完成试吃"
                    }
                  >
                    <FinishedJianbing />
                    <span>{run.order ? "点击交餐" : "点击试吃"}</span>
                  </button>
                )}
            </aside>
            <section className="workstation">
              <div className="work-top">
                <span className="eyebrow">铁板工作台 / LIVE COOKING</span>
                <span className="work-status">● 正在制作</span>
              </div>
              <div className="stage-track">
                {STAGES.map((stage, i) => (
                  <div
                    key={stage}
                    className={`${i < STAGES.indexOf(run.pancake.stage) ? "done" : ""} ${stage === run.pancake.stage ? "active" : ""}`}
                  >
                    <span>{i + 1}</span>
                    <small>{STAGE_NAMES[stage]}</small>
                  </div>
                ))}
              </div>
              <div className="griddle-zone">
                <Griddle
                  pancake={run.pancake}
                  onPaint={paint}
                  onCut={cut}
                  onBag={bag}
                  scraper={save.upgrades.scraper}
                  poured={batterPoured}
                  reducedMotion={save.reducedMotion}
                />
              </div>
              <div className="work-instruction">
                <b>
                  {STAGE_NAMES[run.pancake.stage]} · {run.message}
                </b>
                {run.pancake.stage === "spread" && (
                  <small>
                    覆盖{" "}
                    {Math.round(
                      batterCoverage(run.pancake, save.upgrades.scraper) * 100,
                    )}
                    % · 用鼠标或手指画圈
                  </small>
                )}
                {run.pancake.stage === "egg" && (
                  <small>
                    蛋液覆盖 {Math.round(eggCoverage(run.pancake) * 100)}% ·
                    已打 {run.pancake.eggs} 个 · 铁板预热{" "}
                    {Math.round(run.pancake.heat)}%
                  </small>
                )}
                {run.pancake.stage === "flip" && (
                  <div className="heat-meter">
                    <div>
                      <span>火候 {Math.round(run.pancake.heat)}%</span>
                      <span>最佳区间 48–78%</span>
                    </div>
                    <div className="heat-track">
                      <i
                        style={{ width: `${Math.min(100, run.pancake.heat)}%` }}
                      />
                      <em />
                    </div>
                  </div>
                )}
                {run.pancake.stage === "fold" && (
                  <small>已折 {run.pancake.folds.length} / 2 边</small>
                )}
              </div>
            </section>
            {run.pancake.stage === "sauce" && (
              <CounterStation
                kind="sauce"
                ids={SAUCES}
                available={run.mode === "free" ? SAUCES : save.ingredients}
                onChoose={addIngredient}
                active={run.pancake.activeSauce}
                load={run.pancake.brushLoad}
                actual={run.pancake.sauces}
              />
            )}
            {run.pancake.stage === "fill" && (
              <CounterStation
                kind="fill"
                ids={FILLINGS}
                available={run.mode === "free" ? FILLINGS : save.ingredients}
                onChoose={addIngredient}
                active={run.pancake.activeFilling}
                load={run.pancake.fillLoad}
                actual={run.pancake.fillings}
              />
            )}
            <aside className="tools-panel">
              <div className="tools-heading">
                <small>你的操作</small>
                <h2>{STAGE_NAMES[run.pancake.stage]}</h2>
              </div>
              {run.pancake.stage === "spread" && (
                <>
                  <p>先倒一勺面糊，再按住铁板拖动刮板。</p>
                  {run.mode === "free" && (
                    <div className="batter-choice" aria-label="选择面糊">
                      {(
                        [
                          ["classic", "原味面糊"],
                          ["grain", "杂粮面糊"],
                          ["purple", "紫米面糊"],
                        ] as const
                      ).map(([id, label]) => (
                        <button
                          key={id}
                          disabled={batterPoured}
                          className={
                            run.pancake.batterType === id ? "selected" : ""
                          }
                          onClick={() =>
                            updatePancake(
                              { batterType: id },
                              `已选${label}，倒面糊后画圈摊开。`,
                            )
                          }
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    className="tool-main"
                    disabled={batterPoured}
                    onClick={() => {
                      setBatterPoured(true);
                      sound("pour");
                    }}
                  >
                    <IngredientArt id="batter" />{" "}
                    {batterPoured ? "面糊已倒入" : "倒入面糊"}
                  </button>
                </>
              )}
              {run.pancake.stage === "egg" && (
                <>
                  <p>
                    {run.mode === "free"
                      ? "点击鸡蛋，再拖动涂匀。自由练习不扣金币。"
                      : `按小票打蛋，再拖动涂匀。每颗 ¥${EGG_UNIT_COST}；多打会亏钱。`}
                  </p>
                  <button
                    className="tool-main"
                    onClick={() => addIngredient("egg")}
                  >
                    <IngredientArt id="egg" /> 打一个鸡蛋{" "}
                    <small>
                      已打 {run.pancake.eggs}/5 ·{" "}
                      {run.mode === "free"
                        ? "练习不扣金币"
                        : `成本 ¥${run.pancake.eggs * EGG_UNIT_COST}`}
                    </small>
                  </button>
                </>
              )}
              {run.pancake.stage === "flip" && (
                <p>绿色区间翻面最香。过早会夹生，过晚会焦。</p>
              )}
              {run.pancake.stage === "sauce" && (
                <>
                  <p>
                    看小票选酱。点击搪瓷缸蘸刷，再沿饼面拖动；变淡后可重蘸。
                  </p>
                  <div className="tool-grid station-fallback">
                    {SAUCES.map((id) => {
                      const item = INGREDIENTS.find((i) => i.id === id)!;
                      const locked =
                        run.mode !== "free" && !save.ingredients.includes(id);
                      return (
                        <button
                          key={id}
                          className={
                            run.pancake.activeSauce === id ? "tool-active" : ""
                          }
                          onClick={() => addIngredient(id)}
                          disabled={locked}
                        >
                          <i>
                            <IngredientArt id={id} />
                          </i>
                          <span>{item.name}</span>
                          <b>
                            {locked
                              ? "未解锁"
                              : `已刷 ${run.pancake.sauces[id] ?? 0}`}
                          </b>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
              {run.pancake.stage === "fill" && (
                <>
                  <p>
                    五种配料都在台上。看小票挑要的，从簸箕抓料，在饼上拖动撒开。
                  </p>
                  <div className="tool-grid station-fallback">
                    {FILLINGS.map((id) => {
                      const item = INGREDIENTS.find((i) => i.id === id)!;
                      const locked =
                        run.mode !== "free" && !save.ingredients.includes(id);
                      return (
                        <button
                          key={id}
                          disabled={locked}
                          onClick={() => addIngredient(id)}
                        >
                          <i>
                            <IngredientArt id={id} />
                          </i>
                          <span>{item.name}</span>
                          <b>
                            {locked
                              ? "未解锁"
                              : `已加 ${run.pancake.fillings[id] ?? 0}`}
                          </b>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
              {run.pancake.stage === "fold" && (
                <>
                  <p>先按按钮折一边，再折另一边。两层饼皮会盖住小料。</p>
                  <div className="fold-controls" aria-label="折叠煎饼">
                    <button
                      type="button"
                      onClick={() => fold("left")}
                      disabled={run.pancake.folds.includes("left")}
                    >
                      {run.pancake.folds.includes("left")
                        ? "左边已折 ✓"
                        : "折左边 ↗"}
                    </button>
                    <button
                      type="button"
                      onClick={() => fold("right")}
                      disabled={run.pancake.folds.includes("right")}
                    >
                      {run.pancake.folds.includes("right")
                        ? "右边已折 ✓"
                        : "折右边 ↖"}
                    </button>
                  </div>
                </>
              )}
              {run.pancake.stage === "bag" && (
                <p>
                  {run.pancake.cut
                    ? run.pancake.bagged
                      ? "纸袋装好了，点击顾客头顶的煎饼递出。"
                      : "从饼中央拖到右侧纸袋。"
                    : "沿煎饼中线从左向右划过，切成两半。"}
                </p>
              )}
              <div className="tool-bottom">
                {run.pancake.stage === "bag" ? (
                  run.pancake.bagged ? (
                    <div className="handoff-prompt">点击顾客头顶煎饼交餐 ↖</div>
                  ) : (
                    <button className="primary-button" disabled>
                      {run.pancake.cut ? "拖入纸袋后出餐" : "先划开煎饼"}
                    </button>
                  )
                ) : (
                  <button
                    className="primary-button"
                    onClick={nextStage}
                    disabled={!!stepRequirement}
                    aria-label={stepRequirement || undefined}
                  >
                    {stepRequirement
                      ? stepRequirement
                      : run.pancake.stage === "flip"
                        ? "现在翻面 ↗"
                        : run.pancake.stage === "fold"
                          ? "折好了，装袋 ↗"
                          : `下一步：${STAGE_NAMES[STAGES[STAGES.indexOf(run.pancake.stage) + 1]]} ↗`}
                  </button>
                )}
                <button
                  className="text-button"
                  onClick={() => {
                    setBatterPoured(false);
                    updatePancake(newPancake(), "这份重新做。先倒面糊。");
                  }}
                >
                  重做这份
                </button>
              </div>
            </aside>
          </div>
          {serving && (
            <div className="serve-animation" aria-label="正在装袋出餐">
              <div className="serve-handoff">
                <FinishedJianbing />
              </div>
              <span>新鲜出炉 · 递给顾客</span>
            </div>
          )}
          {run.paused && !toast && !run.finished && !serving && (
            <div className="modal-backdrop">
              <div className="modal-card">
                <p className="eyebrow">暂时歇口气</p>
                <h2>铁板先关小火。</h2>
                <p>营业时间和顾客耐心都已暂停。</p>
                <div className="modal-actions">
                  <button
                    className="primary-button"
                    onClick={() =>
                      setRun((r) => (r ? { ...r, paused: false } : r))
                    }
                  >
                    继续营业
                  </button>
                  <button className="outline-button" onClick={backToMenu}>
                    返回主菜单
                  </button>
                </div>
              </div>
            </div>
          )}
          {toast && (
            <div className="modal-backdrop">
              <div className="modal-card result-card">
                <p className="eyebrow">出餐评价 / ORDER COMPLETE</p>
                {lastServedCustomer && (
                  <div
                    className={`result-customer ${toast.wrong ? "disappointed" : "delighted"}`}
                  >
                    <CustomerPortrait
                      customer={lastServedCustomer}
                      angry={toast.wrong}
                    />
                  </div>
                )}
                <div className="result-score">
                  {toast.score}
                  <small>分</small>
                </div>
                <h2>{toast.feedback}</h2>
                <div className="result-details">
                  {toast.details.map((detail) => (
                    <span
                      key={detail}
                      className={
                        detail.startsWith("少放") || detail.startsWith("多放")
                          ? "ingredient-mismatch"
                          : ""
                      }
                    >
                      {detail}
                    </span>
                  ))}
                </div>
                {run.mode !== "free" && (
                  <p className="result-money">
                    顾客付款 ¥{toast.revenue} · 鸡蛋成本 -¥{toast.eggCost} ·
                    净收益 {signedYuan(toast.profit)} · 满意度{" "}
                    {toast.satisfaction}%
                  </p>
                )}
                <button
                  className="primary-button"
                  onClick={continueAfterResult}
                >
                  {run.mode === "free"
                    ? "再做一份"
                    : run.finished
                      ? "查看今日结算"
                      : "接待下一位"}{" "}
                  ↗
                </button>
              </div>
            </div>
          )}
          {run.finished && !toast && !serving && (
            <div className="modal-backdrop">
              <div className="modal-card summary-card">
                <p className="eyebrow">
                  {run.mode === "endless"
                    ? "无尽经营结束"
                    : "今日收摊 / DAILY REPORT"}
                </p>
                <h2>
                  {run.mode === "level"
                    ? getStars(run) > 0
                      ? "今天，卖得漂亮！"
                      : "明天早点开张！"
                    : "今天的铁板辛苦了。"}
                </h2>
                {run.mode === "level" && (
                  <div className="summary-stars">
                    {Array.from({ length: 3 }, (_, i) =>
                      i < getStars(run) ? "★" : "☆",
                    ).join("")}
                  </div>
                )}
                <div className="summary-grid">
                  <div>
                    <small>营业额</small>
                    <strong>¥{run.revenue}</strong>
                  </div>
                  <div>
                    <small>鸡蛋成本</small>
                    <strong>-¥{run.eggCostTotal}</strong>
                  </div>
                  <div>
                    <small>完成订单</small>
                    <strong>{run.served}</strong>
                  </div>
                  <div>
                    <small>完美订单</small>
                    <strong>{run.perfect}</strong>
                  </div>
                  <div>
                    <small>错误订单</small>
                    <strong>{run.wrong}</strong>
                  </div>
                  <div>
                    <small>平均满意度</small>
                    <strong>
                      {run.served
                        ? Math.round(run.satisfactionTotal / run.served)
                        : 0}
                      %
                    </strong>
                  </div>
                  <div>
                    <small>净收益 / 金币</small>
                    <strong>{signedYuan(run.profit)}</strong>
                  </div>
                </div>
                {run.mode === "endless" && (
                  <p>
                    历史最佳：¥{save.endless.revenue} · 接待{" "}
                    {save.endless.served} 人 · 连续完美{" "}
                    {save.endless.perfectStreak} 单
                  </p>
                )}
                <div className="modal-actions">
                  <button className="primary-button" onClick={backToMenu}>
                    返回摊位
                  </button>
                  <button
                    className="outline-button"
                    onClick={() => launch(run.mode, run.level)}
                  >
                    再来一局
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      )}
      {notice && (
        <div className="toast-notice" role="status">
          {notice}
        </div>
      )}
      <footer className="site-footer">
        <span>天亮了，铁板热了，故事开始了。</span>
        <span>© 老张煎饼铺 · 本地单机游戏</span>
      </footer>
    </div>
  );
}
