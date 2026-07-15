import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateRoadmap } from "@/lib/ai"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id
    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { roadmapItems: { orderBy: { order: "asc" } } },
    })

    return NextResponse.json(goals)
  } catch (err) {
    console.error("Goals GET failed:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id
    const { title, description, targetDate, category } = await req.json()

    if (!title || (typeof title === "string" && title.trim().length < 1)) return NextResponse.json({ error: "Title required" }, { status: 400 })
    if (typeof title === "string" && title.length > 200) return NextResponse.json({ error: "Title must be 200 characters or less" }, { status: 400 })

    const goal = await prisma.goal.create({
      data: { userId, title, description, targetDate: targetDate ? new Date(targetDate) : null, category },
    })

    let roadmapItems: { topic: string; description: string; estimatedLogs: number }[] = []
    try {
      roadmapItems = await generateRoadmap(title, description || "")
    } catch (err) {
      console.error("Roadmap generation failed:", err)
    }

    if (roadmapItems.length > 0) {
      await prisma.roadmapItem.createMany({
        data: roadmapItems.map((item, i) => ({
          goalId: goal.id,
          order: i + 1,
          topic: item.topic,
          description: item.description,
          estimatedLogs: item.estimatedLogs,
        })),
      })
    }

    const goalWithRoadmap = await prisma.goal.findUnique({
      where: { id: goal.id },
      include: { roadmapItems: { orderBy: { order: "asc" } } },
    })

    return NextResponse.json(goalWithRoadmap)
  } catch (err) {
    console.error("Goals POST failed:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
