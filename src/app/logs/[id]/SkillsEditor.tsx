"use client"

import { useState, useEffect, useRef } from "react"
import AnimatedButton from "@/lib/motion/components/AnimatedButton"

interface SkillTag {
  id: string
  skill: { id: string; name: string; category: string | null }
}

interface Props {
  logId: string
  initialSkillTags: SkillTag[]
}

export default function SkillsEditor({ logId, initialSkillTags }: Props) {
  const [skillTags, setSkillTags] = useState(initialSkillTags)
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [knownSkills, setKnownSkills] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/skills")
      .then((res) => res.ok && res.json())
      .then((data: { id: string; skill: { id: string; name: string; category: string | null } }[]) => {
        if (Array.isArray(data)) {
          const names = data
            .filter((s) => !skillTags.some((st) => st.skill.id === s.skill?.id))
            .map((s) => s.skill.name)
          setKnownSkills(names)
        }
      })
      .catch(() => {})
  }, [skillTags])

  async function handleAdd() {
    const name = input.trim()
    if (!name || saving) return
    setSaving(true)
    try {
      const res = await fetch(`/api/logs/${logId}/skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        const data = await res.json()
        setSkillTags(data.skillTags ?? [])
        setInput("")
      }
    } finally {
      setSaving(false)
    }
    inputRef.current?.focus()
  }

  async function handleRemove(skillTagId: string) {
    if (saving) return
    setSaving(true)
    try {
      const res = await fetch(`/api/logs/${logId}/skills/${skillTagId}`, { method: "DELETE" })
      if (res.ok) {
        const data = await res.json()
        setSkillTags(data.skillTags ?? [])
      }
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAdd()
    }
  }

  const filtered = knownSkills.filter((name) =>
    name.toLowerCase().includes(input.toLowerCase()),
  )

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <div className="section-header inline-block">Skills</div>
        {!editing && (
          <AnimatedButton onClick={() => setEditing(true)} variant="sm">
            Manage
          </AnimatedButton>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {skillTags.map((st) => (
          <span key={st.id} className="tag flex items-center gap-1">
            {st.skill.name}
            {editing && (
              <button
                onClick={() => handleRemove(st.id)}
                disabled={saving}
                className="text-muted-ink/50 hover:text-warm-brown"
              >
                ✕
              </button>
            )}
          </span>
        ))}
      </div>
      {editing && (
        <div className="mt-1.5 flex gap-1">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a skill..."
              className="field-coral w-full text-[0.6rem]"
              autoFocus
            />
            {input && filtered.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 border border-warm-brown bg-white max-h-32 overflow-y-auto">
                {filtered.slice(0, 8).map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setInput(name)
                      inputRef.current?.focus()
                    }}
                    className="block w-full text-left px-2 py-1 text-[0.55rem] font-mono hover:bg-warm-paper"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <AnimatedButton onClick={handleAdd} disabled={!input.trim() || saving} variant="sm-primary">
            {saving ? "..." : "Add"}
          </AnimatedButton>
          <AnimatedButton onClick={() => { setEditing(false); setInput("") }} variant="sm">
            Done
          </AnimatedButton>
        </div>
      )}
    </div>
  )
}
