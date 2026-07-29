import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateMentorOverview, type MentorContext } from "@/lib/ai"
import { getComputedSkills } from "@/lib/skills"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const [rawLogs, rawGoals, rawProjects, skills, user, resume, profile] = await Promise.all([
      prisma.studyLog.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { skillTags: { include: { skill: true } } },
      }),
      prisma.goal.findMany({
        where: { userId: session.user.id, status: "active" },
        include: { roadmapItems: { orderBy: { order: "asc" } } },
      }),
      prisma.project.findMany({
        where: { userId: session.user.id, status: { not: "archived" } },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: { steps: { orderBy: { order: "asc" } } },
      }),
      getComputedSkills(session.user.id),
      prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, streakCount: true } }),
      prisma.resume.findUnique({ where: { userId: session.user.id }, select: { id: true } }),
      prisma.menteeProfile.findUnique({ where: { userId: session.user.id } }),
    ])

    const context: MentorContext = {
      name: user?.name || "there",
      profile: profile ? {
        targetRole: profile.targetRole,
        timeline: profile.timeline,
        skillLevel: profile.skillLevel,
        learningStyle: profile.learningStyle,
        careerGoals: profile.careerGoals,
        constraints: profile.constraints,
      } : null,
      goals: rawGoals.map((g) => ({
        title: g.title,
        progressPct: g.roadmapItems.length > 0
          ? Math.round((g.roadmapItems.filter((r) => r.isComplete).length / g.roadmapItems.length) * 100)
          : null,
        items: g.roadmapItems.map((r) => ({
          topic: r.topic,
          isComplete: r.isComplete,
          description: r.description,
        })),
      })),
      recentLogs: rawLogs.map((l) => ({
        title: l.title,
        createdAt: l.createdAt,
        skills: l.skillTags.map((st) => st.skill.name),
      })),
      projects: rawProjects.map((p) => ({
        title: p.title,
        status: p.status,
        progressPct: p.progressPct,
        steps: p.steps.map((s) => ({
          topic: s.topic,
          isComplete: s.isComplete,
        })),
      })),
      skills: skills.map((s) => ({ name: s.skill.name, level: `${s.logCount} logs` })),
      streakCount: user?.streakCount ?? 0,
      hasResume: !!resume,
    }

    const overview = await generateMentorOverview(context)

    return NextResponse.json({ overview, context })
  } catch (err) {
    console.error("/api/mentor/overview error:", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
