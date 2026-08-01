import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { dbRateLimit, HOUR_MS } from "@/lib/db-rate-limit"

const FEEDBACK_LIMIT = 10

function isAdmin(sessionEmail: string | null | undefined) {
  return (
    !!sessionEmail &&
    !!process.env.ADMIN_EMAIL &&
    sessionEmail.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()
  )
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { message, isAnonymous } = await req.json()

    if (typeof message !== "string" || message.trim().length < 1) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: "Message must be 2000 characters or less" }, { status: 400 })
    }

    const { allowed } = await dbRateLimit(`feedback:${session.user.id}`, FEEDBACK_LIMIT, HOUR_MS)
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429 },
      )
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId: session.user.id,
        message: message.trim(),
        isAnonymous: isAnonymous === true,
      },
    })

    return NextResponse.json({ id: feedback.id }, { status: 201 })
  } catch (err) {
    console.error("Feedback POST failed:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const feedback = await prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        message: true,
        isAnonymous: true,
        status: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    })

    return NextResponse.json(feedback)
  } catch (err) {
    console.error("Feedback GET failed:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id, status, reveal } = await req.json()
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Feedback id is required" }, { status: 400 })
    }

    if (reveal === true) {
      const updated = await prisma.feedback.update({
        where: { id },
        data: { isAnonymous: false },
      })
      return NextResponse.json({ id: updated.id, isAnonymous: updated.isAnonymous })
    }

    if (status === "new" || status === "resolved") {
      const updated = await prisma.feedback.update({
        where: { id },
        data: { status },
      })
      return NextResponse.json({ id: updated.id, status: updated.status })
    }

    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  } catch (err) {
    console.error("Feedback PATCH failed:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
