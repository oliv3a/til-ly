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

  const [logs, skills, goals, projects] = await Promise.all([
    prisma.studyLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        files: true,
        skillTags: { include: { skill: true } },
        goalLinks: { include: { goal: { select: { id: true, title: true } } } },
      },
    }),
    getComputedSkills(userId),
    prisma.goal.findMany({
      where: { userId },
      include: { roadmapItems: { orderBy: { order: "asc" } } },
    }),
    prisma.project.findMany({
      where: { userId, status: { not: "archived" } },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: {
        _count: { select: { updates: true } },
        updates: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
  ])

  const session = await auth()

  return (
    <div>
      {/* Profile card */}
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
        userId={userId}
        logs={JSON.parse(JSON.stringify(logs))}
        goals={JSON.parse(JSON.stringify(goals))}
        skills={JSON.parse(JSON.stringify(skills))}
        initialProjects={JSON.parse(JSON.stringify(projects))}
        isOwner={session?.user !== undefined && (session.user as any).id === userId}
      />
    </div>
  )
}
