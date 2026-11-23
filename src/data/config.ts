export type Mode = "level" | "endless" | "free";
export type Stage =
  "spread" | "egg" | "flip" | "sauce" | "fill" | "fold" | "bag";
export type Ingredient =
  | "egg"
  | "scallion"
  | "cilantro"
  | "sweet"
  | "chili"
  | "garlic"
  | "crispy"
  | "ham"
  | "sesame";
export const EGG_UNIT_COST = 3;
export type CustomerKind =
  "worker" | "critic" | "cilantroFan" | "cilantroHater" | "chiliFan";
export type Customer = {
  kind: CustomerKind;
  name: string;
  line: string;
  color: string;
  hair: string;
  accessory: string;
  patience: number;
  speed: number;
  quality: number;
};
export type Order = {
  id: number;
  customer: Customer;
  wants: Partial<Record<Ingredient, number>>;
  notes: string[];
  price: number;
  patience: number;
};
export type Level = {
  id: number;
  title: string;
  area: string;
  seconds: number;
  customers: number;
  target: number;
  patience: number;
  special: string;
  star2: number;
  star3: number;
};

export const STAGES: Stage[] = [
  "spread",
  "egg",
  "flip",
  "sauce",
  "fill",
  "fold",
  "bag",
];
export const STAGE_NAMES: Record<Stage, string> = {
  spread: "摊面",
  egg: "打蛋",
  flip: "翻面",
  sauce: "刷酱",
  fill: "加料",
  fold: "折叠",
  bag: "装袋",
};
export const INGREDIENTS: {
  id: Ingredient;
  name: string;
  icon: string;
  color: string;
  category: string;
  unlockLevel: number;
  cost: number;
}[] = [
  {
    id: "egg",
    name: "鸡蛋",
    icon: "◉",
    color: "#f6bf4d",
    category: "基础",
    unlockLevel: 1,
    cost: 0,
  },
  {
    id: "scallion",
    name: "葱花",
    icon: "✳",
    color: "#8db65c",
    category: "配料",
    unlockLevel: 1,
    cost: 0,
  },
  {
    id: "cilantro",
    name: "香菜",
    icon: "❋",
    color: "#4c9b63",
    category: "配料",
    unlockLevel: 1,
    cost: 0,
  },
  {
    id: "sweet",
    name: "甜面酱",
    icon: "●",
    color: "#85442b",
    category: "酱料",
    unlockLevel: 1,
    cost: 0,
  },
  {
    id: "chili",
    name: "辣椒酱",
    icon: "✦",
    color: "#d84e35",
    category: "酱料",
    unlockLevel: 1,
    cost: 0,
  },
  {
    id: "crispy",
    name: "薄脆",
    icon: "▥",
    color: "#d9994e",
    category: "配料",
    unlockLevel: 1,
    cost: 0,
  },
  {
    id: "ham",
    name: "火腿肠",
    icon: "▰",
    color: "#d67868",
    category: "配料",
    unlockLevel: 1,
    cost: 0,
  },
  {
    id: "garlic",
    name: "蒜蓉酱",
    icon: "◌",
    color: "#dec58e",
    category: "酱料",
    unlockLevel: 5,
    cost: 80,
  },
  {
    id: "sesame",
    name: "芝麻",
    icon: "⁂",
    color: "#e7d4a5",
    category: "配料",
    unlockLevel: 1,
    cost: 0,
  },
];
export const CUSTOMERS: Customer[] = [
  {
    kind: "worker",
    name: "赶早班的阿周",
    line: "地铁还有六分钟！",
    color: "#7692a6",
    hair: "#30271e",
    accessory: "tie",
    patience: 1,
    speed: 1.25,
    quality: 0.9,
  },
  {
    kind: "critic",
    name: "美食侦探老许",
    line: "饼边不圆，我会看出来。",
    color: "#b26c52",
    hair: "#3e322d",
    accessory: "glasses",
    patience: 1.05,
    speed: 0.85,
    quality: 1.3,
  },
  {
    kind: "cilantroFan",
    name: "香菜教主小林",
    line: "香菜请像下雪一样。",
    color: "#8ca86a",
    hair: "#4a3628",
    accessory: "scarf",
    patience: 1.1,
    speed: 1,
    quality: 1,
  },
  {
    kind: "cilantroHater",
    name: "香菜雷达阿宁",
    line: "一片香菜也会报警。",
    color: "#c98d73",
    hair: "#392d32",
    accessory: "headband",
    patience: 0.95,
    speed: 1,
    quality: 1.1,
  },
  {
    kind: "chiliFan",
    name: "无辣不欢老马",
    line: "辣到冒汗才算早餐。",
    color: "#c17959",
    hair: "#2e2521",
    accessory: "cap",
    patience: 1,
    speed: 1,
    quality: 1,
  },
];
export const LEVELS: Level[] = [
  {
    id: 1,
    title: "第一炉烟火",
    area: "街边小摊",
    seconds: 210,
    customers: 2,
    target: 18,
    patience: 90,
    special: "五选二，看清小票",
    star2: 30,
    star3: 38,
  },
  {
    id: 2,
    title: "早起的邻居",
    area: "街边小摊",
    seconds: 230,
    customers: 3,
    target: 38,
    patience: 84,
    special: "香菜偏好",
    star2: 47,
    star3: 56,
  },
  {
    id: 3,
    title: "第一位回头客",
    area: "街边小摊",
    seconds: 240,
    customers: 4,
    target: 56,
    patience: 78,
    special: "辣椒与禁忌",
    star2: 69,
    star3: 79,
  },
  {
    id: 4,
    title: "八点整",
    area: "早餐黄金档",
    seconds: 265,
    customers: 5,
    target: 78,
    patience: 72,
    special: "三样配料加单",
    star2: 95,
    star3: 115,
  },
  {
    id: 5,
    title: "加单！加单！",
    area: "早餐黄金档",
    seconds: 285,
    customers: 6,
    target: 100,
    patience: 68,
    special: "双蛋订单",
    star2: 128,
    star3: 155,
  },
  {
    id: 6,
    title: "忙得脚不沾地",
    area: "早餐黄金档",
    seconds: 305,
    customers: 7,
    target: 125,
    patience: 64,
    special: "连续特殊订单",
    star2: 157,
    star3: 190,
  },
  {
    id: 7,
    title: "商业街开张",
    area: "商业街挑战",
    seconds: 320,
    customers: 8,
    target: 150,
    patience: 60,
    special: "要求更严格",
    star2: 186,
    star3: 226,
  },
  {
    id: 8,
    title: "午前小高峰",
    area: "商业街挑战",
    seconds: 340,
    customers: 9,
    target: 180,
    patience: 56,
    special: "多加薄脆",
    star2: 220,
    star3: 264,
  },
  {
    id: 9,
    title: "排队到街角",
    area: "商业街挑战",
    seconds: 365,
    customers: 10,
    target: 215,
    patience: 52,
    special: "限时冲刺",
    star2: 258,
    star3: 308,
  },
  {
    id: 10,
    title: "煎饼王争霸",
    area: "商业街挑战",
    seconds: 400,
    customers: 12,
    target: 265,
    patience: 48,
    special: "终极早市考验",
    star2: 300,
    star3: 330,
  },
];

export function unlockedByLevel(level: number): Ingredient[] {
  return INGREDIENTS.filter((i) => i.cost === 0 && i.unlockLevel <= level).map(
    (i) => i.id,
  );
}

function drawIngredients<T>(options: T[], count: number): T[] {
  const remaining = [...options];
  const picked: T[] = [];
  while (picked.length < count && remaining.length) {
    picked.push(
      remaining.splice(Math.floor(Math.random() * remaining.length), 1)[0],
    );
  }
  return picked;
}

export function makeOrder(
  level: number,
  sequence: number,
  mode: Mode,
  available: Ingredient[] = unlockedByLevel(level),
): Order {
  const pool =
    level < 2
      ? CUSTOMERS.slice(0, 2)
      : level < 3
        ? CUSTOMERS.slice(0, 4)
        : CUSTOMERS;
  const customer = pool[Math.floor(Math.random() * pool.length)];
  const saucePool = (["sweet", "chili", "garlic"] as Ingredient[]).filter(
    (id) => available.includes(id),
  );
  const fillingPool = (
    ["scallion", "cilantro", "crispy", "ham", "sesame"] as Ingredient[]
  ).filter(
    (id) =>
      available.includes(id) &&
      !(customer.kind === "cilantroHater" && id === "cilantro"),
  );
  const sauce = drawIngredients<Ingredient>(
    saucePool.length ? saucePool : ["sweet"],
    1,
  )[0];
  const fillingCount = level >= 4 ? 3 : 2;
  const extraScallion = level >= 3 && Math.random() < 0.2;
  const extraCrispy = level >= 8 && Math.random() < 0.35;
  const forced = (
    [
      customer.kind === "cilantroFan" ? "cilantro" : null,
      extraScallion ? "scallion" : null,
      extraCrispy ? "crispy" : null,
    ] as (Ingredient | null)[]
  ).filter((id): id is Ingredient => !!id);
  const selected = [
    ...new Set(forced),
    ...drawIngredients(
      fillingPool.filter((id) => !forced.includes(id)),
      Math.max(0, fillingCount - new Set(forced).size),
    ),
  ];
  const wants: Partial<Record<Ingredient, number>> = { egg: 1, [sauce]: 1 };
  for (const id of selected) wants[id] = 1;
  const notes: string[] = [];
  if (level >= 5 && Math.random() < 0.25) {
    wants.egg = 2;
    notes.push("加两个鸡蛋");
  }
  if (customer.kind === "cilantroFan") {
    wants.cilantro = 2;
    notes.push("香菜加倍");
  }
  if (customer.kind === "cilantroHater") {
    wants.cilantro = 0;
    notes.push("不要香菜");
  }
  if (customer.kind === "chiliFan") {
    if (sauce !== "chili") delete wants[sauce];
    wants.chili = 2;
    notes.push("辣椒加倍");
  }
  if (level >= 3 && customer.kind !== "chiliFan" && Math.random() < 0.18) {
    if (sauce === "chili") {
      delete wants.chili;
      wants.sweet = 1;
    }
    wants.chili = 0;
    notes.push("不要辣椒");
  }
  if (extraScallion) {
    wants.scallion = 2;
    notes.push("多加葱花");
  }
  if (extraCrispy) {
    wants.crispy = 2;
    notes.push("多加薄脆");
  }
  const price =
    14 +
    (wants.egg === 2 ? 3 : 0) +
    (wants.ham ? 4 : 0) +
    (wants.crispy === 2 ? 2 : 0) +
    (wants.chili ? 1 : 0);
  const base =
    mode === "endless"
      ? Math.max(30, 78 - Math.floor(sequence / 3) * 4)
      : (LEVELS[level - 1]?.patience ?? 70);
  return {
    id: sequence,
    customer,
    wants,
    notes,
    price,
    patience: Math.round(base * customer.patience),
  };
}
