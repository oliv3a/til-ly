import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import RoadmapLinkEditor from "./RoadmapLinkEditor"
import AiSummaryEditor from "./AiSummaryEditor"
import SkillsEditor from "./SkillsEditor"

export default async function LogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect("/auth/login")

  const userId = (session.user as any).id
  const log = await prisma.studyLog.findUnique({
    where: { id },
    include: {
      files: true,
      skillTags: { include: { skill: true } },
      goalLinks: { include: { goal: { select: { id: true, title: true } } } },
      roadmapLinks: {
        include: { roadmapItem: { include: { goal: { select: { id: true, title: true } } } } },
      },
    },
  })

  if (!log || log.userId !== userId) notFound()

  const roadmapLabels = log.roadmapLinks.map(
    (rl) => `${rl.roadmapItem.goal.title} › ${rl.roadmapItem.topic}`,
  )

  return (
    <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <a href="/dashboard" className="btn-base btn-sm btn-interact-bg">← Back</a>
          <span className="text-[0.55rem] font-mono text-muted-ink/50">
            {new Date(log.createdAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </span>
        </div>

        <h1 className="poster-heading text-2xl mb-1">{log.title}</h1>
        <p className="text-[0.55rem] font-mono text-muted-ink/40 mb-6">
          {new Date(log.createdAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>

        {log.content && (
          <div className="frame-block p-4 mb-4">
            <p className="text-[0.7rem] font-mono text-muted-ink/80 whitespace-pre-wrap leading-relaxed">{log.content}</p>
          </div>
        )}

        <AiSummaryEditor logId={id} initialSummary={log.aiSummary} />

        {log.files.length > 0 && (
          <div className="mb-4">
            <div className="section-header inline-block mb-2">Files</div>
            <div className="space-y-1">
              {log.files.map((f) => (
                <div key={f.id}>
                  {f.extractedText ? (
                    <details className="frame-block">
                      <summary className="cursor-pointer px-2 py-1 text-[0.6rem] font-mono text-warm-brown select-none">
                        📄 {f.fileName}
                      </summary>
                      <pre className="p-2 text-[0.55rem] font-mono text-muted-ink/80 whitespace-pre-wrap overflow-x-auto border-t border-warm-brown bg-white leading-relaxed">
                        {f.extractedText}
                      </pre>
                    </details>
                  ) : (
                    <a
                      href={f.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-base btn-sm btn-interact-bg"
                    >
                      📎 {f.fileName}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <SkillsEditor logId={id} initialSkillTags={log.skillTags} />

        {log.goalLinks.length > 0 && (
          <div className="mb-4">
            <div className="section-header inline-block mb-2">Linked Goals</div>
            <div className="flex flex-wrap gap-1">
              {log.goalLinks.map((gl) => (
                <span key={gl.goal.id} className="tag">
                  🎯 {gl.goal.title}
                </span>
              ))}
            </div>
          </div>
        )}

        <RoadmapLinkEditor
          logId={id}
          initialRoadmapLinks={log.roadmapLinks}
        />

        <div className="mt-8 text-center">
          <a href="/dashboard" className="btn-base btn-coral btn-interact text-sm !px-6 !py-2">
            Done ✨
          </a>
        </div>
    </div>
  )
}
