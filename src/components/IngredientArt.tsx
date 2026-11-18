import { Ingredient } from "../data/config";

type Art = Ingredient | "batter" | "scraper" | "spatula" | "bag";
export default function IngredientArt({ id }: { id: Art }) {
  const common = {
    stroke: "#263b32",
    strokeWidth: 2.6,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
  };
  let art: React.ReactNode;
  switch (id) {
    case "batter":
      art = (
        <>
          <path
            d="M13 22q5-10 19-11 14 2 17 13-1 16-18 18-18 0-20-12z"
            fill="#e8d3a6"
            {...common}
          />
          <path
            d="M18 27q9-9 23-5M21 34q10 4 21-4"
            fill="none"
            stroke="#fff2d0"
            strokeWidth="3"
          />
          <path d="M9 20q-3-7 3-12l8 2q2 4-3 9z" fill="#a4744b" {...common} />
        </>
      );
      break;
    case "egg":
      art = (
        <>
          <path
            d="M10 29q-2-12 8-17 16-8 30 4 9 10 1 22-6 12-23 10Q11 44 10 29Z"
            fill="#fff6d9"
            {...common}
          />
          <path
            d="M25 21q11-6 20 4 4 9-4 15-12 7-21-4-5-8 5-15Z"
            fill="#edaa32"
            stroke="#bd7130"
            strokeWidth="2"
          />
          <path
            d="M28 23q6-4 11 0"
            stroke="#ffe3a0"
            strokeWidth="3"
            fill="none"
          />
        </>
      );
      break;
    case "scallion":
      art = (
        <>
          <path
            d="M10 18 47 45M12 27 44 13M21 47 45 21"
            stroke="#34724b"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M10 18 47 45M12 27 44 13M21 47 45 21"
            stroke="#9bc47b"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M13 17q2 5-3 6M44 13q2 5-3 6M45 44q2 5-3 6"
            stroke="#f2e4ad"
            strokeWidth="2"
            fill="none"
          />
        </>
      );
      break;
    case "cilantro":
      art = (
        <>
          <path
            d="M30 49q-4-20 3-35M30 36q-12-8-20-5M30 28q10-10 22-11"
            stroke="#305e3f"
            strokeWidth="3"
            fill="none"
          />
          <path
            d="M32 17Q18 7 17 17q-10-2-9 9 2 8 12 6 10 8 14-5Q45 31 48 21q-1-10-12-7Z"
            fill="#4f8b51"
            {...common}
          />
          <path
            d="M26 24q7-5 13-5M17 25q9 0 15 3"
            stroke="#a0bb76"
            strokeWidth="2"
            fill="none"
          />
        </>
      );
      break;
    case "crispy":
      art = (
        <>
          <path d="M8 16 44 9l10 29-38 9Z" fill="#e5ad61" {...common} />
          <path
            d="M14 22 41 17M18 31l31-7M20 40l27-7"
            stroke="#f8d394"
            strokeWidth="3"
          />
          <path
            d="m28 17 3 26M39 13l4 26"
            stroke="#a86b38"
            strokeWidth="1.5"
            strokeDasharray="3 4"
          />
        </>
      );
      break;
    case "ham":
      art = (
        <>
          <path
            d="M10 16q14-9 39 2 9 8-1 15Q28 42 13 31 5 25 10 16Z"
            fill="#bd665b"
            {...common}
          />
          <path
            d="M13 18q16-7 34 3 5 4 1 8-17 8-34-1-6-5-1-10Z"
            fill="#e99c8c"
            stroke="#a75650"
            strokeWidth="2"
          />
          <path
            d="M19 22q11-3 20 1"
            stroke="#ffd0ad"
            strokeWidth="2"
            fill="none"
          />
        </>
      );
      break;
    case "sesame":
      art = (
        <>
          {Array.from({ length: 11 }, (_, i) => (
            <ellipse
              key={i}
              cx={13 + ((i * 17) % 39)}
              cy={12 + ((i * 23) % 37)}
              rx="3.8"
              ry="2.2"
              transform={`rotate(${i * 31} ${13 + ((i * 17) % 39)} ${12 + ((i * 23) % 37)})`}
              fill="#f6e6b5"
              stroke="#9e8865"
              strokeWidth="1.2"
            />
          ))}
        </>
      );
      break;
    case "sweet":
    case "chili":
    case "garlic":
      art = (
        <>
          <path d="M25 8h14v8H25z" fill="#f1dcad" {...common} />
          <path
            d="M18 17q12-5 28 0l5 33q-17 7-38 0Z"
            fill={
              id === "chili"
                ? "#bf4735"
                : id === "garlic"
                  ? "#e5d39b"
                  : "#7c4933"
            }
            {...common}
          />
          <path
            d="M19 28q14 5 29 0"
            stroke="#fff1d3"
            strokeWidth="2"
            fill="none"
            opacity=".7"
          />
          <path d="M28 7V3h8v4" fill="none" stroke="#263b32" strokeWidth="2" />
        </>
      );
      break;
    case "scraper":
      art = (
        <>
          <path d="M28 6h9v30h-9z" fill="#a8754d" {...common} />
          <path d="M10 35h44l-4 16q-17 7-36 0Z" fill="#9aa9a4" {...common} />
          <path
            d="M13 43q19 4 38 0"
            stroke="#e7ece5"
            strokeWidth="2"
            fill="none"
          />
        </>
      );
      break;
    case "spatula":
      art = (
        <>
          <path d="M30 4h7v31h-7z" fill="#9b6745" {...common} />
          <path d="M13 34h40l-7 18H20z" fill="#aab7ae" {...common} />
          <path d="M22 40h23M24 45h19" stroke="#e5ebe4" strokeWidth="2" />
        </>
      );
      break;
    case "bag":
      art = (
        <>
          <path d="M14 12h38l-3 41H18z" fill="#dfc397" {...common} />
          <path d="M14 12 22 7h21l9 5-10 10H24z" fill="#f5dfb7" {...common} />
          <path
            d="M23 29q11 7 20 0"
            fill="none"
            stroke="#bd563d"
            strokeWidth="3"
          />
          <path d="M27 38h16" stroke="#a7835a" strokeWidth="2" />
        </>
      );
      break;
  }
  return (
    <svg className="ingredient-art" viewBox="0 0 64 64" aria-hidden="true">
      {art}
    </svg>
  );
}
