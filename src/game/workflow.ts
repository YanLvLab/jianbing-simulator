import { batterCoverage, eggCoverage, Pancake } from "./engine";

export type StepGate = {
  ready: boolean;
  label: string;
  notice: string;
};

const ready: StepGate = { ready: true, label: "", notice: "" };

export function getStepGate(
  pancake: Pancake,
  batterPoured: boolean,
  scraperLevel: number,
): StepGate {
  if (pancake.stage === "spread") {
    if (!batterPoured)
      return {
        ready: false,
        label: "先倒入面糊",
        notice: "先倒一勺面糊，再在铁板上画圈摊开。",
      };
    const coverage = batterCoverage(pancake, scraperLevel);
    if (coverage < 0.38)
      return {
        ready: false,
        label: `摊面 ${Math.round(coverage * 100)}% / 38%`,
        notice: "面糊还没摊开，继续拖动刮板。",
      };
  }
  if (pancake.stage === "egg") {
    if (!pancake.eggs)
      return {
        ready: false,
        label: "先打一个鸡蛋",
        notice: "先打蛋，再拖动蛋液铺开。",
      };
    const coverage = eggCoverage(pancake);
    if (coverage < 0.28)
      return {
        ready: false,
        label: `涂蛋 ${Math.round(coverage * 100)}% / 28%`,
        notice: "先打蛋，再拖动蛋液铺开。",
      };
  }
  if (pancake.stage === "fold" && pancake.folds.length < 2)
    return {
      ready: false,
      label: `折边 ${pancake.folds.length} / 2`,
      notice: "先点击折左边和折右边，再装袋。",
    };
  return ready;
}
