import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: gid } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id
    const goal = await prisma.goal.findUnique({ where: { id: gid }, select: { userId: true } })
    if (!goal || goal.userId !== userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { itemIds } = await req.json()
    if (!Array.isArray(itemIds))
      return NextResponse.json({ error: "itemIds array required" }, { status: 400 })

    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < itemIds.length; i++) {
        await tx.roadmapItem.update({ where: { id: itemIds[i] }, data: { order: i + 1 } })
      }
    })

    const goalWithRoadmap = await prisma.goal.findUnique({
      where: { id: gid },
      include: {
        roadmapItems: {
          orderBy: { order: "asc" },
          include: { _count: { select: { studyLogLinks: true } } },
        },
      },
    })

    return NextResponse.json({ goal: goalWithRoadmap })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
