import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { processCheckin } from "@/lib/checkin"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as any).id

  const logs = await prisma.studyLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      files: true,
      skillTags: { include: { skill: true } },
      goalLinks: { include: { goal: { select: { id: true, title: true } } } },
    },
  })

  return NextResponse.json(logs)
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = (session.user as any).id
    const { title, content, fileUrls, roadmapItemIds, timezoneOffset } = await req.json()

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const log = await prisma.studyLog.create({
      data: {
        userId,
        title,
        content: content || "",
        type: fileUrls?.length ? "both" : "text",
        files: fileUrls?.length
          ? {
              create: fileUrls.map((f: { url: string; type: string; name: string; extractedText?: string | null }) => ({
                fileUrl: f.url,
                fileType: f.type,
                fileName: f.name,
                extractedText: f.extractedText || null,
              })),
            }
          : undefined,
        ...(Array.isArray(roadmapItemIds) && roadmapItemIds.length > 0
          ? { roadmapLinks: { create: roadmapItemIds.map((id: string) => ({ roadmapItemId: id })) } }
          : {}),
      },
    })

    processCheckin(userId, timezoneOffset).catch(() => {})

    return NextResponse.json({
      userId,
      log: {
        id: log.id,
        userId,
        title: log.title,
        content: log.content,
        type: log.type,
        aiSummary: null,
        createdAt: log.createdAt,
      },
    })
  } catch (err) {
    console.error("Log creation failed:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
