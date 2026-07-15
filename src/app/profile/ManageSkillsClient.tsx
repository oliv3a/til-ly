"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { UserSkillWithSkill } from "@/types"
import { toast } from "sonner"
import AnimatedButton from "@/lib/motion/components/AnimatedButton"
import AnimatedCard from "@/lib/motion/components/AnimatedCard"

interface Props {
  initialSkills: UserSkillWithSkill[]
}

export default function ManageSkillsClient({ initialSkills }: Props) {
  const [skills, setSkills] = useState(initialSkills)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [mergeId, setMergeId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const closeMerge = useCallback(() => setMergeId(null), [])

  useEffect(() => {
    if (!mergeId) return
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeMerge()
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeMerge()
    }
    document.addEventListener("mousedown", handle)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handle)
      document.removeEventListener("keydown", handleKey)
    }
  }, [mergeId, closeMerge])

  async function createSkill(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)

    const res = await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    })

    if (res.ok) {
      const skill = await res.json()
      setSkills((prev) => [{ id: "", logCount: 0, skill }, ...prev])
      setShowForm(false)
      setName("")
      toast.success(`"${skill.name}" created`)
    } else {
      const err = await res.json()
      toast.error(err.error || "Failed to create skill")
    }
    setSubmitting(false)
  }

  async function handleRename(skillId: string) {
    if (!editName.trim()) return

    const res = await fetch(`/api/skills/${skillId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName }),
    })
    if (res.ok) {
      const updated = await res.json()
      setSkills((prev) =>
        prev.map((s) =>
          s.skill.id === skillId ? { ...s, skill: updated } : s,
        ),
      )
      setEditingId(null)
      setEditName("")
    } else {
      const err = await res.json()
      toast.error(err.error || "Failed to rename")
    }
  }

  async function handleDelete(skillId: string, skillName: string) {
    if (!confirm(`Delete "${skillName}"? It will be removed from all logs.`)) return

    const res = await fetch(`/api/skills/${skillId}`, { method: "DELETE" })
    if (res.ok) {
      setSkills((prev) => prev.filter((s) => s.skill.id !== skillId))
      toast.success(`"${skillName}" deleted`)
    } else {
      const err = await res.json()
      toast.error(err.error || "Failed to delete")
    }
  }

  async function handleMerge(sourceId: string, targetId: string) {
    const res = await fetch(`/api/skills/${sourceId}/merge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetSkillId: targetId }),
    })
    if (res.ok) {
      const data = await res.json()
      setSkills((prev) =>
        prev
          .filter((s) => s.skill.id !== sourceId)
          .map((s) => (s.skill.id === targetId ? data.target : s)),
      )
      closeMerge()
      toast.success(`Merged into "${data.mergedInto}"`)
    } else {
      const err = await res.json()
      toast.error(err.error || "Failed to merge")
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-lg text-warm-brown">Manage Skills</h2>
        <AnimatedButton onClick={() => setShowForm(!showForm)} variant="sm-primary" className="text-[0.6rem]">
          {showForm ? "Cancel" : "+ New Skill"}
        </AnimatedButton>
      </div>

      {showForm && (
        <form onSubmit={createSkill} className="frame-block p-3 mb-3 space-y-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. TypeScript, Docker, PostgreSQL"
            className="field-coral w-full text-[0.6rem]"
            autoFocus
          />
          <AnimatedButton type="submit" disabled={submitting} variant="sm-primary" className="w-full text-[0.6rem]">
            {submitting ? "Creating..." : "Create Skill"}
          </AnimatedButton>
        </form>
      )}

      {skills.length === 0 && !showForm && (
        <div className="frame-block p-6 text-center">
          <p className="font-serif text-base text-muted-ink/50">No skills yet</p>
          <p className="text-[0.65rem] font-mono text-muted-ink/40 mt-1">Skills appear as you tag them in study logs</p>
        </div>
      )}

      <div className="space-y-1">
        {skills.map((s) => (
          <AnimatedCard key={s.id} hoverLift={false} className="frame-block p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              {editingId === s.skill.id ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="field-coral flex-1 text-[0.6rem]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(s.skill.id)
                      if (e.key === "Escape") setEditingId(null)
                    }}
                  />
                  <AnimatedButton onClick={() => handleRename(s.skill.id)} variant="sm-primary" className="!px-1.5 !py-0.5 text-[0.5rem]">Save</AnimatedButton>
                  <AnimatedButton onClick={() => setEditingId(null)} variant="sm" className="!px-1.5 !py-0.5 text-[0.5rem]">X</AnimatedButton>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[0.65rem] text-warm-brown">{s.skill.name}</span>
                  <span className="text-[0.55rem] font-mono text-muted-ink/40">{s.logCount} log{s.logCount !== 1 ? "s" : ""}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <AnimatedButton
                onClick={() => { setEditingId(s.skill.id); setEditName(s.skill.name) }}
                variant="sm"
                className="!px-1.5 !py-0.5 text-[0.5rem]"
              >
                <span style={{ display: "inline-block", transform: "scaleX(-1)" }}>✏️</span>
              </AnimatedButton>
              <AnimatedButton
                onClick={() => handleDelete(s.skill.id, s.skill.name)}
                variant="sm"
                className="!px-1.5 !py-0.5 text-[0.5rem]"
              >
                🗑
              </AnimatedButton>
              <div className="relative">
                <AnimatedButton
                  onClick={() => setMergeId(mergeId === s.skill.id ? null : s.skill.id)}
                  variant="sm"
                  className="!px-1.5 !py-0.5 text-[0.5rem]"
                >
                  Merge
                </AnimatedButton>
                {mergeId === s.skill.id && (
                  <div
                    ref={dropdownRef}
                    className="absolute right-0 top-full mt-0.5 z-50 frame-block p-2 min-w-[160px]"
                  >
                    <p className="text-[0.55rem] font-mono text-muted-ink/60 mb-1">Merge into...</p>
                    {skills
                      .filter((t) => t.skill.id !== s.skill.id)
                      .map((t) => (
                        <AnimatedButton
                          key={t.skill.id}
                          onClick={() => handleMerge(s.skill.id, t.skill.id)}
                          variant="sm"
                          className="block w-full text-left !px-2 !py-0.5 text-[0.55rem] mb-0.5"
                        >
                          {t.skill.name} ({t.logCount} logs)
                        </AnimatedButton>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </AnimatedCard>
        ))}
      </div>
    </div>
  )
}
