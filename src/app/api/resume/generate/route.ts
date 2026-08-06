import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateResume, normalizeResumeData } from "@/lib/resume/generator"
import { analyzeATS } from "@/lib/resume/ats-analyzer"
import type { ResumeData, TargetRole, ResumeApiResponse, ResumeQuestionnaire } from "@/lib/resume/types"
import { dbRateLimit, aiDailyKey, DAILY_MS } from "@/lib/db-rate-limit"

const CACHE_TTL_MS = 60 * 60 * 1000

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { allowed } = await dbRateLimit(aiDailyKey(session.user.id, "resume"), 20, DAILY_MS)
    if (!allowed) {
      return NextResponse.json({ error: "Daily resume generation limit reached. Try again tomorrow." }, { status: 429 })
    }

    const userId = session.user.id
    const body = await req.json()
    const targetRole: TargetRole = body.targetRole || "full-stack"
    const refresh = body.refresh === true
    const customRoleTitle: string | undefined = body.customRoleTitle

    const hasDynamicInput = !!(body.uploadedResumeText || body.extraNotes)

    if (!refresh && !hasDynamicInput) {
      const cached = await prisma.resume.findUnique({
        where: { userId },
      })

      if (cached && cached.targetRole === targetRole) {
        const age = Date.now() - cached.updatedAt.getTime()
        if (age < CACHE_TTL_MS) {
          let data: ResumeData
          let ats: ReturnType<typeof analyzeATS>

          try {
            data = normalizeResumeData(JSON.parse(cached.content) as ResumeData)
            ats = cached.atsData
              ? (JSON.parse(cached.atsData) as ReturnType<typeof analyzeATS>)
              : analyzeATS(data, targetRole)
          } catch {
            await prisma.resume.delete({ where: { userId } })
            return generateFresh(userId, targetRole, customRoleTitle, body)
          }

          const response: ResumeApiResponse = { data, ats, cached: true }
          return NextResponse.json(response)
        }
      }
    }

    return generateFresh(userId, targetRole, customRoleTitle, body)
  } catch (err) {
    console.error("Resume generation failed:", err)
    return NextResponse.json(
      { error: "Failed to generate resume. Please try again." },
      { status: 500 },
    )
  }
}

async function generateFresh(
  userId: string,
  targetRole: TargetRole,
  customRoleTitle?: string,
  body?: Record<string, unknown>,
) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://til-ly.vercel.app"
  const portfolioUrl = `${baseUrl}/portfolio/${userId}`

  const questionnaire: ResumeQuestionnaire = {
    targetRole,
    customRoleTitle,
    experienceYears: body?.experienceYears as string | undefined,
    githubUrl: body?.githubUrl as string | undefined,
    linkedinUrl: body?.linkedinUrl as string | undefined,
    emphasizeTech: body?.emphasizeTech as string | undefined,
    resumeLength: body?.resumeLength as "one-page" | "two-page" | undefined,
    uploadedResumeText: body?.uploadedResumeText as string | undefined,
    extraNotes: body?.extraNotes as string | undefined,
  }

  const qForPrompt = {
    experienceYears: questionnaire.experienceYears,
    githubUrl: questionnaire.githubUrl,
    linkedinUrl: questionnaire.linkedinUrl,
    portfolioUrl,
    emphasizeTech: questionnaire.emphasizeTech,
    resumeLength: questionnaire.resumeLength,
    uploadedResumeText: questionnaire.uploadedResumeText,
    extraNotes: questionnaire.extraNotes,
  }

  const data = await generateResume(userId, targetRole, customRoleTitle, qForPrompt)
  const ats = analyzeATS(data, targetRole)

  await prisma.resume.upsert({
    where: { userId },
    create: {
      userId,
      targetRole,
      content: JSON.stringify(data),
      atsData: JSON.stringify(ats),
    },
    update: {
      targetRole,
      content: JSON.stringify(data),
      atsData: JSON.stringify(ats),
      updatedAt: new Date(),
    },
  })

  const response: ResumeApiResponse = { data, ats, cached: false }
  return NextResponse.json(response)
}
