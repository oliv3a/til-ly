import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id
    const { endpoint, keys } = await req.json()

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh: keys.p256dh, auth: keys.auth, userId },
      create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Push subscribe failed:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
