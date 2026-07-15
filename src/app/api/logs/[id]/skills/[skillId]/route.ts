import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getLevelForXp } from "@/lib/skill-engine"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; skillId: string }> }) {
  try {
    const { id, skillId } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id
    const log = await prisma.studyLog.findUnique({ where: { id } })
    if (!log || log.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const link = await prisma.studyLogSkill.findUnique({ where: { id: skillId } })
    if (!link || link.studyLogId !== id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const removedSkillId = link.skillId

    await prisma.studyLogSkill.delete({ where: { id: skillId } })

    // Recalculate XP for the affected skill from remaining records
    const remainingXp = await prisma.studyLogSkill.aggregate({
      where: { skillId: removedSkillId, studyLog: { userId } },
      _sum: { xp: true },
    })
    const totalXp = remainingXp._sum.xp ?? 0

    await prisma.userSkill.upsert({
      where: { userId_skillId: { userId, skillId: removedSkillId } },
      create: { userId, skillId: removedSkillId, xp: totalXp, level: getLevelForXp(totalXp) },
      update: { xp: totalXp, level: getLevelForXp(totalXp) },
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
