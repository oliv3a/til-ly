import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = session.user.id

    const goals = await prisma.goal.findMany({
      where: { userId, status: "active" },
      orderBy: { createdAt: "desc" },
      include: {
        roadmapItems: {
          orderBy: { order: "asc" },
          include: { _count: { select: { studyLogLinks: true } } },
        },
      },
    })

    return NextResponse.json({
      goals: goals.map((goal) => ({
        id: goal.id,
        title: goal.title,
        items: goal.roadmapItems.map((item) => ({
          id: item.id,
          topic: item.topic,
          logCount: item._count.studyLogLinks,
        })),
      })),
    })
  } catch (err) {
    console.error("Roadmap items GET failed:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
