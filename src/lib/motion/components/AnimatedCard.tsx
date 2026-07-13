"use client"

import type { ComponentPropsWithoutRef } from "react"
import { motion, useReducedMotion } from "motion/react"

interface AnimatedCardProps extends ComponentPropsWithoutRef<typeof motion.div> {
  hoverLift?: boolean
}

export default function AnimatedCard({
  className = "",
  children,
  whileHover,
  hoverLift = true,
  ...props
}: AnimatedCardProps) {
  const shouldReduce = useReducedMotion()

  return (
    <motion.div
      className={className}
      whileHover={
        shouldReduce || !hoverLift
          ? {}
          : whileHover ?? {
              y: -3,
              scale: 1.01,
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            }
      }
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
