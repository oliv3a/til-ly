import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateMentorOverview, type MentorContext } from "@/lib/ai"
import { getComputedSkills } from "@/lib/skills"
import { checkMilestones, getUnshownMilestones, markMilestonesShown } from "@/lib/milestones"
import type { MilestoneKey } from "@/lib/milestoneDefinitions"
import { runInsightEngine, SHOWN_PREFIX } from "@/lib/insightEngine"
import { generateJourneyRecap } from "@/lib/journeyRecap"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const tod = req.headers.get("x-tod") || req.nextUrl.searchParams.get("tod") || undefined
    const userId = session.user.id
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)
    const oneEightyDaysAgo = new Date(now.getTime() - 180 * 86400000)

    const [rawLogs, rawGoals, projects, skills, user, resume, recentLogsFull, olderLogs, allCheckins, allUserSkills] = await Promise.all([
      prisma.studyLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { skillTags: { include: { skill: true } } },
      }),
      prisma.goal.findMany({
        where: { userId, status: "active" },
        include: { roadmapItems: true },
      }),
      prisma.project.findMany({
        where: { userId, status: { not: "archived" } },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: { id: true, title: true, status: true, progressPct: true, updatedAt: true },
      }),
      getComputedSkills(userId),
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, streakCount: true, mentorName: true, mentorOnboardingCompleted: true, journeyRecapSeenAt: true } }),
      prisma.resume.findUnique({ where: { userId }, select: { id: true } }),
      prisma.studyLog.findMany({
        where: { userId, createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { skillTags: { include: { skill: true } } },
      }),
      prisma.studyLog.findMany({
        where: { userId, createdAt: { gte: oneEightyDaysAgo, lt: thirtyDaysAgo } },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { skillTags: { include: { skill: true } } },
      }),
      prisma.dailyCheckin.findMany({
        where: { userId, studied: true },
        select: { date: true },
        orderBy: { date: "desc" },
        take: 90,
      }),
      prisma.userSkill.findMany({
        where: { userId },
        select: { skill: { select: { name: true } } },
      }),
    ])

    const context: MentorContext = {
      name: user?.name || "there",
      mentorName: user?.mentorName || "Tilly",
      timeOfDay: tod,
      goals: rawGoals.map((g) => ({
        title: g.title,
        progressPct: g.roadmapItems.length > 0
          ? Math.round((g.roadmapItems.filter((r) => r.isComplete).length / g.roadmapItems.length) * 100)
          : null,
      })),
      recentLogs: rawLogs.map((l) => ({
        title: l.title,
        createdAt: l.createdAt,
        skills: l.skillTags.map((st) => st.skill.name),
      })),
      projects: projects.map((p) => ({ title: p.title, status: p.status, progressPct: p.progressPct })),
      skills: skills.map((s) => ({ name: s.skill.name, level: `${s.logCount} logs` })),
      streakCount: user?.streakCount ?? 0,
      hasResume: !!resume,
    }

    const overview = await generateMentorOverview(context)

    await checkMilestones(userId)

    // ── Journey Recap ────────────────────────────────────
    let journeyRecap: Awaited<ReturnType<typeof generateJourneyRecap>> | null = null
    let milestones: Awaited<ReturnType<typeof getUnshownMilestones>> = await getUnshownMilestones(userId)
    if (user?.mentorOnboardingCompleted && !user?.journeyRecapSeenAt) {
      const recap = await generateJourneyRecap(userId)
      if (recap.length > 0) {
        journeyRecap = recap
        milestones = []
      }
    }

    // ── Insight engine ───────────────────────────────────
    const skillCounts: Record<string, number> = {}
    for (const us of allUserSkills) {
      skillCounts[us.skill.name] = (skillCounts[us.skill.name] || 0) + 1
    }
    const allSkillNames = allUserSkills.map((us) => us.skill.name)

    const goalLogDates = await Promise.all(
      rawGoals.map(async (g) => {
        const link = await prisma.goalStudyLog.findFirst({
          where: { goalId: g.id },
          orderBy: { studyLog: { createdAt: "desc" } },
          select: { studyLog: { select: { createdAt: true } } },
        })
        return { id: g.id, lastLogDate: link?.studyLog.createdAt || null }
      })
    )

    const insightInput = {
      recentLogs: recentLogsFull.map((l) => ({
        id: l.id,
        title: l.title,
        createdAt: l.createdAt,
        skillNames: l.skillTags.map((st) => st.skill.name),
      })),
      olderLogs: olderLogs.map((l) => ({
        id: l.id,
        title: l.title,
        createdAt: l.createdAt,
        skillNames: l.skillTags.map((st) => st.skill.name),
      })),
      checkinDates: allCheckins.map((c) => c.date),
      streakCount: user?.streakCount ?? 0,
      goals: rawGoals.map((g) => {
        const pct = g.roadmapItems.length > 0
          ? Math.round((g.roadmapItems.filter((r) => r.isComplete).length / g.roadmapItems.length) * 100)
          : 0
        const ld = goalLogDates.find((x) => x.id === g.id)
        return { id: g.id, title: g.title, progressPct: pct, lastLogDate: ld?.lastLogDate || null }
      }),
      projects: projects.map((p) => ({ id: p.id, title: p.title, status: p.status, progressPct: p.progressPct || 0, updatedAt: p.updatedAt })),
      skillCounts,
      allSkillNames,
    }

    const insight = await runInsightEngine(insightInput, async () => {
      const records = await prisma.userMilestone.findMany({
        where: { userId, key: { startsWith: SHOWN_PREFIX } },
        select: { key: true },
      })
      return records.map((r) => r.key.replace(SHOWN_PREFIX, ""))
    })

    if (insight.text && insight.fingerprint) {
      await prisma.userMilestone.create({
        data: { userId, key: `${SHOWN_PREFIX}${insight.fingerprint}`, achievedAt: new Date() },
      }).catch(() => {})
    }

    const overviewWithInsight = { ...overview, insight: insight.text }

    return NextResponse.json({ overview: overviewWithInsight, context, milestones, journeyRecap }, { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } })
  } catch (err) {
    console.error("/api/mentor/overview error:", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const userId = session.user.id

    if (body.journeyRecapCompleted === true) {
      await prisma.user.update({
        where: { id: userId },
        data: { journeyRecapSeenAt: new Date() },
      })
      return NextResponse.json({ ok: true })
    }

    const { keys } = body
    if (Array.isArray(keys)) {
      await markMilestonesShown(userId, keys as MilestoneKey[])
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (err) {
    console.error("/api/mentor/overview POST error:", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
