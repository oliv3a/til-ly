"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import AnimatedCard from "@/lib/motion/components/AnimatedCard"

interface Student {
  id: string
  name: string | null
  email: string
  avatarUrl: string | null
  bio: string | null
  school: string | null
  year: string | null
  streakCount: number
  userSkills: { id: string; logCount: number; skill: { name: string; category: string | null } }[]
}

export default function StudentsClient() {
  const [students, setStudents] = useState<Student[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudents()
  }, [])

  async function fetchStudents(skill?: string, name?:string) {
    setLoading(true)
    const params = new URLSearchParams()
    if (skill) params.set("skill", skill)
    if (name) params.set("name", name)
    const res = await fetch(`/api/recruit/students?${params}`)
    if (res.ok) setStudents(await res.json())
    setLoading(false)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    fetchStudents(undefined, search)
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or skill..."
          className="field-coral w-full"
        />
      </form>

      {loading ? (
        <p className="text-muted-ink/50 text-center py-8 text-[0.65rem] font-mono">Loading...</p>
      ) : students.length === 0 ? (
        <div className="frame-block p-6 text-center">
          <p className="font-serif text-base text-muted-ink/50">No students found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {students.map((s) => (
            <Link
              key={s.id}
              href={`/recruit/students/${s.id}`}
              className="block"
            >
              <AnimatedCard className="frame-block p-4 hover:shadow-md transition-shadow">
                <h3 className="font-serif text-sm text-warm-brown">{s.name || "Anonymous"}</h3>
                {s.bio && <p className="text-[0.65rem] font-mono text-muted-ink/60 mt-0.5 line-clamp-2">{s.bio}</p>}
                {(s.school || s.year) && (
                  <p className="text-[0.55rem] font-mono text-muted-ink/50 mt-1">{[s.school, s.year].filter(Boolean).join(" · ")}</p>
                )}
                {s.userSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {s.userSkills.map((us) => (
                      <span key={us.id} className="tag">
                        {us.skill.name} · {us.logCount} logs
                      </span>
                    ))}
                  </div>
                )}
                {s.streakCount > 0 && (
                  <p className="text-[0.55rem] font-mono text-muted-ink/50 mt-1">🔥 {s.streakCount}-day streak</p>
                )}
              </AnimatedCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
