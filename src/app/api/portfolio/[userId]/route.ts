import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getComputedSkills } from "@/lib/skills"

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const session = await auth()
  const isOwner = session?.user && session.user.id === userId

  const url = new URL(req.url)
  const offset = parseInt(url.searchParams.get("offset") || "0")
  const limit = parseInt(url.searchParams.get("limit") || "10")

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: isOwner, avatarUrl: true, bio: true, school: true, year: true },
  })

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const [logs, totalLogs] = await Promise.all([
    prisma.studyLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      include: {
        files: true,
        skillTags: { include: { skill: true } },
        goalLinks: { include: { goal: { select: { id: true, title: true } } } },
      },
    }),
    prisma.studyLog.count({ where: { userId } }),
  ])

  const skills = await getComputedSkills(userId)

  const goals = await prisma.goal.findMany({
    where: { userId },
    include: {
      roadmapItems: {
        orderBy: { order: "asc" },
        include: { _count: { select: { studyLogLinks: true } } },
      },
    },
  })

  const projects = await prisma.project.findMany({
    where: { userId, status: { not: "archived" } },
    orderBy: { updatedAt: "desc" },
    take: 20,
    include: {
      _count: { select: { updates: true } },
      updates: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  })

  return NextResponse.json({ user, logs, skills, goals, projects, hasMore: offset + limit < totalLogs })
}
