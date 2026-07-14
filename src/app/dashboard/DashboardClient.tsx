"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import Onigiri from "@/components/Onigiri"
import { parseAiSummary } from "@/lib/ai-summary"
import { colorForSkill } from "@/lib/skill-colors"
import { staggerContainer, staggerItem } from "@/lib/motion/variants"
import { easings } from "@/lib/motion/tokens"

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
  recentLogs: any[]
  recentProjectUpdates: any[]
  goals: any[]
  skills: any[]
  recommendation: { topic: string; reason: string; estimatedTime: string } | null
  initialMonthCache: Record<string, Record<number, LogDayItem[]>>
}

function relativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "today"
  if (days === 1) return "yesterday"
  return `${days}d ago`
}

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function monthName(year: number, month: number) {
  return new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" })
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

  const totalGoals = data.goals?.length ?? 0
  const totalTicked = data.goals?.reduce((s: number, g: any) =>
    s + (g.roadmapItems?.filter((i: any) => i.isComplete).length ?? 0), 0) ?? 0
  const totalItems = data.goals?.reduce((s: number, g: any) =>
    s + (g.roadmapItems?.length ?? 0), 0) ?? 0

  // ─── Calendar state ──────────────────────────────────────
  const today = new Date()
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  const [navMonth, setNavMonth] = useState(today.getMonth())
  const [navYear, setNavYear] = useState(today.getFullYear())
  const [monthData, setMonthData] = useState<Record<number, LogDayItem[]>>(initialData.initialMonthCache?.[currentMonthKey] || {})
  const [selectedDayLogs, setSelectedDayLogs] = useState<LogDayItem[] | null>(null)
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 })
  const popoverRef = useRef<HTMLDivElement>(null)
  const monthCache = useRef<Record<string, Record<number, LogDayItem[]>>>(initialData.initialMonthCache || {})

  const firstDay = new Date(navYear, navMonth, 1).getDay()
  const daysInMonth = new Date(navYear, navMonth + 1, 0).getDate()
  const prevMonthDays = new Date(navYear, navMonth, 0).getDate()

  const fetchMonthData = useCallback((year: number, month: number) => {
    const key = `${year}-${String(month + 1).padStart(2, "0")}`
    setMonthData(monthCache.current[key] || {})
  }, [])

  function goPrev() {
    const m = navMonth - 1
    if (m < 0) {
      setNavYear(navYear - 1)
      setNavMonth(11)
      fetchMonthData(navYear - 1, 11)
    } else {
      setNavMonth(m)
      fetchMonthData(navYear, m)
    }
  }

  function goNext() {
    const m = navMonth + 1
    if (m > 11) {
      setNavYear(navYear + 1)
      setNavMonth(0)
      fetchMonthData(navYear + 1, 0)
    } else {
      setNavMonth(m)
      fetchMonthData(navYear, m)
    }
  }

  function handleDayClick(e: React.MouseEvent, day: number) {
    const logs = monthData[day]
    if (!logs || logs.length === 0) return
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPopoverPos({ x: Math.min(rect.left, window.innerWidth - 180), y: rect.bottom + 4 })
    setSelectedDayLogs(logs)
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setSelectedDayLogs(null)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedDayLogs(null)
    }
    if (selectedDayLogs) {
      document.addEventListener("mousedown", handleClick)
      document.addEventListener("keydown", handleEscape)
    }
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [selectedDayLogs])

  function renderDayCell(day: number, isCurrentMonth: boolean) {
    const logs = isCurrentMonth ? monthData[day] || [] : []
    const count = logs.length
    const isToday = isCurrentMonth && day === today.getDate() && navMonth === today.getMonth() && navYear === today.getFullYear()

    const tealShades = ["#7AD8C8", "#4DC4B0", "#2BA88F", "#B8C8B0", "#6BC4B0", "#95D8C8"]

    return (
      <div
        key={`${isCurrentMonth ? "c" : "o"}-${day}`}
        onClick={(e) => isCurrentMonth && handleDayClick(e, day)}
        className={`relative min-h-[4rem] p-[2px] border text-left ${
          isCurrentMonth && count > 0 ? "cursor-pointer hover:bg-warm-brown/[0.03]" : ""
        } ${
          isToday
            ? "border-soft-coral bg-soft-coral/[0.06]"
            : "border-warm-brown/10"
        }`}
      >
        <span className={`inline-flex items-center justify-center w-3.5 h-3.5 text-[0.4rem] font-mono font-bold leading-none ${
          isToday ? "bg-soft-coral text-warm-paper rounded-full" : isCurrentMonth ? "text-muted-ink/60" : "text-muted-ink/30"
        }`}>
          {day}
        </span>
        {count > 0 && (
          <div className="mt-px space-y-[1px] px-[2px]">
            {logs.slice(0, 3).map((log) => {
              const skillName = log.skillTags?.[0]?.skill?.name || "default"
              let hash = 0
              for (let i = 0; i < skillName.length; i++) {
                hash = skillName.charCodeAt(i) + ((hash << 5) - hash)
              }
              const barColor = tealShades[Math.abs(hash) % tealShades.length]
              return (
                <div
                  key={log.id}
                  className="h-[3px] rounded-full"
                  style={{ background: barColor }}
                />
              )
            })}
            {count > 3 && (
              <span className="text-[0.35rem] font-mono font-bold text-muted-ink/50 leading-none">
                +{count - 3}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  function renderCalendar() {
    const cells: React.ReactNode[] = []

    dayNames.forEach((d) => {
      cells.push(
        <div key={`h-${d}`} className="text-[0.35rem] font-mono font-medium text-muted-ink/40 text-center py-[2px]">
          {d}
        </div>
      )
    })

    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push(renderDayCell(prevMonthDays - i, false))
    }

    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(renderDayCell(d, true))
    }

    const totalCells = cells.length
    const remaining = 7 - (totalCells % 7)
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        cells.push(renderDayCell(d, false))
      }
    }

    return cells
  }

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
          <div className="sm:col-span-2">
            <MacSplitCard />
          </div>
        </div>
      </motion.div>

      <div className="section-divider" />

      {/* 2. Activity Calendar — what have I been doing? */}
      <motion.div variants={staggerItem} className="dash-section">
        <p className="dash-section-title mb-2">
          <span className="text-muted-ink/25">02</span> Activity
        </p>

        {/* Month header with navigation */}
        <div className="flex items-center justify-between mb-2">
          <button onClick={goPrev} className="btn-base btn-sm btn-interact-bg text-[0.45rem] px-1.5">
            ◀
          </button>
          <p className="font-serif text-sm text-warm-brown font-medium">
            {monthName(navYear, navMonth)}
          </p>
          <button onClick={goNext} className="btn-base btn-sm btn-interact-bg text-[0.45rem] px-1.5">
            ▶
          </button>
        </div>

        {/* Calendar grid */}
        <div className="border border-warm-brown/10">
          <div className="grid grid-cols-7">
            {renderCalendar()}
          </div>
        </div>

        {/* Empty state */}
        {Object.keys(monthData).length === 0 && navMonth === today.getMonth() && navYear === today.getFullYear() && (
          <div className="dash-card text-center py-6 mt-2">
            <p className="font-serif text-base text-warm-brown mb-1">No activity yet</p>
            <Link href="/logs/new" className="btn-base btn-sm btn-interact text-[0.6rem]">
              Start your first log
            </Link>
          </div>
        )}

        {/* Floating popover — list of logs for the clicked day */}
        <AnimatePresence>
          {selectedDayLogs && (
            <motion.div
              ref={popoverRef}
              initial={{ opacity: 0, y: -4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.96 }}
              transition={{ duration: 0.15, ease: easings.smooth }}
              className="fixed z-50 w-48 frame-block p-2 shadow-lg max-h-60 overflow-y-auto"
              style={{ left: popoverPos.x, top: popoverPos.y }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[0.45rem] font-mono font-medium text-muted-ink/50">
                  {selectedDayLogs.length} log{selectedDayLogs.length !== 1 ? "s" : ""}
                </p>
                <button
                  onClick={() => setSelectedDayLogs(null)}
                  className="text-muted-ink/30 hover:text-muted-ink/60 shrink-0 text-[0.45rem] leading-none"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-1">
                {selectedDayLogs.map((log) => {
                  const skillName = log.skillTags?.[0]?.skill?.name
                  const dotColor = skillName ? colorForSkill(skillName).border : "#7AD8C8"
                  return (
                    <Link
                      key={log.id}
                      href={`/logs/${log.id}`}
                      className="flex items-start gap-1.5 p-1 rounded-sm hover:bg-warm-brown/[0.05] transition-colors group"
                    >
                      <span
                        className="w-[5px] h-[5px] rounded-full mt-[5px] shrink-0"
                        style={{ background: dotColor }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.55rem] font-mono text-warm-brown truncate group-hover:underline">
                          {log.title}
                        </p>
                        <p className="text-[0.35rem] font-mono text-muted-ink/40">
                          {new Date(log.createdAt).toLocaleDateString("en-US", {
                            weekday: "short", month: "short", day: "numeric",
                          })}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
      <div className="w-[40%] flex items-center gap-2.5 p-2.5 shrink-0">
        <Onigiri size={24} emotion="happy" className="shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-[0.65rem] font-serif font-bold text-warm-brown leading-tight">KeizoKode: Always There.</p>
            <span className="tag text-[0.4rem] py-[1px]">Mac only</span>
          </div>
          <p className="text-[0.5rem] font-mono font-bold text-muted-ink/70 leading-snug mb-1.5">
            One-click logging. No browser needed.
          </p>
          <a
            href="/downloads/keizokode-macos.zip"
            className="inline-block font-mono font-bold text-[0.45rem] text-warm-paper bg-soft-coral py-[4px] px-2.5 border border-warm-brown hover:opacity-90 transition-opacity"
            download
          >
            ⬇ Download
          </a>
          <div className="text-[0.5rem] font-mono font-bold text-muted-ink/70 mt-1.5 space-y-[2px] leading-snug">
            <p>1. Download &amp; unzip</p>
            <p>2. Run <code className="text-muted-ink/50">xattr -c ~/Downloads/KeizoKode.app</code></p>
            <p>3. Right‑click → Open (first launch)</p>
          </div>
        </div>
      </div>

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
