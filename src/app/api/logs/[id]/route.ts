import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getComputedSkills } from "@/lib/skills"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const log = await prisma.studyLog.findUnique({
    where: { id },
    include: {
      files: true,
      skillTags: { include: { skill: true } },
      goalLinks: { include: { goal: { select: { id: true, title: true } } } },
      roadmapLinks: {
        include: { roadmapItem: { include: { goal: { select: { id: true, title: true } } } } },
      },
    },
  })

  if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (log.userId !== (session.user as any).id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(log)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const log = await prisma.studyLog.findUnique({ where: { id } })
  if (!log || log.userId !== (session.user as any).id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()

  const updateData: Record<string, unknown> = {}
  if (body.title !== undefined) updateData.title = body.title
  if (body.content !== undefined) updateData.content = body.content
  if (body.aiSummary !== undefined) updateData.aiSummary = body.aiSummary

  if (body.roadmapItemIds !== undefined) {
    await prisma.studyLogRoadmapItem.deleteMany({ where: { studyLogId: id } })
    if (Array.isArray(body.roadmapItemIds) && body.roadmapItemIds.length > 0) {
      await prisma.studyLogRoadmapItem.createMany({
        data: body.roadmapItemIds.map((rid: string) => ({
          studyLogId: id,
          roadmapItemId: rid,
        })),
        skipDuplicates: true,
      })
    }
  }

  const updated = await prisma.studyLog.update({
    where: { id },
    data: updateData,
    include: {
      roadmapLinks: {
        include: { roadmapItem: { include: { goal: { select: { id: true, title: true } } } } },
      },
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = (session.user as any).id
    const log = await prisma.studyLog.findUnique({ where: { id } })
    if (!log || log.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.studyLog.delete({ where: { id } })

    const [freshSkills, freshGoals] = await Promise.all([
      getComputedSkills(userId),
      prisma.goal.findMany({
        where: { userId },
        include: { roadmapItems: { orderBy: { order: "asc" } } },
      }),
    ])

    return NextResponse.json({ success: true, skills: freshSkills, goals: freshGoals })
  } catch (err) {
    const message = err instanceof Error ? `${err.name}: ${err.message}\n${err.stack}` : String(err)
    console.error("DELETE log failed:", message)
    return NextResponse.json({ error: "Internal Server Error", detail: message }, { status: 500 })
  }
}
