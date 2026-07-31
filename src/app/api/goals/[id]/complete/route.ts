import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { congratulateGoalCompletion } from "@/lib/ai"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const goal = await prisma.goal.findUnique({
      where: { id },
      include: { roadmapItems: { select: { isComplete: true } } },
    })
    if (!goal || goal.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (goal.status === "completed") {
      return NextResponse.json({ error: "Goal already completed" }, { status: 400 })
    }

    const allDone = goal.roadmapItems.every((item) => item.isComplete)
    if (!allDone) {
      return NextResponse.json({ error: "Not all roadmap items are complete" }, { status: 400 })
    }

    const [updated, aiMessage] = await Promise.all([
      prisma.goal.update({
        where: { id },
        data: { status: "completed", completedAt: new Date() },
        include: {
          roadmapItems: {
            orderBy: { order: "asc" },
            include: { _count: { select: { studyLogLinks: true } } },
          },
        },
      }),
      congratulateGoalCompletion(goal.title),
    ])

    return NextResponse.json({ goal: updated, aiCongratulations: aiMessage })
  } catch (err) {
    console.error("Goal complete failed:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
