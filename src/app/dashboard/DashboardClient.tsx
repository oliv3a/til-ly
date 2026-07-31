"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { colorForSkill } from "@/lib/skill-colors"
import { staggerContainer, staggerItem } from "@/lib/motion/variants"

interface DashboardLog {
  id: string
  title: string
  createdAt: string
  aiSummary: string | null
  skillTags: { id: string; xp: number; skill: { id: string; name: string } }[]
}

interface DashboardGoal {
  id: string
  title: string
  roadmapItems?: { isComplete: boolean; topic: string }[]
}

interface DashboardSkill {
  id: string
  logCount: number
  skill: { id: string; name: string }
}

interface DashboardCurrentProject {
  id: string
  title: string
  progressPct: number
  steps: { isComplete: boolean }[]
}

interface LogDayItem {
  id: string
  title: string
  createdAt: string
  aiSummary: string | null
  skillTags: Array<{ id: string; xp: number; skill: { id: string; name: string } }>
}

interface DashboardData {
  userId: string
  userName: string
  streakCount: number
  logCount: number
  recentLogs: DashboardLog[]
  goals: DashboardGoal[]
  skills: DashboardSkill[]
  currentProject: DashboardCurrentProject | null
  recommendation: { topic: string; reason: string; estimatedTime: string } | null
  initialMonthCache: Record<string, Record<number, LogDayItem[]>>
}

export default function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState(initialData)
  const [showAllSkills, setShowAllSkills] = useState(false)

  useEffect(() => {
    async function refresh() {
      const res = await fetch("/api/dashboard")
      if (res.ok) {
        const fresh = await res.json()
        setData((prev) => {
          const updatedMonthCache = { ...prev.initialMonthCache }
          if (fresh.monthlyLogsByDay) {
            const today = new Date()
            const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
            updatedMonthCache[monthKey] = fresh.monthlyLogsByDay
          }
          return {
            ...prev,
            streakCount: fresh.streakCount ?? prev.streakCount,
            logCount: fresh.logCount ?? prev.logCount,
            initialMonthCache: updatedMonthCache,
          }
        })
      }
    }

    refresh()

    const onFocus = () => refresh()
    const onVisible = () => { if (document.visibilityState === "visible") refresh() }
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [])

  const greeting = getGreeting()

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-4">

      {/* 1. Greeting */}
      <motion.div variants={staggerItem} className="mb-6">
        <h1 className="poster-heading text-xl sm:text-2xl text-warm-brown">
          {greeting}, {data.userName}
        </h1>
        <p className="text-sm font-mono text-muted-ink/60 mt-1">
          What are we working on today?
        </p>
      </motion.div>

      {/* 2. Today's Goal */}
      <motion.div variants={staggerItem} className="dash-section">
        <p className="dash-section-title mb-3">
          <span className="text-muted-ink/25">01 </span>Today&apos;s Goal
        </p>
        {data.goals && data.goals.length > 0 ? (
          <div className="space-y-2">
            {data.goals.slice(0, 3).map((goal) => {
              const done = goal.roadmapItems?.filter((i) => i.isComplete).length ?? 0
              const total = goal.roadmapItems?.length ?? 0
              const pct = total > 0 ? Math.round((done / total) * 100) : 0
              return (
                <Link key={goal.id} href={`/goals/${goal.id}`} className="dash-card block p-3 hover:bg-warm-brown/[0.03] transition-colors group">
                  <p className="text-sm font-mono text-warm-brown font-medium truncate group-hover:underline">{goal.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-2 bg-warm-brown/10 rounded-full overflow-hidden">
                      <div className="h-full bg-soft-coral rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-mono text-muted-ink/50 shrink-0">{done}/{total}</span>
                  </div>
                </Link>
              )
            })}
            <Link href="/goals" className="inline-block text-xs font-mono text-muted-ink/50 hover:text-muted-ink/70 transition-colors mt-1">
              View all &rarr;
            </Link>
          </div>
        ) : (
          <div className="dash-card p-4 text-center">
            <p className="font-serif text-base text-warm-brown mb-1">Set your first goal</p>
            <p className="text-xs font-mono text-muted-ink/50 mb-2">Break a topic into a checklist and track progress</p>
            <Link href="/goals/new" className="btn-base btn-sm btn-coral btn-interact inline-flex items-center gap-1 text-xs">
              Create a goal &rarr;
            </Link>
          </div>
        )}
      </motion.div>

      {/* 3. Recent Learning */}
      <motion.div variants={staggerItem} className="dash-section">
        <p className="dash-section-title mb-3">
          <span className="text-muted-ink/25">02 </span>Recent Learning
        </p>
        {data.skills && data.skills.length > 0 ? (
          <div className="dash-card p-3">
            <div className={`flex flex-wrap gap-2 ${showAllSkills ? "" : "max-h-28 overflow-hidden"}`}>
              {(showAllSkills ? data.skills : data.skills.slice(0, 6)).map((s) => {
                const color = colorForSkill(s.skill.name)
                return (
                  <span
                    key={s.id}
                    className="tag inline-flex items-center gap-1.5 text-xs"
                    style={{ borderColor: color.border, background: color.bg }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: color.border }} />
                    {s.skill.name}
                    <span className="text-muted-ink/40 ml-0.5">{s.logCount}</span>
                  </span>
                )
              })}
            </div>
            {data.skills.length > 6 && (
              <button
                onClick={() => setShowAllSkills(!showAllSkills)}
                className="text-[0.55rem] font-mono text-muted-ink/40 hover:text-muted-ink/70 transition-colors mt-2"
              >
                {showAllSkills ? `Show less` : `+${data.skills.length - 6} more`}
              </button>
            )}
          </div>
        ) : (
          <div className="dash-card p-4 text-center">
            <p className="font-serif text-base text-warm-brown mb-1">No skills yet</p>
            <p className="text-xs font-mono text-muted-ink/50 mb-2">Your first log will start building your skill map</p>
            <Link href="/logs/new" className="btn-base btn-sm btn-interact text-xs">
              Write your first log
            </Link>
          </div>
        )}
      </motion.div>

      {/* 4. Current Project */}
      <motion.div variants={staggerItem} className="dash-section">
        <p className="dash-section-title mb-3">
          <span className="text-muted-ink/25">03 </span>Building
        </p>
        {data.currentProject ? (
          <Link href={`/projects/${data.currentProject.id}`} className="dash-card block p-3 hover:bg-warm-brown/[0.03] transition-colors group">
            <p className="text-sm font-mono text-warm-brown font-medium truncate group-hover:underline">{data.currentProject.title}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-2 bg-warm-brown/10 rounded-full overflow-hidden">
                <div className="h-full bg-soft-coral rounded-full transition-all" style={{ width: `${data.currentProject.progressPct}%` }} />
              </div>
              <span className="text-xs font-mono text-muted-ink/50 shrink-0">{data.currentProject.progressPct}%</span>
            </div>
            {data.currentProject.steps.length > 0 && (
              <p className="text-xs font-mono text-muted-ink/40 mt-1">
                {data.currentProject.steps.filter((s) => s.isComplete).length}/{data.currentProject.steps.length} steps done
              </p>
            )}
          </Link>
        ) : (
          <div className="dash-card p-4 text-center">
            <p className="font-serif text-base text-warm-brown mb-1">Start building something</p>
            <p className="text-xs font-mono text-muted-ink/50 mb-2">Track a project and see your progress grow</p>
            <Link href="/projects/new" className="btn-base btn-sm btn-interact text-xs">
              Start a project &rarr;
            </Link>
          </div>
        )}
      </motion.div>

      {/* 5. You're improving */}
      <motion.div variants={staggerItem} className="dash-section">
        <p className="dash-section-title mb-3">
          <span className="text-muted-ink/25">04 </span>You&apos;re improving
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Stats */}
          <div className="dash-card p-3">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="poster-heading text-2xl text-warm-brown">{data.streakCount}</p>
                <p className="text-xs font-mono text-muted-ink/50 uppercase tracking-wider">Streak</p>
              </div>
              <div className="text-center">
                <p className="poster-heading text-2xl text-warm-brown">{data.logCount}</p>
                <p className="text-xs font-mono text-muted-ink/50 uppercase tracking-wider">Logs</p>
              </div>
              <div className="text-center">
                <p className="poster-heading text-2xl text-warm-brown">{data.skills?.length ?? 0}</p>
                <p className="text-xs font-mono text-muted-ink/50 uppercase tracking-wider">Skills</p>
              </div>
            </div>
          </div>

          {/* Compact dot calendar */}
          <CompactDotCalendar initialMonthCache={data.initialMonthCache} />
        </div>
      </motion.div>

      {/* 6. MacSplitCard */}
      <motion.div variants={staggerItem}>
        <MacSplitCard />
      </motion.div>

      <motion.p variants={staggerItem} className="text-center text-xs font-mono text-muted-ink/30 mt-6 tracking-wide pb-4">
        TIL &mdash; Today I Learned
      </motion.p>
    </motion.div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

/* ─── Compact Dot Calendar ─────────────────────────────────── */

function CompactDotCalendar({ initialMonthCache }: { initialMonthCache: Record<string, Record<number, LogDayItem[]>> }) {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`
  const monthData = initialMonthCache?.[monthKey] || {}

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: React.ReactNode[] = []
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} />)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const hasLogs = !!monthData[d]
    const isToday = d === today.getDate()
    cells.push(
      <div
        key={d}
        className={`w-2.5 h-2.5 rounded-full transition-colors ${
          isToday ? "bg-soft-coral ring-1 ring-soft-coral/30" : hasLogs ? "bg-[#4DC4B0]" : "bg-warm-brown/10"
        }`}
        title={isToday ? "Today" : hasLogs ? `${monthData[d].length} log(s)` : ""}
      />
    )
  }

  return (
    <div className="dash-card p-3">
      <p className="text-xs font-mono text-muted-ink/50 uppercase tracking-wider mb-2">
        {today.toLocaleDateString("en-US", { month: "long" })} &middot; {Object.keys(monthData).length} days logged
      </p>
      <div className="grid grid-cols-7 gap-1.5 justify-items-center">
        {cells}
      </div>
    </div>
  )
}

/* ─── MacSplitCard ─────────────────────────────────────────── */

function MacSplitCard() {
  return (
    <div className="dash-card flex p-0 overflow-visible relative flex-col md:flex-row">
      <div className="w-full md:w-[40%] flex items-center gap-3 p-3 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-serif font-bold text-warm-brown leading-tight">til.ly: Always There.</p>
            <span className="tag text-xs py-[1px]">Mac only</span>
          </div>
          <p className="text-xs font-mono font-bold text-muted-ink/70 leading-snug mb-2">
            One-click logging. No browser needed. Tilly&apos;s always there.
          </p>
          <a
            href="/api/downloads/macos"
            className="inline-block font-mono font-bold text-xs text-warm-paper bg-soft-coral py-1.5 px-3 border border-warm-brown hover:opacity-90 transition-opacity"
            download="til-ly-macos.zip"
          >
            Download
          </a>
          <div className="text-xs font-mono font-bold text-muted-ink/70 mt-2 space-y-0.5 leading-snug">
            <p>1. Download &amp; unzip</p>
            <p>2. Open Terminal, paste: <code className="bg-warm-brown/10 px-1 rounded">xattr -dr com.apple.quarantine ~/Downloads/Tilly.app</code></p>
            <p>3. Drag Tilly.app → Applications</p>
            <p>4. Open Tilly (Spotlight / Finder)</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-3 pt-0 md:pt-3 md:pl-0 flex items-center justify-center">
        <video
          className="w-[70%] max-w-[280px] aspect-[8/5] object-cover rounded-lg border border-warm-brown/15"
          src="/videos/menu-bar-demo.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
      </div>
    </div>
  )
}
