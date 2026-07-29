import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { mentorName: true, mentorOnboardingCompleted: true },
    })

    return NextResponse.json({
      completed: user?.mentorOnboardingCompleted ?? false,
      name: user?.mentorName ?? null,
    })
  } catch (err) {
    console.error("/api/mentor/onboarding GET error:", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { name, completed } = await req.json()

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        mentorName: typeof name === "string" ? name.trim() : undefined,
        mentorOnboardingCompleted: completed === true,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("/api/mentor/onboarding POST error:", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
