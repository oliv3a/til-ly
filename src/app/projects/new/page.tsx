"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import AnimatedButton from "@/lib/motion/components/AnimatedButton"
import { useDropzone } from "react-dropzone"
export default function NewProjectPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [techStack, setTechStack] = useState("")
  const [repoUrl, setRepoUrl] = useState("")
  const [files, setFiles] = useState<{ url: string; type: string; name: string; extractedText?: string | null }[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(async (accepted: File[]) => {
    setUploading(true)
    const uploaded: typeof files = []
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
          <Link href="/projects" className="btn-base btn-sm btn-interact-bg">← Projects</Link>
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
