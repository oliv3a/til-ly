import { prisma } from "@/lib/prisma"

export interface JourneyHighlight {
  icon: string
  title: string
  description: string
  priority: number
}

function computeLongestStreak(dates: Date[]): number {
  if (dates.length === 0) return 0
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime())
  let longest = 1
  let current = 1
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round(
      (sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24)
    )
    if (diff === 1) {
      current++
      if (current > longest) longest = current
    } else if (diff > 1) {
      current = 1
    }
  }
  return longest
}

export async function generateJourneyRecap(userId: string): Promise<JourneyHighlight[]> {
  const [logCount, topSkill, completedGoals, completedProjects, uniqueSkills, checkins, resume] =
    await Promise.all([
      prisma.studyLog.count({ where: { userId } }),
      prisma.userSkill.findFirst({
        where: { userId },
        orderBy: { xp: "desc" },
        select: { xp: true, skill: { select: { name: true } } },
      }),
      prisma.goal.count({ where: { userId, status: "completed" } }),
      prisma.project.count({ where: { userId, status: "completed" } }),
      prisma.userSkill.count({ where: { userId } }),
      prisma.dailyCheckin.findMany({
        where: { userId, studied: true },
        select: { date: true },
        orderBy: { date: "asc" },
      }),
      prisma.resume.findUnique({
        where: { userId },
        select: { content: true },
      }),
    ])

  const candidates: JourneyHighlight[] = []

  // 1. Strongest skill
  if (topSkill && topSkill.xp >= 2) {
    candidates.push({
      icon: "⭐",
      title: `${topSkill.skill.name} has become one of your strongest skills.`,
      description: `You've clearly spent a lot of time building it.`,
      priority: 1,
    })
  }

  // 2. Study history
  if (logCount >= 3) {
    candidates.push({
      icon: "📚",
      title: `You've already logged ${logCount} study session${logCount > 1 ? "s" : ""}.`,
      description: logCount >= 10
        ? `You're building something worth being proud of.`
        : `Every session adds up.`,
      priority: 2,
    })
  }

  // 3. Longest streak
  const longestStreak = computeLongestStreak(checkins.map((c) => c.date))
  if (longestStreak >= 3) {
    candidates.push({
      icon: "🔥",
      title: `Your longest streak is ${longestStreak} days.`,
      description: `Consistency like that compounds over time.`,
      priority: 3,
    })
  }

  // 4. Goals completed
  if (completedGoals >= 1) {
    candidates.push({
      icon: "🎯",
      title: `You've already completed ${completedGoals} learning goal${completedGoals > 1 ? "s" : ""}.`,
      description: completedGoals >= 3
        ? `Keep aiming higher.`
        : `That's how progress happens.`,
      priority: 4,
    })
  }

  // 5. Projects completed
  if (completedProjects >= 1) {
    candidates.push({
      icon: "🛠️",
      title: `You've already built ${completedProjects} project${completedProjects > 1 ? "s" : ""}.`,
      description: completedProjects >= 3
        ? `That's real experience.`
        : `You're off to a great start.`,
      priority: 5,
    })
  }

  // 6. Skills explored
  if (uniqueSkills >= 5) {
    candidates.push({
      icon: "🧰",
      title: `You've explored ${uniqueSkills} different skills already.`,
      description: `Curiosity is one of your biggest strengths.`,
      priority: 6,
    })
  } else if (uniqueSkills >= 2 && !topSkill) {
    candidates.push({
      icon: "🧰",
      title: `You've explored ${uniqueSkills} different skills.`,
      description: `Curiosity is one of your biggest strengths.`,
      priority: 6,
    })
  }

  // 7. Resume
  if (resume?.content) {
    const entryCount = (resume.content.match(/- /g) || []).length
    if (entryCount >= 1) {
      candidates.push({
        icon: "📄",
        title: `Your resume is already taking shape.`,
        description: `Future you will thank you.`,
        priority: 7,
      })
    }
  }

  if (candidates.length === 0) return []

  candidates.sort((a, b) => a.priority - b.priority)
  return candidates.slice(0, 3)
}
