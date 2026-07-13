import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const log = await prisma.studyLog.findUnique({ where: { id } })
    if (!log || log.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { name } = await req.json()
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Skill name is required" }, { status: 400 })
    }

    const normalized = name.trim().toLowerCase()
    let skill = await prisma.skill.findFirst({
      where: { name: { equals: normalized, mode: "insensitive" } },
    })
    if (!skill) {
      skill = await prisma.skill.create({
        data: { name: normalized, category: "Other" },
      })
    }

    const existing = await prisma.studyLogSkill.findUnique({
      where: { studyLogId_skillId: { studyLogId: id, skillId: skill.id } },
    })
    if (existing) {
      const skillTags = await prisma.studyLogSkill.findMany({
        where: { studyLogId: id },
        include: { skill: true },
      })
      return NextResponse.json({ skillTags })
    }

    await prisma.studyLogSkill.create({
      data: { studyLogId: id, skillId: skill.id, xp: 0 },
    })

    const skillTags = await prisma.studyLogSkill.findMany({
      where: { studyLogId: id },
      include: { skill: true },
    })

    return NextResponse.json({ skillTags })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
