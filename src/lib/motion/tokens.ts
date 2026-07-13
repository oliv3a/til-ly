export const durations = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  verySlow: 1,
} as const

export const easings = {
  default: [0.25, 0.1, 0.25, 1] as const,
  smooth: [0.4, 0, 0.2, 1] as const,
  emphasize: [0.68, -0.15, 0.265, 1.55] as const,
}

export const springPresets = {
  gentle: { stiffness: 100, damping: 20 },
  bouncy: { stiffness: 300, damping: 10 },
  snappy: { stiffness: 400, damping: 30 },
} as const

export const reducedMotionTransition = { duration: 0 }
