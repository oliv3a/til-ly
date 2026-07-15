import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id
    const project = await prisma.project.findUnique({ where: { id } })
    if (!project || project.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const { stepIds } = await req.json()
    if (!Array.isArray(stepIds)) {
      return NextResponse.json({ error: "stepIds array is required" }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < stepIds.length; i++) {
        await tx.projectStep.update({
          where: { id: stepIds[i] },
          data: { order: i + 1 },
        })
      }
    })

    const freshSteps = await prisma.projectStep.findMany({
      where: { projectId: id },
      orderBy: { order: "asc" },
    })

    return NextResponse.json({ steps: freshSteps })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
