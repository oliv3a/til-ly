"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import Onigiri from "@/components/Onigiri"
import { parseAiSummary } from "@/lib/ai-summary"
import { staggerContainer, staggerItem } from "@/lib/motion/variants"
import { easings } from "@/lib/motion/tokens"

interface DashboardData {
  userId: string
  userName: string
  streakCount: number
  logCount: number
  studiedToday: boolean
  recentLogs: any[]
  recentProjectUpdates: any[]
  goals: any[]
  skills: any[]
  recommendation: { topic: string; reason: string; estimatedTime: string } | null
  logsByDay?: Record<number, number>
}

function relativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "today"
  if (days === 1) return "yesterday"
  return `${days}d ago`
}

export default function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState(initialData)
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

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

  const mergedActivity = useMemo(() => {
    const items: { type: "log" | "project_update"; createdAt: string; data: any }[] = [
      ...(data.recentLogs?.map((log: any) => ({ type: "log" as const, createdAt: log.createdAt, data: log })) || []),
      ...(data.recentProjectUpdates?.map((upd: any) => ({ type: "project_update" as const, createdAt: upd.createdAt, data: upd })) || []),
    ]
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [data.recentLogs, data.recentProjectUpdates])

  const totalGoals = data.goals?.length ?? 0
  const totalTicked = data.goals?.reduce((s: number, g: any) =>
    s + (g.roadmapItems?.filter((i: any) => i.isComplete).length ?? 0), 0) ?? 0
  const totalItems = data.goals?.reduce((s: number, g: any) =>
    s + (g.roadmapItems?.length ?? 0), 0) ?? 0

  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  const firstDay = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const streakDays = useMemo(() => {
    const days = new Set<number>()
    if (data.streakCount <= 0) return days
    const now = new Date()
    const end = data.studiedToday ? 0 : 1
    for (let i = end; i < end + data.streakCount; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      if (d.getMonth() === now.getMonth()) {
        days.add(d.getDate())
      }
    }
    return days
  }, [data.streakCount, data.studiedToday])

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
      {/* 1. Continue Learning — what should I do now? */}
      <motion.div variants={staggerItem} className="dash-section">
        <p className="dash-section-title mb-2">
          <span className="text-muted-ink/25">01</span> Continue Learning
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          <div className="dash-card p-1.5">
            <p className="font-serif text-xs text-warm-brown mb-0.5">
              {data.recommendation
                ? `Study ${data.recommendation.topic}`
                : "What did you learn today?"}
            </p>
            {data.recommendation && (
              <p className="text-[0.5rem] font-mono font-medium text-muted-ink/70 mb-1">
                {data.recommendation.reason} &middot; Est. {data.recommendation.estimatedTime}
              </p>
            )}
            <Link
              href="/logs/new"
              className="btn-base btn-sm btn-coral btn-interact inline-flex items-center gap-1 text-[0.45rem] mt-1"
            >
              Log progress &rarr;
            </Link>
          </div>
          {data.streakCount > 0 && (
            <div className="dash-card flex items-center justify-center gap-1.5 p-1.5">
              <span className="text-base">🔥</span>
              <span className="poster-heading text-sm">{data.streakCount}</span>
              <span className="text-[0.4rem] font-mono font-medium text-muted-ink/60 uppercase tracking-wider">Day Streak</span>
            </div>
          )}
          <MacSplitCard />
          <div className="dash-card p-1">
            <p className="text-[0.45rem] font-mono font-medium text-warm-brown text-center mb-0.5">
              {today.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </p>
            <div className="grid grid-cols-7">
              {dayNames.map((d) => (
                <span key={d} className="inline-flex items-center justify-center text-[0.4rem] font-mono font-medium text-muted-ink/50" style={{ width: "1.1rem", height: "1.1rem", margin: "0 auto" }}>{d}</span>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => (
                <span key={`empty-${i}`} style={{ width: "1.1rem", height: "1.1rem", margin: "0 auto" }} />
              ))}
              {calendarDays.map((d) => {
                const count = data.logsByDay?.[d] ?? 0
                const isToday = d === today.getDate()
                const isStreak = streakDays.has(d) && !isToday
                const dot = count > 0 ? (count >= 3 ? "●●" : "●") : ""
                return (
                  <span
                    key={d}
                    className={`font-mono leading-none ${
                      isToday
                        ? "bg-soft-coral text-warm-paper rounded-full"
                        : "text-muted-ink/70"
                    } ${isStreak ? "text-soft-coral" : ""}`}
                    style={{ fontSize: "0.4rem", width: "1.1rem", height: "1.1rem", display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}
                  >
                    {d}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="section-divider" />

      {/* 2. Activity — what have I been doing? */}
      <motion.div variants={staggerItem} className="dash-section">
        <p className="dash-section-title mb-4">
          <span className="text-muted-ink/25">02</span> Activity
        </p>
        {mergedActivity.length > 0 ? (
          <div>
            {mergedActivity.slice(0, 6).map((item) => (
              <motion.div key={item.data.id} variants={staggerItem}>
                {item.type === "log" ? (
                  <div>
                    <button
                      onClick={() =>
                        setExpandedLogId(expandedLogId === item.data.id ? null : item.data.id)
                      }
                      className={`dash-list-item ${expandedLogId === item.data.id ? "selected" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[0.5rem] shrink-0">📄</span>
                          <h3 className="font-serif text-sm text-warm-brown truncate">{item.data.title}</h3>
                        </div>
                        <span className="text-[0.45rem] font-mono text-muted-ink/40 shrink-0 ml-2">
                          {relativeDate(item.data.createdAt)}
                        </span>
                      </div>
                      {item.data.aiSummary && (
                        <p className="text-[0.55rem] font-mono text-muted-ink/60 mt-0.5 line-clamp-1">
                          {parseAiSummary(item.data.aiSummary).summary}
                        </p>
                      )}
                    </button>
                    {expandedLogId === item.data.id && (
                      <div className="inline-detail">
                        <p className="text-[0.45rem] font-mono text-muted-ink/40 mb-2">
                          {new Date(item.data.createdAt).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        {item.data.aiSummary && (
                          <p className="text-[0.55rem] font-mono text-muted-ink/70 leading-relaxed mb-2">
                            {parseAiSummary(item.data.aiSummary).summary}
                          </p>
                        )}
                        {item.data.content && (
                          <p className="text-[0.55rem] font-mono text-muted-ink/60 whitespace-pre-wrap line-clamp-3 mb-2">
                            {item.data.content}
                          </p>
                        )}
                        <Link
                          href={`/logs/${item.data.id}`}
                          className="btn-base btn-sm btn-interact-bg text-[0.5rem]"
                        >
                          View full log &rarr;
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={`/projects/${item.data.project.id}`}
                    className="dash-list-item block"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[0.5rem] shrink-0">📦</span>
                        <h3 className="font-serif text-sm text-warm-brown truncate">{item.data.project.title}</h3>
                      </div>
                      <span className="text-[0.45rem] font-mono text-muted-ink/40 shrink-0 ml-2">
                        {relativeDate(item.data.createdAt)}
                      </span>
                    </div>
                    {item.data.content && (
                      <p className="text-[0.55rem] font-mono text-muted-ink/60 mt-0.5 line-clamp-1">{item.data.content}</p>
                    )}
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="dash-card text-center py-8">
            <p className="font-serif text-base text-warm-brown mb-1">No activity yet</p>
            <Link href="/logs/new" className="btn-base btn-sm btn-interact text-[0.6rem]">
              Start your first log
            </Link>
          </div>
        )}
      </motion.div>

      <div className="section-divider" />

      {/* 3. Progress — how am I progressing? */}
      <motion.div variants={staggerItem} className="dash-section">
        <p className="dash-section-title mb-4">
          <span className="text-muted-ink/25">03</span> Progress
        </p>
        <div className="flex items-center gap-4 mb-6 stat-row">
          <span className="text-[0.55rem] font-mono text-muted-ink">
            <strong className="font-serif text-warm-brown text-base">{data.streakCount}</strong> streak
          </span>
          <span className="text-[0.55rem] font-mono text-muted-ink">
            <strong className="font-serif text-warm-brown text-base">{data.logCount}</strong> logs
          </span>
          <span className="text-[0.55rem] font-mono text-muted-ink">
            <strong className="font-serif text-warm-brown text-base">{data.skills?.length ?? 0}</strong> skills
          </span>
          <span className="text-[0.55rem] font-mono text-muted-ink">
            <strong className="font-serif text-warm-brown text-base">
              {totalGoals > 0 ? `${totalTicked}/${totalItems}` : "\u2014"}
            </strong> goals
          </span>
        </div>

        <div>
          <p className="dash-section-title mb-3">Goals</p>
            {data.goals && data.goals.length > 0 ? (
              <div className="space-y-2">
                {data.goals.map((goal: any) => {
                  const done = goal.roadmapItems?.filter((i: any) => i.isComplete).length ?? 0
                  const total = goal.roadmapItems?.length ?? 0
                  return (
                    <div key={goal.id} className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.6rem] font-mono text-warm-brown truncate">{goal.title}</p>
                        <p className="text-[0.5rem] font-mono text-muted-ink/40">{done}/{total} steps</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div>
                <p className="text-[0.6rem] font-mono text-muted-ink/50 mb-2">No goals yet</p>
                <Link href="/goals/new" className="btn-base btn-sm btn-interact-bg text-[0.5rem]">
                  Create a goal
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
  )
}

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
  }, [])

  return (
    <div className="dash-card p-0 overflow-visible relative flex">
      {/* Left 40% — text info */}
      <div className="w-[40%] flex items-start gap-1.5 p-1.5 shrink-0">
        <Onigiri size={16} emotion="happy" className="shrink-0 mt-0.5" />
        <div className="leading-tight min-w-0">
          <div className="flex items-center gap-1 mb-px">
            <p className="text-[0.45rem] font-serif font-bold text-warm-brown leading-tight">KeizoKode: Always There.</p>
            <span className="tag text-[0.3rem] py-[1px]">Mac only</span>
          </div>
          <p className="text-[0.35rem] font-mono font-bold text-muted-ink/70 leading-tight">
            One-click logging. No browser needed.
          </p>
          <div className="flex items-center gap-2 mt-1">
            <a
              href="/downloads/keizokode-macos.zip"
              className="font-mono font-bold text-[0.35rem] text-warm-paper bg-soft-coral py-[3px] px-2 border border-warm-brown hover:opacity-90 transition-opacity"
              download
            >
              ⬇ Download
            </a>
          </div>
          <div className="text-[0.4rem] font-mono font-bold text-muted-ink/70 mt-1.5 space-y-px leading-snug">
            <p>1. Download &amp; unzip</p>
            <p>2. Run <code className="text-muted-ink/50">xattr -c ~/Downloads/KeizoKode.app</code> in Terminal</p>
            <p>3. Right‑click → Open (first launch)</p>
          </div>
        </div>
      </div>

      {/* Right 60% — slim menu bar at top */}
      <div className="flex-1 flex flex-col">
        <div className="h-[22px] bg-[#2b2b2b] rounded-tr flex items-center px-2 select-none">
          <div className="flex items-center gap-1.5 text-[0.4rem] font-mono text-white/70">
            <span className="text-xs leading-none"></span>
            <span className="font-semibold text-white/90 text-[0.45rem]">Keizo</span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-[0.35rem] font-mono text-white/50">
            <span className="hidden sm:inline">📶</span>
            <span className="hidden sm:inline">🔋</span>
            <span>{time}</span>
            <span className="relative inline-flex items-center justify-center">
              <AnimatePresence>
                {cursorPhase !== "done" && (
                  <motion.span
                    className="absolute z-40 text-[0.55rem] pointer-events-none"
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
                <Onigiri size={14} emotion="happy" className="shrink-0 animate-keizo-wiggle-slow" style={{ animationDelay: "4s" }} />
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

      {/* Popover above the menu bar */}
      <AnimatePresence>
        {popover && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="absolute top-[26px] right-1 z-50 w-32 frame-block p-1.5 shadow-lg"
          >
            <div className="flex items-center gap-1 w-full font-mono text-[0.4rem] text-warm-paper bg-soft-coral py-1 px-1.5 border-2 border-warm-brown text-left cursor-default">
              <span className="text-[0.45rem]">✏️</span>
              <span>New log</span>
            </div>
            <div className="flex items-center gap-1 w-full text-[0.35rem] font-mono text-muted-ink/60 py-1 px-1.5 text-left cursor-default mt-px">
              <span className="text-[0.45rem]">📊</span>
              <span>Dashboard →</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
