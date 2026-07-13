"use client"

import { useState } from "react"
import Link from "next/link"
import AnimatedButton from "@/lib/motion/components/AnimatedButton"
import AnimatedCard from "@/lib/motion/components/AnimatedCard"
import AnimatedProgress from "@/lib/motion/components/AnimatedProgress"

interface ProjectListItem {
  id: string
  title: string
  description: string | null
  techStack: string | null
  status: string
  progressPct: number
  createdAt: string
  updatedAt: string
  _count: { updates: number; steps: number }
  steps: { id: string; isComplete: boolean }[]
}

interface Props {
  initialProjects: ProjectListItem[]
}

export default function ProjectsClient({ initialProjects }: Props) {
  const [projects, setProjects] = useState(initialProjects)
  const [filter, setFilter] = useState<string>("all")

  const filtered = filter === "all" ? projects : projects.filter((p) => p.status === filter)

  async function deleteProject(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" })
    if (res.ok) setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-[0.6rem] font-mono text-muted-ink/60">Filter:</span>
        {["all", "in_progress", "completed", "archived"].map((s) => (
          <AnimatedButton
            key={s}
            onClick={() => setFilter(s)}
            variant={filter === s ? "sm-primary" : "sm"}
          >
            {s === "all" ? "All" : s.replace("_", " ")}
          </AnimatedButton>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="frame-block p-6 text-center">
          <p className="font-serif text-base text-muted-ink/50">No projects yet</p>
          <p className="text-[0.65rem] font-mono text-muted-ink/40 mt-1">Create your first project to track builds</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((p) => (
          <AnimatedCard key={p.id} className="frame-block p-4">
            <div className="flex items-start justify-between gap-3">
              <Link href={`/projects/${p.id}`} className="flex-1 min-w-0 group">
                <h3 className="font-serif text-sm text-warm-brown truncate group-hover:underline">{p.title}</h3>
                {p.description && <p className="text-[0.6rem] font-mono text-muted-ink/60 mt-0.5 line-clamp-1">{p.description}</p>}
              </Link>
              <span className={`shrink-0 border px-1.5 py-0.5 text-[0.55rem] font-mono ${
                p.status === "completed" ? "border-warm-brown bg-muted-blue/10" :
                p.status === "archived" ? "border-warm-brown opacity-50" :
                "border-warm-brown"
              }`}>
                {p.status.replace("_", " ")}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-3 text-[0.55rem] font-mono text-muted-ink/70">
              <span className="border border-warm-brown px-1.5 py-0.5 bg-white">
                {p.progressPct}% complete
              </span>
              <span>{p._count.steps} step{p._count.steps !== 1 ? "s" : ""}</span>
              <span>{p._count.updates} update{p._count.updates !== 1 ? "s" : ""}</span>
              {p.techStack && <span className="truncate">{p.techStack}</span>}
            </div>

            <AnimatedProgress value={p.progressPct} height={6} className="mt-2" />

            <div className="mt-2 flex gap-1 justify-end">
              <Link href={`/projects/${p.id}`} className="btn-base btn-sm btn-interact-bg !px-2 !py-0.5 text-[0.5rem]">View</Link>
              <AnimatedButton onClick={() => deleteProject(p.id, p.title)} variant="sm" className="!px-2 !py-0.5 text-[0.5rem]">🗑</AnimatedButton>
            </div>
          </AnimatedCard>
        ))}
      </div>
    </div>
  )
}
