import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { dbRateLimit, clientIp, HOUR_MS } from "@/lib/db-rate-limit"

export async function POST(req: Request) {
  try {
    const { allowed } = await dbRateLimit(`reset-ip:${clientIp(req)}`, 10, HOUR_MS)
    if (!allowed) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 })
    }

    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    if (password.length > 72) {
      return NextResponse.json({ error: "Password must be 72 characters or less" }, { status: 400 })
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json({ error: "Password must contain an uppercase letter" }, { status: 400 })
    }

    if (!/[0-9]/.test(password)) {
      return NextResponse.json({ error: "Password must contain a number" }, { status: 400 })
    }

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } })

    if (!resetToken) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 })
    }

    if (resetToken.usedAt) {
      return NextResponse.json({ error: "This reset link has already been used" }, { status: 400 })
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: "This reset link has expired" }, { status: 400 })
    }

    const email = resetToken.email
    const emailLimit = await dbRateLimit(`reset-email:${email.toLowerCase()}`, 5, HOUR_MS)
    if (!emailLimit.allowed) {
      return NextResponse.json({ error: "Too many attempts for this account. Try again later." }, { status: 429 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { email },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    })

    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    })

    await prisma.passwordResetToken.deleteMany({
      where: { email, usedAt: null },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("reset-password error:", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
