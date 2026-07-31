"use client"

import { useState } from "react"
import Link from "next/link"
import type { PortfolioLog, PortfolioSkill, PortfolioProject } from "@/types"
import AnimatedProgress from "@/lib/motion/components/AnimatedProgress"
import { colorForSkill } from "@/lib/skill-colors"

interface GoalInfo {
  id: string
  title: string
  progressPct: number | null
}

interface Props {
  logs: PortfolioLog[]
  goals: GoalInfo[]
  skills: PortfolioSkill[]
  initialProjects: PortfolioProject[]
  isOwner: boolean
  streakCount: number
  logCount: number
  projectCount: number
}

export default function PortfolioClient({ logs, goals, skills, initialProjects, isOwner, streakCount, logCount, projectCount }: Props) {
  const [showAllSkills, setShowAllSkills] = useState(false)

  return (
    <div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        <div className="frame-block p-2 text-center">
          <p className="poster-heading text-lg">{streakCount}</p>
          <p className="text-[0.5rem] font-mono text-muted-ink/50 uppercase">Streak</p>
        </div>
        <div className="frame-block p-2 text-center">
          <p className="poster-heading text-lg">{skills.length}</p>
          <p className="text-[0.5rem] font-mono text-muted-ink/50 uppercase">Skills</p>
        </div>
        <div className="frame-block p-2 text-center">
          <p className="poster-heading text-lg">{logCount}</p>
          <p className="text-[0.5rem] font-mono text-muted-ink/50 uppercase">Logs</p>
        </div>
        <div className="frame-block p-2 text-center">
          <p className="poster-heading text-lg">{projectCount}</p>
          <p className="text-[0.5rem] font-mono text-muted-ink/50 uppercase">Projects</p>
        </div>
      </div>

      <div className="section-divider" />

      {/* 01 — Skills */}
      <div className="dash-section">
        <p className="dash-section-title">01 &nbsp; Skills</p>
        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {(showAllSkills ? skills : skills.slice(0, 8)).map((sk: PortfolioSkill) => {
              const color = colorForSkill(sk.skill.name)
              return (
                <span
                  key={sk.skill.id}
                  className="tag inline-flex items-center gap-1.5 text-xs"
                  style={{ borderColor: color.border, background: color.bg }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: color.border }} />
                  {sk.skill.name}
                  <span className="text-muted-ink/40 ml-0.5">{sk.logCount}</span>
                </span>
              )
            })}
            {skills.length > 8 && (
              <button
                onClick={() => setShowAllSkills(!showAllSkills)}
                className="tag text-[0.55rem] font-mono text-muted-ink/40 hover:text-muted-ink/70 transition-colors cursor-pointer"
              >
                {showAllSkills ? "Show less" : `+${skills.length - 8} more`}
              </button>
            )}
          </div>
        ) : (
          <p className="text-[0.6rem] font-mono text-muted-ink/40">No skills tracked yet</p>
        )}
      </div>

      <div className="section-divider" />

      {/* 02 — Goals */}
      <div className="dash-section">
        <p className="dash-section-title">02 &nbsp; Goals</p>
        {goals.length > 0 ? (
          <div className="space-y-1.5">
            {goals.map((g) => (
              <div key={g.id} className="frame-block p-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-sm text-warm-brown truncate">{g.title}</h3>
                  <span className="text-[0.5rem] font-mono text-muted-ink/50 shrink-0 ml-2">{g.progressPct ?? 0}%</span>
                </div>
                    <AnimatedProgress value={g.progressPct ?? 0} height={4} className="mt-1.5" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[0.6rem] font-mono text-muted-ink/40">No goals set yet</p>
        )}
      </div>

      <div className="section-divider" />

      {/* 03 — Recent Logs */}
      <div className="dash-section">
        <div className="flex items-center justify-between mb-3">
          <p className="dash-section-title mb-0">03 &nbsp; Recent Logs</p>
          {isOwner && logs.length > 0 && (
            <Link href="/dashboard" className="text-[0.55rem] font-mono text-muted-teal underline">View all &rarr;</Link>
          )}
        </div>
        {logs.length > 0 ? (
          <div className="space-y-1.5">
            {logs.map((log: PortfolioLog) => (
              <Link key={log.id} href={`/logs/${log.id}`} className="block">
                <div className="frame-block p-2.5 hover:bg-warm-paper/80 transition-colors">
                  <div className="flex items-start justify-between">
                    <h3 className="font-serif text-sm text-warm-brown truncate">{log.title}</h3>
                    <span className="text-[0.5rem] font-mono text-muted-ink/40 shrink-0 ml-2">
                      {new Date(log.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  {log.skillTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {log.skillTags.map((st) => (
                        <span key={st.skill.id} className="text-[0.45rem] font-mono font-medium px-1 py-px leading-none" style={{ background: colorForSkill(st.skill.name).bg, color: colorForSkill(st.skill.name).text, border: `1px solid ${colorForSkill(st.skill.name).border}` }}>{st.skill.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-[0.6rem] font-mono text-muted-ink/40">No study logs yet</p>
        )}
      </div>

      <div className="section-divider" />

      {/* 04 — Recent Projects */}
      <div className="dash-section">
        <div className="flex items-center justify-between mb-3">
          <p className="dash-section-title mb-0">04 &nbsp; Recent Projects</p>
          {isOwner && initialProjects.length > 0 && (
            <Link href="/projects" className="text-[0.55rem] font-mono text-muted-teal underline">View all &rarr;</Link>
          )}
        </div>
        {initialProjects.length > 0 ? (
          <div className="space-y-1.5">
            {initialProjects.map((p: PortfolioProject) => (
              <a key={p.id} href={`/projects/${p.id}`} className="block">
                <div className="frame-block p-2.5 hover:bg-warm-paper/80 transition-colors">
                  <div className="flex items-start justify-between">
                    <h3 className="font-serif text-sm text-warm-brown truncate">{p.title}</h3>
                    <span className={`text-[0.4rem] font-mono font-bold shrink-0 ml-2 ${
                      p.status === "completed" ? "text-green-700" :
                      p.status === "archived" ? "text-muted-ink/50" :
                      "text-muted-teal"
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  {p.progressPct !== undefined && p.progressPct !== null && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[0.5rem] font-mono font-bold text-warm-brown">{p.progressPct}%</span>
                      <AnimatedProgress value={p.progressPct} height={4} className="flex-1" />
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-[0.6rem] font-mono text-muted-ink/40">No projects yet</p>
        )}
      </div>

      {logs.length === 0 && initialProjects.length === 0 && skills.length === 0 && goals.length === 0 && (
        <div className="frame-block p-6 mt-6 text-center">
          <p className="font-serif text-sm text-warm-brown">No activity yet</p>
          <p className="text-[0.65rem] font-mono text-muted-ink/50 mt-1">This portfolio is still being built</p>
        </div>
      )}
    </div>
  )
}
