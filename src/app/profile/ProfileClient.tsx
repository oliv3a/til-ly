"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import AnimatedButton from "@/lib/motion/components/AnimatedButton"

export default function ProfileClient() {
  const { update } = useSession()
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [school, setSchool] = useState("")
  const [year, setYear] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/profile")
        if (res.ok) {
          const data = await res.json()
          setName(data.name || "")
          setBio(data.bio || "")
          setSchool(data.school || "")
          setYear(data.year || "")
        }
      } catch {
        // fallback to session name
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, school, year }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to save" }))
        throw new Error(err.error || "Failed to save")
      }

      await update()
      toast.success("Profile saved!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="frame-block p-4">
        <div className="space-y-3 animate-pulse">
          <div className="h-8 field-coral" />
          <div className="h-16 field-coral" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-8 field-coral" />
            <div className="h-8 field-coral" />
          </div>
          <div className="h-8 btn-base btn-sm-primary btn-interact" />
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="frame-block space-y-3">

      <div>
        <label className="text-[0.65rem] font-mono text-warm-brown block mb-0.5">Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          className="field-coral w-full"
        />
      </div>
      <div>
        <label className="text-[0.65rem] font-mono text-warm-brown block mb-0.5">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="A short bio for your portfolio..."
          className="field-coral w-full resize-y"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[0.65rem] font-mono text-warm-brown block mb-0.5">School</label>
          <input
            type="text"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            maxLength={100}
            placeholder="University of ..."
            className="field-coral w-full"
          />
        </div>
        <div>
          <label className="text-[0.65rem] font-mono text-warm-brown block mb-0.5">Year</label>
          <input
            type="text"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            maxLength={50}
            placeholder="Sophomore"
            className="field-coral w-full"
          />
        </div>
      </div>
      <AnimatedButton
        type="submit"
        disabled={saving || !name.trim()}
        variant="coral"
        className="w-full"
      >
        {saving ? "Saving..." : "Save Profile"}
      </AnimatedButton>
    </form>
  )
}
