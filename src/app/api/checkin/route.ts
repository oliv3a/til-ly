import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { processCheckin } from "@/lib/checkin"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = (session.user as any).id
    const { timezoneOffset } = await req.json().catch(() => ({}))

    const result = await processCheckin(userId, timezoneOffset)

    if (result.alreadyCheckedIn) {
      return NextResponse.json({ message: "Already checked in today" })
    }

    return NextResponse.json({ streak: result.streak })
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
