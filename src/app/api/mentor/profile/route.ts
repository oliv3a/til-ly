import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const profile = await prisma.menteeProfile.findUnique({
      where: { userId: session.user.id },
    })

    return NextResponse.json({ profile })
  } catch (err) {
    console.error("/api/mentor/profile GET error:", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { targetRole, timeline, skillLevel, learningStyle, careerGoals, constraints } = body

    const profile = await prisma.menteeProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        targetRole: targetRole || null,
        timeline: timeline || null,
        skillLevel: skillLevel || null,
        learningStyle: learningStyle || null,
        careerGoals: careerGoals || null,
        constraints: constraints || null,
      },
      update: {
        targetRole: targetRole ?? undefined,
        timeline: timeline ?? undefined,
        skillLevel: skillLevel ?? undefined,
        learningStyle: learningStyle ?? undefined,
        careerGoals: careerGoals ?? undefined,
        constraints: constraints ?? undefined,
      },
    })

    return NextResponse.json({ profile })
  } catch (err) {
    console.error("/api/mentor/profile PUT error:", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
