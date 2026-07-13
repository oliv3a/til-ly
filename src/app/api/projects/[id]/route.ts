import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        files: true,
        steps: { orderBy: { order: "asc" } },
        updates: { orderBy: { createdAt: "desc" } },
      },
    })

    if (!project || project.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const project = await prisma.project.findUnique({ where: { id } })
    if (!project || project.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const { title, description, techStack, repoUrl, status, notes } = await req.json()

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(techStack !== undefined ? { techStack } : {}),
        ...(repoUrl !== undefined ? { repoUrl } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
      include: { files: true, steps: { orderBy: { order: "asc" } }, updates: { orderBy: { createdAt: "desc" } } },
    })

    return NextResponse.json(updated)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const project = await prisma.project.findUnique({ where: { id } })
    if (!project || project.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.project.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
