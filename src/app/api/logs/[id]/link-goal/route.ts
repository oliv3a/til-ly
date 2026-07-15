import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function getGoalWithProgress(goalId: string) {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: {
      roadmapItems: {
        orderBy: { order: "asc" },
        include: { _count: { select: { studyLogLinks: true } } },
      },
      _count: { select: { studyLinks: true } },
    },
  })
  if (!goal) return null
  const totalItems = goal.roadmapItems.length
  const itemsWithLogs = goal.roadmapItems.filter((i) => i._count.studyLogLinks > 0).length
  return {
    ...goal,
    progressPct: totalItems > 0 ? Math.round((itemsWithLogs / totalItems) * 100) : 0,
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id
    const log = await prisma.studyLog.findUnique({ where: { id }, select: { userId: true } })
    if (!log || log.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { goalId } = await req.json()
    if (!goalId) return NextResponse.json({ error: "goalId required" }, { status: 400 })

    const goal = await prisma.goal.findUnique({ where: { id: goalId }, select: { userId: true } })
    if (!goal || goal.userId !== userId) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
    }

    await prisma.goalStudyLog.upsert({
      where: { goalId_studyLogId: { goalId, studyLogId: id } },
      create: { goalId, studyLogId: id },
      update: {},
    })

    const goalWithProgress = await getGoalWithProgress(goalId)

    return NextResponse.json({ success: true, goal: goalWithProgress })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id
    const log = await prisma.studyLog.findUnique({ where: { id }, select: { userId: true } })
    if (!log || log.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const goalId = searchParams.get("goalId")
    if (!goalId) return NextResponse.json({ error: "goalId required" }, { status: 400 })

    await prisma.goalStudyLog.deleteMany({
      where: { goalId, studyLogId: id },
    })

    const goalWithProgress = await getGoalWithProgress(goalId)

    return NextResponse.json({ success: true, goal: goalWithProgress })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
