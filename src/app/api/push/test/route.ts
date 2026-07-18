import { NextResponse } from "next/server"
import webpush from "web-push"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!process.env.VAPID_SUBJECT || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 })
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )

  const userId = session.user.id
  const subs = await prisma.pushSubscription.findMany({ where: { userId } })

  if (subs.length === 0) {
    return NextResponse.json({ error: "No push subscription found. Visit the dashboard first to subscribe." }, { status: 400 })
  }

  const results: { endpoint: string; ok: boolean; error?: string }[] = []

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          title: "til.ly",
          body: "Test notification — push is working! 🎉",
          url: "/dashboard",
        }),
      )
      results.push({ endpoint: sub.endpoint.slice(0, 30), ok: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      results.push({ endpoint: sub.endpoint.slice(0, 30), ok: false, error: message })
    }
  }

  return NextResponse.json({ sent: results })
}
