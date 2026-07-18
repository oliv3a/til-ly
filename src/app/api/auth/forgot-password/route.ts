import { NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { resend, RESEND_FROM } from "@/lib/email"
import { rateLimit } from "@/lib/rate-limiter"

export async function POST(req: Request) {
  try {
    const { allowed } = rateLimit(req, 5, 60_000)
    if (!allowed) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 })
    }

    const { email } = await req.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ message: "If that email exists, a reset link has been sent." })
    }

    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.passwordResetToken.create({
      data: { email, token, expiresAt },
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.RESET_URL || "http://localhost:3000"
    const resetUrl = `${baseUrl}/auth/reset-password/${token}`

    if (resend) {
      await resend.emails.send({
        from: RESEND_FROM,
        to: email,
        subject: "Reset your til.ly password",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Reset your password</h2>
            <p>Click the link below to reset your til.ly password. This link expires in 1 hour.</p>
            <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#E07060;color:#fff;text-decoration:none;border-radius:4px;">
              Reset password
            </a>
            <p style="margin-top:24px;color:#666;font-size:14px;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
      })
    }

    return NextResponse.json({ message: "If that email exists, a reset link has been sent." })
  } catch (err) {
    console.error("forgot-password error:", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
