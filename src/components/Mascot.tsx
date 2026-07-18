"use client"

export type Emotion = "neutral" | "happy" | "sleepy" | "celebrate" | "thinking" | "encouraging"
type Accessory = "laptop" | "pencil" | null

interface Props {
  size?: number
  emotion?: Emotion
  accessory?: Accessory
  className?: string
  style?: React.CSSProperties
}

const bodyColor = "#B8E6D8"
const earColor = "#A0D8C8"
const outlineColor = "#1C1C1C"
const blushColor = "#F2C4C4"
const collarColor = "#7AD8C8"
const codeTagColor = "#4A6B8A"
const codeLineColor = "#7FB8D8"
const codeLineColor2 = "#E8D5C4"

export default function Mascot({ size = 80, emotion = "neutral", accessory = null, className = "", style }: Props) {
  const eye = {
    neutral: <circle cx={20} cy={22} r={2.5} fill={outlineColor} />,
    happy: <path d="M 17 20 Q 20 16 23 20" fill="none" stroke={outlineColor} strokeWidth={2} strokeLinecap="round" />,
    sleepy: <line x1={17} y1={22} x2={23} y2={22} stroke={outlineColor} strokeWidth={2} strokeLinecap="round" />,
    celebrate: <path d="M 18 20 L 19 17 L 21 20 L 24 19 L 22 21 L 24 24 L 21 23 L 20 25 L 19 23 L 16 24 L 18 21 L 16 19 Z" fill={outlineColor} />,
    thinking: (
      <>
        <circle cx={18} cy={20} r={2.5} fill={outlineColor} />
        <path d="M 22 22 Q 24 20 26 23" fill="none" stroke={outlineColor} strokeWidth={2} strokeLinecap="round" />
      </>
    ),
    encouraging: <path d="M 17 21 Q 20 18 23 21" fill="none" stroke={outlineColor} strokeWidth={2} strokeLinecap="round" />,
  }[emotion]

  const mouth = {
    neutral: <path d="M 10 31 Q 13 33 16 31" fill="none" stroke={outlineColor} strokeWidth={1.5} strokeLinecap="round" />,
    happy: <path d="M 8 32 Q 12 36 17 32" fill="none" stroke={outlineColor} strokeWidth={2} strokeLinecap="round" />,
    sleepy: <path d="M 11 32 Q 13 30 15 32" fill="none" stroke={outlineColor} strokeWidth={1.5} strokeLinecap="round" />,
    celebrate: <path d="M 8 33 Q 12 38 18 33" fill="none" stroke={outlineColor} strokeWidth={2} strokeLinecap="round" />,
    thinking: <path d="M 10 32 Q 13 30 16 33" fill="none" stroke={outlineColor} strokeWidth={1.5} strokeLinecap="round" strokeDasharray="1.5 1.5" />,
    encouraging: <path d="M 9 31 Q 13 33 17 31" fill="none" stroke={outlineColor} strokeWidth={1.5} strokeLinecap="round" />,
  }[emotion]

  const blush = (
    <ellipse cx={17} cy={27} rx={3} ry={1.5} fill={blushColor} opacity={0.5} />
  )

  const tailD = {
    neutral: "M 84 56 Q 94 50 94 40",
    happy: "M 84 54 Q 96 42 96 32",
    sleepy: "M 84 58 Q 90 56 90 50",
    celebrate: "M 84 52 Q 98 38 98 26",
    thinking: "M 84 56 Q 92 50 90 46",
    encouraging: "M 84 55 Q 94 48 94 38",
  }[emotion]

  const earTransform = {
    neutral: "rotate(0, 36, 24)",
    happy: "rotate(-8, 36, 24)",
    sleepy: "rotate(8, 36, 24)",
    celebrate: "rotate(-14, 36, 24)",
    thinking: "rotate(4, 36, 24)",
    encouraging: "rotate(-4, 36, 24)",
  }[emotion]

  const headTilt = {
    neutral: 0,
    happy: -4,
    sleepy: 5,
    celebrate: -6,
    thinking: -3,
    encouraging: -2,
  }[emotion]

  const glassesFrame = (
    <>
      <circle cx={20} cy={22} r={6} fill="none" stroke={outlineColor} strokeWidth={1.2} />
      <line x1={26} y1={22} x2={34} y2={19} stroke={outlineColor} strokeWidth={1.2} strokeLinecap="round" />
    </>
  )

  const codeTag = (
    <g transform="translate(24, 38)">
      <rect x={0} y={0} width={10} height={10} rx={1.5} fill={codeTagColor} stroke={outlineColor} strokeWidth={1} />
      <line x1={2} y1={3.5} x2={8} y2={3.5} stroke={codeLineColor} strokeWidth={1.5} strokeLinecap="round" />
      <line x1={2} y1={6.5} x2={6} y2={6.5} stroke={codeLineColor2} strokeWidth={1.5} strokeLinecap="round" />
    </g>
  )

  const accessoryEl = accessory === "laptop" ? (
    <g transform={`translate(18, 68)`}>
      <rect x={-10} y={-1} width={24} height={16} rx={1.5} fill="#E8D5C4" stroke={outlineColor} strokeWidth={1.2} />
      <rect x={-8} y={1} width={20} height={10} rx={1} fill={codeTagColor} />
      <rect x={-4} y={3} width={4} height={1.5} rx={0.5} fill={codeLineColor} opacity={0.8} />
      <rect x={2} y={3} width={6} height={1.5} rx={0.5} fill={codeLineColor} opacity={0.6} />
      <rect x={-4} y={5.5} width={2} height={1.5} rx={0.5} fill={codeLineColor2} opacity={0.7} />
      <rect x={-1} y={5.5} width={5} height={1.5} rx={0.5} fill={codeLineColor} opacity={0.5} />
      <line x1={-10} y1={11.5} x2={14} y2={11.5} stroke={outlineColor} strokeWidth={0.8} />
      <rect x={-8} y={11.5} width={20} height={3.5} rx={1} fill="#E8D5C4" stroke={outlineColor} strokeWidth={0.8} />
    </g>
  ) : accessory === "pencil" ? (
    <g transform={`translate(44, 62) rotate(-15)`}>
      <rect x={-1.5} y={-14} width={3} height={20} rx={1} fill="#E88D7A" stroke={outlineColor} strokeWidth={1} />
      <polygon points="-2.5,6 2.5,6 0,11" fill={outlineColor} />
    </g>
  ) : null

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`inline-block select-none ${className}`}
      style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.06))", ...style }}
    >
      <ellipse cx={50} cy={92} rx={34} ry={3} fill="rgba(0,0,0,0.06)" />

      {/* tail */}
      <path d={tailD} fill="none" stroke={outlineColor} strokeWidth={2.5} strokeLinecap="round" />

      {/* body — long low sausage */}
      <path
        d="M 30 48 Q 58 44 84 48 Q 90 52 84 68 Q 58 72 30 68 Q 24 64 30 48 Z"
        fill={bodyColor}
        stroke={outlineColor}
        strokeWidth={1.5}
      />

      {/* body highlight */}
      <path
        d="M 34 54 Q 58 52 80 56"
        fill="none"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.35}
      />

      {/* legs — 4 short stubs */}
      <rect x="34" y="68" width="6" height="16" rx="3" fill={bodyColor} stroke={outlineColor} strokeWidth={1.2} />
      <rect x="42" y="68" width="6" height="16" rx="3" fill={bodyColor} stroke={outlineColor} strokeWidth={1.2} />
      <rect x="72" y="68" width="6" height="16" rx="3" fill={bodyColor} stroke={outlineColor} strokeWidth={1.2} />
      <rect x="80" y="68" width="6" height="16" rx="3" fill={bodyColor} stroke={outlineColor} strokeWidth={1.2} />

      {/* paws */}
      <ellipse cx={37} cy={86} rx={3.5} ry={2} fill={bodyColor} stroke={outlineColor} strokeWidth={1} />
      <ellipse cx={45} cy={86} rx={3.5} ry={2} fill={bodyColor} stroke={outlineColor} strokeWidth={1} />
      <ellipse cx={75} cy={86} rx={3.5} ry={2} fill={bodyColor} stroke={outlineColor} strokeWidth={1} />
      <ellipse cx={83} cy={86} rx={3.5} ry={2} fill={bodyColor} stroke={outlineColor} strokeWidth={1} />

      {/* neck fill */}
      <path
        d="M 30 48 L 34 42 L 36 48 Z"
        fill={bodyColor}
        stroke="none"
      />

      {/* head group with tilt */}
      <g transform={`rotate(${headTilt}, 24, 22)`}>
        {/* ear — behind head */}
        <g transform={earTransform}>
          <path
            d="M 30 12 Q 46 16 46 38 Q 46 48 36 44 Q 30 34 30 12 Z"
            fill={earColor}
            stroke={outlineColor}
            strokeWidth={1.5}
          />
        </g>

        {/* head + long snout */}
        <path
          d="M 34 42 C 38 26 34 8 22 10 C 12 12 6 16 6 22 C 6 28 10 32 16 34 C 22 36 28 38 34 44 Z"
          fill={bodyColor}
          stroke={outlineColor}
          strokeWidth={1.5}
        />

        {/* nose */}
        <ellipse cx={7} cy={24} rx={2.5} ry={2} fill={outlineColor} />

        {/* eye */}
        {eye}

        {/* nerd glasses */}
        {glassesFrame}

        {/* blush */}
        {blush}

        {/* smile */}
        {mouth}

        {/* collar */}
        <path d="M 22 40 L 36 42" stroke={collarColor} strokeWidth={3} strokeLinecap="round" />

        {/* code-window collar tag */}
        {codeTag}
      </g>

      {/* accessory */}
      {accessoryEl}
    </svg>
  )
}
