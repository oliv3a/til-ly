"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import BrandLogo from "@/components/BrandLogo"
import { colorForSkill } from "@/lib/skill-colors"
import { staggerContainer, staggerItem } from "@/lib/motion/variants"
import { easings } from "@/lib/motion/tokens"

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
  recentProjectUpdates: Array<{
    id: string
    projectId: string
    content: string | null
    createdAt: string
    project: { id: string; title: string }
  }>
  goals: DashboardGoal[]
  skills: DashboardSkill[]
  currentProject: DashboardCurrentProject | null
  recommendation: { topic: string; reason: string; estimatedTime: string } | null
  initialMonthCache: Record<string, Record<number, LogDayItem[]>>
}

export default function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState(initialData)

  useEffect(() => {
    async function refresh() {
      const res = await fetch("/api/dashboard")
      if (res.ok) {
        const fresh = await res.json()
        setData((prev) => ({ ...prev, ...fresh }))
      }
    }
    refresh()
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
          <span className="text-muted-ink/25">01</span> Today&apos;s Goal
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
          <span className="text-muted-ink/25">02</span> Recent Learning
        </p>
        {data.skills && data.skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {data.skills.slice(0, 8).map((s) => {
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
          <span className="text-muted-ink/25">03</span> Building
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
          <span className="text-muted-ink/25">04</span> You&apos;re improving
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
  const [popover, setPopover] = useState(false)
  const [cursorPhase, setCursorPhase] = useState<"enter" | "click" | "done">("enter")
  const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)
  const now = new Date()
  const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })

  function runCycle() {
    if (!mountedRef.current) return
    setPopover(false)
    setCursorPhase("enter")
    cycleRef.current = setTimeout(() => {
      if (!mountedRef.current) return
      setCursorPhase("click")
      cycleRef.current = setTimeout(() => {
        if (!mountedRef.current) return
        setCursorPhase("done")
        setPopover(true)
        cycleRef.current = setTimeout(() => {
          if (!mountedRef.current) return
          runCycle()
        }, 3500)
      }, 400)
    }, 600)
  }

  useEffect(() => {
    mountedRef.current = true
    const start = setTimeout(() => runCycle(), 1500)
    return () => {
      mountedRef.current = false
      if (cycleRef.current) clearTimeout(cycleRef.current)
      clearTimeout(start)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="dash-card p-0 overflow-visible relative flex">
      <div className="w-[40%] flex items-center gap-3 p-3 shrink-0">
        <BrandLogo size={28} className="shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-serif font-bold text-warm-brown leading-tight">til.ly: Always There.</p>
            <span className="tag text-xs py-[1px]">Mac only</span>
          </div>
          <p className="text-xs font-mono font-bold text-muted-ink/70 leading-snug mb-2">
            One-click logging. No browser needed.
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
            <p>2. Drag Tilly.app to Applications</p>
            <p>3. Open from Spotlight or Finder</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-[22px] bg-[#2b2b2b] rounded-tr flex items-center px-2 select-none">
          <div className="flex items-center gap-1.5 text-xs font-mono text-white/70">
            <span className="text-xs leading-none"></span>
            <span className="font-semibold text-white/90 text-xs">Tilly</span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs font-mono text-white/50">
            <span className="hidden sm:inline">📶</span>
            <span className="hidden sm:inline">🔋</span>
            <span>{time}</span>
            <span className="relative inline-flex items-center justify-center">
              <AnimatePresence>
                {cursorPhase !== "done" && (
                  <motion.span
                    className="absolute z-40 text-xs pointer-events-none"
                    initial={{ y: -10, opacity: 0, scale: 0.5 }}
                    animate={
                      cursorPhase === "enter"
                        ? { y: -8, opacity: 1, scale: 1 }
                        : cursorPhase === "click"
                        ? { y: -2, opacity: 1, scale: 1 }
                        : {}
                    }
                    exit={{ opacity: 0, scale: 0.5, y: -10 }}
                    transition={{ duration: 0.3, ease: easings.smooth }}
                  >
                    👆
                  </motion.span>
                )}
              </AnimatePresence>
              <motion.div
                animate={cursorPhase === "click" ? { scale: [1, 0.8, 1] } : {}}
                transition={{ duration: 0.25 }}
              >
                <BrandLogo size={14} className="shrink-0 animate-tilly-wiggle-slow" style={{ animationDelay: "4s" }} />
              </motion.div>
              <motion.span
                className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-soft-coral rounded-full"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {popover && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="absolute top-[26px] right-1 z-50 w-36 frame-block p-2 shadow-lg"
          >
            <div className="flex items-center gap-1.5 w-full font-mono text-xs text-warm-paper bg-soft-coral py-1.5 px-2 border-2 border-warm-brown text-left cursor-default">
              <span className="text-xs">✏️</span>
              <span>New log</span>
            </div>
            <div className="flex items-center gap-1.5 w-full text-xs font-mono text-muted-ink/60 py-1.5 px-2 text-left cursor-default mt-px">
              <span className="text-xs">📊</span>
              <span>Dashboard →</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
