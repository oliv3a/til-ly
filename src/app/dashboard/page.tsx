import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getComputedSkills } from "@/lib/skills"
import PushSetup from "@/components/PushSetup"

import DashboardClient from "./DashboardClient"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")

  const userId = session.user.id
  const userName = session.user.name || "there"

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const cy = today.getFullYear()
  const cm = today.getMonth()
  const prevMonth = cm === 0 ? { year: cy - 1, month: 11 } : { year: cy, month: cm - 1 }
  const nextMonth = cm === 11 ? { year: cy + 1, month: 0 } : { year: cy, month: cm + 1 }

  const monthRange = (year: number, month: number) => {
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999)
    return { start, end }
  }

  const [
    user,
    logs,
    goals,
    skills,
    currentMonthLogs,
    prevMonthLogs,
    nextMonthLogs,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { streakCount: true },
    }),
    prisma.studyLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        skillTags: { include: { skill: true } },
      },
    }),
    prisma.goal.findMany({
      where: { userId, status: "active" },
      orderBy: { createdAt: "desc" },
      include: {
        roadmapItems: {
          orderBy: { order: "asc" },
          select: { id: true, isComplete: true },
        },
      },
    }),
    getComputedSkills(userId),
    prisma.studyLog.findMany({
      where: { userId, createdAt: { gte: monthRange(cy, cm).start, lte: monthRange(cy, cm).end } },
      orderBy: { createdAt: "asc" },
      include: { skillTags: { include: { skill: true } } },
    }),
    prisma.studyLog.findMany({
      where: { userId, createdAt: { gte: monthRange(prevMonth.year, prevMonth.month).start, lte: monthRange(prevMonth.year, prevMonth.month).end } },
      orderBy: { createdAt: "asc" },
      include: { skillTags: { include: { skill: true } } },
    }),
    prisma.studyLog.findMany({
      where: { userId, createdAt: { gte: monthRange(nextMonth.year, nextMonth.month).start, lte: monthRange(nextMonth.year, nextMonth.month).end } },
      orderBy: { createdAt: "asc" },
      include: { skillTags: { include: { skill: true } } },
    }),
  ])

  function groupByDay(logs: typeof currentMonthLogs) {
    const byDay: Record<number, Array<{
      id: string
      title: string
      createdAt: Date
      aiSummary: string | null
      skillTags: Array<{ id: string; xp: number; skill: { id: string; name: string } }>
    }>> = {}
    logs.forEach((log) => {
      const day = log.createdAt.getDate()
      if (!byDay[day]) byDay[day] = []
      byDay[day].push({
        id: log.id,
        title: log.title,
        createdAt: log.createdAt,
        aiSummary: log.aiSummary,
        skillTags: log.skillTags,
      })
    })
    return byDay
  }

  const key = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, "0")}`
  const initialMonthCache = {
    [key(cy, cm)]: groupByDay(currentMonthLogs),
    [key(prevMonth.year, prevMonth.month)]: groupByDay(prevMonthLogs),
    [key(nextMonth.year, nextMonth.month)]: groupByDay(nextMonthLogs),
  }

  return (
    <>
      <PushSetup />
      <DashboardClient
      initialData={{
        userId,
        userName,
        streakCount: user?.streakCount || 0,
        logCount: logs.length,
        recentLogs: JSON.parse(JSON.stringify(logs)),
        recentProjectUpdates: [],
        goals: JSON.parse(JSON.stringify(goals)),
        skills: JSON.parse(JSON.stringify(skills)),
        recommendation: null,
        initialMonthCache: JSON.parse(JSON.stringify(initialMonthCache)),
      }}
    />
    </>  )
}
