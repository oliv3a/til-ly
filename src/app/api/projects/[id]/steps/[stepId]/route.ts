import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { processCheckin } from "@/lib/checkin"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; stepId: string }> }) {
  try {
    const { id, stepId } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id
    const project = await prisma.project.findUnique({ where: { id } })
    if (!project || project.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const { topic, isComplete, order, timezoneOffset } = await req.json()

    const { step, progressPct } = await prisma.$transaction(async (tx) => {
      const step = await tx.projectStep.update({
        where: { id: stepId },
        data: {
          ...(topic !== undefined ? { topic } : {}),
          ...(isComplete !== undefined ? { isComplete } : {}),
          ...(order !== undefined ? { order } : {}),
        },
      })

      const allSteps = await tx.projectStep.findMany({
        where: { projectId: id },
      })
      const total = allSteps.length
      const completed = allSteps.filter((s) => s.isComplete).length
      const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0

      await tx.project.update({
        where: { id },
        data: { progressPct },
      })

      return { step, progressPct }
    })

    if (isComplete) {
      processCheckin(userId, timezoneOffset).catch(() => {})
    }

    return NextResponse.json({ step, progressPct })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; stepId: string }> }) {
  try {
    const { id, stepId } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id
    const project = await prisma.project.findUnique({ where: { id } })
    if (!project || project.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const { progressPct, steps: freshSteps } = await prisma.$transaction(async (tx) => {
      await tx.projectStep.delete({ where: { id: stepId } })

      const allSteps = await tx.projectStep.findMany({
        where: { projectId: id },
        orderBy: { order: "asc" },
      })
      const total = allSteps.length
      const completed = allSteps.filter((s) => s.isComplete).length
      const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0

      for (let i = 0; i < allSteps.length; i++) {
        if (allSteps[i].order !== i + 1) {
          await tx.projectStep.update({ where: { id: allSteps[i].id }, data: { order: i + 1 } })
        }
      }

      await tx.project.update({
        where: { id },
        data: { progressPct },
      })

      const freshSteps = await tx.projectStep.findMany({
        where: { projectId: id },
        orderBy: { order: "asc" },
      })

      return { progressPct, steps: freshSteps }
    })

    return NextResponse.json({ progressPct, steps: freshSteps })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
