import { prisma } from "@/lib/prisma"

export interface ComputedSkill {
  id: string
  logCount: number
  skill: {
    id: string
    name: string
    category: string | null
  }
}

export async function getComputedSkills(userId: string, take?: number): Promise<ComputedSkill[]> {
  const [studyLogRows, userSkills] = await Promise.all([
    prisma.studyLogSkill.findMany({
      where: { studyLog: { userId } },
      select: { skillId: true, skill: { select: { id: true, name: true, category: true } } },
    }),
    prisma.userSkill.findMany({
      where: { userId, manualLogCount: { not: null } },
      select: { skillId: true, manualLogCount: true, skill: { select: { id: true, name: true, category: true } } },
    }),
  ])

  const countMap = new Map<string, number>()
  const skillMap = new Map<string, ComputedSkill["skill"]>()

  for (const row of studyLogRows) {
    countMap.set(row.skillId, (countMap.get(row.skillId) ?? 0) + 1)
    if (!skillMap.has(row.skillId)) skillMap.set(row.skillId, row.skill)
  }

  for (const us of userSkills) {
    countMap.set(us.skillId, us.manualLogCount!)
    if (!skillMap.has(us.skillId)) skillMap.set(us.skillId, us.skill)
  }

  return Array.from(countMap.entries())
    .map(([skillId, logCount]) => ({
      id: `${userId}_${skillId}`,
      logCount,
      skill: skillMap.get(skillId)!,
    }))
    .sort((a, b) => b.logCount - a.logCount)
    .slice(0, take)
}
