import { useEffect, useRef } from "react";
import { Pancake, Point } from "../game/engine";

type Props = {
  pancake: Pancake;
  onPaint: (point: Point) => void;
  onCut: () => void;
  onBag: () => void;
  scraper: number;
  poured?: boolean;
  reducedMotion?: boolean;
};
type Motion = {
  kind: "pour" | "egg" | "flip" | "fill" | "fold" | "sauce" | "bag";
  started: number;
  seed: number;
};
const size = 560,
  center = size / 2,
  radius = 226;
const rnd = (n: number) => {
  const v = Math.sin(n * 127.1) * 43758.5453;
  return v - Math.floor(v);
};
const pos = (n: number, salt: number) => {
  const a = rnd(n * 7 + salt) * Math.PI * 2,
    r = Math.sqrt(rnd(n * 3 + salt * 9)) * 166;
  return [center + Math.cos(a) * r, center + Math.sin(a) * r] as const;
};
function pancakeOutline(ctx: CanvasRenderingContext2D, edge: number) {
  ctx.beginPath();
  for (let i = 0; i <= 96; i++) {
    const angle = (i / 96) * Math.PI * 2;
    const wobble =
      Math.sin(angle * 7 + 0.8) * 2.7 +
      Math.sin(angle * 19 + 1.6) * 1.6 +
      (rnd(i * 13 + 5) - 0.5) * 2;
    const x = center + Math.cos(angle) * (edge + wobble);
    const y = center + Math.sin(angle) * (edge + wobble);
    if (!i) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}
function drawEggPool(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  bloom: number,
  seed: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(bloom, bloom);
  ctx.fillStyle = "#fff7d9de";
  ctx.strokeStyle = "#dbbd7b";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-36, -3);
  ctx.bezierCurveTo(-43, -19, -21, -28, -7, -26);
  ctx.bezierCurveTo(10, -34, 26, -22, 31, -12);
  ctx.bezierCurveTo(46, 1, 31, 17, 17, 17);
  ctx.bezierCurveTo(2, 28, -21, 21, -29, 11);
  ctx.bezierCurveTo(-38, 8, -40, 4, -36, -3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f6bc43";
  ctx.strokeStyle = "#b9742e";
  ctx.beginPath();
  ctx.ellipse(2 + rnd(seed) * 5, -4, 17, 14, 0.14, 0, 7);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#ffdf88";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(-2, -7, 8, 3.6, 5.2);
  ctx.stroke();
  ctx.restore();
}

function drawTrace(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  width: number,
  color: string,
) {
  if (!points.length) return;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = p.x * size,
      y = p.y * size;
    if (!i || Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y) > 0.15)
      ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  if (points.length === 1) {
    const p = points[0];
    ctx.beginPath();
    ctx.arc(p.x * size, p.y * size, width * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

const sauceStrokeCache = new WeakMap<Point[], HTMLCanvasElement>();
function drawBrushTrace(points: Point[], color: string) {
  let layer = sauceStrokeCache.get(points);
  if (layer) return layer;
  layer = document.createElement("canvas");
  layer.width = layer.height = size;
  const brush = layer.getContext("2d")!;
  pancakeOutline(brush, radius - 8);
  brush.clip();
  brush.strokeStyle = color;
  brush.fillStyle = color;
  brush.lineCap = "butt";
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const previous = points[i - 1];
    const start =
      !previous ||
      point.strokeStart ||
      Math.hypot(point.x - previous.x, point.y - previous.y) > 0.15;
    if (start) {
      const next = points[i + 1];
      const angle =
        next && !next.strokeStart
          ? Math.atan2(next.y - point.y, next.x - point.x)
          : -0.2;
      brush.save();
      brush.translate(point.x * size, point.y * size);
      brush.rotate(angle);
      brush.lineCap = "round";
      brush.globalAlpha = 0.3 * (point.strength ?? 1);
      for (let hair = -4; hair <= 4; hair++) {
        if (rnd(i * 41 + hair * 17 + 7) < 0.2) continue;
        brush.lineWidth = 1 + rnd(i * 19 + hair * 11 + 2) * 1.4;
        brush.beginPath();
        brush.moveTo(-3, hair * 3.8);
        brush.lineTo(2 + rnd(i * 13 + hair * 3 + 5) * 4, hair * 3.8);
        brush.stroke();
      }
      brush.restore();
      continue;
    }
    const x0 = previous.x * size,
      y0 = previous.y * size,
      x1 = point.x * size,
      y1 = point.y * size;
    const distance = Math.hypot(x1 - x0, y1 - y0);
    if (distance < 0.1) continue;
    const normalX = -(y1 - y0) / distance,
      normalY = (x1 - x0) / distance;
    const load = ((previous.strength ?? 1) + (point.strength ?? 1)) / 2;
    brush.globalAlpha = 0.1 * load;
    brush.lineWidth = 30;
    brush.beginPath();
    brush.moveTo(x0, y0);
    brush.lineTo(x1, y1);
    brush.stroke();
    for (let hair = -4; hair <= 4; hair++) {
      const grain = rnd(i * 37 + hair * 23 + 11);
      if (grain < 0.08 + (1 - load) * 0.4) continue;
      const offset = hair * 3.8;
      const flutterBefore = Math.sin(i * 0.29 + hair * 1.13) * 0.8;
      const flutterAfter = Math.sin((i + 1) * 0.29 + hair * 1.13) * 0.8;
      brush.globalAlpha =
        load * (0.34 + grain * 0.4) * (1 - Math.abs(hair) * 0.065);
      brush.lineWidth = 1.6 + rnd(i * 19 + hair * 7 + 2) * 1.5;
      brush.beginPath();
      brush.moveTo(
        x0 + normalX * (offset + flutterBefore),
        y0 + normalY * (offset + flutterBefore),
      );
      brush.lineTo(
        x1 + normalX * (offset + flutterAfter),
        y1 + normalY * (offset + flutterAfter),
      );
      brush.stroke();
    }
  }
  brush.globalAlpha = 1;
  sauceStrokeCache.set(points, layer);
  return layer;
}

function ingredient(
  ctx: CanvasRenderingContext2D,
  id: string,
  x: number,
  y: number,
  seed: number,
  scale = 1,
  settle = 1,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rnd(seed + 8) - 0.5) * 1.7 + (1 - settle) * 1.2);
  ctx.scale(scale, scale);
  ctx.lineJoin = "round";
  if (id === "scallion") {
    ctx.fillStyle = rnd(seed + 3) > 0.5 ? "#5b9849" : "#7eb65e";
    ctx.strokeStyle = "#2f673e";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-11, -4);
    ctx.quadraticCurveTo(-2, -7, 11, -3);
    ctx.lineTo(9, 5);
    ctx.quadraticCurveTo(-2, 7, -12, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#d6e4a5";
    ctx.beginPath();
    ctx.ellipse(-9, 0, 2.7, 3.4, -0.2, 0, 7);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#acd077";
    ctx.beginPath();
    ctx.moveTo(-3, -3);
    ctx.quadraticCurveTo(3, -4, 8, -2);
    ctx.stroke();
  } else if (id === "cilantro") {
    ctx.strokeStyle = "#315e3d";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-2, 13);
    ctx.quadraticCurveTo(-2, 1, 1, -10);
    ctx.moveTo(-1, 3);
    ctx.lineTo(-11, -7);
    ctx.moveTo(0, -2);
    ctx.lineTo(11, -8);
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.translate(i === 0 ? 0 : i === 1 ? -10 : 10, i === 0 ? -10 : -7);
      ctx.rotate(i === 1 ? -0.7 : i === 2 ? 0.8 : 0);
      ctx.fillStyle = i === 1 ? "#6c9d56" : "#4f8548";
      ctx.strokeStyle = "#2b6138";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(0, 5);
      ctx.quadraticCurveTo(-8, 3, -7, -2);
      ctx.quadraticCurveTo(-11, -5, -5, -7);
      ctx.quadraticCurveTo(-4, -12, 0, -8);
      ctx.quadraticCurveTo(4, -12, 5, -7);
      ctx.quadraticCurveTo(11, -5, 7, -1);
      ctx.quadraticCurveTo(8, 3, 0, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#a0bd75";
      ctx.beginPath();
      ctx.moveTo(0, 3);
      ctx.lineTo(0, -6);
      ctx.stroke();
      ctx.restore();
    }
  } else if (id === "crispy") {
    ctx.fillStyle = "#e8ae61";
    ctx.strokeStyle = "#ae6c35";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-19, -11);
    ctx.lineTo(14, -14);
    ctx.lineTo(21, 6);
    ctx.lineTo(-13, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#f8d394";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-16, -5);
    ctx.lineTo(11, -9);
    ctx.moveTo(-11, 5);
    ctx.lineTo(15, 3);
    ctx.stroke();
    ctx.fillStyle = "#ab6b38";
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(rnd(seed + i) * 29 - 14, rnd(seed + 20 + i) * 15 - 7, 1.2, 0, 7);
      ctx.fill();
    }
  } else if (id === "ham") {
    ctx.fillStyle = "#c97866";
    ctx.strokeStyle = "#9d5149";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 8, 0.2, 0, 7);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#eaa692";
    ctx.beginPath();
    ctx.ellipse(-2, -1, 12, 4, 0.2, 0, 7);
    ctx.stroke();
  } else if (id === "sesame") {
    ctx.fillStyle = "#f6e8bd";
    ctx.strokeStyle = "#9d815e";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.ellipse(0, 0, 4, 2, 1, 0, 7);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawPan(
  ctx: CanvasRenderingContext2D,
  heat: number,
  time: number,
  reduced: boolean,
) {
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(center, center);
  ctx.scale(1, 0.94);
  ctx.fillStyle = "#141b1b";
  ctx.beginPath();
  ctx.ellipse(0, 13, 265, 254, 0, 0, 7);
  ctx.fill();
  const rim = ctx.createRadialGradient(-85, -120, 20, 0, 0, 265);
  rim.addColorStop(0, "#77817c");
  rim.addColorStop(0.62, "#35413f");
  rim.addColorStop(0.9, "#1c2827");
  rim.addColorStop(1, "#79837d");
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.arc(0, 0, 256, 0, 7);
  ctx.fill();
  ctx.strokeStyle = "#a4aaa0";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, 252, -2.8, -0.15);
  ctx.stroke();
  ctx.fillStyle = "#202d2b";
  ctx.beginPath();
  ctx.arc(0, 0, 235, 0, 7);
  ctx.fill();
  const inner = ctx.createRadialGradient(-90, -105, 8, 10, 10, 235);
  inner.addColorStop(0, "#485855");
  inner.addColorStop(0.62, "#273633");
  inner.addColorStop(1, "#192522");
  ctx.fillStyle = inner;
  ctx.beginPath();
  ctx.arc(0, 0, 229, 0, 7);
  ctx.fill();
  for (let i = 0; i < 95; i++) {
    const a = rnd(i + 3) * 7,
      r = 20 + rnd(i + 29) * 205;
    ctx.strokeStyle = i % 5 ? "#e0e9da0a" : "#d4dac91c";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.arc(0, 0, r, a, a + 0.3 + rnd(i + 44) * 1.2);
    ctx.stroke();
  }
  const ember = Math.min(1, heat / 100);
  ctx.strokeStyle = `rgba(221,102,55,${0.1 + ember * 0.3})`;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(0, 0, 231, 0.18, 2.4);
  ctx.stroke();
  ctx.restore();
  if (!reduced) {
    for (let i = 0; i < 4; i++) {
      const drift = (time * 0.025 + i * 91) % 170;
      ctx.strokeStyle = `rgba(255,250,224,${0.12 * (1 - drift / 170)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      const x = 160 + i * 75;
      ctx.moveTo(x, 135 - drift);
      ctx.bezierCurveTo(x - 20, 100 - drift, x + 18, 80 - drift, x, 48 - drift);
      ctx.stroke();
    }
  }
}

const batterCache = new WeakMap<Point[], Map<string, HTMLCanvasElement>>();
const eggCache = new WeakMap<Point[], HTMLCanvasElement>();
const cookedEggCache = new WeakMap<Point[], HTMLCanvasElement>();
const foldedSourceCache = new WeakMap<
  Point[],
  { signature: string; food: HTMLCanvasElement; crust: HTMLCanvasElement }
>();

function drawFood(
  ctx: CanvasRenderingContext2D,
  pancake: Pancake,
  scraper: number,
  motion: Motion | null,
  progress: number,
) {
  if (pancake.folds.length) {
    const signature = JSON.stringify([
      pancake.batterType,
      pancake.eggPaint.length,
      pancake.eggs,
      pancake.flipHeat > 90,
      pancake.sauces,
      pancake.fillings,
      Object.values(pancake.fillingDrops).map((drops) => drops?.length ?? 0),
    ]);
    let layers = foldedSourceCache.get(pancake.batter);
    if (!layers || layers.signature !== signature) {
      const food = document.createElement("canvas");
      food.width = food.height = size;
      drawFood(
        food.getContext("2d")!,
        { ...pancake, folds: [] },
        scraper,
        null,
        1,
      );
      const crust = document.createElement("canvas");
      crust.width = crust.height = size;
      drawFood(
        crust.getContext("2d")!,
        {
          ...pancake,
          folds: [],
          sauces: {},
          saucePaint: {},
          fillings: {},
          fillingDrops: {},
        },
        scraper,
        null,
        1,
      );
      layers = { signature, food, crust };
      foldedSourceCache.set(pancake.batter, layers);
    }
    const recentSide = pancake.folds.at(-1);
    const foldAmount =
      motion?.kind === "fold" && progress < 1 ? Math.min(1, progress * 1.4) : 1;
    const left = pancake.folds.includes("left")
      ? recentSide === "left"
        ? foldAmount
        : 1
      : 0;
    const right = pancake.folds.includes("right")
      ? recentSide === "right"
        ? foldAmount
        : 1
      : 0;
    const bagMotion = pancake.bagged && motion?.kind === "bag" && progress < 1;
    if (!pancake.bagged || bagMotion) {
      if (bagMotion) {
        ctx.save();
        ctx.translate(progress * 170, -progress * 28);
        ctx.translate(center, center);
        ctx.scale(1 - progress * 0.54, 1 - progress * 0.42);
        ctx.translate(-center, -center);
      }
      const leftEdge = 55 + left * 150;
      const rightEdge = 505 - right * 150;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(center, 88);
      ctx.bezierCurveTo(rightEdge - 31, 89, rightEdge + 3, 126, rightEdge, 177);
      ctx.bezierCurveTo(
        rightEdge - 4,
        278,
        rightEdge + 2,
        395,
        rightEdge - 12,
        432,
      );
      ctx.bezierCurveTo(
        rightEdge - 31,
        484,
        leftEdge + 31,
        484,
        leftEdge + 12,
        432,
      );
      ctx.bezierCurveTo(leftEdge - 2, 395, leftEdge + 4, 278, leftEdge, 177);
      ctx.bezierCurveTo(leftEdge - 3, 126, leftEdge + 31, 89, center, 88);
      ctx.closePath();
      ctx.shadowColor = "#201c18aa";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 7;
      ctx.fillStyle = "#d99e61";
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#9b6338";
      ctx.stroke();
      ctx.clip();
      const covered = left && right ? Math.min(left, right) : 0;
      ctx.globalAlpha = 1 - covered;
      ctx.drawImage(layers.food, 0, 0);
      if (covered) {
        ctx.globalAlpha = covered;
        ctx.drawImage(layers.crust, 0, 0);
      }
      ctx.globalAlpha = 1;
      for (const [side, amount] of [
        ["left", left],
        ["right", right],
      ] as const) {
        if (!amount) continue;
        ctx.save();
        ctx.shadowColor = "#523c2899";
        ctx.shadowBlur = 14;
        ctx.shadowOffsetX = side === "left" ? 8 : -8;
        if (side === "left") {
          ctx.translate(205, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(
            layers.crust,
            55,
            90,
            150,
            380,
            -150 * amount,
            90,
            150 * amount,
            380,
          );
        } else {
          ctx.translate(355, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(
            layers.crust,
            355,
            90,
            150,
            380,
            0,
            90,
            150 * amount,
            380,
          );
        }
        ctx.restore();
      }
      if (pancake.cut) {
        ctx.strokeStyle = "#263531";
        ctx.lineWidth = 13;
        ctx.beginPath();
        ctx.moveTo(198, 280);
        ctx.lineTo(362, 280);
        ctx.stroke();
        ctx.strokeStyle = "#f8d99a";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(202, 270);
        ctx.lineTo(358, 270);
        ctx.moveTo(202, 290);
        ctx.lineTo(358, 290);
        ctx.stroke();
      }
      ctx.restore();
      if (bagMotion) ctx.restore();
    }
    if (pancake.stage === "bag") {
      ctx.save();
      ctx.translate(455, 275);
      if (pancake.bagged) {
        ctx.save();
        ctx.rotate(-0.12);
        ctx.beginPath();
        ctx.moveTo(-27, -43);
        ctx.lineTo(-25, -89);
        ctx.quadraticCurveTo(-22, -100, -8, -98);
        ctx.quadraticCurveTo(7, -105, 24, -91);
        ctx.lineTo(28, -43);
        ctx.closePath();
        ctx.fillStyle = "#d9a063";
        ctx.fill();
        ctx.clip();
        ctx.drawImage(layers.crust, 205, 90, 150, 380, -30, -110, 60, 137);
        ctx.strokeStyle = "#9d623a";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-23, -84);
        ctx.quadraticCurveTo(-4, -94, 23, -82);
        ctx.moveTo(-23, -71);
        ctx.quadraticCurveTo(1, -77, 24, -69);
        ctx.stroke();
        ctx.restore();
      }
      ctx.fillStyle = pancake.bagged ? "#e2bd82" : "#f1d49f";
      ctx.strokeStyle = "#966942";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-38, -50);
      ctx.lineTo(37, -50);
      ctx.lineTo(30, 62);
      ctx.quadraticCurveTo(0, 76, -30, 62);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-38, -50);
      ctx.quadraticCurveTo(0, -68, 37, -50);
      ctx.stroke();
      ctx.restore();
      if (!pancake.cut) {
        ctx.setLineDash([9, 8]);
        ctx.strokeStyle = "#fff5db";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(195, 280);
        ctx.lineTo(365, 280);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    return;
  }
  ctx.save();
  if (motion?.kind === "flip" && progress < 1) {
    const lift = Math.sin(progress * Math.PI);
    ctx.translate(0, -lift * 42);
    ctx.translate(0, center);
    ctx.transform(1, 0, lift * 0.08, 1 - lift * 0.86, 0, 0);
    ctx.translate(0, -center);
  }
  const burn = pancake.flipHeat > 90 || pancake.heat > 105;
  const key = `${pancake.batterType}-${pancake.stage === "spread"}-${burn}-${scraper}`;
  let variants = batterCache.get(pancake.batter);
  if (!variants) {
    variants = new Map();
    batterCache.set(pancake.batter, variants);
  }
  let mask = variants.get(key);
  if (!mask) {
    mask = document.createElement("canvas");
    mask.width = mask.height = size;
    const m = mask.getContext("2d")!;
    m.save();
    pancakeOutline(m, radius);
    m.clip();
    if (pancake.batter.length)
      drawTrace(m, pancake.batter, 86 + scraper * 13, "#e9cc93");
    m.restore();
    if (pancake.batter.length) {
      m.globalCompositeOperation = "source-atop";
      const cooked = pancake.stage !== "spread";
      const colors =
        pancake.batterType === "purple"
          ? cooked
            ? ["#b18a9a", "#885b6a"]
            : ["#d6b5bb", "#a97d8d"]
          : pancake.batterType === "grain"
            ? cooked
              ? ["#d4aa6c", "#9e6a3c"]
              : ["#e2c894", "#a88758"]
            : cooked
              ? ["#ecc485", "#ae7041"]
              : ["#f0d6a6", "#bf834f"];
      const grad = m.createLinearGradient(75, 70, 480, 490);
      grad.addColorStop(0, colors[0]);
      grad.addColorStop(1, colors[1]);
      m.fillStyle = grad;
      m.fillRect(0, 0, size, size);
      const toasted = cooked;
      for (let i = 0; i < 1000; i++) {
        const x = rnd(i * 2) * size,
          y = rnd(i * 2 + 1) * size;
        m.fillStyle = burn
          ? `rgba(64,32,21,${rnd(i + 40) * 0.12})`
          : toasted
            ? `rgba(100,50,25,${rnd(i + 40) * 0.23})`
            : `rgba(255,249,218,${rnd(i + 40) * 0.13})`;
        m.beginPath();
        m.ellipse(
          x,
          y,
          1 + rnd(i + 20) * 4,
          1 + rnd(i + 21) * 2,
          rnd(i + 60) * 7,
          0,
          7,
        );
        m.fill();
      }
      if (toasted) {
        for (let i = 0; i < 90; i++) {
          const [x, y] = pos(i + 701, 17);
          m.fillStyle = `rgba(127,67,32,${0.035 + rnd(i + 505) * 0.09})`;
          m.beginPath();
          m.ellipse(
            x,
            y,
            7 + rnd(i + 31) * 13,
            2 + rnd(i + 48) * 7,
            rnd(i + 87) * 7,
            0,
            7,
          );
          m.fill();
        }
      }
      m.strokeStyle = toasted ? "#9c62304d" : "#fff1c970";
      m.lineWidth = toasted ? 9 : 5;
      pancakeOutline(m, radius - 3);
      m.stroke();
      m.globalCompositeOperation = "source-over";
    }
    variants.set(key, mask);
  }
  if (pancake.batter.length) {
    ctx.save();
    ctx.drawImage(mask, 0, 0);
    ctx.restore();
    ctx.strokeStyle = "rgba(115,63,37,.22)";
    ctx.lineWidth = 2;
  }
  if (pancake.eggs) {
    const pooled = Math.max(0, 1 - pancake.eggPaint.length / 65);
    if (pooled > 0) {
      ctx.save();
      ctx.globalAlpha = pooled;
      for (let egg = 0; egg < pancake.eggs; egg++) {
        const x = center + (egg - (pancake.eggs - 1) / 2) * 39;
        const arriving =
          motion?.kind === "egg" && progress < 1 && egg === pancake.eggs - 1;
        if (arriving && progress < 0.36) continue;
        const bloom = arriving ? Math.min(1, (progress - 0.36) * 3.6) : 1;
        drawEggPool(ctx, x, center - 20, bloom, egg + 14);
      }
      ctx.restore();
    }
    const cookedEgg = !["egg", "flip"].includes(pancake.stage);
    const cache = cookedEgg ? cookedEggCache : eggCache;
    let eggMask = cache.get(pancake.eggPaint);
    if (!eggMask) {
      eggMask = document.createElement("canvas");
      eggMask.width = eggMask.height = size;
      const e = eggMask.getContext("2d")!;
      e.save();
      pancakeOutline(e, radius - 7);
      e.clip();
      drawTrace(e, pancake.eggPaint, 64, cookedEgg ? "#d6b473" : "#f6db9d");
      e.globalCompositeOperation = "source-atop";
      for (let i = 0; i < pancake.eggPaint.length; i += 3) {
        const point = pancake.eggPaint[i];
        const x = point.x * size,
          y = point.y * size;
        e.fillStyle = cookedEgg
          ? `rgba(168,100,43,${0.07 + rnd(i + 53) * 0.13})`
          : `rgba(240,183,66,${0.08 + rnd(i + 53) * 0.17})`;
        e.beginPath();
        e.ellipse(
          x + (rnd(i + 31) - 0.5) * 19,
          y + (rnd(i + 37) - 0.5) * 19,
          10 + rnd(i + 14) * 16,
          4 + rnd(i + 27) * 8,
          rnd(i + 41) * 7,
          0,
          7,
        );
        e.fill();
      }
      e.globalCompositeOperation = "source-over";
      e.restore();
      if (cookedEgg) {
        e.globalCompositeOperation = "source-atop";
        for (let i = 0; i < 220; i++) {
          e.fillStyle = `rgba(115,65,33,${rnd(i + 41) * 0.22})`;
          e.beginPath();
          e.ellipse(
            rnd(i * 3) * size,
            rnd(i * 3 + 1) * size,
            2 + rnd(i + 19) * 4,
            1 + rnd(i + 21) * 2,
            rnd(i + 3) * 7,
            0,
            7,
          );
          e.fill();
        }
        e.globalCompositeOperation = "source-over";
      }
      cache.set(pancake.eggPaint, eggMask);
    }
    ctx.globalAlpha = cookedEgg ? 0.48 : 0.55;
    ctx.drawImage(eggMask, 0, 0);
    ctx.globalAlpha = 1;
  }
  for (const [id, count] of Object.entries(pancake.sauces)) {
    const color =
      id === "chili" ? "#b73529" : id === "garlic" ? "#e1cc91" : "#703f2c";
    ctx.strokeStyle = color;
    ctx.lineWidth = id === "garlic" ? 10 : 13;
    ctx.lineCap = "round";
    const trace =
      pancake.saucePaint?.[id as keyof typeof pancake.saucePaint] ?? [];
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius - 8, 0, 7);
    ctx.clip();
    if (trace.length) {
      ctx.drawImage(drawBrushTrace(trace, color), 0, 0);
      ctx.restore();
      continue;
    }
    for (let n = 0; n < (count ?? 0); n++) {
      ctx.beginPath();
      const max =
        motion?.kind === "sauce" && progress < 1
          ? Math.ceil(progress * 35)
          : 35;
      for (let i = 0; i <= max; i++) {
        const x = center - 155 + i * 9,
          y =
            center +
            Math.sin(i * 0.48 + n * 1.7 + id.length) * 46 +
            n * 20 -
            24;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.save();
  pancakeOutline(ctx, radius - 10);
  ctx.clip();
  for (const [id, count] of Object.entries(pancake.fillings)) {
    const drops =
      pancake.fillingDrops?.[id as keyof typeof pancake.fillingDrops] ?? [];
    if (drops.length) {
      drops.forEach((drop, i) => {
        const pieces = id === "crispy" || id === "ham" ? 1 : 3;
        for (let j = 0; j < pieces; j++) {
          const age =
            pancake.stage === "fill" && drop.at && drop.at <= Date.now()
              ? Date.now() - drop.at - j * 45
              : 1000;
          const settle = Math.max(0, Math.min(1, age / 510));
          const drift = (1 - settle) * (rnd(i * 13 + j * 17) - 0.5) * 30;
          const x = drop.x * size + (rnd(i * 13 + j * 7) - 0.5) * 60 + drift;
          const y = drop.y * size + (rnd(i * 9 + j * 5) - 0.5) * 50;
          const bounce =
            settle > 0.75
              ? Math.sin((settle - 0.75) * Math.PI * 5) * (1 - settle) * 11
              : 0;
          ingredient(
            ctx,
            id,
            x,
            y - (1 - settle) ** 2 * 105 - bounce,
            i * 3 + j + id.length,
            (0.65 + rnd(i + j) * 0.45) * (0.8 + settle * 0.2),
            settle,
          );
        }
      });
      continue;
    }
    const pieces = (count ?? 0) * (id === "crispy" || id === "ham" ? 7 : 20);
    for (let i = 0; i < pieces; i++) {
      const [x, y] = pos(i, id.length * 19 + (count ?? 0) * 3);
      let scale = 1;
      if (
        motion?.kind === "fill" &&
        progress < 1 &&
        i >= pieces - Math.max(1, pieces / (count ?? 1))
      ) {
        scale = Math.max(0.1, Math.min(1, progress * 1.6));
        const fall = (1 - progress) * 140;
        ingredient(ctx, id, x, y - fall, i + id.length, scale);
      } else ingredient(ctx, id, x, y, i + id.length, scale);
    }
  }
  ctx.restore();
  if (pancake.folds.length) {
    ctx.fillStyle = "#d5a26e";
    ctx.strokeStyle = "#9b623b";
    ctx.lineWidth = 3;
    const folding = motion?.kind === "fold" ? Math.min(1, progress * 1.4) : 1;
    if (pancake.folds.includes("left")) {
      ctx.beginPath();
      ctx.moveTo(90, 145);
      ctx.quadraticCurveTo(
        150 + folding * 150,
        125,
        110 + folding * 200,
        center,
      );
      ctx.quadraticCurveTo(150 + folding * 150, 430, 90, 415);
      ctx.quadraticCurveTo(155, center, 90, 145);
      ctx.fill();
      ctx.stroke();
    }
    if (pancake.folds.includes("right")) {
      ctx.beginPath();
      ctx.moveTo(470, 145);
      ctx.quadraticCurveTo(
        410 - folding * 150,
        125,
        450 - folding * 200,
        center,
      );
      ctx.quadraticCurveTo(410 - folding * 150, 430, 470, 415);
      ctx.quadraticCurveTo(405, center, 470, 145);
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.restore();
  if (motion?.kind === "flip" && progress < 1)
    drawTool(
      ctx,
      495 - progress * 125,
      440 - Math.sin(progress * Math.PI) * 90,
      "spatula",
    );
  if (motion?.kind === "egg" && progress < 1) {
    const y = 68 + Math.min(progress, 0.38) * 410;
    ctx.fillStyle = "#fff6d9";
    ctx.strokeStyle = "#bda77c";
    ctx.lineWidth = 3;
    if (progress < 0.68) {
      const split = Math.max(0, (progress - 0.32) * 90);
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(
          center + side * split,
          y - Math.max(0, progress - 0.4) * 95,
        );
        ctx.rotate(side * Math.max(0, progress - 0.3) * 0.9);
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.quadraticCurveTo(side * 21, -10, side * 15, 8);
        ctx.lineTo(side * 5, 15);
        ctx.lineTo(0, 7);
        ctx.lineTo(-side * 5, 15);
        ctx.quadraticCurveTo(-side * 10, -1, 0, -20);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }
    if (progress > 0.3 && progress < 0.75) {
      const splash = (progress - 0.3) / 0.45;
      ctx.fillStyle = `rgba(255,247,221,${(1 - splash) * 0.75})`;
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI * 2) / 8 + rnd(i * 9) * 0.6;
        const dist = 16 + splash * (17 + rnd(i + 24) * 20);
        ctx.beginPath();
        ctx.ellipse(
          center + Math.cos(a) * dist,
          center - 20 + Math.sin(a) * dist * 0.8,
          2 + rnd(i + 7) * 3,
          1.5 + rnd(i + 8) * 2,
          a,
          0,
          7,
        );
        ctx.fill();
      }
    }
  }
  if (motion?.kind === "pour" && progress < 1) {
    ctx.strokeStyle = "#e9cc93";
    ctx.lineWidth = 13;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(center - 20, 10);
    ctx.bezierCurveTo(center - 35, 70, center + 20, 100, center, center - 10);
    ctx.stroke();
    ctx.fillStyle = "#f3dba8";
    ctx.beginPath();
    ctx.ellipse(
      center,
      center,
      16 + progress * 35,
      10 + progress * 30,
      0,
      0,
      7,
    );
    ctx.fill();
  }
}

function drawTool(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tool: "scraper" | "spatula" | "brush" | "pinch" | "knife",
  sauceColor = "#75472e",
  angle = -0.5,
  load = 1,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tool === "knife" ? -0.85 : angle);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (tool === "pinch") {
    ctx.fillStyle = "#c66745";
    ctx.beginPath();
    ctx.moveTo(18, -62);
    ctx.lineTo(42, -49);
    ctx.lineTo(21, -18);
    ctx.lineTo(5, -27);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#e2ad7d";
    ctx.strokeStyle = "#8f573a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, -33);
    ctx.bezierCurveTo(-5, -26, -12, -14, -4, -7);
    ctx.bezierCurveTo(2, -2, 9, -11, 13, -13);
    ctx.bezierCurveTo(24, -5, 29, -10, 25, -19);
    ctx.bezierCurveTo(21, -26, 14, -28, 8, -33);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(3, -8);
    ctx.quadraticCurveTo(9, -18, 17, -16);
    ctx.stroke();
  } else if (tool === "brush") {
    ctx.fillStyle = "#a96a3c";
    ctx.strokeStyle = "#6b412d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, -75);
    ctx.quadraticCurveTo(0, -81, 5, -75);
    ctx.lineTo(5, -6);
    ctx.lineTo(-4, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#c5b58f";
    ctx.fillRect(-11, -13, 22, 12);
    ctx.strokeStyle = "#655849";
    ctx.strokeRect(-11, -13, 22, 12);
    ctx.globalAlpha = 0.3 + load * 0.7;
    ctx.fillStyle = sauceColor;
    ctx.beginPath();
    ctx.moveTo(-17, -2);
    ctx.quadraticCurveTo(0, 2, 17, -2);
    ctx.lineTo(15, 13);
    ctx.quadraticCurveTo(0, 18, -15, 13);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#f4dfbd";
    ctx.lineWidth = 1.1;
    for (let i = -14; i <= 14; i += 3.5) {
      ctx.beginPath();
      ctx.moveTo(i, 1);
      ctx.lineTo(i * 0.94, 13 + rnd(i + 20) * 3);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = "#a56a3e";
    ctx.strokeStyle = "#543a2b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-7, -69, 14, 67, 5);
    ctx.fill();
    ctx.stroke();
    const metal = ctx.createLinearGradient(-34, 0, 34, 0);
    metal.addColorStop(0, "#64716d");
    metal.addColorStop(0.4, "#d9ded2");
    metal.addColorStop(1, "#788b84");
    ctx.fillStyle = metal;
    ctx.beginPath();
    if (tool === "knife") {
      ctx.moveTo(-2, -4);
      ctx.lineTo(50, -1);
      ctx.quadraticCurveTo(65, 6, 43, 11);
      ctx.lineTo(-2, 8);
    } else {
      const width = tool === "spatula" ? 40 : 32;
      ctx.moveTo(-width + 6, -5);
      ctx.lineTo(width - 6, -5);
      ctx.lineTo(width, 12);
      ctx.quadraticCurveTo(0, 21, -width, 12);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#fff9e499";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tool === "knife" ? 8 : -20, 3);
    ctx.lineTo(tool === "knife" ? 48 : 21, 3);
    ctx.stroke();
  }
  ctx.restore();
}

export default function Griddle({
  pancake,
  onPaint,
  onCut,
  onBag,
  scraper,
  poured = false,
  reducedMotion = false,
}: Props) {
  const canvas = useRef<HTMLCanvasElement>(null),
    dragging = useRef(false),
    bagAction = useRef<"cut" | "bag" | null>(null),
    cursor = useRef<Point | null>(null),
    brushAngle = useRef(-0.5),
    repaint = useRef<(() => void) | null>(null),
    previous = useRef<Pancake | null>(null),
    motion = useRef<Motion | null>(null);
  const point = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const b = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (event.clientX - b.left) / b.width)),
      y: Math.max(0, Math.min(1, (event.clientY - b.top) / b.height)),
    };
  };
  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = point(e);
    cursor.current = p;
    repaint.current?.();
    if (pancake.stage === "bag") {
      bagAction.current =
        !pancake.cut && p.x < 0.44 && p.y > 0.35 && p.y < 0.65
          ? "cut"
          : pancake.cut && !pancake.bagged && p.x > 0.34 && p.x < 0.66
            ? "bag"
            : null;
    } else if (
      (pancake.stage === "spread" && poured) ||
      (pancake.stage === "egg" && pancake.eggs > 0) ||
      (pancake.stage === "sauce" && pancake.brushLoad > 0) ||
      (pancake.stage === "fill" && pancake.fillLoad > 0)
    ) {
      dragging.current = true;
      onPaint(pancake.stage === "sauce" ? { ...p, strokeStart: true } : p);
    }
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const next = point(e);
    if (pancake.stage === "sauce" && dragging.current && cursor.current) {
      const dx = next.x - cursor.current.x,
        dy = next.y - cursor.current.y;
      if (Math.hypot(dx, dy) > 0.002)
        brushAngle.current = Math.atan2(dy, dx) - Math.PI / 2;
    }
    cursor.current = next;
    if (dragging.current) onPaint(cursor.current);
    else repaint.current?.();
  };
  const up = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (bagAction.current) {
      const p = point(e);
      if (bagAction.current === "cut" && p.x > 0.58 && p.y > 0.35 && p.y < 0.65)
        onCut();
      if (bagAction.current === "bag" && p.x > 0.79 && p.y > 0.25 && p.y < 0.76)
        onBag();
    }
    dragging.current = false;
    bagAction.current = null;
    cursor.current = null;
    repaint.current?.();
  };
  useEffect(() => {
    const prev = previous.current;
    if (prev) {
      let kind: Motion["kind"] | null = null;
      if (prev.stage === "flip" && pancake.stage === "sauce") kind = "flip";
      else if (pancake.eggs > prev.eggs) kind = "egg";
      else if (pancake.folds.length > prev.folds.length) kind = "fold";
      else if (pancake.bagged && !prev.bagged) kind = "bag";
      else if (
        pancake.stage === "fill" &&
        Object.values(pancake.fillingDrops).reduce(
          (total, drops) => total + (drops?.length ?? 0),
          0,
        ) >
          Object.values(prev.fillingDrops).reduce(
            (total, drops) => total + (drops?.length ?? 0),
            0,
          )
      )
        kind = "fill";
      else if (
        Object.values(pancake.fillings).reduce((a, b) => a + (b ?? 0), 0) >
        Object.values(prev.fillings).reduce((a, b) => a + (b ?? 0), 0)
      )
        kind = "fill";
      else if (
        Object.values(pancake.sauces).reduce((a, b) => a + (b ?? 0), 0) >
        Object.values(prev.sauces).reduce((a, b) => a + (b ?? 0), 0)
      )
        kind = "sauce";
      if (kind)
        motion.current = {
          kind,
          started: performance.now(),
          seed: pancake.elapsed,
        };
    } else if (poured && pancake.batter.length === 0)
      motion.current = { kind: "pour", started: performance.now(), seed: 0 };
    previous.current = pancake;
    const c = canvas.current,
      ctx = c?.getContext("2d");
    if (!ctx) return;
    const reduced =
      reducedMotion ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const render = (now: number) => {
      const m = motion.current,
        progress = m
          ? Math.min(1, (now - m.started) / (m.kind === "flip" ? 850 : 650))
          : 1;
      drawPan(ctx, pancake.heat, now, reduced);
      drawFood(ctx, pancake, scraper, m, progress);
      if (cursor.current && pancake.stage !== "flip")
        drawTool(
          ctx,
          cursor.current.x * size,
          cursor.current.y * size,
          pancake.stage === "sauce"
            ? "brush"
            : pancake.stage === "fill" ||
                (pancake.stage === "bag" && pancake.cut)
              ? "pinch"
              : pancake.stage === "bag"
                ? "knife"
                : "scraper",
          pancake.activeSauce === "chili"
            ? "#b73529"
            : pancake.activeSauce === "garlic"
              ? "#e1cc91"
              : pancake.activeSauce === "sweet"
                ? "#703f2c"
                : "#b9a786",
          pancake.stage === "sauce" ? brushAngle.current : -0.5,
          pancake.stage === "sauce" ? pancake.brushLoad : 1,
        );
      if (progress < 1 && !reduced) frame = requestAnimationFrame(render);
    };
    repaint.current = () => render(performance.now());
    render(performance.now());
    return () => {
      repaint.current = null;
      cancelAnimationFrame(frame);
    };
  }, [pancake, scraper, poured, reducedMotion]);
  return (
    <div className="griddle-wrap">
      <div className="heat-glow" />
      <canvas
        ref={canvas}
        width={size}
        height={size}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        aria-label="煎饼铁板操作区"
      />
      <div className="griddle-mark">老张铁板 · 火候正旺</div>
    </div>
  );
}
