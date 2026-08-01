"use client"

import { useState } from "react"
import AnimatedButton from "@/lib/motion/components/AnimatedButton"

export default function FeedbackForm() {
  const [message, setMessage] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, isAnonymous }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Something went wrong")
        setLoading(false)
        return
      }

      setSent(true)
    } catch {
      setError("Something went wrong")
    }

    setLoading(false)
  }

  if (sent) {
    return (
      <div className="frame-block p-6 text-center">
        <p className="font-serif text-xl text-warm-brown mb-2">Thanks for the feedback!</p>
        <p className="text-[0.65rem] font-mono text-muted-ink/70">
          We&apos;ve got it. You can submit another any time.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="frame-block p-4 space-y-4">
      <div>
        <label className="block text-[0.65rem] font-mono text-muted-ink mb-1">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          maxLength={2000}
          className="field-coral resize-y"
          placeholder="Tell us what's on your mind..."
        />
        <p className="text-right text-[0.5rem] font-mono text-muted-ink/40 mt-1">{message.length}/2000</p>
      </div>

      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          className="mt-0.5 accent-warm-brown"
        />
        <span className="text-[0.6rem] font-mono text-muted-ink/80 leading-relaxed">
          Send anonymously — your identity stays hidden unless your feedback is spam or abuse,
          in which case we&apos;ll identify you and take action.
        </span>
      </label>

      {error && (
        <p className="text-[0.65rem] font-mono text-warm-brown bg-peach/50 px-2 py-1 border-2 border-warm-brown">
          {error}
        </p>
      )}

      <AnimatedButton type="submit" variant="coral" className="w-full justify-center" disabled={loading}>
        {loading ? "Sending..." : "Send feedback"}
      </AnimatedButton>
    </form>
  )
}
