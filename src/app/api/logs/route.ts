import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { processCheckin } from "@/lib/checkin"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id
    const { searchParams } = req.nextUrl
    const search = searchParams.get("search")?.trim()
    const skillId = searchParams.get("skill")
    const sort = searchParams.get("sort") || "newest"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)))
    const skip = (page - 1) * limit

    const where: Prisma.StudyLogWhereInput = { userId }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ]
    }

    if (skillId) {
      where.skillTags = { some: { skillId } }
    }

    const orderBy = sort === "oldest" ? { createdAt: "asc" as const } : { createdAt: "desc" as const }

    const [rawLogs, total] = await Promise.all([
      prisma.studyLog.findMany({
        where,
        orderBy,
        skip,
        take: limit + 1,
        include: {
          files: true,
          skillTags: { include: { skill: true } },
          goalLinks: { include: { goal: { select: { id: true, title: true } } } },
        },
      }),
      prisma.studyLog.count({ where }),
    ])

    const hasMore = rawLogs.length > limit
    if (hasMore) rawLogs.pop()

    return NextResponse.json({ logs: rawLogs, hasMore, total, page, limit })
  } catch (err) {
    console.error("Logs GET failed:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id
    const { title, content, fileUrls, roadmapItemIds, timezoneOffset } = await req.json()

    if (!title || (typeof title === "string" && title.trim().length < 1)) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }
    if (typeof title === "string" && title.length > 200) {
      return NextResponse.json({ error: "Title must be 200 characters or less" }, { status: 400 })
    }

    const log = await prisma.studyLog.create({
      data: {
        userId,
        title,
        content: content || "",
        type: fileUrls?.length ? "both" : "text",
        files: fileUrls?.length
          ? {
              create: fileUrls.map((f: { url: string; type: string; name: string; extractedText?: string | null; filePath?: string | null }) => ({
                fileUrl: f.url,
                fileType: f.type,
                fileName: f.name,
                filePath: f.filePath || null,
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
