import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, bio: true, school: true, year: true, isPublic: true },
    })

    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(user)
  } catch (err) {
    console.error("Profile GET failed:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id
    const { name, bio, school, year, isPublic } = await req.json()

    if (name && (typeof name !== "string" || name.trim().length < 1 || name.length > 100)) {
      return NextResponse.json({ error: "Name must be 1-100 characters" }, { status: 400 })
    }
    if (bio && typeof bio === "string" && bio.length > 500) {
      return NextResponse.json({ error: "Bio must be 500 characters or less" }, { status: 400 })
    }
    if (school && typeof school === "string" && school.length > 100) {
      return NextResponse.json({ error: "School must be 100 characters or less" }, { status: 400 })
    }
    if (year && typeof year === "string" && year.length > 50) {
      return NextResponse.json({ error: "Year must be 50 characters or less" }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        bio: bio || undefined,
        school: school || undefined,
        year: year || undefined,
        isPublic: typeof isPublic === "boolean" ? isPublic : undefined,
      },
    })

    return NextResponse.json({
      name: updated.name,
      bio: updated.bio,
      school: updated.school,
      year: updated.year,
      isPublic: updated.isPublic,
    })
  } catch (err) {
    console.error("Profile PATCH failed:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
