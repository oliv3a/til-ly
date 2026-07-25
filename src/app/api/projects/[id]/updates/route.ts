import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { reviewProjectUpdate } from "@/lib/ai"
import { processCheckin } from "@/lib/checkin"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const project = await prisma.project.findUnique({
      where: { id },
      include: { files: true, steps: { orderBy: { order: "asc" } } },
    })
    if (!project || project.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const { content, fileUrls, timezoneOffset } = await req.json()
    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Run AI analysis
    const codeFiles = (fileUrls || []).filter(
      (f: { extractedText?: string | null }) => f.extractedText,
    )
    const aiResult = await reviewProjectUpdate(
      {
        title: project.title,
        description: project.description || undefined,
        techStack: project.techStack || undefined,
        files: codeFiles.map((f: { name: string; extractedText: string }) => ({ name: f.name, content: f.extractedText })),
      },
      content,
      project.aiOverallFeedback || undefined,
    )

    processCheckin(session.user.id, timezoneOffset).catch(() => {})

    // Create the update
    const update = await prisma.projectUpdate.create({
      data: {
        projectId: id,
        content: content.trim(),
        aiComment: aiResult.comment || null,
        onTrack: aiResult.onTrack,
      },
    })

    // Recalculate progressPct
    const allSteps = await prisma.projectStep.findMany({
      where: { projectId: id },
    })
    const total = allSteps.length
    const completed = allSteps.filter((s) => s.isComplete).length
    const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0

    // Update progress; only set overall feedback if project had none before
    await prisma.project.update({
      where: { id },
      data: {
        ...(project.aiOverallFeedback ? {} : { aiOverallFeedback: aiResult.comment || undefined }),
        progressPct,
      },
    })

    const updatedProject = await prisma.project.findUnique({
      where: { id },
      include: {
        files: true,
        steps: { orderBy: { order: "asc" } },
        updates: { orderBy: { createdAt: "desc" } },
      },
    })

    return NextResponse.json({ update, project: updatedProject })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
