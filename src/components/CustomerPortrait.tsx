import { Customer } from "../data/config";

export default function CustomerPortrait({
  customer,
  angry,
}: {
  customer: Customer;
  angry: boolean;
}) {
  return (
    <svg
      className={`portrait ${angry ? "angry" : ""}`}
      viewBox="0 0 180 180"
      role="img"
      aria-label={customer.name}
    >
      <ellipse cx="90" cy="170" rx="70" ry="38" fill={customer.color} />
      <path d="M61 124 Q90 144 119 124 L124 168 L56 168Z" fill="#e9bb91" />
      <ellipse cx="90" cy="80" rx="52" ry="60" fill="#e9bb91" />
      <path
        d="M38 74 Q30 12 91 16 Q150 14 142 82 Q130 54 111 50 Q66 66 38 74"
        fill={customer.hair}
      />
      <path
        d={
          angry
            ? "M57 84 L76 89 M103 89 L123 84"
            : "M56 82 Q66 77 77 82 M103 82 Q114 77 124 82"
        }
        stroke="#3c2922"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="68" cy="93" r="4" fill="#352a25" />
      <circle cx="112" cy="93" r="4" fill="#352a25" />
      <path
        d={angry ? "M72 126 Q90 113 108 126" : "M72 119 Q90 136 108 119"}
        fill="none"
        stroke="#8e4538"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="48" cy="108" r="8" fill="#e9bb91" />
      <circle cx="132" cy="108" r="8" fill="#e9bb91" />
      {customer.accessory === "glasses" && (
        <g fill="none" stroke="#46372e" strokeWidth="4">
          <circle cx="68" cy="94" r="16" />
          <circle cx="112" cy="94" r="16" />
          <path d="M84 92h12" />
        </g>
      )}
      {customer.accessory === "tie" && (
        <path d="M85 141 L95 141 L100 170 L90 178 L80 170Z" fill="#d75242" />
      )}
      {customer.accessory === "scarf" && (
        <path
          d="M45 142 Q90 165 137 140 L132 155 Q90 179 48 154Z"
          fill="#d7ab4b"
        />
      )}
      {customer.accessory === "headband" && (
        <path
          d="M38 64 Q90 22 142 64"
          fill="none"
          stroke="#e0a947"
          strokeWidth="10"
        />
      )}
      {customer.accessory === "cap" && (
        <path
          d="M34 55 Q45 7 103 13 Q140 16 147 50 L160 57 Q98 73 34 55Z"
          fill="#a94a37"
        />
      )}
    </svg>
  );
}
