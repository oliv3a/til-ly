"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import AnimatedButton from "@/lib/motion/components/AnimatedButton"
import { useDropzone } from "react-dropzone"


export default function NewLogPage() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [files, setFiles] = useState<{ url: string; type: string; name: string; extractedText?: string | null }[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState("")
  const [roadmapGoals, setRoadmapGoals] = useState<{ id: string; title: string; items: { id: string; topic: string; logCount: number }[] }[]>([])
  const [selectedRoadmapItemIds, setSelectedRoadmapItemIds] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const rid = params.get("roadmapItemId")

    fetch("/api/roadmap-items")
      .then((res) => res.ok && res.json())
      .then((data) => {
        const goals = data.goals ?? []
        setRoadmapGoals(goals)
        if (rid) {
          setSelectedRoadmapItemIds([rid])
        }
      })
      .catch(() => {})
  }, [])

  function toggleRoadmapItem(id: string) {
    setSelectedRoadmapItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    )
  }

  const onDrop = useCallback(async (accepted: File[]) => {
    setUploading(true)
    const uploaded: { url: string; type: string; name: string; extractedText?: string | null }[] = []
    for (const file of accepted) {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (res.ok) {
        const data = await res.json()
        uploaded.push({ url: data.url, type: data.type, name: data.name, extractedText: data.extractedText })
      }
    }
    setFiles((prev) => [...prev, ...uploaded])
    setUploading(false)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    setError("")

    const res = await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, fileUrls: files, roadmapItemIds: selectedRoadmapItemIds.length > 0 ? selectedRoadmapItemIds : undefined, timezoneOffset: new Date().getTimezoneOffset() }),
    })

    if (res.ok) {
      const data = await res.json()
      setSubmitting(false)
      setAnalyzing(true)
      await fetch(`/api/logs/${data.log.id}/analyze`, { method: "POST" }).catch(() => {})
      router.push(`/logs/${data.log.id}`)
    } else {
      const data = await res.json()
      setError(data.error || "Something went wrong")
      setSubmitting(false)
    }
  }

  if (analyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-24 max-w-lg mx-auto text-center">
        <div className="w-full bg-warm-paper rounded-full h-2 mb-6 overflow-hidden">
          <div className="bg-turquoise h-full rounded-full animate-pulse" style={{ width: "60%" }} />
        </div>
        <h2 className="poster-heading text-xl mb-2">Analyzing your study log...</h2>
        <p className="text-[0.65rem] font-mono text-muted-ink/60">
          AI is reading your notes and extracting skills
        </p>
      </div>
    )
  }

  return (
    <div>
      <Link
        href="/logs"
        className="inline-flex items-center gap-1 text-[0.55rem] font-mono text-muted-ink/50 hover:text-warm-brown transition-colors mb-2"
      >
        ← Back to logs
      </Link>
      <h1 className="poster-heading text-2xl mb-6">📝 Log your progress</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <div>
          <label className="block text-[0.65rem] font-mono text-warm-brown mb-1">What did you study?</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="field-coral w-full"
            placeholder="e.g. Python list comprehensions"
          />
        </div>

        <div>
          <label className="block text-[0.65rem] font-mono text-warm-brown mb-1">Notes</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="field-coral w-full resize-y font-mono"
            placeholder="What did you learn? What was challenging?&#10;&#10;AI will summarize this and extract skills..."
          />
        </div>

        <div>
          <label className="block text-[0.65rem] font-mono text-warm-brown mb-1">
            Screenshots / Code / Files {files.length > 0 && `(${files.length})`}
          </label>
          <div
            {...getRootProps()}
            className={`frame-block p-6 text-center cursor-pointer border-dashed ${
              isDragActive ? "bg-muted-blue/10" : ""
            }`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <p className="text-[0.65rem] font-mono text-muted-ink/50">Uploading...</p>
            ) : (
              <p className="text-[0.65rem] font-mono text-muted-ink/60">
                {isDragActive ? "Drop files here" : "Click or drag files here"}
              </p>
            )}
          </div>
          {files.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {files.map((f, i) => (
                <span key={i} className="tag flex items-center gap-1">
                  📎 {f.name}
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                    className="text-muted-ink/50 hover:text-warm-brown"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {roadmapGoals.length > 0 && (
          <div>
            <label className="block text-[0.65rem] font-mono text-warm-brown mb-1">Roadmap (optional)</label>
            <div className="space-y-1 frame-block p-2 max-h-48 overflow-y-auto">
              {roadmapGoals.map((goal) => (
                <details key={goal.id} className="text-[0.6rem]">
                  <summary className="cursor-pointer text-warm-brown font-mono select-none px-1 py-0.5 hover:bg-warm-paper">
                    {goal.title}
                  </summary>
                  <div className="ml-3 mt-0.5 space-y-0.5">
                    {goal.items.map((item) => {
                      const checked = selectedRoadmapItemIds.includes(item.id)
                      return (
                        <label
                          key={item.id}
                          className={`flex items-center gap-1.5 px-1 py-0.5 cursor-pointer font-mono hover:bg-warm-paper ${
                            checked ? "bg-muted-blue/10" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleRoadmapItem(item.id)}
                            className="accent-warm-brown"
                          />
                          <span className="text-warm-brown">{item.topic}</span>
                          <span className="text-muted-ink/50 ml-auto">{item.logCount} logs</span>
                        </label>
                      )
                    })}
                  </div>
                </details>
              ))}
            </div>
            {selectedRoadmapItemIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedRoadmapItemIds.map((id) => {
                  const allItems = roadmapGoals.flatMap((g) => g.items)
                  const item = allItems.find((i) => i.id === id)
                  return item ? (
                    <span key={id} className="tag flex items-center gap-1">
                      {item.topic}
                      <button type="button" onClick={() => toggleRoadmapItem(id)} className="text-muted-ink/50 hover:text-warm-brown">✕</button>
                    </span>
                  ) : null
                })}
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="frame-block p-2 text-[0.65rem] font-mono text-warm-brown bg-red-100">
            ! {error}
          </p>
        )}

        <div className="flex gap-2">
          <AnimatedButton
            type="submit"
            disabled={submitting || !title.trim()}
            variant="sm-primary"
          >
            {submitting ? "Processing..." : "Save & Analyze"}
          </AnimatedButton>
          <Link href="/dashboard" className="btn-base btn-sm btn-interact-bg">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
