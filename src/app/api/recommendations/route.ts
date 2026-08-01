import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getRecommendation } from "@/lib/ai"
import { getComputedSkills } from "@/lib/skills"
import { dbRateLimit, aiDailyKey, DAILY_MS } from "@/lib/db-rate-limit"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { allowed } = await dbRateLimit(aiDailyKey(session.user.id, "recommend"), 50, DAILY_MS)
  if (!allowed) {
    return NextResponse.json({ error: "Daily recommendation limit reached. Try again tomorrow." }, { status: 429 })
  }

  const userId = session.user.id

  const goals = await prisma.goal.findMany({
    where: { userId, status: "active" },
    select: { id: true, title: true },
  })

  const recentLogs = await prisma.studyLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { skillTags: { include: { skill: true } } },
  })

  const recentSkills = [...new Set(recentLogs.flatMap((l) => l.skillTags.map((st) => st.skill.name)))]

  const userSkills = await getComputedSkills(userId)

  const skillsSummary = userSkills.map((us) => ({ name: us.skill.name, logCount: us.logCount }))

  if (goals.length === 0) {
    return NextResponse.json({ topic: "Set a goal", reason: "Set a learning goal and we'll recommend what to study next.", estimatedTime: "", goalProgressAfter: "" })
  }

  let recommendation
  try {
    recommendation = await getRecommendation(goals, recentSkills, skillsSummary)
  } catch {
    recommendation = {
      topic: "Keep going with your goal",
      reason: `You're making progress on "${goals[0]?.title}". Log another session to keep moving forward.`,
      estimatedTime: "30 min",
    }
  }

  return NextResponse.json(recommendation)
}
