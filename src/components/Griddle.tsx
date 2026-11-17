import { useEffect, useRef, useState } from "react";
import { Pancake, Point } from "../game/engine";

type Props = {
  pancake: Pancake;
  onPaint: (point: Point) => void;
  onFold: (side: "left" | "right") => void;
  scraper: number;
};

export default function Griddle({ pancake, onPaint, onFold, scraper }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const foldStart = useRef<"left" | "right" | null>(null);
  const [foldTarget, setFoldTarget] = useState<Point | null>(null);
  const pointFromEvent = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    };
  };
  const down = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointFromEvent(event);
    if (pancake.stage === "fold") {
      const side = point.x < 0.38 ? "left" : point.x > 0.62 ? "right" : null;
      foldStart.current = side && !pancake.folds.includes(side) ? side : null;
      setFoldTarget(point);
    } else if (
      pancake.stage === "spread" ||
      (pancake.stage === "egg" && pancake.eggs > 0)
    ) {
      dragging.current = true;
      onPaint(point);
    }
  };
  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragging.current) onPaint(pointFromEvent(event));
    if (foldStart.current) setFoldTarget(pointFromEvent(event));
  };
  const up = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (foldStart.current) {
      const point = pointFromEvent(event);
      if (point.x > 0.39 && point.x < 0.62) onFold(foldStart.current);
    }
    dragging.current = false;
    foldStart.current = null;
    setFoldTarget(null);
  };

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const s = c.width;
    ctx.clearRect(0, 0, s, s);
    const center = s / 2,
      radius = s * 0.425;
    const metal = ctx.createRadialGradient(
      center,
      center,
      20,
      center,
      center,
      center,
    );
    metal.addColorStop(0, "#505251");
    metal.addColorStop(0.7, "#343938");
    metal.addColorStop(1, "#171b1a");
    ctx.fillStyle = "#151719";
    ctx.beginPath();
    ctx.arc(center, center, s * 0.49, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = metal;
    ctx.beginPath();
    ctx.arc(center, center, s * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#6b6e67";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(center, center, s * 0.448, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.055)";
    ctx.lineWidth = 2;
    for (let r = 0.15; r < 0.44; r += 0.065) {
      ctx.beginPath();
      ctx.arc(center, center, s * r, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (pancake.batter.length) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.clip();
      const burn = pancake.flipHeat > 90 || pancake.heat > 105;
      ctx.fillStyle = burn
        ? "#9c633b"
        : pancake.batterType === "purple"
          ? pancake.stage === "spread"
            ? "#c7a9b2"
            : "#ac838f"
          : pancake.batterType === "grain"
            ? pancake.stage === "spread"
              ? "#d8bd81"
              : "#bea06b"
            : pancake.stage === "spread"
              ? "#e9c889"
              : "#ddb071";
      ctx.shadowColor = "#24170d";
      ctx.shadowBlur = 10;
      for (const p of pancake.batter) {
        ctx.beginPath();
        ctx.arc(
          p.x * s,
          p.y * s,
          s * (0.077 + scraper * 0.012),
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      if (pancake.stage !== "spread") {
        ctx.fillStyle = burn ? "rgba(79,39,19,.28)" : "rgba(154,92,45,.16)";
        for (let i = 0; i < 30; i++) {
          const a = i * 2.4;
          const r = Math.sqrt(((i * 37) % 100) / 100) * radius;
          ctx.beginPath();
          ctx.arc(
            center + Math.cos(a) * r,
            center + Math.sin(a) * r,
            3 + (i % 5),
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      }
      if (pancake.eggs) {
        ctx.fillStyle = "rgba(255,240,174,.8)";
        for (const p of pancake.eggPaint) {
          ctx.beginPath();
          ctx.arc(p.x * s, p.y * s, s * 0.086, 0, Math.PI * 2);
          ctx.fill();
        }
        for (let i = 0; i < pancake.eggs; i++) {
          const x = center + (i - (pancake.eggs - 1) / 2) * 40;
          ctx.fillStyle = "#f3ac3c";
          ctx.beginPath();
          ctx.arc(x, center - 20, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffd36d";
          ctx.beginPath();
          ctx.arc(x - 4, center - 24, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (["sauce", "fill", "fold", "bag"].includes(pancake.stage)) {
        for (const [id, count] of Object.entries(pancake.sauces)) {
          const color =
            id === "chili"
              ? "#c94b35"
              : id === "garlic"
                ? "#e5cc8b"
                : "#854629";
          ctx.strokeStyle = color;
          ctx.lineWidth = 7;
          ctx.lineCap = "round";
          for (let n = 0; n < (count ?? 0); n++) {
            ctx.beginPath();
            for (let i = 0; i <= 22; i++) {
              const x = center - 116 + i * 10;
              const y =
                center +
                Math.sin(i * 0.83 + n * 2 + id.length) * 43 +
                n * 13 -
                10;
              i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
            }
            ctx.stroke();
          }
        }
        const colors: Record<string, string> = {
          scallion: "#509c56",
          cilantro: "#297e4a",
          crispy: "#f1ba63",
          ham: "#cc7661",
          sesame: "#f8e6b7",
        };
        for (const [id, count] of Object.entries(pancake.fillings))
          for (
            let n = 0;
            n < (count ?? 0) * (id === "crispy" || id === "ham" ? 5 : 17);
            n++
          ) {
            const seed = n * 89 + id.length * 37 + (count ?? 0) * 11;
            const x = center + Math.sin(seed * 1.73) * 115,
              y = center + Math.cos(seed * 2.16) * 108;
            ctx.fillStyle = colors[id] ?? "#fff";
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(seed);
            ctx.fillRect(
              -2,
              -2,
              id === "ham" ? 30 : id === "crispy" ? 27 : 5,
              id === "ham" ? 8 : id === "crispy" ? 13 : 4,
            );
            ctx.restore();
          }
      }
      ctx.restore();
      if (pancake.folds.length) {
        ctx.fillStyle = "#dca96d";
        ctx.strokeStyle = "#a36c3e";
        ctx.lineWidth = 4;
        if (pancake.folds.includes("left")) {
          ctx.beginPath();
          ctx.moveTo(135, 100);
          ctx.quadraticCurveTo(235, 205, 135, 310);
          ctx.quadraticCurveTo(88, 220, 135, 100);
          ctx.fill();
          ctx.stroke();
        }
        if (pancake.folds.includes("right")) {
          ctx.beginPath();
          ctx.moveTo(285, 100);
          ctx.quadraticCurveTo(185, 205, 285, 310);
          ctx.quadraticCurveTo(332, 220, 285, 100);
          ctx.fill();
          ctx.stroke();
        }
      }
    }
    if (foldTarget) {
      ctx.strokeStyle = "#fff0ba";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.arc(foldTarget.x * s, foldTarget.y * s, 19, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [pancake, scraper, foldTarget]);

  return (
    <div
      className={`griddle-wrap ${pancake.stage === "fold" ? "fold-cursor" : ""}`}
    >
      <div className="heat-glow" />
      <canvas
        ref={canvas}
        width={420}
        height={420}
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
