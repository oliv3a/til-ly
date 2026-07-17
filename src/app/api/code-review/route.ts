import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { codeChat } from "@/lib/ai"

const MAX_MESSAGES = 20

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { mode, code, fileName, messages } = await req.json()

    if (mode !== "review" && mode !== "chat") {
      return NextResponse.json({ error: "Mode must be 'review' or 'chat'" }, { status: 400 })
    }

    if (mode === "review" && !code?.trim()) {
      return NextResponse.json({ error: "Code is required for review mode" }, { status: 400 })
    }

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 })
    }

    const userMessageCount = messages.filter((m: { role: string }) => m.role === "user").length + 1
    if (userMessageCount > MAX_MESSAGES) {
      return NextResponse.json({
        type: "limit",
        messageCount: userMessageCount,
        limit: MAX_MESSAGES,
      })
    }

    const isFirstReview = mode === "review" && messages.length === 0

    const result = await codeChat({ mode, code, fileName, messages, isFirstReview })

    return NextResponse.json({
      ...result,
      messageCount: userMessageCount,
      limit: MAX_MESSAGES,
    })
  } catch (err) {
    console.error("/api/code-review error:", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
