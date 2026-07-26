"use client"

import { useState } from "react"
import { motion } from "motion/react"
import AnimatedButton from "@/lib/motion/components/AnimatedButton"
import BrandLogo from "@/components/BrandLogo"
import { staggerContainer, staggerItem } from "@/lib/motion/variants"

interface Props {
  logId: string
  initialNextStep: string | null
}

export default function NextRecommendation({ logId, initialNextStep }: Props) {
  const [nextStep, setNextStep] = useState(initialNextStep)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initialNextStep ?? "")
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    try {
      const res = await fetch(`/api/logs/${logId}/analyze`, { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        if (data.recommendation) {
          setNextStep(data.recommendation)
          setDraft(data.recommendation)
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
      body: JSON.stringify({ nextStep: draft || null }),
    })
    if (res.ok) {
      setNextStep(draft || null)
      setEditing(false)
    }
    setSaving(false)
  }

  if (generating) {
    return (
      <div className="frame-block p-4 mb-4">
        <div className="section-header mb-2">What to Learn Next</div>
        <div className="flex items-center gap-2 text-[0.65rem] font-mono text-muted-ink/50">
          <BrandLogo size={32} />
          Figuring out your next step...
        </div>
      </div>
    )
  }

  if (!nextStep && !editing) {
    return (
      <div className="frame-block p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="section-header">What to Learn Next</div>
          <AnimatedButton onClick={handleGenerate} variant="sm" className="text-[0.55rem]">
            Generate
          </AnimatedButton>
        </div>
        <p className="text-[0.65rem] font-mono text-muted-ink/50">
          Get a personalized suggestion for what to study next.
        </p>
      </div>
    )
  }

  return (
    <div className="frame-block p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="section-header">What to Learn Next</div>
        {!editing && (
          <AnimatedButton onClick={() => { setDraft(nextStep ?? ""); setEditing(true) }} variant="sm" className="text-[0.55rem]">
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
            {nextStep}
          </motion.p>
        </motion.div>
      )}
    </div>
  )
}
