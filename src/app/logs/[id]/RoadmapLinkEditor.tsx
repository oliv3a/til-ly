"use client"

import { useState, useEffect } from "react"
import AnimatedButton from "@/lib/motion/components/AnimatedButton"

interface RoadmapItem {
  id: string
  topic: string
  logCount: number
}

interface GoalGroup {
  id: string
  title: string
  items: RoadmapItem[]
}

interface Props {
  logId: string
  initialRoadmapLinks: { id: string; roadmapItem: { id: string; topic: string; goal: { id: string; title: string } } }[]
}

export default function RoadmapLinkEditor({ logId, initialRoadmapLinks }: Props) {
  const [goals, setGoals] = useState<GoalGroup[]>([])
  const [links, setLinks] = useState(initialRoadmapLinks)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState("")
  const [selectedItemId, setSelectedItemId] = useState("")

  useEffect(() => {
    fetch("/api/roadmap-items")
      .then((res) => res.ok && res.json())
      .then((data) => setGoals(data.goals ?? []))
      .catch(() => {})
  }, [])

  async function updateLinks(newLinks: typeof links) {
    setSaving(true)
    const res = await fetch(`/api/logs/${logId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roadmapItemIds: newLinks.map((l) => l.roadmapItem.id) }),
    })
    if (res.ok) {
      const data = await res.json()
      setLinks(data.roadmapLinks ?? [])
    }
    setSaving(false)
  }

  async function handleAdd() {
    if (!selectedItemId) return
    if (links.some((l) => l.roadmapItem.id === selectedItemId)) return
    const goal = goals.find((g) => g.id === selectedGoalId)
    const item = goal?.items.find((i) => i.id === selectedItemId)
    if (!goal || !item) return
    const newLink = {
      id: `pending-${selectedItemId}`,
      roadmapItem: {
        id: selectedItemId,
        topic: item.topic,
        goal: { id: goal.id, title: goal.title },
      },
    }
    await updateLinks([...links, newLink])
    setSelectedGoalId("")
    setSelectedItemId("")
  }

  async function handleRemove(itemId: string) {
    await updateLinks(links.filter((l) => l.roadmapItem.id !== itemId))
  }

  const alreadyLinked = new Set(links.map((l) => l.roadmapItem.id))

  return (
    <div className="frame-block p-3">
      <div className="text-[0.55rem] font-mono text-muted-ink/50 mb-1">Roadmap Links</div>

      {links.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {links.map((link) => (
            <span
              key={link.id}
              className="tag flex items-center gap-1"
            >
              {link.roadmapItem.goal.title} › {link.roadmapItem.topic}
              <button
                onClick={() => handleRemove(link.roadmapItem.id)}
                disabled={saving}
                className="text-muted-ink/50 hover:text-warm-brown"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {editing ? (
        <div className="space-y-1.5 border-t border-warm-brown/20 pt-2">
          <div className="flex gap-1">
            <select
              value={selectedGoalId}
              onChange={(e) => {
                setSelectedGoalId(e.target.value)
                setSelectedItemId("")
              }}
              className="field-coral flex-1 text-[0.6rem]"
            >
              <option value="">Select goal</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
            {selectedGoalId && (
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="field-coral flex-1 text-[0.6rem]"
              >
                <option value="">Select item</option>
                {goals
                  .find((g) => g.id === selectedGoalId)
                  ?.items.filter((i) => !alreadyLinked.has(i.id))
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.topic} ({item.logCount} logs)
                    </option>
                  ))}
              </select>
            )}
            <AnimatedButton
              onClick={handleAdd}
              disabled={!selectedItemId || saving}
              variant="sm-primary"
            >
              {saving ? "..." : "Add"}
            </AnimatedButton>
            <AnimatedButton
              onClick={() => {
                setEditing(false)
                setSelectedGoalId("")
                setSelectedItemId("")
              }}
              variant="sm"
            >
              Done
            </AnimatedButton>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {links.length === 0 && (
            <span className="text-[0.65rem] font-mono text-muted-ink/50">Not linked</span>
          )}
          <AnimatedButton onClick={() => setEditing(true)} variant="sm">
            {links.length > 0 ? "Add" : "Link"}
          </AnimatedButton>
        </div>
      )}
    </div>
  )
}
