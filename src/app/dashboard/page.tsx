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

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
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
        monthlyLogsByDay: JSON.parse(JSON.stringify(monthlyLogsByDay)),
      }}
    />
    </>  )
}
