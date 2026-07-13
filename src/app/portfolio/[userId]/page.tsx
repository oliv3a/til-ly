import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { getComputedSkills } from "@/lib/skills"
import PortfolioClient from "./PortfolioClient"

export default async function PortfolioPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, avatarUrl: true, bio: true, school: true, year: true },
  })

  if (!user) notFound()

  const [rawLogs, skills, rawGoals, projects, logCount, projectCount] = await Promise.all([
    prisma.studyLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        skillTags: { include: { skill: true } },
      },
    }),
    getComputedSkills(userId),
    prisma.goal.findMany({
      where: { userId, status: "active" },
      include: { roadmapItems: true },
    }),
    prisma.project.findMany({
      where: { userId, status: { not: "archived" } },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: { id: true, title: true, status: true, progressPct: true },
    }),
    prisma.studyLog.count({ where: { userId } }),
    prisma.project.count({ where: { userId, status: { not: "archived" } } }),
  ])

  const goals = rawGoals.map((g) => ({
    id: g.id,
    title: g.title,
    progressPct: g.roadmapItems.length > 0
      ? Math.round((g.roadmapItems.filter((r) => r.isComplete).length / g.roadmapItems.length) * 100)
      : 0,
  }))

  const logs = rawLogs.map((l) => ({
    id: l.id,
    title: l.title,
    createdAt: l.createdAt,
    skillTags: l.skillTags,
  }))

  const session = await auth()
  const isOwner = session?.user !== undefined && (session.user as any).id === userId

  const userStreak = await prisma.user.findUnique({
    where: { id: userId },
    select: { streakCount: true },
  })

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="frame-block p-6 mb-6 text-center">
        <h1 className="poster-heading text-2xl">{user.name || "Anonymous"}</h1>
        {user.bio && <p className="text-[0.65rem] font-mono text-muted-ink/60 mt-1">{user.bio}</p>}
        {(user.school || user.year) && (
          <p className="text-[0.6rem] font-mono text-muted-ink/40 mt-1">
            {[user.school, user.year].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      <PortfolioClient
        logs={JSON.parse(JSON.stringify(logs))}
        goals={JSON.parse(JSON.stringify(goals))}
        skills={JSON.parse(JSON.stringify(skills))}
        initialProjects={JSON.parse(JSON.stringify(projects))}
        isOwner={isOwner}
        streakCount={userStreak?.streakCount ?? 0}
        logCount={logCount}
        projectCount={projectCount}
      />
    </div>
  )
}
