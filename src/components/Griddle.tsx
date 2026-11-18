import { useEffect, useRef } from "react";
import { Pancake, Point } from "../game/engine";

type Props = {
  pancake: Pancake;
  onPaint: (point: Point) => void;
  onFold: (side: "left" | "right") => void;
  scraper: number;
  poured?: boolean;
  reducedMotion?: boolean;
};
type Motion = {
  kind: "pour" | "egg" | "flip" | "fill" | "fold" | "sauce";
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

function ingredient(
  ctx: CanvasRenderingContext2D,
  id: string,
  x: number,
  y: number,
  seed: number,
  scale = 1,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rnd(seed + 8) - 0.5) * 1.7);
  ctx.scale(scale, scale);
  ctx.lineJoin = "round";
  if (id === "scallion") {
    ctx.fillStyle = "#6d9d54";
    ctx.strokeStyle = "#315d3a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 5, 0.4, 0, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#c5d79b";
    ctx.beginPath();
    ctx.ellipse(-1, 0, 4, 2, 0.4, 0, 7);
    ctx.fill();
  } else if (id === "cilantro") {
    ctx.strokeStyle = "#315e3d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-3, 12);
    ctx.quadraticCurveTo(0, 0, 3, -8);
    ctx.stroke();
    ctx.fillStyle = "#477c49";
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.rotate(i * 2.1);
      ctx.beginPath();
      ctx.moveTo(0, -3);
      ctx.bezierCurveTo(5, -16, 16, -12, 13, -5);
      ctx.bezierCurveTo(13, 1, 4, 1, 0, -3);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = "#89ad6d";
    ctx.beginPath();
    ctx.ellipse(-3, -5, 3, 2, -0.5, 0, 7);
    ctx.fill();
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

function drawFood(
  ctx: CanvasRenderingContext2D,
  pancake: Pancake,
  scraper: number,
  motion: Motion | null,
  progress: number,
) {
  ctx.save();
  if (motion?.kind === "flip" && progress < 1) {
    const lift = Math.sin(progress * Math.PI);
    ctx.translate(center, -lift * 115);
    ctx.translate(-center, 0);
    ctx.transform(1, 0, 0, 1 - lift * 0.92, 0, center * lift * 0.48);
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
    m.beginPath();
    m.arc(center, center, radius, 0, 7);
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
    const cookedEgg = !["egg", "flip"].includes(pancake.stage);
    const cache = cookedEgg ? cookedEggCache : eggCache;
    let eggMask = cache.get(pancake.eggPaint);
    if (!eggMask) {
      eggMask = document.createElement("canvas");
      eggMask.width = eggMask.height = size;
      const e = eggMask.getContext("2d")!;
      e.save();
      e.beginPath();
      e.arc(center, center, radius - 4, 0, 7);
      e.clip();
      drawTrace(e, pancake.eggPaint, 90, cookedEgg ? "#dfbb79" : "#fff0bb");
      e.globalAlpha = cookedEgg ? 0.22 : 0.3;
      drawTrace(e, pancake.eggPaint, 33, "#eebc46");
      e.globalAlpha = 1;
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
    ctx.globalAlpha = cookedEgg ? 0.7 : 0.83;
    ctx.drawImage(eggMask, 0, 0);
    ctx.globalAlpha = 1;
    const yolkVisibility = Math.max(0, 1 - pancake.eggPaint.length / 24);
    ctx.globalAlpha = yolkVisibility;
    for (let i = 0; i < pancake.eggs; i++) {
      const x = center + (i - (pancake.eggs - 1) / 2) * 39,
        y = center - 20;
      const g = ctx.createRadialGradient(x - 5, y - 6, 2, x, y, 20);
      g.addColorStop(0, "#ffe394");
      g.addColorStop(0.5, "#f4b945");
      g.addColorStop(1, "#cd7d2c");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, 19, 16, 0.2, 0, 7);
      ctx.fill();
      ctx.strokeStyle = "#fce1a4";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x - 3, y - 2, 10, 3.5, 5.5);
      ctx.stroke();
    }
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
    if (trace.length > 1) {
      ctx.beginPath();
      trace.forEach((p, i) => {
        if (!i || Math.hypot(p.x - trace[i - 1].x, p.y - trace[i - 1].y) > 0.15)
          ctx.moveTo(p.x * size, p.y * size);
        else ctx.lineTo(p.x * size, p.y * size);
      });
      ctx.stroke();
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
  for (const [id, count] of Object.entries(pancake.fillings)) {
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
      false,
    );
  if (motion?.kind === "egg" && progress < 1) {
    const y = 80 + progress * 120;
    ctx.fillStyle = "#fff6d9";
    ctx.strokeStyle = "#bda77c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(center, y, 17, 22, 0.3, 0, 7);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(center - 12, y + 4);
    ctx.lineTo(center + 5, y - 2);
    ctx.lineTo(center + 13, y + 10);
    ctx.stroke();
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
  sauce: boolean,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.5);
  ctx.fillStyle = "#a56a3e";
  ctx.strokeStyle = "#543a2b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-7, -69, 14, 67, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = sauce ? "#85412e" : "#a9b5ad";
  ctx.beginPath();
  ctx.moveTo(-26, -5);
  ctx.lineTo(27, -5);
  ctx.lineTo(34, 12);
  ctx.quadraticCurveTo(0, 21, -34, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export default function Griddle({
  pancake,
  onPaint,
  onFold,
  scraper,
  poured = false,
  reducedMotion = false,
}: Props) {
  const canvas = useRef<HTMLCanvasElement>(null),
    dragging = useRef(false),
    foldStart = useRef<"left" | "right" | null>(null),
    cursor = useRef<Point | null>(null),
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
    if (pancake.stage === "fold") {
      const side = p.x < 0.38 ? "left" : p.x > 0.62 ? "right" : null;
      foldStart.current = side && !pancake.folds.includes(side) ? side : null;
    } else if (
      (pancake.stage === "spread" && poured) ||
      (pancake.stage === "egg" && pancake.eggs > 0) ||
      pancake.stage === "sauce"
    ) {
      dragging.current = true;
      onPaint(p);
    }
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    cursor.current = point(e);
    if (dragging.current) onPaint(cursor.current);
  };
  const up = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (foldStart.current) {
      const p = point(e);
      if (p.x > 0.39 && p.x < 0.62) onFold(foldStart.current);
    }
    dragging.current = false;
    foldStart.current = null;
    cursor.current = null;
  };
  useEffect(() => {
    const prev = previous.current;
    if (prev) {
      let kind: Motion["kind"] | null = null;
      if (prev.stage === "flip" && pancake.stage === "sauce") kind = "flip";
      else if (pancake.eggs > prev.eggs) kind = "egg";
      else if (pancake.folds.length > prev.folds.length) kind = "fold";
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
      if (cursor.current && ["spread", "egg", "sauce"].includes(pancake.stage))
        drawTool(
          ctx,
          cursor.current.x * size,
          cursor.current.y * size,
          pancake.stage === "sauce",
        );
      if (progress < 1 && !reduced) frame = requestAnimationFrame(render);
    };
    render(performance.now());
    return () => cancelAnimationFrame(frame);
  }, [pancake, scraper, poured, reducedMotion]);
  return (
    <div
      className={`griddle-wrap ${pancake.stage === "fold" ? "fold-cursor" : ""}`}
    >
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
