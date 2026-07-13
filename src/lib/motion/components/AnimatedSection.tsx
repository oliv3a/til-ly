"use client"

import type { Variants } from "motion/react"
import { motion, useReducedMotion } from "motion/react"
import { fadeInUp, reducedMotionVariants } from "../variants"

interface AnimatedSectionProps {
  children: React.ReactNode
  variant?: Variants
  className?: string
  once?: boolean
}

export default function AnimatedSection({
  children,
  variant = fadeInUp,
  className = "",
  once = true,
}: AnimatedSectionProps) {
  const shouldReduce = useReducedMotion()
  const finalVariant = shouldReduce ? reducedMotionVariants : variant

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-50px" }}
      variants={finalVariant}
      className={className}
    >
      {children}
    </motion.section>
  )
}
