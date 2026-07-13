import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const goal = await prisma.goal.findUnique({ where: { id } })
  if (!goal || goal.userId !== (session.user as any).id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const updated = await prisma.goal.update({
    where: { id },
    data: {
      title: body.title ?? undefined,
      description: body.description ?? undefined,
      targetDate: body.targetDate ? new Date(body.targetDate) : undefined,
      category: body.category ?? undefined,
      status: body.status ?? undefined,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const goal = await prisma.goal.findUnique({ where: { id } })
  if (!goal || goal.userId !== (session.user as any).id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.goal.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
