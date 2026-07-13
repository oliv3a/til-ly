import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { name } = await req.json()
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Skill name is required" }, { status: 400 })
    }

    const normalized = name.trim().toLowerCase()
    const existing = await prisma.skill.findFirst({
      where: { name: { equals: normalized, mode: "insensitive" }, id: { not: id } },
    })
    if (existing) {
      return NextResponse.json({ error: `A skill named "${existing.name}" already exists` }, { status: 409 })
    }

    const skill = await prisma.skill.update({
      where: { id },
      data: { name: normalized },
    })

    return NextResponse.json(skill)
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

    await prisma.skill.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
