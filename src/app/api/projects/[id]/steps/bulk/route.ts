import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id
    const project = await prisma.project.findUnique({ where: { id }, select: { userId: true } })
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (project.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { items } = await req.json()
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items array is required" }, { status: 400 })
    }

    const validated = items.map((item: { topic?: string }, i: number) => {
      if (!item.topic || typeof item.topic !== "string") throw new Error(`Item ${i}: topic is required`)
      return { topic: item.topic.trim() }
    })

    const result = await prisma.$transaction(async (tx) => {
      await tx.projectStep.deleteMany({ where: { projectId: id } })
      await tx.projectStep.createMany({
        data: validated.map((item: { topic: string }, i: number) => ({
          projectId: id,
          order: i + 1,
          topic: item.topic,
        })),
      })
      const steps = await tx.projectStep.findMany({
        where: { projectId: id },
        orderBy: { order: "asc" },
      })
      const total = steps.length
      const done = steps.filter((s) => s.isComplete).length
      const progressPct = total > 0 ? Math.round((done / total) * 100) : 0
      await tx.project.update({ where: { id }, data: { progressPct } })
      return { steps, progressPct }
    })

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
