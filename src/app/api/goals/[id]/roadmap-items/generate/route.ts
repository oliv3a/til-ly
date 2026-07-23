import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { regenerateRoadmap } from "@/lib/ai"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id
    const goal = await prisma.goal.findUnique({
      where: { id },
      select: {
        userId: true,
        title: true,
        description: true,
        roadmapItems: { select: { topic: true, description: true } },
      },
    })
    if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (goal.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { instruction } = await req.json()
    if (!instruction || typeof instruction !== "string") {
      return NextResponse.json({ error: "instruction is required" }, { status: 400 })
    }

    const newItems = await regenerateRoadmap(goal.title, goal.description || "", goal.roadmapItems, instruction)

    const updated = await prisma.$transaction(async (tx) => {
      await tx.roadmapItem.deleteMany({ where: { goalId: id } })
      await tx.roadmapItem.createMany({
        data: newItems.map((item, i) => ({
          goalId: id,
          order: i + 1,
          topic: item.topic,
          description: item.description || null,
          estimatedLogs: Math.max(1, item.estimatedLogs ?? 2),
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
