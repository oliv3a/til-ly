import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getComputedSkills } from "@/lib/skills"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

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

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const studiedToday = logs.some((log) => {
      const logDate = new Date(log.createdAt)
      logDate.setHours(0, 0, 0, 0)
      return logDate.getTime() === today.getTime()
    })

    return NextResponse.json({
      userId,
      userName,
      streakCount: user?.streakCount || 0,
      logCount: logs.length,
      studiedToday,
      recentLogs: logs,
      recentProjectUpdates: projectUpdates,
      goals,
      skills,
    })
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
