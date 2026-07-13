import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getComputedSkills } from "@/lib/skills"

export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params
    const session = await auth()
    if (!session?.user || (session.user as any).id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { edits } = await req.json()
    if (!Array.isArray(edits)) {
      return NextResponse.json({ error: "edits must be an array" }, { status: 400 })
    }

    for (const edit of edits) {
      const { action, skillName, logCount } = edit
      if (!skillName || !skillName.trim()) continue
      const normalized = skillName.trim().toLowerCase()

      let skill = await prisma.skill.findFirst({
        where: { name: { equals: normalized, mode: "insensitive" } },
      })

      if (action === "delete") {
        if (skill) {
          await prisma.studyLogSkill.deleteMany({
            where: { studyLog: { userId }, skillId: skill.id },
          })
          await prisma.userSkill.deleteMany({
            where: { userId, skillId: skill.id },
          })
        }
      } else if (action === "upsert") {
        if (!skill) {
          skill = await prisma.skill.create({
            data: { name: normalized, category: "Other" },
          })
        }
        await prisma.userSkill.upsert({
          where: { userId_skillId: { userId, skillId: skill.id } },
          update: { manualLogCount: Math.max(1, logCount ?? 1) },
          create: {
            userId,
            skillId: skill.id,
            manualLogCount: Math.max(1, logCount ?? 1),
            level: "beginner",
            xp: 0,
          },
        })
      }
    }

    const skills = await getComputedSkills(userId)
    return NextResponse.json({ skills })
  } catch (err) {
    console.error("Portfolio skills PATCH failed:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
