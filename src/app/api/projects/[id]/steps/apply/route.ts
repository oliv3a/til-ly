import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { extractChecklist } from "@/lib/ai"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id
    const project = await prisma.project.findUnique({ where: { id }, select: { userId: true, title: true } })
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (project.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { text } = await req.json()
    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    const steps = await extractChecklist(text.trim(), project.title)
    if (steps.length === 0) {
      return NextResponse.json({ error: "Couldn't extract any checklist steps from that text" }, { status: 422 })
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.projectStep.deleteMany({ where: { projectId: id } })
      await tx.projectStep.createMany({
        data: steps.map((topic, i) => ({
          projectId: id,
          order: i + 1,
          topic,
        })),
      })
      const savedSteps = await tx.projectStep.findMany({
        where: { projectId: id },
        orderBy: { order: "asc" },
      })
      const total = savedSteps.length
      const done = savedSteps.filter((s) => s.isComplete).length
      const progressPct = total > 0 ? Math.round((done / total) * 100) : 0
      await tx.project.update({ where: { id }, data: { progressPct } })
      return { steps: savedSteps, progressPct }
    })

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
