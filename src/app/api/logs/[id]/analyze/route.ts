import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { summarizeStudyLog, analyzeCode, matchLogToRoadmap, type AiExtractResult } from "@/lib/ai"

async function withRetry<T>(fn: () => Promise<T>, label: string, retries = 3): Promise<T | null> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err) {
      console.error(`${label} attempt ${i + 1}/${retries} failed:`, err)
      if (i < retries - 1) await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
    }
  }
  return null
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id
    const log = await prisma.studyLog.findUnique({
      where: { id },
      include: { files: true },
    })
    if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (log.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    let aiSummary = ""
    let aiSkills: AiExtractResult["skills"] = []
    let recommendation: string | undefined

    const codeFiles = log.files.filter((f) => f.extractedText)
    if (codeFiles.length > 0) {
      const codeResult = await withRetry(() => analyzeCode(
        codeFiles.map((f) => ({ name: f.fileName, content: f.extractedText! })),
      ), "analyzeCode")
      if (codeResult && codeResult.isValid && codeResult.bulletpoints.length > 0) {
        const bulletStr = codeResult.bulletpoints.map((b) => `  • ${b}`).join("\n")
        aiSummary = bulletStr
        aiSkills = codeResult.skills || []
      }
    }

    if (log.content || !aiSummary) {
      try {
        const textToAnalyze = log.content || log.title
        const textResult: AiExtractResult | null = await withRetry(async () => {
          const existingSkillNames = (await prisma.skill.findMany({
            select: { name: true },
          })).map((s) => s.name)
          return summarizeStudyLog(textToAnalyze, undefined, existingSkillNames)
        }, "summarizeStudyLog")
        if (textResult) {
          if (textResult.summary) {
            const combined = textResult.motivation
              ? `${textResult.summary}\n\n—\n💡 ${textResult.motivation}`
              : textResult.summary
            aiSummary = aiSummary ? `${combined}\n\n${aiSummary}` : combined
          }
          if (textResult.skills?.length) {
            const existingNames = new Set(aiSkills.map((s) => s.name.toLowerCase()))
            for (const s of textResult.skills) {
              if (!existingNames.has(s.name.toLowerCase())) {
                aiSkills.push(s)
                existingNames.add(s.name.toLowerCase())
              }
            }
          }
          if (textResult.nextRecommendation) recommendation = textResult.nextRecommendation
        }
      } catch (err) {
        console.error("Text AI analysis failed:", err)
      }
    }

    await prisma.studyLog.update({
      where: { id: log.id },
      data: { aiSummary: aiSummary || null },
    })

    if (aiSkills?.length) {
      const skillEntries: { studyLogId: string; skillId: string; xp: number }[] = []
      for (const skill of aiSkills) {
        const normalized = skill.name.trim().toLowerCase()
        let skillRecord = await prisma.skill.findFirst({
          where: { name: { equals: normalized, mode: "insensitive" } },
        })
        if (!skillRecord) {
          skillRecord = await prisma.skill.create({
            data: { name: normalized, category: skill.category || "Other" },
          })
        }
        skillEntries.push({ studyLogId: log.id, skillId: skillRecord.id, xp: 0 })
      }
      await prisma.studyLogSkill.createMany({ data: skillEntries, skipDuplicates: true })
    }

    let matchedRoadmapItems: { itemId: string; goalId: string; topic: string; goalTitle: string }[] = []
    try {
      const goals = await prisma.goal.findMany({
        where: { userId, status: "active" },
        include: {
          roadmapItems: { where: { isComplete: false }, orderBy: { order: "asc" } },
        },
      })
      const items = goals.flatMap((g) =>
        g.roadmapItems.map((ri) => ({
          goalId: g.id,
          goalTitle: g.title,
          itemId: ri.id,
          topic: ri.topic,
        })),
      )
      if (items.length > 0) {
        const textToMatch = log.content || log.title
        const match = await withRetry(() => matchLogToRoadmap(textToMatch, items), "matchLogToRoadmap")
        if (match?.matches && match.matches.length > 0) {
          await prisma.studyLogRoadmapItem.createMany({
            data: match.matches.map((m) => ({
              studyLogId: log.id,
              roadmapItemId: m.itemId,
            })),
            skipDuplicates: true,
          })
          matchedRoadmapItems = match.matches
            .map((m) => {
              const goal = goals.find((g) => g.id === m.goalId)
              const item = goal?.roadmapItems.find((ri) => ri.id === m.itemId)
              return goal && item
                ? { itemId: m.itemId, goalId: m.goalId, topic: item.topic, goalTitle: goal.title }
                : null
            })
            .filter(Boolean) as { itemId: string; goalId: string; topic: string; goalTitle: string }[]
        }
      }
    } catch (err) {
      console.error("AI roadmap matching failed:", err)
    }

    return NextResponse.json({
      aiSummary: aiSummary || null,
      recommendation,
      skills: aiSkills,
      matchedRoadmapItems,
    })
  } catch (err) {
    console.error("Log analysis failed:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
