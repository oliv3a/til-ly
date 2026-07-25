"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import AnimatedButton from "@/lib/motion/components/AnimatedButton"
import FileUpload, { type UploadedFile } from "@/components/FileUpload"

export default function NewProjectPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [techStack, setTechStack] = useState("")
  const [repoUrl, setRepoUrl] = useState("")
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          techStack: techStack.trim() || undefined,
          repoUrl: repoUrl.trim() || undefined,
          fileUrls: files.length > 0 ? files : undefined,
          timezoneOffset: new Date().getTimezoneOffset(),
        }),
      })

      if (res.ok) {
        const project = await res.json()
        router.push(`/projects/${project.id}`)
      } else {
        const err = await res.json()
        setError(err.error || "Failed to create project")
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="poster-heading text-2xl">New Project</h1>
          <Link href="/projects" className="btn-base btn-sm btn-interact-bg">← Building</Link>
        </div>

        {error && (
          <div className="frame-block p-3 text-[0.65rem] font-mono text-warm-brown mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="frame-block p-4 space-y-3">
          <div>
            <label className="text-[0.65rem] font-mono text-warm-brown block mb-0.5">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Portfolio Website"
              className="field-coral w-full"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-[0.65rem] font-mono text-warm-brown block mb-0.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this project do?"
              rows={3}
              className="field-coral w-full resize-y"
            />
          </div>

          <div>
            <label className="text-[0.65rem] font-mono text-warm-brown block mb-0.5">Tech Stack</label>
            <input
              type="text"
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              placeholder="React, Tailwind, PostgreSQL (comma-separated)"
              className="field-coral w-full"
            />
          </div>

          <div>
            <label className="text-[0.65rem] font-mono text-warm-brown block mb-0.5">Repository URL</label>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/project"
              className="field-coral w-full"
            />
          </div>

          <div>
            <label className="text-[0.65rem] font-mono text-warm-brown block mb-0.5">
              Files {files.length > 0 && `(${files.length})`}
            </label>
            <FileUpload files={files} onFilesChange={setFiles} />
          </div>

          <AnimatedButton
            type="submit"
            disabled={submitting}
            variant="sm-primary"
            className="w-full"
          >
            {submitting ? "Creating..." : "Create Project"}
          </AnimatedButton>
        </form>
    </div>
  )
}
