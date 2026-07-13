import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getComputedSkills } from "@/lib/skills"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = (session.user as any).id
    const userName = (session.user as any).name || "there"

    const { searchParams } = new URL(req.url)
    const monthParam = searchParams.get("month")

    let targetYear: number
    let targetMonth: number

    if (monthParam) {
      const parts = monthParam.split("-")
      targetYear = parseInt(parts[0], 10)
      targetMonth = parseInt(parts[1], 10) - 1
    } else {
      const now = new Date()
      targetYear = now.getFullYear()
      targetMonth = now.getMonth()
    }

    const monthStart = new Date(targetYear, targetMonth, 1)
    const monthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999)

    const monthlyLogs = await prisma.studyLog.findMany({
      where: { userId, createdAt: { gte: monthStart, lte: monthEnd } },
      orderBy: { createdAt: "asc" },
      include: {
        skillTags: { include: { skill: true } },
      },
    })

    const monthlyLogsByDay: Record<number, Array<{
      id: string
      title: string
      createdAt: Date
      aiSummary: string | null
      skillTags: Array<{ id: string; xp: number; skill: { id: string; name: string } }>
    }>> = {}
    monthlyLogs.forEach((log) => {
      const day = log.createdAt.getDate()
      if (!monthlyLogsByDay[day]) monthlyLogsByDay[day] = []
      monthlyLogsByDay[day].push({
        id: log.id,
        title: log.title,
        createdAt: log.createdAt,
        aiSummary: log.aiSummary,
        skillTags: log.skillTags,
      })
    })

    if (monthParam) {
      return NextResponse.json({ monthlyLogsByDay })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { streakCount: true },
    })

    const logs = await prisma.studyLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        skillTags: { include: { skill: true } },
      },
    })

    const projectUpdates = await prisma.projectUpdate.findMany({
      where: { project: { userId } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        project: { select: { id: true, title: true } },
      },
    })

    const goals = await prisma.goal.findMany({
      where: { userId, status: "active" },
      orderBy: { createdAt: "desc" },
      include: {
        roadmapItems: {
          orderBy: { order: "asc" },
          select: { id: true, isComplete: true },
        },
      },
    })

    const skills = await getComputedSkills(userId)

    return NextResponse.json({
      userId,
      userName,
      streakCount: user?.streakCount || 0,
      logCount: logs.length,
      recentLogs: logs,
      recentProjectUpdates: projectUpdates,
      goals,
      skills,
      monthlyLogsByDay,
    })
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
