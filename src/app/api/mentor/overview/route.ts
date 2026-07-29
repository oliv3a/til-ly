import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateMentorOverview, type MentorContext } from "@/lib/ai"
import { getComputedSkills } from "@/lib/skills"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const [rawLogs, rawGoals, projects, skills, user, resume] = await Promise.all([
      prisma.studyLog.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { skillTags: { include: { skill: true } } },
      }),
      prisma.goal.findMany({
        where: { userId: session.user.id, status: "active" },
        include: { roadmapItems: true },
      }),
      prisma.project.findMany({
        where: { userId: session.user.id, status: { not: "archived" } },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: { title: true, status: true, progressPct: true },
      }),
      getComputedSkills(session.user.id),
      prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, streakCount: true, mentorName: true } }),
      prisma.resume.findUnique({ where: { userId: session.user.id }, select: { id: true } }),
    ])

    const context: MentorContext = {
      name: user?.name || "there",
      mentorName: user?.mentorName || "Tilly",
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
      projects,
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
