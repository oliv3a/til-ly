import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateProjectSteps } from "@/lib/ai"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const project = await prisma.project.findUnique({
      where: { id },
      include: { steps: { orderBy: { order: "asc" } } },
    })
    if (!project || project.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const { level } = await req.json()

    const recentUpdates = await prisma.projectUpdate.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { content: true },
    })

    const suggestions = await generateProjectSteps(
      {
        title: project.title,
        description: project.description || undefined,
        techStack: project.techStack || undefined,
      },
      recentUpdates.map((u) => u.content || "").filter(Boolean),
      project.steps.map((s) => s.topic),
      level || "intermediate",
    )

    const { steps: allSteps, progressPct, created } = await prisma.$transaction(async (tx) => {
      if (suggestions.length === 0) {
        const steps = project.steps
        const completed = steps.filter((s) => s.isComplete).length
        const pct = steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0
        return { steps, progressPct: pct, created: [] as string[] }
      }

      const existingTopics = new Set(project.steps.map((s) => s.topic.toLowerCase()))
      const maxStep = await tx.projectStep.findFirst({
        where: { projectId: id },
        orderBy: { order: "desc" },
      })
      let order = maxStep?.order ?? project.steps.length
      const created: string[] = []

      for (const topic of suggestions) {
        if (!existingTopics.has(topic.toLowerCase())) {
          order++
          await tx.projectStep.create({
            data: { projectId: id, topic, order, isComplete: false },
          })
          existingTopics.add(topic.toLowerCase())
          created.push(topic)
        }
      }

      const allSteps = await tx.projectStep.findMany({
        where: { projectId: id },
        orderBy: { order: "asc" },
      })
      const total = allSteps.length
      const completed = allSteps.filter((s) => s.isComplete).length
      const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0

      await tx.project.update({
        where: { id },
        data: { progressPct },
      })

      return { steps: allSteps, progressPct, created }
    })

    return NextResponse.json({ steps: allSteps, progressPct, created, message: `${created.length} step(s) added` })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
