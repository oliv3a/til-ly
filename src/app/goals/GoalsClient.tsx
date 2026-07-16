"use client"

import { useState } from "react"
import Link from "next/link"
import type { GoalWithRoadmap, RoadmapItemType } from "@/types"
import AnimatedButton from "@/lib/motion/components/AnimatedButton"
import AnimatedCard from "@/lib/motion/components/AnimatedCard"

interface Props {
  initialGoals: GoalWithRoadmap[]
}

function buildPrompt(goal: GoalWithRoadmap): string {
  const items = goal.roadmapItems.map((i) => `  - ${i.topic}${i.description ? `: ${i.description}` : ""}`).join("\n")
  return `I'm working toward a learning goal: "${goal.title}"${goal.description ? ` (${goal.description})` : ""}.

I currently have these roadmap steps:
${items || "  (none yet)"}

Please help me create a better, more detailed roadmap. Return a JSON array of objects with:
- "topic": short step name
- "description": what to learn or do in this step
- "estimatedLogs": number of study sessions needed (1-10)

Aim for 5-13 steps ordered beginner to advanced.
Do not wrap the JSON in markdown or code fences — return only the raw JSON array.`
}

function buildNewGoalPrompt(title: string, description: string): string {
  return `I'm planning a learning goal: "${title}"${description ? ` (${description})` : ""}.

I haven't created a roadmap yet. Please help me build one from scratch. Return a JSON array of objects with:
- "topic": short step name
- "description": what to learn or do in this step
- "estimatedLogs": number of study sessions needed (1-10)

Aim for 5-13 steps ordered beginner to advanced.
Do not wrap the JSON in markdown or code fences — return only the raw JSON array.`
}

export default function GoalsClient({ initialGoals }: Props) {
  const [goals, setGoals] = useState(initialGoals)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [targetDate, setTargetDate] = useState("")
  const [category, setCategory] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [editingItem, setEditingItem] = useState<{ goalId: string; itemId: string } | null>(null)
  const [editFields, setEditFields] = useState({ topic: "", description: "", estimatedLogs: 2 })
  const [addingItemGoalId, setAddingItemGoalId] = useState<string | null>(null)
  const [addFields, setAddFields] = useState({ topic: "", description: "", estimatedLogs: 2 })
  const [dragItemId, setDragItemId] = useState<string | null>(null)
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null)
  const [chatGptGoalId, setChatGptGoalId] = useState<string | null>(null)
  const [chatGptResponse, setChatGptResponse] = useState("")
  const [applyingGpt, setApplyingGpt] = useState(false)
  const [createGptOpen, setCreateGptOpen] = useState(false)
  const [createGptResponse, setCreateGptResponse] = useState("")

  function updateGoalInState(goal: GoalWithRoadmap) {
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? goal : g)))
  }

  async function toggleItem(goalId: string, item: RoadmapItemType) {
    const newComplete = !item.isComplete
    const goal = goals.find((g) => g.id === goalId)
    if (!goal) return

    const prevGoal = goal
    const updatedItems = goal.roadmapItems.map((ri) =>
      ri.id === item.id ? { ...ri, isComplete: newComplete } : ri,
    )
    updateGoalInState({ ...goal, roadmapItems: updatedItems })

    const res = await fetch(`/api/goals/${goalId}/roadmap-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isComplete: newComplete }),
    })
    if (res.ok) {
      const data = await res.json()
      updateGoalInState(data.goal)
    } else {
      updateGoalInState(prevGoal)
    }
  }

  function startEdit(goalId: string, item: RoadmapItemType) {
    setEditingItem({ goalId, itemId: item.id })
    setEditFields({ topic: item.topic, description: item.description || "", estimatedLogs: item.estimatedLogs })
  }

  function cancelEdit() {
    setEditingItem(null)
  }

  async function saveEdit(goalId: string, itemId: string) {
    if (!editFields.topic.trim()) return
    const res = await fetch(`/api/goals/${goalId}/roadmap-items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editFields),
    })
    if (res.ok) {
      const data = await res.json()
      updateGoalInState(data.goal)
      setEditingItem(null)
    }
  }

  function startAdd(goalId: string) {
    setAddingItemGoalId(goalId)
    setAddFields({ topic: "", description: "", estimatedLogs: 2 })
  }

  function cancelAdd() {
    setAddingItemGoalId(null)
  }

  async function saveAdd(goalId: string) {
    if (!addFields.topic.trim()) return
    const res = await fetch(`/api/goals/${goalId}/roadmap-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addFields),
    })
    if (res.ok) {
      const data = await res.json()
      updateGoalInState(data.goal)
      setAddingItemGoalId(null)
    }
  }

  async function deleteItem(goalId: string, itemId: string) {
    if (!confirm("Delete this roadmap step?")) return
    const res = await fetch(`/api/goals/${goalId}/roadmap-items/${itemId}`, { method: "DELETE" })
    if (res.ok) {
      const data = await res.json()
      updateGoalInState(data.goal)
    }
  }

  async function commitReorder(goalId: string, items: RoadmapItemType[]) {
    const res = await fetch(`/api/goals/${goalId}/roadmap-items/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemIds: items.map((i) => i.id) }),
    })
    if (!res.ok) return false
    return true
  }

  function handleDragStart(goalId: string, itemId: string) {
    setDragItemId(itemId)
  }

  function handleDragOver(e: React.DragEvent, itemId: string) {
    e.preventDefault()
    setDragOverItemId(itemId)
  }

  function handleDragLeave() {
    setDragOverItemId(null)
  }

  function handleDrop(goalId: string, targetItemId: string) {
    setDragOverItemId(null)
    const draggedId = dragItemId
    setDragItemId(null)
    if (!draggedId || draggedId === targetItemId) return

    const goal = goals.find((g) => g.id === goalId)
    if (!goal) return

    const prevGoal = goal
    const items = [...goal.roadmapItems]
    const fromIdx = items.findIndex((i) => i.id === draggedId)
    const toIdx = items.findIndex((i) => i.id === targetItemId)
    if (fromIdx === -1 || toIdx === -1) return

    const [moved] = items.splice(fromIdx, 1)
    items.splice(toIdx, 0, moved)

    const reordered = items.map((item, i) => ({ ...item, order: i + 1 }))
    const updatedGoal = { ...goal, roadmapItems: reordered }
    updateGoalInState(updatedGoal)

    commitReorder(goalId, reordered).then((ok) => {
      if (!ok) updateGoalInState(prevGoal)
    })
  }

  function handleDragEnd() {
    setDragItemId(null)
    setDragOverItemId(null)
  }

  async function createGoal(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)

    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, targetDate, category }),
    })

    if (res.ok) {
      const goal = await res.json()
      if (createGptResponse.trim()) {
        try {
          const trimmed = createGptResponse.trim()
          const jsonStart = trimmed.indexOf("[")
          const jsonEnd = trimmed.lastIndexOf("]")
          const items = jsonStart !== -1 && jsonEnd > jsonStart
            ? JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1))
            : JSON.parse(trimmed)
          if (Array.isArray(items) && items.length > 0) {
            const bulkRes = await fetch(`/api/goals/${goal.id}/roadmap-items/bulk`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ items }),
            })
            if (bulkRes.ok) {
              const data = await bulkRes.json()
              if (data.goal) goal.roadmapItems = data.goal.roadmapItems
            }
          }
        } catch {
          // silent
        }
      }
      setGoals((prev) => [goal, ...prev])
      setShowForm(false)
      setTitle("")
      setDescription("")
      setTargetDate("")
      setCategory("")
      setCreateGptOpen(false)
      setCreateGptResponse("")
    }
    setSubmitting(false)
  }

  async function deleteGoal(id: string) {
    if (!confirm("Delete this goal? This cannot be undone.")) return
    const res = await fetch(`/api/goals/${id}`, { method: "DELETE" })
    if (res.ok) setGoals((prev) => prev.filter((g) => g.id !== id))
  }

  function openChatGpt(goal: GoalWithRoadmap) {
    setChatGptGoalId(goal.id)
    setChatGptResponse("")
  }

  function closeChatGpt() {
    setChatGptGoalId(null)
    setChatGptResponse("")
  }

  async function applyChatGpt(goalId: string) {
    if (!chatGptResponse.trim()) return
    setApplyingGpt(true)
    try {
      let items: { topic: string; description?: string; estimatedLogs?: number }[] = []
      const trimmed = chatGptResponse.trim()
      const jsonStart = trimmed.indexOf("[")
      const jsonEnd = trimmed.lastIndexOf("]")
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        items = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1))
      } else {
        items = JSON.parse(trimmed)
      }
      if (!Array.isArray(items) || items.length === 0) throw new Error("No items found")
      const res = await fetch(`/api/goals/${goalId}/roadmap-items/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.goal) {
          setGoals((prev) => prev.map((g) => (g.id === goalId ? data.goal : g)))
          closeChatGpt()
        }
      }
    } catch {
      // If parsing fails, let the user know silently — they can fix the format
    } finally {
      setApplyingGpt(false)
    }
  }

  function isEditing(goalId: string, itemId: string) {
    return editingItem?.goalId === goalId && editingItem?.itemId === itemId
  }

  return (
    <div>
      <AnimatedButton onClick={() => setShowForm(!showForm)} variant="sm-primary" className="mb-4">
        {showForm ? "Cancel" : "+ New Goal"}
      </AnimatedButton>

      {showForm && (
        <form onSubmit={createGoal} className="frame-block p-4 mb-4 space-y-3">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Master Python for Data Analysis" required className="field-coral w-full" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what you want to achieve..." rows={3} className="field-coral w-full resize-y" />
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (e.g. Data Science)" className="field-coral flex-1" />
            <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="field-coral sm:max-w-[160px]" />
          </div>
          <AnimatedButton type="button" onClick={() => setCreateGptOpen(!createGptOpen)} variant="sm" className="w-full text-[0.55rem]">
            {createGptOpen ? "– Hide AI Roadmap" : "✨ AI Roadmap (optional)"}
          </AnimatedButton>
          {createGptOpen && (
            <div className="frame-block p-3 space-y-2 bg-warm-paper/50">
              <p className="text-[0.55rem] font-mono text-warm-brown font-medium">✨ ChatGPT Prompt</p>
              <pre className="text-[0.5rem] font-mono text-muted-ink/70 bg-white p-2 rounded whitespace-pre-wrap max-h-24 overflow-y-auto">{buildNewGoalPrompt(title || "my goal", description)}</pre>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(buildNewGoalPrompt(title || "my goal", description))}
                className="btn-base btn-outline btn-interact text-[0.5rem]"
              >
                Copy Prompt
              </button>
              <textarea
                value={createGptResponse}
                onChange={(e) => setCreateGptResponse(e.target.value)}
                placeholder="Paste ChatGPT response here..."
                rows={4}
                className="field-coral w-full resize-y text-[0.55rem]"
              />
            </div>
          )}
          <AnimatedButton type="submit" disabled={submitting} variant="sm-primary" className="w-full">
            {submitting ? "Generating roadmap..." : "Create Goal"}
          </AnimatedButton>
        </form>
      )}

      {goals.length === 0 && !showForm && (
        <div className="frame-block p-6 text-center">
          <p className="font-serif text-base text-muted-ink/50">No goals yet</p>
          <p className="text-[0.65rem] font-mono text-muted-ink/40 mt-1">Set your first learning goal and AI will build a roadmap</p>
        </div>
      )}

      <div className="space-y-3">
        {goals.map((goal) => (
          <AnimatedCard key={goal.id} className="frame-block p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-serif text-sm text-warm-brown truncate">{goal.title}</h3>
                {goal.description && <p className="text-[0.65rem] font-mono text-muted-ink/60 mt-0.5">{goal.description}</p>}
              </div>
              <span className={`badge ${
                goal.status === "completed" ? "badge-complete" :
                goal.status === "abandoned" ? "badge-archived" :
                ""
              }`}>
                {goal.status}
              </span>
              <AnimatedButton onClick={() => deleteGoal(goal.id)} variant="sm" className="shrink-0 !px-1 !py-0 text-[0.55rem]">🗑</AnimatedButton>
            </div>

            <div className="mt-3 flex items-center gap-2 text-[0.55rem] font-mono text-muted-ink/70">
              <span className="tag">
                {goal.roadmapItems.filter((i) => i.isComplete).length} / {goal.roadmapItems.length} items ticked
              </span>
              {goal.roadmapItems.some((i) => i._count?.studyLogLinks > 0) && (
                <span className="tag">
                  {goal.roadmapItems.reduce((s, i) => s + i._count.studyLogLinks, 0)} logs
                </span>
              )}
            </div>

            <div className="mt-3">
              <div className="section-header mb-2 flex items-center justify-between">
                <span>Roadmap</span>
                <div className="flex items-center gap-1">
                  <AnimatedButton onClick={() => openChatGpt(goal)} variant="sm" className="!px-1.5 !py-0 text-[0.5rem]">✨ AI</AnimatedButton>
                  <AnimatedButton onClick={() => startAdd(goal.id)} variant="sm" className="!px-1.5 !py-0 text-[0.5rem] text-warm-brown bg-white">+ Add Step</AnimatedButton>
                </div>
              </div>

              {addingItemGoalId === goal.id && (
                <div className="frame-block p-2 mb-2 space-y-1.5">
                  <input type="text" value={addFields.topic} onChange={(e) => setAddFields({ ...addFields, topic: e.target.value })} placeholder="Topic name" className="field-coral w-full text-[0.6rem]" />
                  <input type="text" value={addFields.description} onChange={(e) => setAddFields({ ...addFields, description: e.target.value })} placeholder="Description (optional)" className="field-coral w-full text-[0.6rem]" />
                  <div className="flex items-center gap-2">
                    <label className="text-[0.55rem] font-mono text-warm-brown">Est. logs:</label>
                    <input type="number" min={1} value={addFields.estimatedLogs} onChange={(e) => setAddFields({ ...addFields, estimatedLogs: Number(e.target.value) })} className="field-coral w-16 text-[0.6rem]" />
                    <AnimatedButton onClick={() => saveAdd(goal.id)} variant="sm-primary" className="!px-2 !py-0.5 text-[0.55rem]">Save</AnimatedButton>
                    <AnimatedButton onClick={cancelAdd} variant="sm" className="!px-2 !py-0.5 text-[0.55rem]">Cancel</AnimatedButton>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {goal.roadmapItems.map((item) => (
                  <div
                    key={item.id}
                    onDragOver={(e) => handleDragOver(e, item.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={() => handleDrop(goal.id, item.id)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-2 text-[0.65rem] font-mono group ${
                      dragOverItemId === item.id ? "border-t-2 border-muted-teal" : ""
                    } ${dragItemId === item.id ? "opacity-40" : ""}`}
                  >
                    <span
                      draggable={!isEditing(goal.id, item.id)}
                      onDragStart={() => handleDragStart(goal.id, item.id)}
                      className="cursor-grab active:cursor-grabbing text-muted-ink/30 shrink-0 text-[0.5rem] select-none"
                    >⠿</span>

                    <button
                      type="button"
                      onClick={() => toggleItem(goal.id, item)}
                      className={`w-5 h-5 border border-warm-brown flex items-center justify-center text-[0.6rem] shrink-0 cursor-pointer hover:bg-warm-paper ${
                        item.isComplete ? "bg-muted-teal text-ink" : "bg-white text-muted-ink/50"
                      }`}
                    >
                      {item.isComplete ? "✓" : ""}
                    </button>

                    {isEditing(goal.id, item.id) ? (
                      <div className="flex-1 flex items-center gap-1">
                        <input
                          type="text"
                          value={editFields.topic}
                          onChange={(e) => setEditFields({ ...editFields, topic: e.target.value })}
                          className="field-coral flex-1 text-[0.6rem]"
                        />
                        <input
                          type="text"
                          value={editFields.description}
                          onChange={(e) => setEditFields({ ...editFields, description: e.target.value })}
                          placeholder="desc"
                          className="field-coral w-24 text-[0.6rem]"
                        />
                        <input
                          type="number"
                          min={1}
                          value={editFields.estimatedLogs}
                          onChange={(e) => setEditFields({ ...editFields, estimatedLogs: Number(e.target.value) })}
                          className="field-coral w-12 text-[0.6rem]"
                        />
                        <AnimatedButton onClick={() => saveEdit(goal.id, item.id)} variant="sm-primary" className="!px-1.5 !py-0 text-[0.5rem]">Save</AnimatedButton>
                        <AnimatedButton onClick={cancelEdit} variant="sm" className="!px-1.5 !py-0 text-[0.5rem]">X</AnimatedButton>
                      </div>
                    ) : (
                      <>
                        <span className={`flex-1 truncate ${item.isComplete ? "text-muted-ink/40 line-through" : "text-warm-brown"}`}>
                          {item.order}. {item.topic}
                        </span>
                        <span className="text-[0.5rem] text-muted-ink/50 shrink-0">
                          {item._count?.studyLogLinks ?? 0} logs
                        </span>
                        <Link
                          href={`/logs/new?roadmapItemId=${item.id}`}
                          className="btn-base btn-sm btn-interact-bg !px-1.5 !py-0 text-[0.5rem]"
                        >
                          Log
                        </Link>
                        <AnimatedButton onClick={() => startEdit(goal.id, item)} variant="sm" className="!px-1 !py-0 text-[0.5rem] opacity-0 group-hover:opacity-100">✏</AnimatedButton>
                        <AnimatedButton onClick={() => deleteItem(goal.id, item.id)} variant="sm" className="!px-1 !py-0 text-[0.5rem] opacity-0 group-hover:opacity-100">🗑</AnimatedButton>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {chatGptGoalId === goal.id && (
              <div className="mt-3 frame-block p-3 space-y-2 bg-warm-paper/50">
                <p className="text-[0.55rem] font-mono text-warm-brown font-medium">✨ ChatGPT Prompt</p>
                <pre className="text-[0.5rem] font-mono text-muted-ink/70 bg-white p-2 rounded whitespace-pre-wrap max-h-32 overflow-y-auto">{buildPrompt(goal)}</pre>
                <button
                  onClick={() => navigator.clipboard.writeText(buildPrompt(goal))}
                  className="btn-base btn-outline btn-interact text-[0.5rem]"
                >
                  Copy Prompt
                </button>
                <textarea
                  value={chatGptResponse}
                  onChange={(e) => setChatGptResponse(e.target.value)}
                  placeholder="Paste ChatGPT response here..."
                  rows={5}
                  className="field-coral w-full resize-y text-[0.55rem]"
                />
                <div className="flex items-center gap-2">
                  <AnimatedButton
                    onClick={() => applyChatGpt(goal.id)}
                    disabled={!chatGptResponse.trim() || applyingGpt}
                    variant="sm-primary"
                    className="text-[0.55rem]"
                  >
                    {applyingGpt ? "Applying..." : "Apply to Roadmap"}
                  </AnimatedButton>
                  <AnimatedButton onClick={closeChatGpt} variant="sm" className="text-[0.55rem]">Cancel</AnimatedButton>
                </div>
              </div>
            )}

            {goal.targetDate && (
              <p className="text-[0.55rem] font-mono text-muted-ink/50 mt-2">
                🎯 Due {new Date(goal.targetDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            )}
          </AnimatedCard>
        ))}
      </div>
    </div>
  )
}
