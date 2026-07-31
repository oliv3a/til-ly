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

  const threeMonthStart = new Date(prevMonth.year, prevMonth.month, 1)
  const threeMonthEnd = new Date(nextMonth.year, nextMonth.month + 1, 0, 23, 59, 59, 999)

  const [
    user,
    totalLogCount,
    logs,
    goals,
    skills,
    allMonthLogs,
    currentProject,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { streakCount: true },
    }),
    prisma.studyLog.count({ where: { userId } }),
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
          select: { id: true, isComplete: true, topic: true },
        },
      },
    }),
    getComputedSkills(userId, 20),
    prisma.studyLog.findMany({
      where: { userId, createdAt: { gte: threeMonthStart, lte: threeMonthEnd } },
      orderBy: { createdAt: "asc" },
      include: { skillTags: { include: { skill: true } } },
    }),
    prisma.project.findFirst({
      where: { userId, status: "in_progress" },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        progressPct: true,
        steps: { select: { isComplete: true } },
      },
    }),
  ])

  function groupByMonthAndDay(logs: typeof allMonthLogs) {
    const byMonth: Record<string, Record<number, Array<{
      id: string
      title: string
      createdAt: Date
      aiSummary: string | null
      skillTags: Array<{ id: string; xp: number; skill: { id: string; name: string } }>
    }>>> = {}
    logs.forEach((log) => {
      const monthKey = `${log.createdAt.getFullYear()}-${String(log.createdAt.getMonth() + 1).padStart(2, "0")}`
      const day = log.createdAt.getDate()
      if (!byMonth[monthKey]) byMonth[monthKey] = {}
      if (!byMonth[monthKey][day]) byMonth[monthKey][day] = []
      byMonth[monthKey][day].push({
        id: log.id,
        title: log.title,
        createdAt: log.createdAt,
        aiSummary: log.aiSummary,
        skillTags: log.skillTags,
      })
    })
    return byMonth
  }

  const initialMonthCache = groupByMonthAndDay(allMonthLogs)

  return (
    <>
      <PushSetup />
      <DashboardClient
      initialData={{
        userId,
        userName,
        streakCount: user?.streakCount || 0,
        logCount: totalLogCount,
        recentLogs: JSON.parse(JSON.stringify(logs)),
        goals: JSON.parse(JSON.stringify(goals)),
        skills: JSON.parse(JSON.stringify(skills)),
        recommendation: null,
        currentProject: currentProject ? JSON.parse(JSON.stringify(currentProject)) : null,
        initialMonthCache: JSON.parse(JSON.stringify(initialMonthCache)),
      }}
    />
    </>  )
}
