"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  activeTab?: string
  onTabChange?: (tab: string) => void
  tabs?: { id: string; label: string }[]
}

export default function Toolbar({ activeTab, onTabChange, tabs }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState("")

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/recruit/students?name=${encodeURIComponent(search.trim())}`)
    }
  }

  const defaultTabs = [
    { id: "all", label: "All" },
    { id: "logs", label: "Logs" },
    { id: "projects", label: "Projects" },
    { id: "updates", label: "Updates" },
  ]

  const displayTabs = tabs || defaultTabs
  const currentTab = activeTab || "all"

  return (
    <div className="toolbar">
      <form onSubmit={handleSearch} className="flex items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="toolbar-search"
        />
      </form>

      <div className="flex items-center gap-1">
        {displayTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange?.(tab.id)}
            className={`toolbar-tab ${currentTab === tab.id ? "active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <a
          href="/logs/new"
          className="btn-base btn-sm-primary btn-interact text-[0.6rem] !px-3 !py-1"
        >
          + Log
        </a>
      </div>
    </div>
  )
}
