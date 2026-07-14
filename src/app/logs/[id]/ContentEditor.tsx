"use client"

import { useState } from "react"
import AnimatedButton from "@/lib/motion/components/AnimatedButton"

interface Props {
  logId: string
  initialContent: string | null
}

export default function ContentEditor({ logId, initialContent }: Props) {
  const [content, setContent] = useState(initialContent ?? "")
  const [draft, setDraft] = useState("")
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  function handleEdit() {
    setDraft(content)
    setEditing(true)
  }

  function handleCancel() {
    setEditing(false)
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/logs/${logId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft || null }),
    })
    if (res.ok) {
      setContent(draft)
      setEditing(false)
    }
    setSaving(false)
  }

  return (
    <div className="frame-block p-4 mb-4">
      <div className="flex items-center justify-between mb-1">
        <div className="section-header inline-block">Description</div>
        {!editing && (
          <AnimatedButton onClick={handleEdit} variant="sm">
            {content ? "Edit" : "Add"}
          </AnimatedButton>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            className="field-coral w-full resize-y text-[0.65rem] font-mono"
            autoFocus
          />
          <div className="flex gap-1">
            <AnimatedButton onClick={handleSave} disabled={saving} variant="sm-primary">
              {saving ? "..." : "Save"}
            </AnimatedButton>
            <AnimatedButton onClick={handleCancel} variant="sm">Cancel</AnimatedButton>
          </div>
        </div>
      ) : content ? (
        <p className="text-[0.7rem] font-mono text-muted-ink/80 whitespace-pre-wrap leading-relaxed">
          {content}
        </p>
      ) : (
        <p className="text-[0.65rem] font-mono text-muted-ink/50 italic">No description</p>
      )}
    </div>
  )
}
