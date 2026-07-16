import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { reviewCode } from "@/lib/ai"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { code, fileName } = await req.json()
    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 })
    }

    const result = await reviewCode(code, fileName)
    return NextResponse.json(result)
  } catch (err) {
    console.error("/api/code-review error:", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
