"use client"

import { motion, useReducedMotion } from "motion/react"
import { reducedMotionTransition } from "../tokens"

interface AnimatedProgressProps {
  value: number
  color?: string
  height?: number
  label?: string
  className?: string
}

export default function AnimatedProgress({
  value,
  color,
  height = 8,
  label,
  className = "",
}: AnimatedProgressProps) {
  const shouldReduce = useReducedMotion()
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={className}
      style={{
        width: "100%",
        height,
        background: "color-mix(in srgb, var(--color-warm-brown) 8%, transparent)",
        borderRadius: "2px",
        overflow: "hidden",
      }}
    >
      <motion.div
        initial={shouldReduce ? { width: `${clamped}%` } : { width: "0%" }}
        animate={{ width: `${clamped}%` }}
        transition={
          shouldReduce
            ? reducedMotionTransition
            : { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }
        }
        style={{
          height: "100%",
          background: color || "var(--color-soft-coral)",
        }}
      />
    </div>
  )
}
