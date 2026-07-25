"use client"

import { useState } from "react"
import { motion } from "motion/react"
import AnimatedButton from "@/lib/motion/components/AnimatedButton"
import BrandLogo from "@/components/BrandLogo"
import { staggerContainer, staggerItem } from "@/lib/motion/variants"

interface Props {
  logId: string
  initialConnection: string | null
}

export default function RealWorldConnection({ logId, initialConnection }: Props) {
  const [connection, setConnection] = useState(initialConnection)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initialConnection ?? "")
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    try {
      const res = await fetch(`/api/logs/${logId}/analyze`, { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        if (data.realWorldConnection) {
          setConnection(data.realWorldConnection)
          setDraft(data.realWorldConnection)
        }
      }
    } catch {
      // silent
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/logs/${logId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ realWorldConnection: draft || null }),
    })
    if (res.ok) {
      setConnection(draft || null)
      setEditing(false)
    }
    setSaving(false)
  }

  if (generating) {
    return (
      <div className="frame-block p-4 mb-4">
        <div className="section-header mb-2">🌍 Real World Connection</div>
        <div className="flex items-center gap-2 text-[0.65rem] font-mono text-muted-ink/50">
          <BrandLogo size={32} />
          Finding real world connection...
        </div>
      </div>
    )
  }

  if (!connection && !editing) {
    return (
      <div className="frame-block p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="section-header">🌍 Real World Connection</div>
          <AnimatedButton onClick={handleGenerate} variant="sm" className="text-[0.55rem]">
            Generate
          </AnimatedButton>
        </div>
        <p className="text-[0.65rem] font-mono text-muted-ink/50">
          See how this connects to real apps you use daily.
        </p>
      </div>
    )
  }

  return (
    <div className="frame-block p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="section-header">🌍 Real World Connection</div>
        {!editing && (
          <AnimatedButton onClick={() => { setDraft(connection ?? ""); setEditing(true) }} variant="sm" className="text-[0.55rem]">
            Edit
          </AnimatedButton>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            className="field-coral w-full resize-y text-[0.65rem] font-mono"
          />
          <div className="flex gap-1">
            <AnimatedButton onClick={handleSave} disabled={saving} variant="sm-primary" className="text-[0.55rem]">
              {saving ? "..." : "Save"}
            </AnimatedButton>
            <AnimatedButton onClick={() => setEditing(false)} variant="sm" className="text-[0.55rem]">Cancel</AnimatedButton>
          </div>
        </div>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
          <motion.p
            variants={staggerItem}
            className="font-serif text-sm text-turquoise leading-relaxed"
          >
            {connection}
          </motion.p>
        </motion.div>
      )}
    </div>
  )
}
