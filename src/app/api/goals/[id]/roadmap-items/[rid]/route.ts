import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { processCheckin } from "@/lib/checkin"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; rid: string }> }) {
  try {
    const { id: gid, rid } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const goal = await prisma.goal.findUnique({ where: { id: gid }, select: { userId: true } })
    if (!goal || goal.userId !== session.user.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await req.json()

    const data: Record<string, unknown> = {}
    if (body.isComplete !== undefined) data.isComplete = body.isComplete
    const { timezoneOffset } = body
    if (body.topic !== undefined) data.topic = body.topic
    if (body.description !== undefined) data.description = body.description
    if (body.estimatedLogs !== undefined) data.estimatedLogs = body.estimatedLogs
    if (Object.keys(data).length === 0)
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })

    await prisma.roadmapItem.update({ where: { id: rid }, data })

    if (body.isComplete === true) {
      processCheckin(session.user.id, timezoneOffset).catch(() => {})
    }

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
    console.error("Roadmap item PATCH failed:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; rid: string }> }) {
  try {
    const { id: gid, rid } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id
    const goal = await prisma.goal.findUnique({ where: { id: gid }, select: { userId: true } })
    if (!goal || goal.userId !== userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const goalWithRoadmap = await prisma.$transaction(async (tx) => {
      await tx.roadmapItem.delete({ where: { id: rid } })

      const remaining = await tx.roadmapItem.findMany({
        where: { goalId: gid },
        orderBy: { order: "asc" },
      })

      for (let i = 0; i < remaining.length; i++) {
        if (remaining[i].order !== i + 1) {
          await tx.roadmapItem.update({ where: { id: remaining[i].id }, data: { order: i + 1 } })
        }
      }

      return tx.goal.findUnique({
        where: { id: gid },
        include: {
          roadmapItems: {
            orderBy: { order: "asc" },
            include: { _count: { select: { studyLogLinks: true } } },
          },
        },
      })
    })

    return NextResponse.json({ goal: goalWithRoadmap })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
