"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import AnimatedButton from "@/lib/motion/components/AnimatedButton"

export default function NewGoalPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [targetDate, setTargetDate] = useState("")
  const [category, setCategory] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    setError("")

    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        targetDate: targetDate || undefined,
        category: category || undefined,
        timezoneOffset: new Date().getTimezoneOffset(),
      }),
    })

    if (res.ok) {
      const goal = await res.json()
      router.push(`/goals?id=${goal.id}`)
    } else {
      const data = await res.json()
      setError(data.error || "Something went wrong")
      setSubmitting(false)
    }
  }

  return (
    <div>
      <Link
        href="/goals"
        className="inline-flex items-center gap-1 text-[0.55rem] font-mono text-muted-ink/50 hover:text-warm-brown transition-colors mb-2"
      >
        ← Back to learning goals
      </Link>
      <h1 className="poster-heading text-2xl mb-6">🎯 New learning goal</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <div>
          <label className="block text-[0.65rem] font-mono text-warm-brown mb-1">What do you want to learn?</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="field-coral w-full"
            placeholder="e.g. Master React Server Components"
          />
        </div>

        <div>
          <label className="block text-[0.65rem] font-mono text-warm-brown mb-1">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="field-coral w-full resize-y font-mono"
            placeholder="Why do you want to learn this? Any specific projects or outcomes in mind?"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[0.65rem] font-mono text-warm-brown mb-1">Target date (optional)</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="field-coral w-full"
            />
          </div>

          <div>
            <label className="block text-[0.65rem] font-mono text-warm-brown mb-1">Category (optional)</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="field-coral w-full"
            >
              <option value="">Select a category</option>
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
              <option value="fullstack">Fullstack</option>
              <option value="devops">DevOps</option>
              <option value="algorithms">Algorithms</option>
              <option value="system-design">System Design</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {error && (
          <p className="frame-block p-2 text-[0.65rem] font-mono text-warm-brown bg-red-100">
            ! {error}
          </p>
        )}

        <div className="flex gap-2">
          <AnimatedButton type="submit" disabled={submitting || !title.trim()} variant="sm-primary">
            {submitting ? "Creating..." : "Create Goal"}
          </AnimatedButton>
          <Link href="/goals" className="btn-base btn-sm btn-interact-bg">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
