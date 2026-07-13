import type { Variants } from "motion/react"

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
}

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0 },
}

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0 },
}

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
}

export const reducedMotionVariants: Variants = {
  hidden: { opacity: 1, x: 0, y: 0, scale: 1 },
  visible: { opacity: 1, x: 0, y: 0, scale: 1 },
}

export const btnHoverCoral = { scale: 1.02, y: -1 }

export const btnHoverOutline = { scale: 1.02, y: -1, background: "var(--color-warm-paper)" }

export const btnHoverSm = { y: -1, background: "var(--color-warm-paper)" }

export const btnHoverSmPrimary = { scale: 1.02, y: -1 }

export const btnTapDefault = { scale: 0.98 }
