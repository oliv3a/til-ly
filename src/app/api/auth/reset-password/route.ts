import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
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

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { email: resetToken.email },
      data: { passwordHash },
    })

    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("reset-password error:", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
