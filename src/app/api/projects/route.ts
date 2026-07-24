import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id

    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { updates: true, steps: true } },
        steps: { orderBy: { order: "asc" } },
      },
    })

    return NextResponse.json(projects)
  } catch (err) {
    console.error("Projects GET failed:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id
    const { title, description, techStack, repoUrl, fileUrls } = await req.json()

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }
    if (title.length > 200) {
      return NextResponse.json({ error: "Title must be 200 characters or less" }, { status: 400 })
    }

    const project = await prisma.project.create({
      data: {
        userId,
        title: title.trim(),
        description: description || null,
        techStack: techStack || null,
        repoUrl: repoUrl || null,
        files: fileUrls?.length
          ? { create: fileUrls.map((f: { url: string; type: string; name: string; extractedText?: string | null; filePath?: string | null }) => ({
              fileUrl: f.url,
              fileType: f.type,
              fileName: f.name,
              filePath: f.filePath || null,
              extractedText: f.extractedText || null,
            })) }
          : undefined,
      },
      include: { files: true, steps: true, updates: true },
    })

    return NextResponse.json(project)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
