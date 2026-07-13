import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getComputedSkills } from "@/lib/skills"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const skill = searchParams.get("skill")
  const name = searchParams.get("name")

  let userIds: string[] = []

  if (skill) {
    const matching = await prisma.studyLogSkill.findMany({
      where: { skill: { name: { contains: skill, mode: "insensitive" } } },
      select: { studyLog: { select: { userId: true } } },
      distinct: ["studyLogId"],
    })
    userIds = [...new Set(matching.map((m) => m.studyLog.userId))]
  }

  const users = await prisma.user.findMany({
    where: {
      role: "student",
      ...(name ? { name: { contains: name, mode: "insensitive" } } : {}),
      ...(skill ? { id: { in: userIds } } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      bio: true,
      school: true,
      year: true,
      streakCount: true,
    },
    take: 50,
  })

  const usersWithSkills = await Promise.all(
    users.map(async (u) => ({
      ...u,
      userSkills: await getComputedSkills(u.id),
    })),
  )

  return NextResponse.json(usersWithSkills)
}
