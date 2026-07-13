const XP_THRESHOLDS = {
  beginner: 0,
  intermediate: 100,
  expert: 300,
}

const XP_BY_DEPTH = {
  surface: 5,
  moderate: 15,
  deep: 30,
}

export function getXpForDepth(depth: string): number {
  return XP_BY_DEPTH[depth as keyof typeof XP_BY_DEPTH] ?? 5
}

export function getLevelForXp(xp: number): string {
  if (xp >= XP_THRESHOLDS.expert) return "expert"
  if (xp >= XP_THRESHOLDS.intermediate) return "intermediate"
  return "beginner"
}

export function calculateNewLevel(currentXp: number, addedXp: number): { newXp: number; newLevel: string; leveledUp: boolean } {
  const newXp = currentXp + addedXp
  const oldLevel = getLevelForXp(currentXp)
  const newLevel = getLevelForXp(newXp)
  return { newXp, newLevel, leveledUp: oldLevel !== newLevel }
}
