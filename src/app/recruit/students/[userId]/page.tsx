import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getComputedSkills } from "@/lib/skills"
import { parseAiSummary } from "@/lib/ai-summary"
import AnimatedCard from "@/lib/motion/components/AnimatedCard"
export default async function RecruitStudentPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, avatarUrl: true, bio: true, school: true, year: true, streakCount: true },
  })

  if (!user) notFound()

  const skills = await getComputedSkills(userId)

  const logs = await prisma.studyLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { skillTags: { include: { skill: true } } },
  })

  const goals = await prisma.goal.findMany({
    where: { userId },
    include: {
      roadmapItems: {
        orderBy: { order: "asc" },
        include: { _count: { select: { studyLogLinks: true } } },
      },
    },
  })

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Link href="/recruit/students" className="btn-base btn-sm btn-interact-bg">← Back</Link>
        <span className="text-[0.55rem] font-mono text-muted-ink/50">Recruiter View</span>
      </div>

      {/* Profile header */}
      <div className="frame-block p-6 mb-6">
        <h1 className="font-serif text-lg text-warm-brown">{user.name || "Anonymous"}</h1>
        {user.bio && <p className="text-[0.65rem] font-mono text-muted-ink/60 mt-1">{user.bio}</p>}
        <div className="flex flex-wrap gap-2 mt-2">
          {user.school && <span className="tag">🏫 {user.school}</span>}
          {user.year && <span className="tag">📅 {user.year}</span>}
          {user.streakCount > 0 && <span className="tag bg-faded-purple/10">🔥 {user.streakCount}-day streak</span>}
        </div>
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mb-6">
          <div className="section-header">⚡ Skills</div>
          <div className="flex flex-wrap gap-1 mt-2">
            {skills.map((us: { id: string; logCount: number; skill: { name: string; category: string | null } }) => (
              <div key={us.id} className="tag flex items-center gap-1">
                {us.skill.name}
                <span className="text-muted-ink/50">{us.logCount} logs</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goals */}
      {goals.length > 0 && (
        <div className="mb-6">
          <div className="section-header">🎯 Goals</div>
          <div className="space-y-2 mt-2">
            {goals.map((g: { id: string; title: string; roadmapItems?: { isComplete: boolean; _count?: { studyLogLinks: number } }[] }) => {
              const total = g.roadmapItems?.length ?? 0
              const ticked = g.roadmapItems?.filter((r) => r.isComplete).length ?? 0
              const logTotal = g.roadmapItems?.reduce((s: number, r) => s + (r._count?.studyLogLinks ?? 0), 0) ?? 0
              return (
                <AnimatedCard key={g.id} className="frame-block p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-sm text-warm-brown">{g.title}</h3>
                    <span className="text-[0.55rem] font-mono text-muted-ink/50">{ticked}/{total} ticked</span>
                  </div>
                  {total > 0 && (
                    <p className="text-[0.55rem] font-mono text-muted-ink/40 mt-1">{logTotal} logs</p>
                  )}
                </AnimatedCard>
              )
            })}
          </div>
        </div>
      )}

      {/* Logs */}
      <div>
        <div className="section-header">📚 Recent Activity</div>
        {logs.length === 0 ? (
          <div className="frame-block p-4 text-center mt-2">
            <p className="text-[0.65rem] font-mono text-muted-ink/50">No logs yet</p>
          </div>
        ) : (
          <div className="space-y-2 mt-2">
            {logs.map((log) => (
              <AnimatedCard key={log.id} className="frame-block p-3">
                <h3 className="font-serif text-sm text-warm-brown">{log.title}</h3>
                <p className="text-[0.55rem] font-mono text-muted-ink/40 mt-0.5">
                  {new Date(log.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
                {log.aiSummary && <p className="text-[0.65rem] font-mono text-muted-ink/60 mt-1">{parseAiSummary(log.aiSummary).summary}</p>}
                {log.skillTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {log.skillTags.map((st) => (
                      <span key={st.skill.id} className="tag">
                        {st.skill.name}
                      </span>
                    ))}
                  </div>
                )}
              </AnimatedCard>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
