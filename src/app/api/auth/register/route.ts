import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { dbRateLimit, clientIp, MINUTE_MS } from "@/lib/db-rate-limit"

export async function POST(req: Request) {
  try {
    const { allowed } = await dbRateLimit(`register:${clientIp(req)}`, 3, MINUTE_MS)
    if (!allowed) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 })
    }

    const { name, email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 })
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

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) {
      return NextResponse.json({ error: "An account with this email already exists. Try logging in instead." }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.user.create({
      data: { name, email, passwordHash, role: "student" },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
