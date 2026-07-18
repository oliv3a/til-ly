"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { parseAiSummary, combineAiSummary, summaryToBullets } from "@/lib/ai-summary"
import AnimatedButton from "@/lib/motion/components/AnimatedButton"
import BrandLogo from "@/components/BrandLogo"
import { staggerContainer, staggerItem } from "@/lib/motion/variants"

interface Props {
  logId: string
  initialSummary: string | null
}

export default function AiSummaryEditor({ logId, initialSummary }: Props) {
  const [summary, setSummary] = useState(parseAiSummary(initialSummary))
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)

  async function handleGenerate() {
    setGenerating(true)
    setGenError(null)
    try {
      const res = await fetch(`/api/logs/${logId}/analyze`, { method: "POST" })
      if (!res.ok) throw new Error("Analysis failed")
      const data = await res.json()
      setSummary(parseAiSummary(data.aiSummary))
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Failed to generate summary")
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    const combined = combineAiSummary(summary.summary, summary.motivation)
    const res = await fetch(`/api/logs/${logId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aiSummary: combined || null }),
    })
    if (res.ok) setEditing(false)
    setSaving(false)
  }

  function handleCancel() {
    setSummary(parseAiSummary(initialSummary))
    setEditing(false)
  }

  return (
    <div className="frame-block p-4 mb-4">
      <div className="flex items-center justify-between mb-1">
        <div className="section-header inline-block">AI Summary</div>
        {!editing && summary.summary && (
          <AnimatedButton onClick={() => setEditing(true)} variant="sm">
            Edit
          </AnimatedButton>
        )}
      </div>

      {generating ? (
        <div className="flex items-center gap-2 text-[0.65rem] font-mono text-muted-ink/50">
          <BrandLogo size={32} />
          Generating AI summary...
        </div>
      ) : genError ? (
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-2">
          <motion.p variants={staggerItem} className="text-[0.65rem] font-mono text-warm-brown/80">{genError}</motion.p>
          <motion.div variants={staggerItem}>
            <AnimatedButton onClick={handleGenerate} variant="sm">Retry</AnimatedButton>
          </motion.div>
        </motion.div>
      ) : editing ? (
        <div className="space-y-2">
          <div>
            <label className="text-[0.55rem] font-mono text-muted-ink/60 block mb-0.5">Summary</label>
            <textarea
              value={summary.summary}
              onChange={(e) => setSummary((prev) => ({ ...prev, summary: e.target.value }))}
              rows={3}
              className="field-coral w-full resize-y text-[0.65rem] font-mono"
            />
          </div>
          <div>
            <label className="text-[0.55rem] font-mono text-muted-ink/60 block mb-0.5">Motivation note (optional)</label>
            <textarea
              value={summary.motivation ?? ""}
              onChange={(e) => setSummary((prev) => ({ ...prev, motivation: e.target.value || null }))}
              rows={2}
              className="field-coral w-full resize-y text-[0.65rem] font-mono"
            />
          </div>
          <div className="flex gap-1">
            <AnimatedButton onClick={handleSave} disabled={saving} variant="sm-primary">
              {saving ? "..." : "Save"}
            </AnimatedButton>
            <AnimatedButton onClick={handleCancel} variant="sm">Cancel</AnimatedButton>
          </div>
        </div>
      ) : summary.summary ? (
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-2">
          <motion.ul variants={staggerContainer} className="space-y-1">
            {summaryToBullets(summary.summary).map((point, i) => (
              <motion.li
                key={i}
                variants={staggerItem}
                className="flex gap-2 text-[0.65rem] font-mono text-muted-ink/70 leading-relaxed"
              >
                <span className="text-turquoise mt-0.5 select-none">▶</span>
                <span>{point}</span>
              </motion.li>
            ))}
          </motion.ul>
          {summary.motivation && (
            <motion.div
              variants={staggerItem}
              className="pt-3 mt-3 border-t-2 border-warm-brown/10"
            >
              <p className="font-serif text-sm text-turquoise font-medium leading-relaxed">
                ✨ {summary.motivation}
              </p>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <div>
          <p className="text-[0.65rem] font-mono text-muted-ink/50 mb-2">
            No AI summary yet
          </p>
          <AnimatedButton onClick={handleGenerate} disabled={generating} variant="sm">
            Generate
          </AnimatedButton>
        </div>
      )}
    </div>
  )
}
