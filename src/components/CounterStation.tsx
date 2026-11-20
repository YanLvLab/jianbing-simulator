import { Ingredient, INGREDIENTS } from "../data/config";
import IngredientArt from "./IngredientArt";

type Props = {
  kind: "sauce" | "fill";
  ids: Ingredient[];
  available: Ingredient[];
  onChoose: (id: Ingredient) => void;
  active: Ingredient | null;
  load: number;
  actual: Partial<Record<Ingredient, number>>;
};

export default function CounterStation({
  kind,
  ids,
  available,
  onChoose,
  active,
  load,
  actual,
}: Props) {
  return (
    <div
      className={`counter-station ${kind}`}
      aria-label={kind === "sauce" ? "酱料搪瓷缸" : "配料簸箕"}
    >
      <div className="station-title">
        <strong>{kind === "sauce" ? "蘸酱" : "抓料"}</strong>
        <span>
          {kind === "sauce"
            ? "看小票选酱 · 点缸蘸刷"
            : "看小票挑料 · 点簸箕抓一把"}
        </span>
      </div>
      <div className="station-vessels">
        {ids.map((id) => {
          const item = INGREDIENTS.find((i) => i.id === id)!;
          const selected = active === id;
          const locked = !available.includes(id);
          return (
            <button
              key={id}
              type="button"
              className={`station-vessel ${selected ? "active" : ""} ${locked ? "locked" : ""}`}
              onClick={() => onChoose(id)}
              disabled={locked}
              aria-label={locked ? `${item.name}，未解锁` : item.name}
            >
              <svg
                className="vessel-art"
                viewBox="0 0 96 86"
                aria-hidden="true"
              >
                {kind === "sauce" ? (
                  <>
                    <path
                      d="M15 27Q16 20 48 19q31 0 33 8l-5 38q-8 10-28 11-22 0-28-11Z"
                      fill="#cbd8d1"
                      stroke="#29453f"
                      strokeWidth="3"
                    />
                    <path
                      d="M23 38q3 17 7 26M68 40q-2 20-8 27"
                      fill="none"
                      stroke="#f6f8ea"
                      strokeWidth="4"
                      opacity=".75"
                      strokeLinecap="round"
                    />
                    <path
                      d="M17 27q4-12 31-12 30 0 33 12-4 11-33 12-28-1-31-12Z"
                      fill="#eaf0e6"
                      stroke="#26463f"
                      strokeWidth="3"
                    />
                    <path
                      d="M22 27q4-7 26-7 23 0 28 7-3 6-28 7-24-1-26-7Z"
                      fill={item.color}
                    />
                    <path
                      d="M25 25q9-5 23-4M23 48l5 2M65 60l4-2"
                      fill="none"
                      stroke="#fff6df"
                      strokeWidth="2"
                      opacity=".65"
                      strokeLinecap="round"
                    />
                    <path
                      d="M78 37q15-5 12 10-3 12-15 8"
                      fill="none"
                      stroke="#dce6dc"
                      strokeWidth="6"
                    />
                    <path
                      d="M78 37q15-5 12 10-3 12-15 8"
                      fill="none"
                      stroke="#28443e"
                      strokeWidth="2"
                    />
                    <path
                      d="M39 57q8 6 17 0"
                      fill="none"
                      stroke="#73968e"
                      strokeWidth="2"
                    />
                  </>
                ) : (
                  <>
                    <path
                      d="M10 28q34-16 76 0L77 67q-29 19-58 0Z"
                      fill="#a8784e"
                      stroke="#4c3828"
                      strokeWidth="3"
                    />
                    <path
                      d="M17 40q31 12 61 0M20 51q27 13 55 0M25 61q23 11 46 0"
                      fill="none"
                      stroke="#d7ad77"
                      strokeWidth="3"
                      opacity=".75"
                    />
                    <path
                      d="M22 34q9 19 13 39M40 30q1 26 3 46M60 30q-3 28-6 46M77 34q-9 23-15 40"
                      fill="none"
                      stroke="#65452f"
                      strokeWidth="2"
                      opacity=".65"
                    />
                    <path
                      d="M10 28q35-16 76 0-5 11-38 14-31-2-38-14Z"
                      fill="#c99d6b"
                      stroke="#4c3828"
                      strokeWidth="3"
                    />
                    <path
                      d="M16 30q28-9 64 0"
                      fill="none"
                      stroke="#ebc596"
                      strokeWidth="3"
                    />
                  </>
                )}
              </svg>
              {kind === "fill" && (
                <span className="vessel-food">
                  <IngredientArt id={id} />
                </span>
              )}
              {kind === "sauce" && selected && (
                <span className="vessel-brush" aria-hidden="true" />
              )}
              <span className="vessel-name">{item.name}</span>
              <span className="vessel-count">
                {locked ? "未解锁" : `已加 ${actual[id] ?? 0}`}
              </span>
            </button>
          );
        })}
      </div>
      {active && (
        <div className="station-load">
          <span>{kind === "sauce" ? "刷上余酱" : "手上余料"}</span>
          <i>
            <em style={{ width: `${Math.round(load * 100)}%` }} />
          </i>
        </div>
      )}
    </div>
  );
}
