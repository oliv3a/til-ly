"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { motion } from "motion/react"
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

  const chartData = useMemo(() => {
    const days: { label: string; count: number }[] = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dayStart = new Date(d)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(d)
      dayEnd.setHours(23, 59, 59, 999)
      const count = data.recentLogs?.filter((log: any) => {
        const logDate = new Date(log.createdAt)
        return logDate >= dayStart && logDate <= dayEnd
      }).length ?? 0
      const label = d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2)
      days.push({ label, count })
    }
    return days
  }, [data.recentLogs])

  const maxCount = Math.max(...chartData.map((d) => d.count), 1)

  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  const firstDay = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

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
        <div className="flex items-start gap-6 continue-learning-row">
          <div className="flex-1">
            <p className="dash-section-title mb-4">
              <span className="text-muted-ink/25">01</span> Continue Learning
            </p>
            <div className="dash-card">
              <p className="font-serif text-xl text-warm-brown mb-3">
                {data.recommendation
                  ? `Study ${data.recommendation.topic}`
                  : "What did you learn today?"}
              </p>
              {data.recommendation && (
                <p className="text-[0.55rem] font-mono text-muted-ink/50 mb-3">
                  {data.recommendation.reason} &middot; Est. {data.recommendation.estimatedTime}
                </p>
              )}
              <Link
                href="/logs/new"
                className="btn-base btn-coral btn-interact inline-flex items-center gap-1 text-[0.65rem]"
              >
                Log progress &rarr;
              </Link>
            </div>
          </div>
          <div className="cal-widget shrink-0">
            <div className="dash-card">
              <div className="flex items-center justify-between mb-2">
                <p className="dash-section-title mb-0">
                  {today.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </p>
                {data.streakCount > 0 && (
                  <span className="font-mono text-[0.5rem] text-soft-coral">{data.streakCount}d</span>
                )}
                <span className="font-mono text-[0.45rem] text-muted-ink/30">{today.getFullYear()}</span>
              </div>
              <div className="cal-grid">
                {dayNames.map((d) => (
                  <span key={d} className="cal-day cal-day-header">{d}</span>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <span key={`empty-${i}`} className="cal-day" />
                ))}
                {calendarDays.map((d) => {
                  const count = data.logsByDay?.[d] ?? 0
                  const cls = [
                    "cal-day",
                    d === today.getDate() ? "today" : "",
                    streakDays.has(d) && d !== today.getDate() ? "streak-day" : "",
                    count > 0 && !streakDays.has(d) ? "has-activity" : "",
                    count >= 3 ? "many" : "",
                  ].filter(Boolean).join(" ")
                  return <span key={d} className={cls}>{d}</span>
                })}
              </div>
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
        <div className="flex items-end gap-[3px] h-8 mb-4 px-0.5">
          {chartData.map((d, i) => (
            <motion.div
              key={i}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.3, ease: easings.smooth, delay: i * 0.03 }}
              className="flex-1 rounded-[1px]"
              style={{
                height: `${Math.max((d.count / maxCount) * 100, d.count > 0 ? 20 : 4)}%`,
                background: "var(--color-warm-brown)",
                opacity: d.count > 0 ? 0.5 : 0.12,
                transformOrigin: "bottom",
              }}
            />
          ))}
        </div>
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
