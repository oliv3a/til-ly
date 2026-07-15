"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import type { PortfolioLog, PortfolioSkill, PortfolioProject } from "@/types"
import AnimatedProgress from "@/lib/motion/components/AnimatedProgress"
import { colorForSkill } from "@/lib/skill-colors"

const COLORS = [
  "#E88D7A", "#7BA89A", "#C49C6E", "#A8B5C4", "#D4A5A5",
  "#8FA89B", "#C4A882", "#A5B4C4", "#D4C4A8", "#B8A8C4",
]

function pieArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const startRad = ((startDeg - 90) * Math.PI) / 180
  const endRad = ((endDeg - 90) * Math.PI) / 180
  const x1 = (cx + r * Math.cos(startRad)).toFixed(4)
  const y1 = (cy + r * Math.sin(startRad)).toFixed(4)
  const x2 = (cx + r * Math.cos(endRad)).toFixed(4)
  const y2 = (cy + r * Math.sin(endRad)).toFixed(4)
  const largeArc = endDeg - startDeg > 180 ? "1" : "0"
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
}

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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)

  const totalLogs = useMemo(() => skills.reduce((s: number, sk: PortfolioSkill) => s + sk.logCount, 0), [skills])
  const visibleSkills = useMemo(() => skills.filter((sk: PortfolioSkill) => sk.logCount > 0), [skills])

  const slices = useMemo(() => {
    if (visibleSkills.length === 0) return []
    const total = visibleSkills.reduce((s: number, sk: PortfolioSkill) => s + sk.logCount, 0)
    const result: { index: number; startDeg: number; endDeg: number; color: string }[] = []
    let currentDeg = 0
    for (let i = 0; i < visibleSkills.length; i++) {
      const pct = visibleSkills[i].logCount / total
      const sliceDeg = pct * 360
      const originalIndex = skills.indexOf(visibleSkills[i])
      result.push({ index: originalIndex, startDeg: currentDeg, endDeg: currentDeg + sliceDeg, color: COLORS[i % COLORS.length] })
      currentDeg += sliceDeg
    }
    return result
  }, [visibleSkills, skills])

  const cx = 100, cy = 100, r = 90

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
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="relative shrink-0">
              <svg width={200} height={200} viewBox="0 0 200 200" className="max-w-full h-auto">
                {visibleSkills.length === 0 ? (
                  <circle cx={cx} cy={cy} r={r} fill="#f0ebe4" />
                ) : (
                  slices.map((slice) => (
                    <path
                      key={slice.index}
                      d={pieArc(cx, cy, r, slice.startDeg, slice.endDeg)}
                      fill={slice.color}
                      stroke="white"
                      strokeWidth={2}
                      className="cursor-pointer transition-opacity"
                      opacity={hoveredIndex === null || hoveredIndex === slice.index ? 1 : 0.4}
                      onMouseEnter={(e) => {
                        setHoveredIndex(slice.index)
                        const rect = (e.currentTarget.closest("svg") as SVGElement)?.getBoundingClientRect()
                        if (rect) setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top + 20 })
                      }}
                      onMouseLeave={() => { setHoveredIndex(null); setTooltipPos(null) }}
                      onMouseMove={(e) => {
                        setTooltipPos({ x: e.clientX, y: e.clientY - 40 })
                      }}
                    />
                  ))
                )}
              </svg>
              {totalLogs > 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="poster-heading text-xl">{totalLogs}</p>
                    <p className="text-[0.45rem] font-mono text-muted-ink/50 uppercase tracking-wider">total logs</p>
                  </div>
                </div>
              )}
              {hoveredIndex !== null && tooltipPos && (
                <div
                  className="fixed z-50 px-3 py-1.5 frame-block shadow-lg pointer-events-none"
                  style={{ left: tooltipPos.x, top: tooltipPos.y, transform: "translate(-50%, -100%)" }}
                >
                  <p className="text-[0.65rem] font-mono text-warm-brown whitespace-nowrap">{skills[hoveredIndex].skill.name}</p>
                  <p className="text-[0.55rem] font-mono text-muted-ink/60">{skills[hoveredIndex].logCount} logs</p>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 w-full sm:w-auto">
              <div className="space-y-1">
                {skills.map((sk: PortfolioSkill, i: number) => (
                  <div
                    key={sk.skill.id}
                    className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors hover:bg-warm-paper/60 ${sk.logCount === 0 ? "opacity-50" : ""}`}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <span
                      className="w-2.5 h-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="flex-1 text-[0.65rem] font-mono text-warm-brown truncate">{sk.skill.name}</span>
                    <span className="text-[0.6rem] font-mono text-muted-ink/50">{sk.logCount}</span>
                  </div>
                ))}
              </div>
            </div>
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
