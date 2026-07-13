"use client"

import { useState, useMemo } from "react"
import type { UserSkillWithSkill } from "@/types"
import AnimatedButton from "@/lib/motion/components/AnimatedButton"

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

interface Props {
  skills: UserSkillWithSkill[]
  isOwner: boolean
  userId: string
}

export default function SkillsSection({ skills: propSkills, isOwner, userId }: Props) {
  const [skills, setSkills] = useState(propSkills)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const [editing, setEditing] = useState(false)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [deletions, setDeletions] = useState<Set<string>>(new Set())
  const [newSkillName, setNewSkillName] = useState("")
  const [newSkillCount, setNewSkillCount] = useState("5")
  const [saving, setSaving] = useState(false)

  const totalLogs = useMemo(() => skills.reduce((s, sk) => s + sk.logCount, 0), [skills])

  const visibleSkills = useMemo(() => skills.filter((sk) => sk.logCount > 0), [skills])

  const slices = useMemo(() => {
    if (visibleSkills.length === 0) return []
    const total = visibleSkills.reduce((s, sk) => s + sk.logCount, 0)
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

  async function handleSave() {
    setSaving(true)
    const edits: { action: string; skillName: string; logCount?: number }[] = []

    for (const name of deletions) {
      edits.push({ action: "delete", skillName: name })
    }

    for (const [name, countStr] of Object.entries(editValues)) {
      if (deletions.has(name)) continue
      const count = parseInt(countStr)
      if (!isNaN(count)) {
        edits.push({ action: "upsert", skillName: name, logCount: count })
      }
    }

    if (newSkillName.trim()) {
      edits.push({ action: "upsert", skillName: newSkillName.trim(), logCount: Math.max(1, parseInt(newSkillCount) || 1) })
    }

    if (edits.length === 0) { setSaving(false); return }
    const res = await fetch(`/api/portfolio/${userId}/skills`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ edits }),
    })
    if (res.ok) {
      const data = await res.json()
      setSkills(data.skills)
    }
    setEditing(false)
    setEditValues({})
    setDeletions(new Set())
    setNewSkillName("")
    setNewSkillCount("5")
    setSaving(false)
  }

  function handleCancel() {
    setEditing(false)
    setEditValues({})
    setDeletions(new Set())
    setNewSkillName("")
    setNewSkillCount("5")
  }

  function toggleDelete(name: string) {
    setDeletions((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  if (skills.length === 0) return null

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="section-header inline-block">⚡ Skills</div>
        {isOwner && !editing && (
          <AnimatedButton onClick={() => setEditing(true)} variant="sm">Edit</AnimatedButton>
        )}
      </div>

      {editing && (
        <div className="frame-block p-3 mb-3 space-y-2">
          <p className="text-[0.55rem] font-mono text-muted-ink/60 uppercase tracking-wider">Edit Skills</p>
          {skills.length === 0 && (
            <p className="text-[0.6rem] font-mono text-muted-ink/40">No skills yet. Add one below.</p>
          )}
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {skills.map((sk, i) => {
              const isDeleted = deletions.has(sk.skill.name)
              return (
                <div key={sk.skill.id} className={`flex items-center gap-2 ${isDeleted ? "opacity-40" : ""}`}>
                  <span
                    className="w-2 h-2 shrink-0 rounded-sm"
                    style={{ backgroundColor: isDeleted ? "#ccc" : COLORS[i % COLORS.length] }}
                  />
                  <span className="flex-1 text-[0.65rem] font-mono text-warm-brown truncate">{sk.skill.name}</span>
                  <input
                    type="number"
                    min={0}
                    className="field-coral w-16 text-[0.6rem] font-mono text-center"
                    value={editValues[sk.skill.name] ?? String(sk.logCount)}
                    onChange={(e) => setEditValues((prev) => ({ ...prev, [sk.skill.name]: e.target.value }))}
                    disabled={isDeleted}
                  />
                  <span className="text-[0.5rem] font-mono text-muted-ink/40">logs</span>
                  <AnimatedButton
                    onClick={() => toggleDelete(sk.skill.name)}
                    variant="sm"
                    className="text-[0.5rem] px-1.5 py-0.5 ml-1"
                    title={isDeleted ? "Undo delete" : "Delete skill"}
                  >
                    {isDeleted ? "↩" : "×"}
                  </AnimatedButton>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-warm-brown/10">
            <input
              type="text"
              placeholder="New skill name"
              className="field-coral flex-1 text-[0.6rem] font-mono"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
            />
            <input
              type="number"
              min={1}
              className="field-coral w-16 text-[0.6rem] font-mono text-center"
              value={newSkillCount}
              onChange={(e) => setNewSkillCount(e.target.value)}
            />
            <span className="text-[0.5rem] font-mono text-muted-ink/40">logs</span>
          </div>
          <div className="flex gap-1 pt-1">
            <AnimatedButton onClick={handleSave} disabled={saving} variant="sm-primary" className="text-[0.55rem]">
              {saving ? "..." : "Save"}
            </AnimatedButton>
            <AnimatedButton onClick={handleCancel} variant="sm" className="text-[0.55rem]">Cancel</AnimatedButton>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {/* Pie chart */}
        <div className="relative shrink-0">
          <svg width={200} height={200} viewBox="0 0 200 200">
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

          {/* Center label */}
          {totalLogs > 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="poster-heading text-xl">{totalLogs}</p>
                <p className="text-[0.45rem] font-mono text-muted-ink/50 uppercase tracking-wider">total logs</p>
              </div>
            </div>
          )}

          {/* Tooltip */}
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

        {/* Legend */}
        <div className="flex-1 min-w-0 w-full sm:w-auto">
          <div className="space-y-1">
            {skills.map((sk, i) => (
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
    </div>
  )
}
