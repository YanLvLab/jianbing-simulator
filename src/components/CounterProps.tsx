export default function CounterProps({ side }: { side: "left" | "right" }) {
  return (
    <svg
      className={`counter-props ${side}`}
      viewBox="0 0 300 190"
      aria-hidden="true"
    >
      <g
        stroke="#23362e"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {side === "left" ? (
          <>
            <path d="M12 115q34-13 79 0l-5 42q-34 18-69 0Z" fill="#8b9990" />
            <path
              d="M12 115q37 17 79 0"
              fill="none"
              stroke="#d5dcd0"
              strokeWidth="5"
            />
            <path
              d="M18 111q15-39 43-19 23 11 24 23-35 13-67-4Z"
              fill="#e6c990"
            />
            <path
              d="M22 108q18-15 47 0"
              fill="none"
              stroke="#fff1c0"
              strokeWidth="4"
            />
            <path d="M109 121q46-17 89 0l-9 44q-30 15-72-2Z" fill="#7d8f83" />
            <path
              d="M109 121q45 17 89 0"
              fill="none"
              stroke="#e1e5d6"
              strokeWidth="5"
            />
            <path
              d="M122 116q-14-19 2-26 10 0 11 16 5-21 20-19 12 8-1 24 15-14 25-6 7 10-8 16Z"
              fill="#4c8254"
            />
            <path
              d="M132 116q14-24 35-20"
              stroke="#a0b878"
              fill="none"
              strokeWidth="3"
            />
            <path d="M218 92q23-12 51 0l-4 68q-24 12-43 1Z" fill="#a95d42" />
            <path d="M227 82h34v11h-34z" fill="#edc78b" />
            <path d="M235 67h18v15h-18z" fill="#7a4938" />
            <path d="M229 120q18 10 34 0" stroke="#eab98d" fill="none" />
          </>
        ) : (
          <>
            <path d="M12 116q39-17 79 0l-7 47q-32 17-67-1Z" fill="#75877d" />
            <path
              d="M12 116q36 17 79 0"
              fill="none"
              stroke="#d8dfd2"
              strokeWidth="5"
            />
            <path d="M23 110q23-30 56-4l-6 12q-23 7-50-8Z" fill="#e5a860" />
            <path
              d="M33 105q10 13 20 4m6-9q6 13 16 5"
              stroke="#f8d28b"
              fill="none"
            />
            <path d="M107 92q22-11 45 0l-4 69q-18 11-38 0Z" fill="#bd4b38" />
            <path d="M116 79h28v13h-28z" fill="#dfb37d" />
            <path d="M122 64h15v15h-15z" fill="#704437" />
            <path d="M109 126q22 8 40 0" fill="none" stroke="#e99577" />
            <path d="M166 100q23-11 48 0l-5 60q-22 12-39 1Z" fill="#754a39" />
            <path d="M173 87h34v13h-34z" fill="#d5ad78" />
            <path d="M182 73h18v14h-18z" fill="#704437" />
            <path d="M172 130q19 9 39-1" fill="none" stroke="#aa775a" />
            <path d="M231 121q25-12 54 0l-5 38q-22 12-44 1Z" fill="#7e8e82" />
            <path
              d="M232 121q25 10 53 0"
              fill="none"
              stroke="#dae2d4"
              strokeWidth="5"
            />
            <path
              d="M235 114q4-24 16-20 7 4 4 20 4-30 17-26 13 11 1 30Z"
              fill="#6c9f60"
            />
          </>
        )}
        <path
          d="M5 167q137 8 290 0"
          stroke="#f6dfb4"
          strokeWidth="4"
          fill="none"
          opacity=".65"
        />
      </g>
    </svg>
  );
}
