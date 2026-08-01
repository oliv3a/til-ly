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

    const existing = await prisma.pushSubscription.findUnique({ where: { endpoint } })

    if (existing && existing.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (existing) {
      await prisma.pushSubscription.update({
        where: { endpoint },
        data: { p256dh: keys.p256dh, auth: keys.auth },
      })
    } else {
      await prisma.pushSubscription.create({
        data: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId },
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Push subscribe failed:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
