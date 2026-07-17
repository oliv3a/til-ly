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

export default function Onigiri({ size = 80, emotion = "neutral", accessory = null, className = "", style }: Props) {
  const eyeY = 46
  const blushY = 51

  const eyes = {
    neutral: (
      <>
        <circle cx={36} cy={eyeY} r={3.5} fill="#1a1a1a" />
        <circle cx={64} cy={eyeY} r={3.5} fill="#1a1a1a" />
      </>
    ),
    happy: (
      <>
        <path d="M 33 45 Q 36 40 39 45" fill="none" stroke="#1a1a1a" strokeWidth={2.5} strokeLinecap="round" />
        <path d="M 61 45 Q 64 40 67 45" fill="none" stroke="#1a1a1a" strokeWidth={2.5} strokeLinecap="round" />
      </>
    ),
    sleepy: (
      <>
        <line x1={33} y1={eyeY} x2={39} y2={eyeY} stroke="#1a1a1a" strokeWidth={2.5} strokeLinecap="round" />
        <line x1={61} y1={eyeY} x2={67} y2={eyeY} stroke="#1a1a1a" strokeWidth={2.5} strokeLinecap="round" />
      </>
    ),
    celebrate: (
      <>
        <path d="M 33 44 L 35 41 L 37 44 L 40 43 L 38 46 L 41 48 L 37 48 L 36 51 L 35 48 L 31 48 L 34 46 L 32 43 Z" fill="#1a1a1a" />
        <path d="M 60 44 L 62 41 L 64 44 L 67 43 L 65 46 L 68 48 L 64 48 L 63 51 L 62 48 L 58 48 L 61 46 L 59 43 Z" fill="#1a1a1a" />
      </>
    ),
    thinking: (
      <>
        <circle cx={36} cy={eyeY} r={3.5} fill="#1a1a1a" />
        <path d="M 61 46 Q 64 42 67 46" fill="none" stroke="#1a1a1a" strokeWidth={2.5} strokeLinecap="round" />
      </>
    ),
    encouraging: (
      <>
        <path d="M 33 46 Q 36 42 39 46" fill="none" stroke="#1a1a1a" strokeWidth={2.5} strokeLinecap="round" />
        <path d="M 61 46 Q 64 42 67 46" fill="none" stroke="#1a1a1a" strokeWidth={2.5} strokeLinecap="round" />
      </>
    ),
  }[emotion]

  const mouth = {
    neutral: <path d="M 44 55 Q 50 59 56 55" fill="none" stroke="#1a1a1a" strokeWidth={2} strokeLinecap="round" />,
    happy: <path d="M 42 56 Q 50 64 58 56" fill="none" stroke="#1a1a1a" strokeWidth={2.5} strokeLinecap="round" />,
    sleepy: <path d="M 45 56 Q 50 53 55 56" fill="none" stroke="#1a1a1a" strokeWidth={1.5} strokeLinecap="round" />,
    celebrate: <path d="M 43 57 Q 50 66 57 57" fill="none" stroke="#1a1a1a" strokeWidth={2.5} strokeLinecap="round" />,
    thinking: <path d="M 44 57 Q 50 54 56 59" fill="none" stroke="#1a1a1a" strokeWidth={2} strokeLinecap="round" strokeDasharray="2 2" />,
    encouraging: <path d="M 44 55 Q 50 58 56 55" fill="none" stroke="#1a1a1a" strokeWidth={2.5} strokeLinecap="round" />,
  }[emotion]

  const blush = (
    <>
      <ellipse cx={26} cy={blushY} rx={5} ry={3} fill="#F2C4C4" opacity={0.7} />
      <ellipse cx={74} cy={blushY} rx={5} ry={3} fill="#F2C4C4" opacity={0.7} />
    </>
  )

  const accessoryEl = accessory === "laptop" ? (
    <g transform={`translate(50, 68)`}>
      <rect x={-18} y={-2} width={36} height={22} rx={2} fill="#E8D5C4" stroke="#1a1a1a" strokeWidth={1.5} />
      <rect x={-15} y={0} width={30} height={14} rx={1} fill="#4A6B8A" />
      <rect x={-13} y={2} width={6} height={1.5} rx={0.5} fill="#7FB8D8" opacity={0.8} />
      <rect x={-5} y={2} width={10} height={1.5} rx={0.5} fill="#7FB8D8" opacity={0.6} />
      <rect x={-13} y={4.5} width={8} height={1.5} rx={0.5} fill="#E8D5C4" opacity={0.7} />
      <rect x={-3} y={4.5} width={6} height={1.5} rx={0.5} fill="#7FB8D8" opacity={0.5} />
      <rect x={-13} y={7} width={4} height={1.5} rx={0.5} fill="#7FB8D8" opacity={0.7} />
      <rect x={-7} y={7} width={12} height={1.5} rx={0.5} fill="#E8D5C4" opacity={0.6} />
      <rect x={-13} y={9.5} width={10} height={1.5} rx={0.5} fill="#7FB8D8" opacity={0.5} />
      <line x1={-16} y1={15} x2={16} y2={15} stroke="#1a1a1a" strokeWidth={1} />
      <rect x={-14} y={15} width={28} height={5} rx={1} fill="#E8D5C4" stroke="#1a1a1a" strokeWidth={1} />
      <rect x={-3} y={18} width={6} height={1.5} rx={2} fill="#1a1a1a" opacity={0.15} />
    </g>
  ) : accessory === "pencil" ? (
    <g transform={`translate(85, 45) rotate(-30)`}>
      <rect x={-2} y={-20} width={4} height={28} rx={1} fill="#E88D7A" stroke="#1a1a1a" strokeWidth={1.2} />
      <polygon points="-3,8 3,8 0,14" fill="#1a1a1a" />
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
      <g>
        {/* shadow */}
        <ellipse cx={50} cy={91} rx={28} ry={4} fill="rgba(0,0,0,0.06)" />

        {/* rice body */}
        <path
          d="M 50 8 C 56 8 62 18 68 30 L 84 72 C 88 80 82 88 74 88 L 26 88 C 18 88 12 80 16 72 L 32 30 C 38 18 44 8 50 8 Z"
          fill="#FFF5E6"
          stroke="#E8D5C4"
          strokeWidth={1.5}
        />

        {/* body highlight */}
        <path
          d="M 46 14 C 50 12 55 14 58 20"
          fill="none"
          stroke="white"
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.5}
        />

        {/* nori (seaweed) wrap */}
        <path
          d="M 16 62 L 84 62 C 86 70 86 78 74 88 L 26 88 C 14 78 14 70 16 62 Z"
          fill="#2D4A3E"
        />
        <path
          d="M 16 62 C 22 58 32 62 40 63 C 48 64 52 61 60 63 C 68 65 78 60 84 62"
          fill="none"
          stroke="#3A5C4E"
          strokeWidth={1.5}
          opacity={0.6}
        />

        {/* nori highlight */}
        <path
          d="M 30 68 C 36 66 42 70 50 67 C 55 65 65 68 70 66"
          fill="none"
          stroke="#4A705E"
          strokeWidth={1.5}
          strokeLinecap="round"
          opacity={0.4}
        />

        {/* face */}
        {eyes}
        {blush}
        {mouth}

        {/* accessory */}
        {accessoryEl}
      </g>
    </svg>
  )
}
