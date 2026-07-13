import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = (session.user as any).id
    const project = await prisma.project.findUnique({ where: { id } })
    if (!project || project.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const { topic } = await req.json()
    if (!topic?.trim()) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 })
    }

    const step = await prisma.$transaction(async (tx) => {
      const lastStep = await tx.projectStep.findFirst({
        where: { projectId: id },
        orderBy: { order: "desc" },
      })
      return tx.projectStep.create({
        data: { projectId: id, topic: topic.trim(), order: (lastStep?.order ?? 0) + 1 },
      })
    })

    return NextResponse.json(step)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
