"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import type { ProjectType } from "@/types"
import AnimatedButton from "@/lib/motion/components/AnimatedButton"
import AnimatedCard from "@/lib/motion/components/AnimatedCard"
import AnimatedProgress from "@/lib/motion/components/AnimatedProgress"

interface Props {
  initialProject: ProjectType
}

export default function ProjectDetailClient({ initialProject }: Props) {
  const router = useRouter()
  const [project, setProject] = useState(initialProject)
  const [editing, setEditing] = useState(false)
  const [editFields, setEditFields] = useState({
    title: project.title,
    description: project.description || "",
    techStack: project.techStack || "",
    repoUrl: project.repoUrl || "",
    status: project.status,
  })
  const [addingStep, setAddingStep] = useState(false)
  const [stepTopic, setStepTopic] = useState("")
  const [updateContent, setUpdateContent] = useState("")
  const [postingUpdate, setPostingUpdate] = useState(false)
  const [deletingUpdateId, setDeletingUpdateId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate")
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const [editingStepTopic, setEditingStepTopic] = useState("")
  const [pendingUpdate, setPendingUpdate] = useState<{ content: string; timestamp: Date } | null>(null)
  const [notesOpen, setNotesOpen] = useState(!!project.notes)
  const [notesDraft, setNotesDraft] = useState(project.notes || "")
  const [notesSaving, setNotesSaving] = useState(false)
  const [chatGptOpen, setChatGptOpen] = useState(false)
  const [chatGptResponse, setChatGptResponse] = useState("")
  const [applyingGpt, setApplyingGpt] = useState(false)

  async function toggleStep(stepId: string) {
    const step = project.steps.find((s) => s.id === stepId)
    if (!step) return
    const newComplete = !step.isComplete
    const prevProject = project

    setProject((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === stepId ? { ...s, isComplete: newComplete } : s)),
    }))

    const res = await fetch(`/api/projects/${project.id}/steps/${stepId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isComplete: newComplete, timezoneOffset: new Date().getTimezoneOffset() }),
    })
    if (res.ok) {
      const data = await res.json()
      setProject((prev) => ({ ...prev, progressPct: data.progressPct }))
    } else {
      setProject(prevProject)
    }
  }

  async function addStep() {
    if (!stepTopic.trim()) return
    const res = await fetch(`/api/projects/${project.id}/steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: stepTopic.trim() }),
    })
    if (res.ok) {
      const step = await res.json()
      setProject((prev) => ({ ...prev, steps: [...prev.steps, step] }))
      setStepTopic("")
      setAddingStep(false)
    }
  }

  async function deleteStep(stepId: string) {
    const res = await fetch(`/api/projects/${project.id}/steps/${stepId}`, {
      method: "DELETE",
    })
    if (res.ok) {
      const data = await res.json()
      setProject((prev) => ({ ...prev, steps: data.steps, progressPct: data.progressPct }))
    }
  }

  async function saveEdit() {
    if (!editFields.title.trim()) return
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editFields),
    })
    if (res.ok) {
      const data = await res.json()
      setProject(data)
      setEditing(false)
    }
  }

  async function postUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!updateContent.trim()) return
    setPostingUpdate(true)
    setError(null)

    const content = updateContent.trim()
    setPendingUpdate({ content, timestamp: new Date() })
    setUpdateContent("")

    const res = await fetch(`/api/projects/${project.id}/updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, timezoneOffset: new Date().getTimezoneOffset() }),
    })
    if (res.ok) {
      const data = await res.json()
      setProject(data.project)
      setPendingUpdate(null)
    } else {
      const err = await res.json()
      setError(err.error || "Failed to post update")
      setPendingUpdate(null)
    }
    setPostingUpdate(false)
  }

  async function deleteUpdate(id: string) {
    if (!confirm("Delete this update?")) return
    setDeletingUpdateId(id)
    const res = await fetch(`/api/projects/${project.id}/updates/${id}`, {
      method: "DELETE",
    })
    if (res.ok) {
      setProject((prev) => ({
        ...prev,
        updates: prev.updates.filter((u) => u.id !== id),
      }))
    }
    setDeletingUpdateId(null)
  }

  async function generateSteps() {
    setGenerating(true)
    try {
      const res = await fetch(`/api/projects/${project.id}/steps/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      })
      const data = await res.json()
      if (res.ok) {
        setProject((prev) => ({ ...prev, steps: data.steps, progressPct: data.progressPct }))
        if (data.created?.length > 0) {
          toast.success(`Added: ${data.created.join(", ")}`)
        } else {
          toast.success("No new steps needed — nice!")
        }
      } else {
        toast.error(data.error || "Failed to generate")
      }
    } catch {
      toast.error("Something went wrong")
    }
    setGenerating(false)
  }

  function handleDragStart(index: number) {
    setDragIndex(index)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  async function handleDrop(index: number) {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null)
      return
    }

    const prevProject = project
    const reordered = [...project.steps]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(index, 0, moved)
    setProject((prev) => ({ ...prev, steps: reordered }))
    setDragIndex(null)

    const res = await fetch(`/api/projects/${project.id}/steps/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepIds: reordered.map((s) => s.id) }),
    })
    if (!res.ok) setProject(prevProject)
  }

  async function saveNotes() {
    setNotesSaving(true)
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: notesDraft.trim() || null }),
    })
    if (res.ok) {
      const data = await res.json()
      setProject(data)
    }
    setNotesSaving(false)
  }

  async function applyChatGptSteps() {
    if (!chatGptResponse.trim()) return
    setApplyingGpt(true)
    try {
      const res = await fetch(`/api/projects/${project.id}/steps/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: chatGptResponse.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setProject((prev) => ({ ...prev, steps: data.steps, progressPct: data.progressPct }))
        setChatGptOpen(false)
        setChatGptResponse("")
        toast.success("Checklist updated!")
      } else {
        const err = await res.json().catch(() => ({ error: "Failed" }))
        toast.error(err.error || "Failed to apply steps")
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setApplyingGpt(false)
    }
  }

  function startEditing(step: typeof project.steps[0]) {
    setEditingStepId(step.id)
    setEditingStepTopic(step.topic)
  }

  async function saveRename(stepId: string) {
    if (!editingStepTopic.trim()) return
    const prevProject = project
    const res = await fetch(`/api/projects/${project.id}/steps/${stepId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: editingStepTopic.trim() }),
    })
    if (res.ok) {
      const data = await res.json()
      setProject((prev) => ({
        ...prev,
        steps: prev.steps.map((s) => (s.id === stepId ? { ...s, topic: data.step.topic } : s)),
      }))
    } else {
      setProject(prevProject)
    }
    setEditingStepId(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <Link href="/projects" className="btn-base btn-sm btn-interact-bg mb-3 inline-block">← Building</Link>
      </div>
      <div className={`flex items-start justify-between gap-3 mb-4 p-3 ${editing ? "frame-block-accent" : ""}`}>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editFields.title}
                onChange={(e) => setEditFields({ ...editFields, title: e.target.value })}
                className="field-coral w-full"
              />
              <textarea
                value={editFields.description}
                onChange={(e) => setEditFields({ ...editFields, description: e.target.value })}
                rows={2}
                className="field-coral w-full resize-y"
              />
              <input
                type="text"
                value={editFields.techStack}
                onChange={(e) => setEditFields({ ...editFields, techStack: e.target.value })}
                placeholder="Tech stack"
                className="field-coral w-full"
              />
              <input
                type="url"
                value={editFields.repoUrl}
                onChange={(e) => setEditFields({ ...editFields, repoUrl: e.target.value })}
                placeholder="Repo URL"
                className="field-coral w-full"
              />
              <select
                value={editFields.status}
                onChange={(e) => setEditFields({ ...editFields, status: e.target.value })}
                className="field-coral w-full text-[0.6rem]"
              >
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
              <div className="flex gap-1">
                <AnimatedButton onClick={saveEdit} variant="sm-primary" className="!px-3 !py-1 text-[0.6rem]">Save</AnimatedButton>
                <AnimatedButton onClick={() => setEditing(false)} variant="sm" className="!px-3 !py-1 text-[0.6rem]">Cancel</AnimatedButton>
              </div>
            </div>
          ) : (
            <>
              <h1 className="font-serif text-lg text-warm-brown">{project.title}</h1>
              {project.description && <p className="text-[0.65rem] font-mono text-muted-ink/60 mt-1">{project.description}</p>}
              <div className="flex items-center gap-2 mt-1 text-[0.55rem] font-mono text-muted-ink/50">
                {project.techStack && <span>Stack: {project.techStack}</span>}
                {project.repoUrl && (
                  <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="underline">Repo</a>
                )}
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!editing && (
            <>
              <AnimatedButton onClick={() => setEditing(true)} variant="sm" className="!px-2 !py-1 text-[0.55rem]">✏ Edit</AnimatedButton>
              <AnimatedButton
                onClick={async () => {
                  if (!confirm(`Delete "${project.title}"? This cannot be undone.`)) return
                  await fetch(`/api/projects/${project.id}`, { method: "DELETE" })
                  router.push("/projects")
                }}
                variant="sm"
                className="!px-2 !py-1 text-[0.55rem]"
              >
                🗑
              </AnimatedButton>
            </>
          )}
          <span className={`border px-1.5 py-0.5 text-[0.55rem] font-mono ${
            project.status === "completed" ? "border-warm-brown bg-muted-blue/10" :
            project.status === "archived" ? "border-warm-brown opacity-50" :
            "border-warm-brown"
          }`}>
            {project.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <AnimatedCard className="frame-block p-3 mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[0.6rem] font-mono text-muted-ink/60">Progress</span>
          <span className="text-[0.6rem] font-mono text-warm-brown">{project.steps.length} steps · {project.progressPct}%</span>
        </div>
        <AnimatedProgress value={project.progressPct} height={8} />
      </AnimatedCard>

      {/* AI Overall Feedback */}
      {project.aiOverallFeedback && (
        <AnimatedCard className="frame-block-accent mb-4">
          <p className="text-[0.6rem] font-mono text-muted-blue mb-1">🤖 AI Mentor</p>
          <p className="text-[0.65rem] font-mono text-warm-brown whitespace-pre-wrap">{project.aiOverallFeedback}</p>
        </AnimatedCard>
      )}

      {/* Notes */}
      <AnimatedCard className="frame-block p-3 mb-4">
        <button
          onClick={() => setNotesOpen(!notesOpen)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-serif text-sm text-warm-brown">📝 Notes</span>
          <span className="text-[0.55rem] font-mono text-muted-ink/50">{notesOpen ? "▲" : "▼"}</span>
        </button>
        {notesOpen && (
          <div className="mt-2 space-y-2">
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Scratchpad — TODOs, ideas, links, anything..."
              rows={4}
              className="field-coral w-full resize-y text-[0.6rem] font-mono"
            />
            <div className="flex items-center justify-between">
              <span className="text-[0.5rem] font-mono text-muted-ink/40">Auto-saves on blur</span>
              <AnimatedButton
                onClick={saveNotes}
                disabled={notesSaving}
                variant="sm"
                className="!px-2 !py-0.5 text-[0.55rem]"
              >
                {notesSaving ? "Saving..." : "Save"}
              </AnimatedButton>
            </div>
          </div>
        )}
      </AnimatedCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Steps Checklist */}
        <AnimatedCard className="frame-block p-3">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
            <h2 className="font-serif text-sm text-warm-brown">Checklist</h2>
            {editing && (
              <div className="flex items-center gap-1">
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as "beginner" | "intermediate" | "advanced")}
                  className="field-coral text-[0.5rem] py-0.5 w-20"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <AnimatedButton
                  onClick={generateSteps}
                  disabled={generating}
                  variant="sm"
                  className="!px-2 !py-0.5 text-[0.5rem]"
                >
                  {generating ? "⏳ Generating..." : "Generate Steps"}
                </AnimatedButton>
                <AnimatedButton onClick={() => setAddingStep(!addingStep)} variant="sm" className="!px-2 !py-0.5 text-[0.55rem]">
                  {addingStep ? "Cancel" : "+ Step"}
                </AnimatedButton>
                <AnimatedButton onClick={() => setChatGptOpen(!chatGptOpen)} variant="sm" className="!px-2 !py-0.5 text-[0.55rem]">✨ AI</AnimatedButton>
              </div>
            )}
          </div>

          {editing && addingStep && (
            <div className="flex gap-1 mb-2">
              <input
                type="text"
                value={stepTopic}
                onChange={(e) => setStepTopic(e.target.value)}
                placeholder="New step..."
                className="field-coral flex-1 text-[0.6rem]"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") addStep() }}
              />
              <AnimatedButton onClick={addStep} variant="sm-primary" className="!px-2 !py-0.5 text-[0.55rem]">Add</AnimatedButton>
            </div>
          )}

          {editing && chatGptOpen && (
            <div className="frame-block p-2 mb-2 space-y-1.5 bg-warm-paper/50">
              <textarea
                value={chatGptResponse}
                onChange={(e) => setChatGptResponse(e.target.value)}
                placeholder="Paste AI-generated checklist here..."
                rows={3}
                className="field-coral w-full resize-y text-[0.5rem]"
              />
              <div className="flex items-center gap-1">
                <AnimatedButton
                  onClick={applyChatGptSteps}
                  disabled={!chatGptResponse.trim() || applyingGpt}
                  variant="sm-primary"
                  className="text-[0.5rem]"
                >
                  {applyingGpt ? "Applying..." : "Apply to Checklist"}
                </AnimatedButton>
                <AnimatedButton onClick={() => { setChatGptOpen(false); setChatGptResponse("") }} variant="sm" className="text-[0.5rem]">Cancel</AnimatedButton>
              </div>
            </div>
          )}

          {project.steps.length === 0 && (
            <p className="text-[0.6rem] font-mono text-muted-ink/40">{editing ? "No steps yet. Add one or use AI to generate." : "No steps yet."}</p>
          )}

          <div className="space-y-0.5">
            {project.steps.map((step, idx) => (
              <div
                key={step.id}
                draggable={editing}
                onDragStart={() => editing && handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(idx)}
                className={`flex items-center gap-2 ${editing ? "group cursor-grab active:cursor-grabbing" : ""} ${
                  dragIndex === idx ? "opacity-50" : ""
                }`}
              >
                <button
                  onClick={() => toggleStep(step.id)}
                  className={`w-4 h-4 border border-warm-brown flex items-center justify-center text-[0.5rem] shrink-0 cursor-pointer ${
                    step.isComplete ? "bg-muted-blue text-ink" : "bg-white"
                  }`}
                >
                  {step.isComplete ? "✓" : ""}
                </button>

                {editing && editingStepId === step.id ? (
                  <input
                    type="text"
                    value={editingStepTopic}
                    onChange={(e) => setEditingStepTopic(e.target.value)}
                    className="field-coral flex-1 text-[0.6rem] py-0.5"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRename(step.id)
                      if (e.key === "Escape") setEditingStepId(null)
                    }}
                  />
                ) : (
                  <span
                    onClick={() => editing && startEditing(step)}
                    className={`flex-1 text-[0.6rem] font-mono break-words ${editing ? "cursor-text" : ""} ${
                      step.isComplete ? "text-muted-ink/40 line-through" : "text-warm-brown"
                    }`}
                  >
                    {step.topic}
                  </span>
                )}

                {editing && (
                  <AnimatedButton
                    onClick={() => deleteStep(step.id)}
                    variant="sm"
                    className="!px-1 !py-0 text-[0.45rem]"
                  >
                    ✕
                  </AnimatedButton>
                )}
              </div>
            ))}
          </div>
        </AnimatedCard>

        {/* Quick Post Update */}
        <AnimatedCard className="frame-block p-3">
          <h2 className="font-serif text-sm text-warm-brown mb-2">Post Update</h2>

          {error && (
            <div className="frame-block p-2 text-[0.6rem] font-mono text-warm-brown mb-2">
              {error}
            </div>
          )}

          <form onSubmit={postUpdate} className="space-y-2">
            <textarea
              value={updateContent}
              onChange={(e) => setUpdateContent(e.target.value)}
              placeholder="What did you build or learn today?"
              rows={3}
              className="field-coral w-full resize-y text-[0.6rem]"
            />
            <AnimatedButton
              type="submit"
              disabled={postingUpdate || !updateContent.trim()}
              variant="sm-primary"
              className="w-full text-[0.6rem]"
            >
              {postingUpdate ? "Analyzing..." : "Post & Analyze"}
            </AnimatedButton>
          </form>
        </AnimatedCard>
      </div>

      {/* Updates Timeline */}
      <h2 className="font-serif text-sm text-warm-brown mb-2">Updates</h2>

      {project.updates.length === 0 && (
        <div className="frame-block p-4 text-center">
          <p className="text-[0.65rem] font-mono text-muted-ink/50">No updates yet</p>
        </div>
      )}

      <div className="space-y-2">
        {pendingUpdate && (
          <div className="frame-block p-3 opacity-60">
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="text-[0.55rem] font-mono text-muted-ink/40">
                {pendingUpdate.timestamp.toLocaleDateString("en-US", {
                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </span>
              <span className="text-[0.5rem] font-mono text-muted-blue">Analyzing...</span>
            </div>
            <p className="text-[0.65rem] font-mono text-warm-brown whitespace-pre-wrap">{pendingUpdate.content}</p>
          </div>
        )}
        {project.updates.map((update) => (
          <AnimatedCard key={update.id} className="frame-block p-3">
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="text-[0.55rem] font-mono text-muted-ink/40">
                {new Date(update.createdAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </span>
              <AnimatedButton
                onClick={() => deleteUpdate(update.id)}
                disabled={deletingUpdateId === update.id}
                variant="sm"
                className="!px-1 !py-0 text-[0.5rem]"
              >
                🗑
              </AnimatedButton>
            </div>

            {update.content && (
              <p className="text-[0.65rem] font-mono text-warm-brown whitespace-pre-wrap mb-2">{update.content}</p>
            )}

            {update.onTrack !== null && (
              <span className={`inline-block border px-1 py-0.5 text-[0.5rem] font-mono ${
                update.onTrack ? "border-green-700 text-green-700" : "border-red-700 text-red-700"
              }`}>
                {update.onTrack ? "✓ On track" : "⚠ Needs attention"}
              </span>
            )}

            {update.aiComment && (
              <div className="mt-2 border-l-2 border-muted-blue pl-2">
                <p className="text-[0.55rem] font-mono text-muted-blue">🤖 AI comment</p>
                <p className="text-[0.6rem] font-mono text-muted-ink/80 whitespace-pre-wrap mt-0.5">{update.aiComment}</p>
              </div>
            )}
          </AnimatedCard>
        ))}
      </div>
    </div>
  )
}
