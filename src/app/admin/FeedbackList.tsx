"use client"

import { useState } from "react"

export interface FeedbackRow {
  id: string
  message: string
  isAnonymous: boolean
  status: string
  createdAt: string
  userName: string | null
  userEmail: string | null
}

export default function FeedbackList({ feedback }: { feedback: FeedbackRow[] }) {
  const [rows, setRows] = useState(feedback)
  const [busyId, setBusyId] = useState<string | null>(null)

  const unresolved = rows.filter((f) => f.status === "new").length

  async function patch(id: string, body: Record<string, unknown>) {
    setBusyId(id)
    try {
      const res = await fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      })
      if (!res.ok) return
      const updated = await res.json()
      setRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: updated.status ?? r.status, isAnonymous: updated.isAnonymous ?? r.isAnonymous }
            : r,
        ),
      )
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="frame-block p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-header">Feedback</h2>
        <span className="text-[0.6rem] font-mono text-muted-ink/60">
          {unresolved > 0 ? `${unresolved} new` : "all caught up"}
        </span>
      </div>

      {rows.length === 0 && (
        <p className="text-[0.6rem] font-mono text-muted-ink/50 py-2">No feedback yet.</p>
      )}

      <div className="space-y-2">
        {rows.map((f) => {
          const isNew = f.status === "new"
          return (
            <div
              key={f.id}
              className={`text-[0.65rem] font-mono border-2 p-3 ${isNew ? "border-soft-coral bg-peach/30" : "border-warm-brown/10 opacity-70"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-warm-brown whitespace-pre-wrap leading-relaxed">{f.message}</p>
                  <p className="text-muted-ink/50 text-[0.55rem] mt-1.5">
                    {f.isAnonymous
                      ? "Anonymous"
                      : `${f.userName || "Unknown"} · ${f.userEmail || ""}`}
                    {" · "}
                    {new Date(f.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {f.isAnonymous && (
                    <button
                      onClick={() => patch(f.id, { reveal: true })}
                      disabled={busyId === f.id}
                      className="text-[0.55rem] font-mono px-2 py-1 border-2 border-warm-brown/30 text-muted-ink/70 hover:border-soft-coral hover:text-soft-coral transition-colors"
                    >
                      Reveal
                    </button>
                  )}
                  <button
                    onClick={() => patch(f.id, { status: isNew ? "resolved" : "new" })}
                    disabled={busyId === f.id}
                    className={`text-[0.55rem] font-mono px-2 py-1 border-2 transition-colors ${
                      isNew
                        ? "border-warm-brown bg-soft-coral text-warm-brown hover:bg-peach"
                        : "border-warm-brown/30 text-muted-ink/60 hover:border-warm-brown"
                    }`}
                  >
                    {busyId === f.id ? "..." : isNew ? "Resolve" : "Reopen"}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
