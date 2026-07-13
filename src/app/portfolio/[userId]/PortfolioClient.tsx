"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import type { StudyLogWithRelations } from "@/types"
import AnimatedButton from "@/lib/motion/components/AnimatedButton"
import AnimatedCard from "@/lib/motion/components/AnimatedCard"
import AnimatedProgress from "@/lib/motion/components/AnimatedProgress"
import SkillsSection from "./SkillsSection"
import { parseAiSummary } from "@/lib/ai-summary"

interface GoalInfo {
  id: string
  title: string
}

interface Props {
  userId: string
  logs: StudyLogWithRelations[]
  goals: GoalInfo[]
  skills: any[]
  initialProjects: any[]
  isOwner: boolean
}

export default function PortfolioClient({ userId, logs: initialLogs, goals: initialGoals, skills: initialSkills, initialProjects, isOwner }: Props) {
  const [logs, setLogs] = useState(initialLogs)
  const [goals, setGoals] = useState(initialGoals)
  const [skills, setSkills] = useState(initialSkills)
  const [projects, setProjects] = useState(initialProjects)
  const [view, setView] = useState<"grid" | "timeline">("grid")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
  const [offset, setOffset] = useState(10)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    fetch(`/api/portfolio/${userId}`)
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (data?.goals) setGoals(data.goals)
        if (data?.skills) setSkills(data.skills)
        if (data?.projects) setProjects(data.projects)
        if (data?.hasMore !== undefined && offset === 10) setHasMore(data.hasMore)
      })
      .catch(() => {})
  }, [userId, offset])

  async function loadMore() {
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/portfolio/${userId}?offset=${offset}&limit=10`)
      if (res.ok) {
        const data = await res.json()
        setLogs((prev) => [...prev, ...data.logs])
        setHasMore(data.hasMore)
        setOffset((prev) => prev + 10)
      }
    } catch {
      // ignore
    }
    setLoadingMore(false)
  }

  async function deleteLog(id: string) {
    if (!confirm("Delete this log? This cannot be undone.")) return
    setDeletingId(id)
    const res = await fetch(`/api/logs/${id}`, { method: "DELETE" })
    if (res.ok) {
      const data = await res.json().catch(() => ({}))
      setLogs((prev) => prev.filter((l) => l.id !== id))
      if (data.skills) setSkills(data.skills)
    } else {
      const errBody = await res.json().catch(() => ({ error: "Unknown" }))
      console.error("DELETE failed:", res.status, errBody.detail || errBody.error)
    }
    setDeletingId(null)
  }

  const uniqueSkills = useMemo(() => {
    const names = new Set<string>()
    for (const log of logs) {
      for (const st of log.skillTags) {
        names.add(st.skill.name)
      }
    }
    return Array.from(names).sort()
  }, [logs])

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedGoalId) {
        const hasGoal = log.goalLinks.some((gl) => gl.goal.id === selectedGoalId)
        if (!hasGoal) return false
      }
      if (selectedSkill) {
        const hasSkill = log.skillTags.some((st) => st.skill.name === selectedSkill)
        if (!hasSkill) return false
      }
      return true
    })
  }, [logs, selectedGoalId, selectedSkill])

  function renderLogCard(log: StudyLogWithRelations) {
    return (
      <Link key={log.id} href={`/logs/${log.id}`} className="block">
        <AnimatedCard className="frame-block p-3 hover:bg-warm-paper/80 transition-colors">
          <div className="flex items-start justify-between">
            <h3 className="font-serif text-sm text-warm-brown">{log.title}</h3>
            {isOwner && (
              <button
                onClick={(e) => { e.preventDefault(); deleteLog(log.id) }}
                disabled={deletingId === log.id}
                className="btn-sm text-[0.55rem] px-1.5 py-0.5 shrink-0"
              >
                {deletingId === log.id ? "..." : "Del"}
              </button>
            )}
          </div>
          <p className="text-[0.55rem] font-mono text-muted-ink/40 mt-0.5">
            {new Date(log.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
          {log.aiSummary && (
            <p className="text-[0.65rem] font-mono text-muted-ink/60 mt-2 line-clamp-3">{parseAiSummary(log.aiSummary).summary}</p>
          )}
          {log.skillTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {log.skillTags.map((st) => (
                <span key={st.skill.id} className="tag">
                  {st.skill.name}
                </span>
              ))}
            </div>
          )}
        </AnimatedCard>
      </Link>
    )
  }

  function renderTimelineItem(log: StudyLogWithRelations, index: number, total: number) {
    return (
      <div key={log.id} className="flex gap-3">
        <div className="flex flex-col items-center">
          <div className="w-2.5 h-2.5 border border-warm-brown bg-muted-teal mt-1.5" />
          {index < total - 1 && <div className="w-px flex-1 bg-warm-brown/20 mt-1" />}
        </div>
        <Link href={`/logs/${log.id}`} className="flex-1">
          <AnimatedCard className="frame-block p-3 mb-1">
            <div className="flex items-start justify-between">
              <h3 className="font-serif text-sm text-warm-brown">{log.title}</h3>
              {isOwner && (
                <AnimatedButton
                  onClick={(e) => { e.preventDefault(); deleteLog(log.id) }}
                  disabled={deletingId === log.id}
                  variant="sm"
                  className="text-[0.55rem] px-1.5 py-0.5 shrink-0"
                >
                  {deletingId === log.id ? "..." : "Del"}
                </AnimatedButton>
              )}
            </div>
            <p className="text-[0.55rem] font-mono text-muted-ink/40 mt-0.5">
              {new Date(log.createdAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
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
        </Link>
      </div>
    )
  }

  return (
    <div>
      <SkillsSection skills={skills} isOwner={isOwner} userId={userId} />

      {/* Projects section */}
      {projects.length > 0 && (
        <div className="mb-6">
          <h2 className="font-serif text-sm text-white mb-2">📦 Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {projects.map((p: any) => {
              const latestUpdate = p.updates?.[0]
              return (
                <a
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="block"
                >
                  <AnimatedCard className="frame-block p-3 hover:bg-warm-paper/80 transition-colors">
                    <div className="flex items-start justify-between">
                      <h3 className="font-serif text-sm text-warm-brown">{p.title}</h3>
                      <span className={`text-[0.5rem] font-mono uppercase px-1.5 py-0.5 border ${
                        p.status === "completed" ? "border-green-600 text-green-700" :
                        p.status === "archived" ? "border-warm-brown/30 text-muted-ink/50" :
                        "border-muted-teal text-muted-teal"
                      }`}>
                        {p.status}
                      </span>
                    </div>
                    {p.description && (
                      <p className="text-[0.65rem] font-mono text-muted-ink/60 mt-1 line-clamp-2">{p.description}</p>
                    )}
                    {p.techStack && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {p.techStack.split(",").map((t: string) => (
                          <span key={t.trim()} className="tag text-[0.5rem]">
                            {t.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[0.55rem] font-mono text-muted-ink/50">
                      <span>{p._count?.updates ?? 0} updates</span>
                      {latestUpdate && (
                        <span className="truncate">Latest: {latestUpdate.content?.slice(0, 50)}</span>
                      )}
                    </div>
                  {p.progressPct !== undefined && p.progressPct !== null && (
                    <AnimatedProgress value={p.progressPct} height={6} color="var(--color-muted-teal)" className="mt-2" />
                  )}
                  </AnimatedCard>
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* Study Logs */}
      {logs.length === 0 ? (
        <div className="frame-block p-6 text-center">
          <p className="font-serif text-sm text-warm-brown">No study logs yet</p>
          <p className="text-[0.65rem] font-mono text-muted-ink/50 mt-1">This portfolio is still being built</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-sm text-white">Study Logs</h2>
              <select
                value={selectedGoalId ?? ""}
                onChange={(e) => setSelectedGoalId(e.target.value || null)}
                className="field-coral text-[0.6rem] py-1"
              >
                <option value="">All Goals</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
              {uniqueSkills.length > 0 && (
                <select
                  value={selectedSkill ?? ""}
                  onChange={(e) => setSelectedSkill(e.target.value || null)}
                  className="field-coral text-[0.6rem] py-1"
                >
                  <option value="">All Skills</option>
                  {uniqueSkills.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex gap-0.5">
              <AnimatedButton
                onClick={() => setView("grid")}
                variant={view === "grid" ? "sm-primary" : "sm"}
                className="text-[0.55rem] px-2 py-1"
              >
                Grid
              </AnimatedButton>
              <AnimatedButton
                onClick={() => setView("timeline")}
                variant={view === "timeline" ? "sm-primary" : "sm"}
                className="text-[0.55rem] px-2 py-1"
              >
                Timeline
              </AnimatedButton>
            </div>
          </div>

          {filteredLogs.length === 0 && (
            <div className="frame-block p-6 text-center">
              <p className="font-serif text-sm text-warm-brown">No logs match these filters</p>
              <button
                onClick={() => { setSelectedGoalId(null); setSelectedSkill(null) }}
                className="text-[0.6rem] font-mono text-muted-teal underline mt-1"
              >
                Clear filters
              </button>
            </div>
          )}

          {view === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredLogs.map((log) => renderLogCard(log))}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredLogs.map((log, i) => renderTimelineItem(log, i, filteredLogs.length))}
            </div>
          )}

          {hasMore && (
            <div className="text-center mt-4">
              <AnimatedButton
                onClick={loadMore}
                disabled={loadingMore}
                variant="sm"
                className="text-[0.65rem]"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </AnimatedButton>
            </div>
          )}
        </>
      )}
    </div>
  )
}
