"use client"

import { useState, useCallback, useRef } from "react"
import type {
  ResumeData,
  ResumeApiResponse,
  ATSSuggestion,
  TargetRole,
  ResumeQuestionnaire,
} from "@/lib/resume/types"
import { TARGET_ROLE_LABELS } from "@/lib/resume/types"

const ROLE_OPTIONS = Object.entries(TARGET_ROLE_LABELS).filter(([k]) => k !== "custom")

export default function ResumeClient() {
  const [targetRole, setTargetRole] = useState<TargetRole>("full-stack")
  const [customRole, setCustomRole] = useState("")
  const [experienceYears, setExperienceYears] = useState("")
  const [githubUrl, setGithubUrl] = useState("")
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [emphasizeTech, setEmphasizeTech] = useState("")
  const [resumeLength, setResumeLength] = useState<"one-page" | "two-page">("one-page")
  const [extraNotes, setExtraNotes] = useState("")
  const [pastedResumeText, setPastedResumeText] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ResumeData | null>(null)
  const [ats, setAts] = useState<ATSSuggestion[] | null>(null)
  const [cached, setCached] = useState(false)
  const [expandedAts, setExpandedAts] = useState(false)
  const [editing, setEditing] = useState(false)
  const resumeRef = useRef<HTMLDivElement>(null)

  const canGenerate = targetRole !== "custom" || customRole.trim().length > 0

  const buildQuestionnaire = useCallback((): ResumeQuestionnaire => ({
    targetRole,
    customRoleTitle: targetRole === "custom" ? customRole.trim() || undefined : undefined,
    experienceYears: experienceYears || undefined,
    githubUrl: githubUrl.trim() || undefined,
    linkedinUrl: linkedinUrl.trim() || undefined,
    emphasizeTech: emphasizeTech.trim() || undefined,
    resumeLength,
    uploadedResumeText: pastedResumeText.trim() || undefined,
    extraNotes: extraNotes.trim() || undefined,
  }), [targetRole, customRole, experienceYears, githubUrl, linkedinUrl, emphasizeTech, resumeLength, pastedResumeText, extraNotes])

  const generate = useCallback(async (refresh = false) => {
    setLoading(true)
    setError(null)

    try {
      const q = buildQuestionnaire()
      const res = await fetch("/api/resume/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...q, refresh }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error((errData as { error?: string }).error || "Failed to generate resume")
      }

      const result = (await res.json()) as ResumeApiResponse
      setData(result.data)
      setAts(result.ats)
      setCached(result.cached)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }, [buildQuestionnaire])

  const handlePrint = () => window.print()
  const handleRegenerate = () => generate(true)
  const toggleEdit = () => setEditing((e) => !e)

  const suggestionIcon = (type: ATSSuggestion["type"]) => {
    switch (type) {
      case "success": return "✓"
      case "warning": return "!"
      case "error": return "✗"
    }
  }

  const suggestionColor = (type: ATSSuggestion["type"]) => {
    switch (type) {
      case "success": return "text-green-700"
      case "warning": return "text-amber-700"
      case "error": return "text-red-700"
    }
  }

  const suggestionBg = (type: ATSSuggestion["type"]) => {
    switch (type) {
      case "success": return "bg-green-50 border-green-300"
      case "warning": return "bg-amber-50 border-amber-300"
      case "error": return "bg-red-50 border-red-300"
    }
  }

  return (
    <div>
      {/* ── Questionnaire ── */}
      <div className="frame-block p-4 mb-6 no-print">
        <p className="text-[0.55rem] font-mono text-muted-ink/50 uppercase tracking-wider mb-3">
          Resume Questionnaire
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
          {/* Target role */}
          <div>
            <label className="text-[0.55rem] font-mono text-muted-ink/50 uppercase tracking-wider block mb-0.5">
              Target Role *
            </label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value as TargetRole)}
              className="field-coral text-[0.75rem]"
              disabled={loading}
            >
              {ROLE_OPTIONS.map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
              <option value="custom">Custom Role...</option>
            </select>
            {targetRole === "custom" && (
              <input
                type="text"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="e.g. DevOps Engineer"
                className="field-coral text-[0.75rem] mt-1"
                disabled={loading}
              />
            )}
          </div>

          {/* Experience years */}
          <div>
            <label className="text-[0.55rem] font-mono text-muted-ink/50 uppercase tracking-wider block mb-0.5">
              Years of Experience
            </label>
            <select
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              className="field-coral text-[0.75rem]"
              disabled={loading}
            >
              <option value="">Prefer not to say</option>
              <option value="&lt;1">&lt; 1 year</option>
              <option value="1-2">1 - 2 years</option>
              <option value="3-5">3 - 5 years</option>
              <option value="5+">5+ years</option>
            </select>
          </div>

          {/* GitHub */}
          <div>
            <label className="text-[0.55rem] font-mono text-muted-ink/50 uppercase tracking-wider block mb-0.5">
              GitHub URL
            </label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/yourhandle"
              className="field-coral text-[0.75rem]"
              disabled={loading}
            />
          </div>

          {/* LinkedIn */}
          <div>
            <label className="text-[0.55rem] font-mono text-muted-ink/50 uppercase tracking-wider block mb-0.5">
              LinkedIn URL
            </label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/yourhandle"
              className="field-coral text-[0.75rem]"
              disabled={loading}
            />
          </div>

          {/* Resume length */}
          <div>
            <label className="text-[0.55rem] font-mono text-muted-ink/50 uppercase tracking-wider block mb-0.5">
              Resume Length
            </label>
            <div className="flex gap-3 mt-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="resumeLength"
                  checked={resumeLength === "one-page"}
                  onChange={() => setResumeLength("one-page")}
                  disabled={loading}
                  className="accent-warm-brown"
                />
                <span className="text-[0.65rem] font-mono text-warm-brown">1 page</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="resumeLength"
                  checked={resumeLength === "two-page"}
                  onChange={() => setResumeLength("two-page")}
                  disabled={loading}
                  className="accent-warm-brown"
                />
                <span className="text-[0.65rem] font-mono text-warm-brown">1-2 pages</span>
              </label>
            </div>
          </div>

          {/* Technologies to emphasize (spans full width) */}
          <div className="sm:col-span-2">
            <label className="text-[0.55rem] font-mono text-muted-ink/50 uppercase tracking-wider block mb-0.5">
              Technologies to Emphasize
            </label>
            <textarea
              value={emphasizeTech}
              onChange={(e) => setEmphasizeTech(e.target.value)}
              placeholder="e.g. React, TypeScript, AWS, Python — comma-separated"
              className="field-coral text-[0.75rem] resize-none"
              rows={2}
              disabled={loading}
            />
          </div>

          {/* Paste existing resume text (optional) */}
          <div className="sm:col-span-2">
            <label className="text-[0.55rem] font-mono text-muted-ink/50 uppercase tracking-wider block mb-0.5">
              Paste Your Resume Text Here <span className="text-muted-ink/30">(optional)</span>
            </label>
            <textarea
              value={pastedResumeText}
              onChange={(e) => setPastedResumeText(e.target.value)}
              placeholder="Copy and paste your current resume, work experience, or any other relevant content here. The AI will merge it with your til.ly data."
              className="field-coral text-[0.75rem] resize-y"
              rows={8}
              disabled={loading}
            />
          </div>

          {/* Extra notes (optional) */}
          <div className="sm:col-span-2">
            <label className="text-[0.55rem] font-mono text-muted-ink/50 uppercase tracking-wider block mb-0.5">
              Extra Notes <span className="text-muted-ink/30">(optional)</span>
            </label>
            <textarea
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              placeholder="Anything else you want the AI to know — e.g. 'I led a team of 3 on a hackathon project' or 'I contributed to open source'"
              className="field-coral text-[0.75rem] resize-none"
              rows={2}
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => generate(false)}
            disabled={loading || !canGenerate}
            className="btn-base btn-coral btn-interact"
          >
            {loading ? "Generating..." : "Generate Resume"}
          </button>
          {loading && (
            <span className="text-[0.55rem] font-mono text-muted-ink/40">
              Analyzing your profile, logs, and projects...
            </span>
          )}
        </div>

        {error && (
          <p className="text-[0.65rem] font-mono text-red-700 mt-2">{error}</p>
        )}

        {cached && data && (
          <p className="text-[0.55rem] font-mono text-muted-ink/40 mt-2">
            Loaded from cache.{" "}
            <button onClick={handleRegenerate} className="underline text-muted-teal cursor-pointer">
              Regenerate with AI
            </button>
          </p>
        )}
      </div>

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-warm-paper/60 w-1/3 rounded" />
          <div className="h-4 bg-warm-paper/60 w-2/3 rounded" />
          <div className="h-4 bg-warm-paper/60 w-1/2 rounded" />
          <div className="h-4 bg-warm-paper/60 w-3/4 rounded" />
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="h-32 bg-warm-paper/60 rounded" />
            <div className="h-32 bg-warm-paper/60 rounded" />
          </div>
          <div className="h-24 bg-warm-paper/60 rounded mt-4" />
          <div className="h-24 bg-warm-paper/60 rounded mt-2" />
        </div>
      )}

      {/* ── Resume + ATS panel ── */}
      {data && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {ats && ats.length > 0 && (
            <div className="lg:col-span-1 order-2 lg:order-1 no-print">
              <div className="frame-block p-3 lg:sticky lg:top-20">
                <button
                  onClick={() => setExpandedAts(!expandedAts)}
                  className="flex items-center justify-between w-full text-left lg:cursor-default"
                >
                  <p className="text-[0.55rem] font-mono text-muted-ink/50 uppercase tracking-wider">
                    ATS Review
                  </p>
                  <span className="text-[0.55rem] font-mono text-muted-ink/40 lg:hidden">
                    {expandedAts ? "▲" : "▼"}
                  </span>
                </button>

                <div className={`mt-2 space-y-1 ${expandedAts ? "block" : "hidden"} lg:block`}>
                  {ats.map((s, i) => (
                    <div
                      key={i}
                      className={`text-[0.55rem] font-mono px-2 py-1 border ${suggestionBg(s.type)}`}
                    >
                      <span className={`font-bold ${suggestionColor(s.type)}`}>
                        {suggestionIcon(s.type)}
                      </span>{" "}
                      <span className="font-bold uppercase text-[0.45rem]">{s.category}:</span>{" "}
                      {s.message}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="lg:col-span-3 order-1 lg:order-2" ref={resumeRef}>
            <div className="flex items-center justify-between mb-3 no-print flex-wrap gap-2">
              <p className="text-[0.55rem] font-mono text-muted-ink/40">
                Optimized for: <span className="font-bold text-warm-brown">{data.targetRole}</span>
              </p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handlePrint}
                  className="btn-base btn-coral btn-interact text-[0.65rem]"
                >
                  Print / Save as PDF
                </button>
                <button
                  onClick={toggleEdit}
                  className="btn-base btn-outline btn-interact text-[0.65rem]"
                >
                  {editing ? "Done Editing" : "Edit"}
                </button>
                <button
                  onClick={handleRegenerate}
                  className="btn-base btn-outline btn-interact text-[0.65rem]"
                >
                  Regenerate
                </button>
              </div>
            </div>

            {editing ? (
              <ResumeDocumentEditor data={data} setData={setData} />
            ) : (
              <ResumeDocument data={data} />
            )}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!data && !loading && (
        <div className="frame-block p-8 text-center">
          <p className="font-serif text-sm text-warm-brown">Ready to build your resume</p>
          <p className="text-[0.65rem] font-mono text-muted-ink/50 mt-1">
            Fill in the questionnaire above and click Generate Resume.
            <br />The AI will analyze your logs, skills, projects, and pasted resume to craft an ATS-optimized resume.
          </p>
        </div>
      )}
    </div>
  )
}

function ResumeDocument({ data }: { data: ResumeData }) {
  const skillsCount = data.skills.reduce((s, c) => s + c.items.length, 0)
  const contactParts: string[] = [data.personalInfo.email]
  if (data.personalInfo.github) contactParts.push(data.personalInfo.github)
  if (data.personalInfo.linkedin) contactParts.push(data.personalInfo.linkedin)
  if (data.personalInfo.portfolio) contactParts.push(data.personalInfo.portfolio)

  return (
    <div className="bg-white border-2 border-warm-brown p-6 sm:p-8 md:p-10 resume-document">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-warm-brown" style={{ fontFamily: "Georgia, serif" }}>
          {data.personalInfo.name}
        </h1>
        <p className="text-[0.65rem] text-muted-ink/60 mt-1" style={{ fontFamily: "Georgia, serif" }}>
          {contactParts.join(" · ")}
          {(data.personalInfo.school || data.personalInfo.year) && contactParts.length > 0 && (
            <>{" · "}{[data.personalInfo.school, data.personalInfo.year].filter(Boolean).join(" · ")}</>
          )}
        </p>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-5">
          <SectionTitle text="Professional Summary" />
          <p className="text-[0.7rem] leading-relaxed text-warm-brown mt-1" style={{ fontFamily: "Georgia, serif" }}>
            {data.summary}
          </p>
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div className="mb-5">
          <SectionTitle text="Skills" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 mt-1.5">
            {data.skills.map((cat, i) => (
              <div key={i}>
                <p className="text-[0.55rem] font-bold text-warm-brown uppercase tracking-wider" style={{ fontFamily: "Georgia, serif" }}>
                  {cat.category}
                </p>
                <p className="text-[0.65rem] text-muted-ink/80 leading-snug" style={{ fontFamily: "Georgia, serif" }}>
                  {cat.items.join(", ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div className="mb-5">
          <SectionTitle text="Experience" />
          <div className="mt-1.5 space-y-3">
            {data.experience.map((exp, i) => (
              <div key={i}>
                <div className="flex items-start justify-between">
                  <p className="text-[0.75rem] font-bold text-warm-brown" style={{ fontFamily: "Georgia, serif" }}>
                    {exp.title}
                  </p>
                  <p className="text-[0.6rem] text-muted-ink/50 shrink-0 ml-2" style={{ fontFamily: "Georgia, serif" }}>
                    {exp.date}
                  </p>
                </div>
                <ul className="mt-0.5 space-y-0.5 list-disc list-inside">
                  {exp.bullets.map((bullet, j) => (
                    <li key={j} className="text-[0.7rem] leading-snug text-muted-ink/80" style={{ fontFamily: "Georgia, serif" }}>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {data.projects.length > 0 && (
        <div className="mb-5">
          <SectionTitle text="Projects" />
          <div className="mt-1.5 space-y-2.5">
            {data.projects.map((proj, i) => (
              <div key={i}>
                <div className="flex items-start justify-between">
                  <p className="text-[0.75rem] font-bold text-warm-brown" style={{ fontFamily: "Georgia, serif" }}>
                    {proj.name}
                  </p>
                  {proj.tech && (
                    <p className="text-[0.55rem] text-muted-ink/50 shrink-0 ml-2 text-right max-w-[40%]" style={{ fontFamily: "Georgia, serif" }}>
                      {proj.tech}
                    </p>
                  )}
                </div>
                <p className="text-[0.7rem] leading-snug text-muted-ink/80 mt-0.5" style={{ fontFamily: "Georgia, serif" }}>
                  {proj.description}
                </p>
                {proj.highlights.length > 0 && (
                  <ul className="mt-0.5 space-y-0.5 list-disc list-inside">
                    {proj.highlights.map((h, j) => (
                      <li key={j} className="text-[0.65rem] text-muted-ink/70" style={{ fontFamily: "Georgia, serif" }}>
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {(data.education?.school || data.personalInfo?.school) && (
        <div className="mb-5">
          <SectionTitle text="Education" />
          <p className="text-[0.7rem] text-warm-brown mt-1" style={{ fontFamily: "Georgia, serif" }}>
            {data.education?.school || data.personalInfo.school}
            {(data.education?.year || data.personalInfo.year) && (
              <> — {data.education?.year || data.personalInfo.year}</>
            )}
          </p>
        </div>
      )}

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <div>
          <SectionTitle text="Certifications" />
          <ul className="mt-1 space-y-0.5 list-disc list-inside">
            {data.certifications.map((cert, i) => (
              <li key={i} className="text-[0.7rem] text-muted-ink/80" style={{ fontFamily: "Georgia, serif" }}>
                {cert}
              </li>
            ))}
          </ul>
        </div>
      )}

      {skillsCount === 0 && data.experience.length === 0 && data.projects.length === 0 && (
        <p className="text-[0.65rem] font-mono text-muted-ink/40 text-center py-8">
          No resume data yet. Add study logs and skills to generate a complete resume.
        </p>
      )}
    </div>
  )
}

function ResumeDocumentEditor({
  data,
  setData,
}: {
  data: ResumeData
  setData: (d: ResumeData) => void
}) {
  const update = (patch: Partial<ResumeData>) => setData({ ...data, ...patch })

  return (
    <div className="bg-white border-2 border-warm-brown p-6 sm:p-8 md:p-10 space-y-5">
      {/* Personal Info */}
      <div className="space-y-2">
        <SectionTitle text="Personal Info" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input className="field-coral text-[0.75rem]" value={data.personalInfo.name} onChange={(e) => update({ personalInfo: { ...data.personalInfo, name: e.target.value } })} placeholder="Name" />
          <input className="field-coral text-[0.75rem]" value={data.personalInfo.email} onChange={(e) => update({ personalInfo: { ...data.personalInfo, email: e.target.value } })} placeholder="Email" />
          <input className="field-coral text-[0.75rem]" value={data.personalInfo.github || ""} onChange={(e) => update({ personalInfo: { ...data.personalInfo, github: e.target.value } })} placeholder="GitHub URL" />
          <input className="field-coral text-[0.75rem]" value={data.personalInfo.linkedin || ""} onChange={(e) => update({ personalInfo: { ...data.personalInfo, linkedin: e.target.value } })} placeholder="LinkedIn URL" />
          <input className="field-coral text-[0.75rem]" value={data.personalInfo.school || ""} onChange={(e) => update({ personalInfo: { ...data.personalInfo, school: e.target.value } })} placeholder="School" />
          <input className="field-coral text-[0.75rem]" value={data.personalInfo.year || ""} onChange={(e) => update({ personalInfo: { ...data.personalInfo, year: e.target.value } })} placeholder="Year" />
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-2">
        <SectionTitle text="Professional Summary" />
        <textarea className="field-coral text-[0.75rem] resize-y w-full" rows={3} value={data.summary} onChange={(e) => update({ summary: e.target.value })} />
      </div>

      {/* Skills */}
      <div className="space-y-2">
        <SectionTitle text="Skills" />
        {data.skills.map((cat, i) => (
          <div key={i} className="flex gap-2 items-start">
            <input className="field-coral text-[0.75rem] w-1/3" value={cat.category} onChange={(e) => {
              const next = [...data.skills]
              next[i] = { ...next[i], category: e.target.value }
              update({ skills: next })
            }} placeholder="Category" />
            <textarea className="field-coral text-[0.75rem] resize-y flex-1" rows={2} value={cat.items.join(", ")} onChange={(e) => {
              const next = [...data.skills]
              next[i] = { ...next[i], items: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }
              update({ skills: next })
            }} placeholder="Items (comma-separated)" />
            <button onClick={() => update({ skills: data.skills.filter((_, j) => j !== i) })} className="text-red-600 hover:text-red-800 text-[0.6rem] font-mono underline shrink-0 mt-1">
              Remove
            </button>
          </div>
        ))}
        <button onClick={() => update({ skills: [...data.skills, { category: "", items: [] }] })} className="btn-base btn-outline btn-interact text-[0.65rem]">
          + Add Category
        </button>
      </div>

      {/* Experience */}
      <div className="space-y-2">
        <SectionTitle text="Experience" />
        {data.experience.map((exp, i) => (
          <div key={i} className="border border-warm-brown/10 p-3 rounded space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                <input className="field-coral text-[0.75rem]" value={exp.title} onChange={(e) => {
                  const next = [...data.experience]
                  next[i] = { ...next[i], title: e.target.value }
                  update({ experience: next })
                }} placeholder="Title" />
                <input className="field-coral text-[0.75rem]" value={exp.date} onChange={(e) => {
                  const next = [...data.experience]
                  next[i] = { ...next[i], date: e.target.value }
                  update({ experience: next })
                }} placeholder="Date" />
              </div>
              <button onClick={() => update({ experience: data.experience.filter((_, j) => j !== i) })} className="text-red-600 hover:text-red-800 text-[0.6rem] font-mono underline shrink-0 mt-1">
                Remove
              </button>
            </div>
            <textarea className="field-coral text-[0.75rem] resize-y w-full" rows={3} value={exp.bullets.join("\n")} onChange={(e) => {
              const next = [...data.experience]
              next[i] = { ...next[i], bullets: e.target.value.split("\n").filter(Boolean) }
              update({ experience: next })
            }} placeholder="One bullet point per line" />
          </div>
        ))}
        <button onClick={() => update({ experience: [...data.experience, { title: "", date: "", bullets: [""] }] })} className="btn-base btn-outline btn-interact text-[0.65rem]">
          + Add Experience
        </button>
      </div>

      {/* Projects */}
      <div className="space-y-2">
        <SectionTitle text="Projects" />
        {data.projects.map((proj, i) => (
          <div key={i} className="border border-warm-brown/10 p-3 rounded space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                <input className="field-coral text-[0.75rem]" value={proj.name} onChange={(e) => {
                  const next = [...data.projects]
                  next[i] = { ...next[i], name: e.target.value }
                  update({ projects: next })
                }} placeholder="Project name" />
                <input className="field-coral text-[0.75rem]" value={proj.tech} onChange={(e) => {
                  const next = [...data.projects]
                  next[i] = { ...next[i], tech: e.target.value }
                  update({ projects: next })
                }} placeholder="Technologies" />
              </div>
              <button onClick={() => update({ projects: data.projects.filter((_, j) => j !== i) })} className="text-red-600 hover:text-red-800 text-[0.6rem] font-mono underline shrink-0 mt-1">
                Remove
              </button>
            </div>
            <textarea className="field-coral text-[0.75rem] resize-y w-full" rows={2} value={proj.description} onChange={(e) => {
              const next = [...data.projects]
              next[i] = { ...next[i], description: e.target.value }
              update({ projects: next })
            }} placeholder="Description" />
            <textarea className="field-coral text-[0.75rem] resize-y w-full" rows={2} value={proj.highlights.join("\n")} onChange={(e) => {
              const next = [...data.projects]
              next[i] = { ...next[i], highlights: e.target.value.split("\n").filter(Boolean) }
              update({ projects: next })
            }} placeholder="Highlights (one per line)" />
          </div>
        ))}
        <button onClick={() => update({ projects: [...data.projects, { name: "", tech: "", description: "", highlights: [""] }] })} className="btn-base btn-outline btn-interact text-[0.65rem]">
          + Add Project
        </button>
      </div>

      {/* Education */}
      <div className="space-y-2">
        <SectionTitle text="Education" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input className="field-coral text-[0.75rem]" value={data.education?.school || ""} onChange={(e) => update({ education: { ...data.education, school: e.target.value } })} placeholder="School" />
          <input className="field-coral text-[0.75rem]" value={data.education?.year || ""} onChange={(e) => update({ education: { ...data.education, year: e.target.value } })} placeholder="Year" />
        </div>
      </div>

      {/* Certifications */}
      <div className="space-y-2">
        <SectionTitle text="Certifications" />
        {data.certifications.map((cert, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input className="field-coral text-[0.75rem] flex-1" value={cert} onChange={(e) => {
              const next = [...data.certifications]
              next[i] = e.target.value
              update({ certifications: next })
            }} placeholder="Certification" />
            <button onClick={() => update({ certifications: data.certifications.filter((_, j) => j !== i) })} className="text-red-600 hover:text-red-800 text-[0.6rem] font-mono underline shrink-0">
              Remove
            </button>
          </div>
        ))}
        <button onClick={() => update({ certifications: [...data.certifications, ""] })} className="btn-base btn-outline btn-interact text-[0.65rem]">
          + Add Certification
        </button>
      </div>
    </div>
  )
}

function SectionTitle({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 mb-0.5">
      <span className="h-px flex-1 bg-warm-brown/20" />
      <p className="text-[0.6rem] font-bold uppercase tracking-widest text-warm-brown" style={{ fontFamily: "Georgia, serif" }}>
        {text}
      </p>
      <span className="h-px flex-1 bg-warm-brown/20" />
    </div>
  )
}
