import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { targetSkillId } = await req.json()
    if (!targetSkillId) {
      return NextResponse.json({ error: "targetSkillId is required" }, { status: 400 })
    }
    if (targetSkillId === id) {
      return NextResponse.json({ error: "Cannot merge a skill into itself" }, { status: 400 })
    }

    const [source, target] = await Promise.all([
      prisma.skill.findUnique({ where: { id } }),
      prisma.skill.findUnique({ where: { id: targetSkillId } }),
    ])
    if (!source) return NextResponse.json({ error: "Source skill not found" }, { status: 404 })
    if (!target) return NextResponse.json({ error: "Target skill not found" }, { status: 404 })

    await prisma.$transaction(async (tx) => {
      const studyLogSkills = await tx.studyLogSkill.findMany({
        where: { skillId: id },
        select: { id: true, studyLogId: true },
      })

      for (const sls of studyLogSkills) {
        const exists = await tx.studyLogSkill.findUnique({
          where: {
            studyLogId_skillId: { studyLogId: sls.studyLogId, skillId: targetSkillId },
          },
        })
        if (!exists) {
          await tx.studyLogSkill.update({
            where: { id: sls.id },
            data: { skillId: targetSkillId },
          })
        } else {
          await tx.studyLogSkill.delete({ where: { id: sls.id } })
        }
      }

      await tx.skill.delete({ where: { id } })
    })

    const updatedCount = await prisma.studyLogSkill.count({
      where: { skillId: targetSkillId },
    })

    return NextResponse.json({
      success: true,
      mergedInto: target.name,
      target: { id: `merged_${target.id}`, logCount: updatedCount, skill: { id: target.id, name: target.name, category: target.category } },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
