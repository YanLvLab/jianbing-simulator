export default function FinishedJianbing({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      className={`finished-jianbing ${className}`.trim()}
      viewBox="0 0 120 150"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M40 9Q60 2 81 12L88 66Q62 80 32 65L34 27Q34 16 40 9Z"
        fill="#DCA365"
        stroke="#7E4E31"
        strokeWidth="3"
      />
      <path
        d="M43 11Q58 5 76 13L81 63Q59 71 37 63L38 25Q38 16 43 11Z"
        fill="#E9BB79"
      />
      <path
        d="M39 20Q53 11 78 17M38 36Q52 29 82 35M37 51Q54 45 84 50"
        stroke="#B97942"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".7"
      />
      <path
        d="M49 13Q47 31 48 63M72 14Q72 39 75 64"
        stroke="#F4D39A"
        strokeWidth="3"
        opacity=".8"
      />
      <path
        d="M25 58Q60 65 96 57L90 133Q60 146 30 133L25 58Z"
        fill="#EDD2A1"
        stroke="#8E6848"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M25 58Q60 69 96 57L90 73Q60 82 29 72L25 58Z"
        fill="#F8E5BD"
        stroke="#9F7850"
        strokeWidth="2"
      />
      <path
        d="M31 76L35 128Q61 139 85 128L91 74"
        stroke="#D9B887"
        strokeWidth="2"
      />
      <path
        d="M39 84Q60 93 81 83M40 91Q58 99 80 90"
        stroke="#FFF2D6"
        strokeWidth="2"
        opacity=".55"
      />
      <path d="M49 107Q59 97 72 107Q64 119 50 116Z" fill="#C34A36" />
      <path
        d="M55 109Q61 105 67 109M56 114Q61 117 67 112"
        stroke="#F6D9AE"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
