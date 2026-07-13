"use client"

import type { ComponentPropsWithoutRef } from "react"
import { motion, useReducedMotion } from "motion/react"
import {
  btnHoverCoral,
  btnHoverOutline,
  btnHoverSm,
  btnHoverSmPrimary,
  btnTapDefault,
} from "../variants"

type Variant = "coral" | "outline" | "sm" | "sm-primary"

interface AnimatedButtonProps extends ComponentPropsWithoutRef<typeof motion.button> {
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  coral: "btn-base btn-coral",
  outline: "btn-base btn-outline",
  sm: "btn-base btn-sm",
  "sm-primary": "btn-base btn-sm-primary",
}

const hoverDefaults = {
  coral: btnHoverCoral,
  outline: btnHoverOutline,
  sm: btnHoverSm,
  "sm-primary": btnHoverSmPrimary,
}

export default function AnimatedButton({
  variant = "coral",
  className = "",
  children,
  whileHover,
  whileTap,
  ...props
}: AnimatedButtonProps) {
  const shouldReduce = useReducedMotion()

  return (
    <motion.button
      className={`${variantClasses[variant]} ${className}`}
      whileHover={shouldReduce ? {} : whileHover ?? hoverDefaults[variant]}
      whileTap={shouldReduce ? {} : whileTap ?? btnTapDefault}
      {...props}
    >
      {children}
    </motion.button>
  )
}
