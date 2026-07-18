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

export default function Mascot({ size = 80, emotion = "neutral", accessory = null, className = "", style }: Props) {
  const eyes = {
    neutral: (
      <circle cx={30} cy={30} r={2.5} fill={outlineColor} />
    ),
    happy: (
      <path d="M 27 28 Q 30 24 33 28" fill="none" stroke={outlineColor} strokeWidth={2} strokeLinecap="round" />
    ),
    sleepy: (
      <line x1={27} y1={30} x2={33} y2={30} stroke={outlineColor} strokeWidth={2} strokeLinecap="round" />
    ),
    celebrate: (
      <path d="M 28 28 L 29 25 L 31 28 L 34 27 L 32 29 L 34 32 L 31 31 L 30 33 L 29 31 L 26 32 L 28 29 L 26 27 Z" fill={outlineColor} />
    ),
    thinking: (
      <>
        <circle cx={28} cy={28} r={2.5} fill={outlineColor} />
        <path d="M 32 30 Q 34 28 36 31" fill="none" stroke={outlineColor} strokeWidth={2} strokeLinecap="round" />
      </>
    ),
    encouraging: (
      <path d="M 27 29 Q 30 26 33 29" fill="none" stroke={outlineColor} strokeWidth={2} strokeLinecap="round" />
    ),
  }[emotion]

  const mouth = {
    neutral: <path d="M 19 38 Q 22 40 25 38" fill="none" stroke={outlineColor} strokeWidth={1.5} strokeLinecap="round" />,
    happy: <path d="M 16 40 Q 20 44 25 40" fill="none" stroke={outlineColor} strokeWidth={2} strokeLinecap="round" />,
    sleepy: <path d="M 20 39 Q 22 37 24 39" fill="none" stroke={outlineColor} strokeWidth={1.5} strokeLinecap="round" />,
    celebrate: <path d="M 16 41 Q 20 46 26 41" fill="none" stroke={outlineColor} strokeWidth={2} strokeLinecap="round" />,
    thinking: <path d="M 19 40 Q 22 38 25 41" fill="none" stroke={outlineColor} strokeWidth={1.5} strokeLinecap="round" strokeDasharray="1.5 1.5" />,
    encouraging: <path d="M 18 38 Q 22 40 26 38" fill="none" stroke={outlineColor} strokeWidth={2} strokeLinecap="round" />,
  }[emotion]

  const blush = (
    <ellipse cx={28} cy={42} rx={4} ry={2} fill={blushColor} opacity={0.6} />
  )

  const tailNeutral = "M 80 54 C 90 50 94 44 92 38"
  const tailHappy = "M 80 52 C 92 44 96 36 94 30"
  const tailSleepy = "M 80 56 C 86 56 90 54 90 50"
  const tailCelebrate = "M 80 50 C 94 40 98 30 96 24"
  const tailThinking = "M 80 54 C 86 52 90 54 88 48"
  const tailEncouraging = "M 80 53 C 90 48 94 42 92 36"

  const tailD = {
    neutral: tailNeutral,
    happy: tailHappy,
    sleepy: tailSleepy,
    celebrate: tailCelebrate,
    thinking: tailThinking,
    encouraging: tailEncouraging,
  }[emotion]

  const earTransform = {
    neutral: "rotate(0, 42, 32)",
    happy: "rotate(-8, 42, 32)",
    sleepy: "rotate(10, 42, 32)",
    celebrate: "rotate(-12, 42, 32)",
    thinking: "rotate(5, 42, 32)",
    encouraging: "rotate(-4, 42, 32)",
  }[emotion]

  const headTilt = {
    neutral: 0,
    happy: -4,
    sleepy: 6,
    celebrate: -6,
    thinking: -3,
    encouraging: -2,
  }[emotion]

  const accessoryEl = accessory === "laptop" ? (
    <g transform={`translate(20, 68)`}>
      <rect x={-12} y={-1} width={28} height={18} rx={1.5} fill="#E8D5C4" stroke={outlineColor} strokeWidth={1.2} />
      <rect x={-10} y={1} width={24} height={11} rx={1} fill="#4A6B8A" />
      <rect x={-6} y={2.5} width={5} height={1.5} rx={0.5} fill="#7FB8D8" opacity={0.8} />
      <rect x={1} y={2.5} width={8} height={1.5} rx={0.5} fill="#7FB8D8" opacity={0.6} />
      <rect x={-6} y={4.5} width={3} height={1.5} rx={0.5} fill="#E8D5C4" opacity={0.7} />
      <rect x={-2} y={4.5} width={7} height={1.5} rx={0.5} fill="#7FB8D8" opacity={0.5} />
      <rect x={-6} y={6.5} width={6} height={1.5} rx={0.5} fill="#7FB8D8" opacity={0.7} />
      <line x1={-12} y1={12.5} x2={16} y2={12.5} stroke={outlineColor} strokeWidth={0.8} />
      <rect x={-10} y={12.5} width={24} height={4} rx={1} fill="#E8D5C4" stroke={outlineColor} strokeWidth={0.8} />
    </g>
  ) : accessory === "pencil" ? (
    <g transform={`translate(48, 70) rotate(-20)`}>
      <rect x={-2} y={-16} width={4} height={24} rx={1} fill="#E88D7A" stroke={outlineColor} strokeWidth={1.2} />
      <polygon points="-3,8 3,8 0,13" fill={outlineColor} />
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
      {/* shadow */}
      <ellipse cx={52} cy={92} rx={32} ry={3} fill="rgba(0,0,0,0.06)" />

      {/* tail */}
      <path d={tailD} fill="none" stroke={outlineColor} strokeWidth={2.5} strokeLinecap="round" />

      {/* body */}
      <path
        d="M 38 44 C 60 40 78 44 82 52 C 86 60 84 72 80 76 C 76 80 44 80 38 74 C 32 68 30 50 38 44 Z"
        fill={bodyColor}
        stroke={outlineColor}
        strokeWidth={1.5}
      />

      {/* body highlight */}
      <path
        d="M 44 48 C 56 46 72 48 78 54"
        fill="none"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.4}
      />

      {/* back legs */}
      <path
        d="M 72 74 C 72 74 68 88 68 90 C 68 92 72 92 72 90 C 72 88 76 74 76 74"
        fill={bodyColor}
        stroke={outlineColor}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <path
        d="M 76 74 C 76 74 74 88 74 90 C 74 92 78 92 78 90 C 78 88 80 74 80 74"
        fill={bodyColor}
        stroke={outlineColor}
        strokeWidth={1.5}
        strokeLinecap="round"
      />

      {/* front legs */}
      <path
        d="M 40 74 C 40 74 36 88 36 90 C 36 92 40 92 40 90 C 40 88 44 74 44 74"
        fill={bodyColor}
        stroke={outlineColor}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <path
        d="M 44 74 C 44 74 40 88 40 90 C 40 92 44 92 44 90 C 44 88 48 74 48 74"
        fill={bodyColor}
        stroke={outlineColor}
        strokeWidth={1.5}
        strokeLinecap="round"
      />

      {/* paws */}
      <ellipse cx={38} cy={91} rx={4} ry={2.5} fill={bodyColor} stroke={outlineColor} strokeWidth={1.2} />
      <ellipse cx={46} cy={91} rx={4} ry={2.5} fill={bodyColor} stroke={outlineColor} strokeWidth={1.2} />
      <ellipse cx={70} cy={91} rx={4} ry={2.5} fill={bodyColor} stroke={outlineColor} strokeWidth={1.2} />
      <ellipse cx={78} cy={91} rx={4} ry={2.5} fill={bodyColor} stroke={outlineColor} strokeWidth={1.2} />

      {/* neck bridge */}
      <path
        d="M 34 40 C 36 34 38 30 38 44 C 38 44 48 44 44 40 Z"
        fill={bodyColor}
        stroke="none"
      />

      {/* head group with tilt */}
      <g transform={`rotate(${headTilt}, 32, 26)`}>
        {/* ear */}
        <g transform={earTransform}>
          <path
            d="M 40 22 C 48 24 50 38 48 48 C 46 52 40 52 38 48 C 36 44 36 30 40 22 Z"
            fill={earColor}
            stroke={outlineColor}
            strokeWidth={1.5}
          />
          <path
            d="M 42 26 C 46 28 48 38 46 44 C 44 46 42 46 40 44 C 40 40 40 30 42 26 Z"
            fill={bodyColor}
            opacity={0.5}
          />
        </g>

        {/* head + snout */}
        <path
          d="M 40 22 C 42 16 36 12 30 12 C 24 12 18 16 14 22 C 12 26 12 32 14 34 C 16 36 20 40 26 40 C 32 40 38 38 42 34 C 44 30 44 26 40 22 Z"
          fill={bodyColor}
          stroke={outlineColor}
          strokeWidth={1.5}
        />

        {/* nose */}
        <ellipse cx={14} cy={26} rx={2.5} ry={2} fill={outlineColor} />

        {/* face */}
        {eyes}
        {blush}
        {mouth}

        {/* collar */}
        <path d="M 28 42 L 44 42" stroke={collarColor} strokeWidth={3} strokeLinecap="round" />
        <path d="M 36 40 L 37 44 L 36 44 L 35 40 Z" fill={outlineColor} />
      </g>

      {/* accessory */}
      {accessoryEl}
    </svg>
  )
}
