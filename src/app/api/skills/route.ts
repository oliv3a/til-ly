import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getComputedSkills } from "@/lib/skills"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as any).id

  const skills = await getComputedSkills(userId)

  return NextResponse.json(skills)
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { name } = await req.json()
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Skill name is required" }, { status: 400 })
    }

    const normalized = name.trim().toLowerCase()
    const existing = await prisma.skill.findFirst({
      where: { name: { equals: normalized, mode: "insensitive" } },
    })
    if (existing) {
      return NextResponse.json({ error: `Skill "${existing.name}" already exists` }, { status: 409 })
    }

    const skill = await prisma.skill.create({
      data: { name: normalized, category: "Other" },
    })

    return NextResponse.json(skill)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
