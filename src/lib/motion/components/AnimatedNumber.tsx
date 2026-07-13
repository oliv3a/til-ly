"use client"

import { useEffect, useState } from "react"
import { useMotionValue, useSpring, useMotionValueEvent } from "motion/react"
import { springPresets } from "../tokens"
import { useReducedMotion } from "motion/react"

interface AnimatedNumberProps {
  value: number
  format?: (n: number) => string
  springConfig?: { stiffness?: number; damping?: number }
  className?: string
}

export default function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString(),
  springConfig,
  className = "",
}: AnimatedNumberProps) {
  const shouldReduce = useReducedMotion()
  const config = shouldReduce
    ? { stiffness: 1000, damping: 500 }
    : (springConfig ?? springPresets.gentle)

  const motionValue = useMotionValue(value)
  const springValue = useSpring(motionValue, config)
  const [display, setDisplay] = useState(() => format(value))

  useMotionValueEvent(springValue, "change", (latest) => {
    setDisplay(format(latest))
  })

  useEffect(() => {
    motionValue.set(value)
  }, [value, motionValue])

  return <span className={className}>{display}</span>
}
