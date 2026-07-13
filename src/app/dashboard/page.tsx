import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getComputedSkills } from "@/lib/skills"
import PushSetup from "@/components/PushSetup"

import DashboardClient from "./DashboardClient"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")

  const userId = (session.user as any).id
  const userName = (session.user as any).name || "there"

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

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  async function fetchMonth(year: number, month: number) {
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999)
    const logs = await prisma.studyLog.findMany({
      where: { userId, createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: "asc" },
      include: {
        skillTags: { include: { skill: true } },
      },
    })
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

  const cy = today.getFullYear()
  const cm = today.getMonth()
  const prevMonth = cm === 0 ? { year: cy - 1, month: 11 } : { year: cy, month: cm - 1 }
  const nextMonth = cm === 11 ? { year: cy + 1, month: 0 } : { year: cy, month: cm + 1 }

  const [currentData, prevData, nextData] = await Promise.all([
    fetchMonth(cy, cm),
    fetchMonth(prevMonth.year, prevMonth.month),
    fetchMonth(nextMonth.year, nextMonth.month),
  ])

  const key = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, "0")}`
  const initialMonthCache: Record<string, Record<number, Array<{
    id: string
    title: string
    createdAt: Date
    aiSummary: string | null
    skillTags: Array<{ id: string; xp: number; skill: { id: string; name: string } }>
  }>>> = {
    [key(cy, cm)]: currentData,
    [key(prevMonth.year, prevMonth.month)]: prevData,
    [key(nextMonth.year, nextMonth.month)]: nextData,
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
