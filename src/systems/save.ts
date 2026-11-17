import { Ingredient, unlockedByLevel } from "../data/config";
import type { Run } from "../game/engine";

export type Save = {
  version: 1;
  unlockedLevel: number;
  stars: Record<number, number>;
  coins: number;
  ingredients: Ingredient[];
  upgrades: { griddle: number; scraper: number; service: number };
  decoration: boolean;
  endless: { revenue: number; served: number; perfectStreak: number };
  sound: boolean;
  achievements: string[];
  cilantroMistakeStreak: number;
  perfectStreak: number;
  activeRun: Run | null;
};

export const SAVE_KEY = "jianbing-simulator-save-v1";
export const defaultSave = (): Save => ({
  version: 1,
  unlockedLevel: 1,
  stars: {},
  coins: 0,
  ingredients: unlockedByLevel(1),
  upgrades: { griddle: 0, scraper: 0, service: 0 },
  decoration: false,
  endless: { revenue: 0, served: 0, perfectStreak: 0 },
  sound: true,
  achievements: [],
  cilantroMistakeStreak: 0,
  perfectStreak: 0,
  activeRun: null,
});

function normalizeRun(value: unknown): Run | null {
  if (!value || typeof value !== "object") return null;
  const run = value as Run;
  if (
    !["level", "endless", "free"].includes(run.mode) ||
    !Number.isInteger(run.level) ||
    run.level < 1 ||
    run.level > 10 ||
    !run.pancake ||
    !Array.isArray(run.pancake.batter) ||
    !Array.isArray(run.pancake.eggPaint) ||
    !Array.isArray(run.pancake.folds) ||
    !Number.isFinite(run.elapsed)
  )
    return null;
  return {
    ...run,
    pancake: {
      ...run.pancake,
      batterType: run.pancake.batterType ?? "classic",
    },
    secondsLeft:
      run.mode === "level" && Number.isFinite(run.secondsLeft)
        ? run.secondsLeft
        : Infinity,
    maxCustomers:
      run.mode === "level" && Number.isFinite(run.maxCustomers)
        ? run.maxCustomers
        : Infinity,
    bestPerfectStreak: run.bestPerfectStreak ?? 0,
    paused: true,
  };
}

export function loadSave(): Save {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Partial<Save>;
    if (
      parsed.version !== 1 ||
      !Number.isInteger(parsed.unlockedLevel) ||
      !Number.isFinite(parsed.coins) ||
      !Array.isArray(parsed.ingredients)
    )
      throw new Error("Invalid save");
    const base = defaultSave();
    return {
      ...base,
      ...parsed,
      unlockedLevel: Math.min(10, Math.max(1, parsed.unlockedLevel!)),
      coins: Math.max(0, parsed.coins!),
      stars: parsed.stars ?? {},
      upgrades: { ...base.upgrades, ...parsed.upgrades },
      endless: { ...base.endless, ...parsed.endless },
      achievements: Array.isArray(parsed.achievements)
        ? parsed.achievements
        : [],
      activeRun: normalizeRun(parsed.activeRun),
    };
  } catch {
    return defaultSave();
  }
}

export function persistSave(save: Save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    /* Storage may be unavailable. Play remains possible. */
  }
}

export function importSave(text: string): Save {
  const parsed = JSON.parse(text) as Save;
  if (
    parsed.version !== 1 ||
    !Number.isInteger(parsed.unlockedLevel) ||
    parsed.unlockedLevel < 1 ||
    parsed.unlockedLevel > 10 ||
    !Number.isFinite(parsed.coins) ||
    parsed.coins < 0 ||
    !Array.isArray(parsed.ingredients) ||
    !parsed.upgrades ||
    !parsed.endless ||
    !Array.isArray(parsed.achievements)
  )
    throw new Error("存档格式不正确或版本不兼容");
  const allowed: Ingredient[] = [
    "egg",
    "scallion",
    "cilantro",
    "sweet",
    "chili",
    "garlic",
    "crispy",
    "ham",
    "sesame",
  ];
  if (
    !parsed.ingredients.every((i) => allowed.includes(i)) ||
    Object.values(parsed.upgrades).some(
      (n) => !Number.isInteger(n) || n < 0 || n > 3,
    )
  )
    throw new Error("存档内容不合法");
  return {
    ...defaultSave(),
    ...parsed,
    activeRun: normalizeRun(parsed.activeRun),
  };
}

export function exportSave(save: Save) {
  const blob = new Blob([JSON.stringify(save, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "jianbing-save.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
