import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id
    const goal = await prisma.goal.findUnique({ where: { id }, select: { userId: true } })
    if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (goal.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { items } = await req.json()
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items array is required" }, { status: 400 })
    }

    const validated = items.map((item: { topic?: string; description?: string; estimatedLogs?: number }, i: number) => {
      if (!item.topic || typeof item.topic !== "string") throw new Error(`Item ${i}: topic is required`)
      return {
        topic: item.topic.trim(),
        description: item.description?.trim() || null,
        estimatedLogs: typeof item.estimatedLogs === "number" ? Math.max(1, item.estimatedLogs) : 2,
      }
    })

    const updated = await prisma.$transaction(async (tx) => {
      await tx.roadmapItem.deleteMany({ where: { goalId: id } })
      await tx.roadmapItem.createMany({
        data: validated.map((item: { topic: string; description: string | null; estimatedLogs: number }, i: number) => ({
          goalId: id,
          order: i + 1,
          topic: item.topic,
          description: item.description,
          estimatedLogs: item.estimatedLogs,
        })),
      })
      return tx.goal.findUnique({
        where: { id },
        include: {
          roadmapItems: {
            orderBy: { order: "asc" },
            include: { _count: { select: { studyLogLinks: true } } },
          },
        },
      })
    })

    return NextResponse.json({ goal: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
