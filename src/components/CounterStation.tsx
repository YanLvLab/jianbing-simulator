import { Ingredient, INGREDIENTS } from "../data/config";
import IngredientArt from "./IngredientArt";

type Props = {
  kind: "sauce" | "fill";
  ids: Ingredient[];
  onChoose: (id: Ingredient) => void;
  active: Ingredient | null;
  load: number;
  actual: Partial<Record<Ingredient, number>>;
  wants?: Partial<Record<Ingredient, number>>;
};

export default function CounterStation({
  kind,
  ids,
  onChoose,
  active,
  load,
  actual,
  wants,
}: Props) {
  return (
    <div
      className={`counter-station ${kind}`}
      aria-label={kind === "sauce" ? "酱料搪瓷缸" : "配料簸箕"}
    >
      <div className="station-title">
        <strong>{kind === "sauce" ? "蘸酱" : "抓料"}</strong>
        <span>{kind === "sauce" ? "点搪瓷缸蘸刷" : "点簸箕抓一把"}</span>
      </div>
      <div className="station-vessels">
        {ids.map((id) => {
          const item = INGREDIENTS.find((i) => i.id === id)!;
          const selected = active === id;
          return (
            <button
              key={id}
              type="button"
              className={`station-vessel ${selected ? "active" : ""}`}
              onClick={() => onChoose(id)}
              aria-label={item.name}
            >
              <svg
                className="vessel-art"
                viewBox="0 0 96 86"
                aria-hidden="true"
              >
                <path
                  d="M12 27 Q44 12 84 27 L78 67 Q47 83 18 67 Z"
                  fill={kind === "sauce" ? "#cedbd0" : "#9e7951"}
                  stroke="#263f35"
                  strokeWidth="3"
                />
                <path
                  d="M13 27 C12 16 81 14 84 27 C83 38 17 40 13 27 Z"
                  fill="#eff4e8"
                  stroke="#25453b"
                  strokeWidth="3"
                />
                <path
                  d="M19 27 C22 19 75 19 78 27 C75 35 23 35 19 27 Z"
                  fill={kind === "sauce" ? item.color : "#ad8354"}
                />
                <path
                  d="M20 43 Q25 63 36 67 M76 44 Q72 60 67 64"
                  fill="none"
                  stroke={kind === "sauce" ? "#fbfff3" : "#d0aa78"}
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity=".75"
                />
                {kind === "sauce" && (
                  <path
                    d="M78 37 Q93 31 89 46 Q86 56 78 51"
                    fill="none"
                    stroke="#25453b"
                    strokeWidth="3"
                  />
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
                {actual[id] ?? 0}
                {wants && ` / ${wants[id] ?? 0}`}
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
