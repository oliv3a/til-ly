"use client"

import { useState } from "react"

export interface UserRow {
  id: string
  name: string | null
  email: string | null
  createdAt: string
  isPublic: boolean
  streakCount: number
  lastLogAt: string | null
}

function isDemo(u: UserRow) {
  return u.email?.toLowerCase().startsWith("demo-") ?? false
}

export default function UserList({ users }: { users: UserRow[] }) {
  const [hideDemo, setHideDemo] = useState(true)

  const visible = hideDemo ? users.filter((u) => !isDemo(u)) : users

  return (
    <div className="frame-block p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-header">Users</h2>
        <label className="flex items-center gap-1.5 text-[0.6rem] font-mono text-muted-ink/70 cursor-pointer">
          <input
            type="checkbox"
            checked={hideDemo}
            onChange={(e) => setHideDemo(e.target.checked)}
            className="accent-warm-brown"
          />
          Hide demo accounts
        </label>
      </div>

      <div className="space-y-1">
        {visible.length === 0 && (
          <p className="text-[0.6rem] font-mono text-muted-ink/50 py-2">No users.</p>
        )}
        {visible.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between text-[0.65rem] font-mono py-1 border-b border-warm-brown/10 last:border-0"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-warm-brown truncate">{u.name || "Unnamed"}</span>
                <span className={`shrink-0 text-[0.5rem] px-1 rounded-sm ${u.isPublic ? "bg-emerald-200/40 text-emerald-800" : "bg-muted-ink/10 text-muted-ink/50"}`}>
                  {u.isPublic ? "public" : "private"}
                </span>
              </div>
              <span className="text-muted-ink/50 text-[0.55rem]">{u.email}</span>
            </div>
            <div className="shrink-0 text-right ml-2 text-muted-ink/40 text-[0.55rem]">
              <div>🔥 {u.streakCount}</div>
              <div>log {u.lastLogAt ? new Date(u.lastLogAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</div>
              <div>joined {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
