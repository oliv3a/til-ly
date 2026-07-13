import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = (session.user as any).id

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
}
