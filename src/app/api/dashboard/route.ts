import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id

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

    const [user, totalLogCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { streakCount: true },
      }),
      prisma.studyLog.count({ where: { userId } }),
    ])

    return NextResponse.json({
      streakCount: user?.streakCount || 0,
      logCount: totalLogCount,
      monthlyLogsByDay,
    })
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
