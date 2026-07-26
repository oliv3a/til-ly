import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const conversations = await prisma.mentorConversation.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    })

    return NextResponse.json({ conversations })
  } catch (err) {
    console.error("/api/mentor/conversations GET error:", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const conversation = await prisma.mentorConversation.create({
      data: { userId: session.user.id },
    })

    return NextResponse.json({ conversation })
  } catch (err) {
    console.error("/api/mentor/conversations POST error:", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
