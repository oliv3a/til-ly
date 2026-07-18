"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "motion/react"
import BrandLogo from "@/components/BrandLogo"
import { staggerContainer, staggerItem } from "@/lib/motion/variants"
import { parseAiSummary } from "@/lib/ai-summary"
import { colorForSkill } from "@/lib/skill-colors"

interface Log {
  id: string
  title: string
  content: string
  createdAt: string
  type: string
  aiSummary: string | null
  skillTags: { skill: { id: string; name: string } }[]
  goalLinks: { goal: { id: string; title: string } }[]
}

interface SkillOption {
  id: string
  name: string
}

interface ComputedSkill {
  id: string
  logCount: number
  skill: { id: string; name: string }
}

function relativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "today"
  if (days === 1) return "yesterday"
  return `${days}d ago`
}

export default function LogsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [logs, setLogs] = useState<Log[]>([])
  const [skills, setSkills] = useState<SkillOption[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const pageRef = useRef(1)

  const search = searchParams.get("search") || ""
  const skillFilter = searchParams.get("skill") || ""
  const sort = searchParams.get("sort") || "newest"

  useEffect(() => {
    setLoading(true)
    setLogs([])
    setHasMore(false)
    pageRef.current = 1
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (skillFilter) params.set("skill", skillFilter)
    if (sort !== "newest") params.set("sort", sort)
    params.set("page", "1")

    fetch(`/api/logs?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.logs)
        setHasMore(data.hasMore)
        setLoading(false)
      })
  }, [search, skillFilter, sort])

  async function loadMore() {
    setLoadingMore(true)
    pageRef.current += 1
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (skillFilter) params.set("skill", skillFilter)
    if (sort !== "newest") params.set("sort", sort)
    params.set("page", String(pageRef.current))
    try {
      const res = await fetch(`/api/logs?${params.toString()}`)
      const data = await res.json()
      setLogs((prev) => [...prev, ...data.logs])
      setHasMore(data.hasMore)
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetch("/api/skills")
      .then((r) => r.json())
      .then((data: ComputedSkill[]) => setSkills(data.map((s) => ({ id: s.skill.id, name: s.skill.name }))))
  }, [])

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/logs?${params.toString()}`)
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="px-4 py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-serif text-lg text-warm-brown">Study Logs</h1>
        <Link
          href="/logs/new"
          className="btn-base btn-sm btn-coral btn-interact text-[0.5rem]"
        >
          + New log
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Search logs…"
          value={search}
          onChange={(e) => updateParam("search", e.target.value)}
          className="field-coral text-[0.5rem] px-2 py-1 min-w-[120px] flex-1"
        />
        <select
          value={skillFilter}
          onChange={(e) => updateParam("skill", e.target.value)}
          className="field-coral text-[0.5rem] px-2 py-1"
        >
          <option value="">All skills</option>
          {skills.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="field-coral text-[0.5rem] px-2 py-1"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      {/* Logs grid */}
      {loading ? (
        <p className="text-[0.5rem] font-mono text-muted-ink/50">Loading…</p>
      ) : logs.length === 0 ? (
        <div className="text-center py-8">
          <BrandLogo size={40} className="mx-auto mb-2" />
          <p className="text-[0.55rem] font-mono text-muted-ink/50">No logs found</p>
          <Link
            href="/logs/new"
            className="btn-base btn-sm btn-coral btn-interact inline-flex items-center gap-1 text-[0.5rem] mt-2"
          >
            Write your first log
          </Link>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {logs.map((log) => (
            <motion.div key={log.id} variants={staggerItem}>
              <Link
                href={`/logs/${log.id}`}
                className="frame-block p-2 flex flex-col h-full hover:opacity-85 transition-opacity cursor-pointer"
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <h3 className="font-serif text-sm text-warm-brown leading-tight line-clamp-2">{log.title}</h3>
                  <span className="text-[0.4rem] font-mono text-muted-ink/40 shrink-0 mt-0.5">
                    {relativeDate(log.createdAt)}
                  </span>
                </div>
                {log.aiSummary && (
                  <p className="text-[0.5rem] font-mono text-muted-ink/60 line-clamp-3 leading-relaxed mb-auto">
                    {parseAiSummary(log.aiSummary).summary}
                  </p>
                )}
                {log.skillTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {log.skillTags.slice(0, 3).map((st) => {
                      const c = colorForSkill(st.skill.name)
                      return (
                        <span
                          key={st.skill.id}
                          className="text-[0.45rem] font-mono font-medium px-1 py-px leading-none"
                          style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
                        >
                          {st.skill.name}
                        </span>
                      )
                    })}
                    {log.skillTags.length > 3 && (
                      <span className="text-[0.25rem] font-mono text-muted-ink/40">+{log.skillTags.length - 3}</span>
                    )}
                  </div>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
        {hasMore && (
          <div className="flex justify-center mt-4">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="btn-base btn-outline btn-interact text-[0.55rem]"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </>
      )}
    </motion.div>
  )
}
