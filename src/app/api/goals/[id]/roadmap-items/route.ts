import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: gid } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = (session.user as any).id
    const goal = await prisma.goal.findUnique({ where: { id: gid }, select: { userId: true } })
    if (!goal || goal.userId !== userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { topic, description, estimatedLogs } = await req.json()
    if (!topic) return NextResponse.json({ error: "topic required" }, { status: 400 })

    const result = await prisma.$transaction(async (tx) => {
      const maxOrder = await tx.roadmapItem.aggregate({
        where: { goalId: gid },
        _max: { order: true },
      })

      const item = await tx.roadmapItem.create({
        data: {
          goalId: gid,
          order: (maxOrder._max.order ?? 0) + 1,
          topic,
          description,
          estimatedLogs: estimatedLogs ?? 2,
        },
      })

      const goalWithRoadmap = await tx.goal.findUnique({
        where: { id: gid },
        include: {
          roadmapItems: {
            orderBy: { order: "asc" },
            include: { _count: { select: { studyLogLinks: true } } },
          },
        },
      })

      return { item, goal: goalWithRoadmap }
    })

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
