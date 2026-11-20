import {
  Ingredient,
  INGREDIENTS,
  LEVELS,
  Mode,
  Order,
  Stage,
} from "../data/config";

export type Point = { x: number; y: number; strength?: number; at?: number };
export type Pancake = {
  stage: Stage;
  batterType: "classic" | "grain" | "purple";
  batter: Point[];
  eggPaint: Point[];
  eggs: number;
  flipHeat: number;
  heat: number;
  sauces: Partial<Record<Ingredient, number>>;
  saucePaint: Partial<Record<Ingredient, Point[]>>;
  activeSauce: Ingredient | null;
  brushLoad: number;
  brushFresh: boolean;
  fillings: Partial<Record<Ingredient, number>>;
  fillingDrops: Partial<Record<Ingredient, Point[]>>;
  activeFilling: Ingredient | null;
  fillLoad: number;
  fillFresh: boolean;
  folds: ("left" | "right")[];
  cut: boolean;
  bagged: boolean;
  elapsed: number;
};
export type Result = {
  score: number;
  satisfaction: number;
  revenue: number;
  perfect: boolean;
  wrong: boolean;
  feedback: string;
  details: string[];
  cilantroError: boolean;
};
export type Run = {
  mode: Mode;
  level: number;
  secondsLeft: number;
  elapsed: number;
  maxCustomers: number;
  order: Order | null;
  customerWait: number;
  sequence: number;
  served: number;
  missed: number;
  revenue: number;
  perfect: number;
  wrong: number;
  satisfactionTotal: number;
  perfectStreak: number;
  bestPerfectStreak: number;
  pancake: Pancake;
  paused: boolean;
  finished: boolean;
  lastResult: Result | null;
  message: string;
};

export const newPancake = (): Pancake => ({
  stage: "spread",
  batterType: "classic",
  batter: [],
  eggPaint: [],
  eggs: 0,
  flipHeat: 0,
  heat: 0,
  sauces: {},
  saucePaint: {},
  activeSauce: null,
  brushLoad: 0,
  brushFresh: false,
  fillings: {},
  fillingDrops: {},
  activeFilling: null,
  fillLoad: 0,
  fillFresh: false,
  folds: [],
  cut: false,
  bagged: false,
  elapsed: 0,
});

function coverage(points: Point[], radius: number) {
  if (!points.length) return 0;
  let total = 0,
    hit = 0;
  for (let y = 0.12; y <= 0.88; y += 0.04)
    for (let x = 0.12; x <= 0.88; x += 0.04) {
      if (Math.hypot(x - 0.5, y - 0.5) > 0.39) continue;
      total++;
      if (points.some((p) => Math.hypot(x - p.x, y - p.y) < radius)) hit++;
    }
  return hit / total;
}
export const batterCoverage = (p: Pancake, scraper = 0) =>
  coverage(p.batter, 0.075 + scraper * 0.012);
export const eggCoverage = (p: Pancake) => coverage(p.eggPaint, 0.085);

export function evaluate(
  p: Pancake,
  order: Order | null,
  wait: number,
  mode: Mode,
  griddle: number,
  scraper: number,
): Result {
  const batter = batterCoverage(p, scraper);
  const egg = eggCoverage(p);
  const outside = p.batter.filter(
    (v) => Math.hypot(v.x - 0.5, v.y - 0.5) > 0.43,
  ).length;
  const roundness = Math.max(
    0,
    1 - (outside / Math.max(1, p.batter.length)) * 2,
  );
  const base = Math.round(100 * (0.65 * batter + 0.35 * roundness));
  const eggQuality = Math.round(100 * Math.min(1, egg / 0.75));
  const heatTolerance = 15 + griddle * 5;
  const heatQuality = Math.max(
    0,
    Math.round(100 - Math.abs(p.flipHeat - 63) * (100 / heatTolerance)),
  );
  const foldQuality = p.folds.length === 2 ? 100 : p.folds.length * 40;
  let accuracy = 100;
  const wants = order?.wants ?? {};
  const actual: Partial<Record<Ingredient, number>> = {
    ...p.fillings,
    ...p.sauces,
    egg: p.eggs,
  };
  const mismatches: string[] = [];
  if (order)
    for (const { id: ingredient, name } of INGREDIENTS) {
      const expected = wants[ingredient] ?? 0;
      const got = actual[ingredient] ?? 0;
      if (got === expected) continue;
      accuracy -=
        Math.min(2, Math.abs(got - expected)) *
        (ingredient === "cilantro" && expected === 0 ? 30 : 18);
      mismatches.push(
        `${got < expected ? "少放" : "多放"}${name}（要 ${expected}，放 ${got}）`,
      );
    }
  if (mode === "free") {
    const sauceCount =
      (p.sauces.sweet ?? 0) + (p.sauces.chili ?? 0) + (p.sauces.garlic ?? 0);
    const fillingCount = Object.values(p.fillings).reduce(
      (sum, n) => sum + (n ?? 0),
      0,
    );
    if (!sauceCount) accuracy -= 22;
    if (!p.fillings.crispy) accuracy -= 12;
    if (!p.fillings.scallion && !p.fillings.cilantro) accuracy -= 8;
    if (!fillingCount) accuracy -= 14;
    if (sauceCount > 2) accuracy -= (sauceCount - 2) * 6;
    if (p.eggs > 3) accuracy -= (p.eggs - 3) * 6;
  }
  accuracy = Math.max(0, accuracy);
  const wrong = mismatches.length > 0;
  const speed =
    mode === "free" || !order
      ? 100
      : Math.max(0, Math.round(100 * (1 - wait / order.patience)));
  const score = Math.round(
    base * 0.18 +
      eggQuality * 0.11 +
      heatQuality * 0.18 +
      foldQuality * 0.1 +
      accuracy * 0.34 +
      speed * 0.09,
  );
  const satisfaction = Math.max(
    0,
    Math.min(
      wrong ? 68 : 100,
      Math.round(
        score * (order?.customer.quality ?? 1) -
          (order?.customer.kind === "worker" ? (100 - speed) * 0.12 : 0) -
          (wrong ? 12 : 0),
      ),
    ),
  );
  const perfect = score >= 88 && accuracy === 100;
  const revenue =
    mode === "free"
      ? 0
      : Math.max(
          0,
          Math.round(
            (order?.price ?? 0) *
              (wrong ? Math.max(0.3, 0.75 - mismatches.length * 0.2) : 1) +
              (perfect ? 5 : 0),
          ),
        );
  const feedback =
    mode === "free"
      ? score >= 85
        ? "这份煎饼可以出摊了！"
        : score >= 65
          ? "有模有样，再练练手感。"
          : "铁板记住了你的勇气。"
      : wrong
        ? "这配料和我说的好像不太一样……"
        : perfect
          ? "老板，这口绝了！明天还来。"
          : satisfaction < 55
            ? "早高峰要赶不上了……"
            : "热乎！下回再来一份。";
  return {
    score,
    satisfaction,
    revenue,
    perfect,
    wrong,
    feedback,
    cilantroError:
      !!order && (order.wants.cilantro ?? 0) !== (actual.cilantro ?? 0),
    details: [
      `面饼 ${base}`,
      `蛋液 ${eggQuality}`,
      `火候 ${heatQuality}`,
      `配料 ${accuracy}`,
      `折叠 ${foldQuality}`,
      `速度 ${speed}`,
      ...mismatches,
    ],
  };
}

export function getStars(run: Run): number {
  const level = LEVELS[run.level - 1];
  if (!level || run.revenue < level.target) return 0;
  return run.revenue >= level.star3 && run.missed === 0
    ? 3
    : run.revenue >= level.star2
      ? 2
      : 1;
}
