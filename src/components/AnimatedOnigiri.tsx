"use client"

import { motion, useReducedMotion } from "motion/react"
import Onigiri from "./Onigiri"
import type { Emotion } from "./Onigiri"

interface AnimatedOnigiriProps {
  size?: number
  emotion?: Emotion
  accessory?: "laptop" | "pencil" | null
  className?: string
}

const emotionTransitions: Record<Emotion, { scale: number; rotate: number }> = {
  neutral: { scale: 1, rotate: 0 },
  happy: { scale: 1.04, rotate: -2 },
  sleepy: { scale: 0.96, rotate: 3 },
  celebrate: { scale: 1.06, rotate: 0 },
  thinking: { scale: 1, rotate: 1 },
  encouraging: { scale: 1.02, rotate: 0 },
}

export default function AnimatedOnigiri({
  size = 80,
  emotion = "neutral",
  accessory = null,
  className = "",
}: AnimatedOnigiriProps) {
  const shouldReduce = useReducedMotion()

  return (
    <motion.div
      className={`inline-flex ${className}`}
      animate={
        shouldReduce
          ? {}
          : {
              y: [0, -3, 0],
              ...emotionTransitions[emotion],
            }
      }
      transition={
        shouldReduce
          ? { duration: 0 }
          : {
              y: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              },
              scale: {
                type: "spring",
                stiffness: 200,
                damping: 20,
                duration: 0.4,
              },
              rotate: {
                type: "spring",
                stiffness: 200,
                damping: 20,
                duration: 0.4,
              },
            }
      }
    >
      <Onigiri size={size} emotion={emotion} accessory={accessory} />
    </motion.div>
  )
}
