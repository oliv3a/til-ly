import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as any).id
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, bio: true, school: true, year: true },
  })

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(user)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as any).id
  const { name, bio, school, year } = await req.json()

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name: name || undefined,
      bio: bio || undefined,
      school: school || undefined,
      year: year || undefined,
    },
  })

  return NextResponse.json({ name: updated.name, bio: updated.bio, school: updated.school, year: updated.year })
}
