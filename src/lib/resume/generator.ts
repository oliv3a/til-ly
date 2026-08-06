import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { getComputedSkills } from "@/lib/skills"
import { buildResumePrompt } from "./prompt-builder"
import type { ResumeData, ResumeEducation, TargetRole, ResumeQuestionnaire } from "./types"

function getClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

function isTillyUrl(url?: string): boolean {
  if (!url) return false
  return /til[l-]?y\.vercel\.app|(^|[./])til\.ly/i.test(url)
}

function cleanPortfolio(url?: string): string | undefined {
  return url && !isTillyUrl(url) ? url : undefined
}

function seedEducation(school: string, year: string): ResumeEducation[] {
  const entry: ResumeEducation = {
    school: school || "",
    degree: "",
    date: year || "",
    bullets: [],
  }
  return school || year ? [entry] : []
}

function fallbackResume(name: string, email: string, bio: string, school: string, year: string, targetRole: string): ResumeData {
  return {
    personalInfo: { name, email, bio: bio || "", school: school || "", year: year || "" },
    summary: "",
    skills: [],
    experience: [],
    projects: [],
    education: seedEducation(school, year),
    certifications: [],
    activities: [],
    volunteer: [],
    targetRole,
  }
}

export function normalizeResumeData(data: Partial<ResumeData> | null | undefined, school?: string, year?: string): ResumeData {
  const safe = (data || {}) as Partial<ResumeData>
  const education = Array.isArray(safe.education)
    ? safe.education
    : seedEducation(
        (safe.education as { school?: string } | undefined)?.school || school || "",
        (safe.education as { year?: string } | undefined)?.year || year || "",
      )
  return {
    personalInfo: {
      name: safe.personalInfo?.name || "",
      email: safe.personalInfo?.email || "",
      bio: safe.personalInfo?.bio || "",
      school: safe.personalInfo?.school || school || "",
      year: safe.personalInfo?.year || year || "",
      phone: safe.personalInfo?.phone,
      github: safe.personalInfo?.github,
      linkedin: safe.personalInfo?.linkedin,
      portfolio: cleanPortfolio(safe.personalInfo?.portfolio),
    },
    summary: safe.summary || "",
    skills: Array.isArray(safe.skills) ? safe.skills : [],
    experience: Array.isArray(safe.experience) ? safe.experience : [],
    projects: Array.isArray(safe.projects) ? safe.projects : [],
    education,
    certifications: Array.isArray(safe.certifications) ? safe.certifications : [],
    activities: Array.isArray(safe.activities) ? safe.activities : [],
    volunteer: Array.isArray(safe.volunteer) ? safe.volunteer : [],
    targetRole: safe.targetRole || "",
  }
}

const HACKATHON_RE = /\b(hackathon|hack\s*-?\s*day|code\s*jam|datathon|ctf|build\s+week|build\s+day)\b|\b(?:24|48)\s*-?\s*hour\b/i

const TECH_TERMS: { match: string; display: string }[] = [
  { match: "python", display: "Python" },
  { match: "javascript", display: "JavaScript" },
  { match: "typescript", display: "TypeScript" },
  { match: "react", display: "React" },
  { match: "next.js", display: "Next.js" },
  { match: "node.js", display: "Node.js" },
  { match: "express", display: "Express" },
  { match: "xgboost", display: "XGBoost" },
  { match: "pytorch", display: "PyTorch" },
  { match: "tensorflow", display: "TensorFlow" },
  { match: "fastapi", display: "FastAPI" },
  { match: "flask", display: "Flask" },
  { match: "django", display: "Django" },
  { match: "postgresql", display: "PostgreSQL" },
  { match: "mongodb", display: "MongoDB" },
  { match: "aws", display: "AWS" },
  { match: "gcp", display: "GCP" },
  { match: "azure", display: "Azure" },
  { match: "docker", display: "Docker" },
  { match: "kubernetes", display: "Kubernetes" },
  { match: "git", display: "Git" },
  { match: "openai", display: "OpenAI" },
  { match: "langchain", display: "LangChain" },
  { match: "machine learning", display: "Machine Learning" },
  { match: "tailwind css", display: "Tailwind CSS" },
  { match: "graphql", display: "GraphQL" },
  { match: "prisma", display: "Prisma" },
  { match: "redis", display: "Redis" },
  { match: "java", display: "Java" },
  { match: "go", display: "Go" },
  { match: "rust", display: "Rust" },
  { match: "sql", display: "SQL" },
]

function extractTech(text: string): string[] {
  const lower = text.toLowerCase()
  return TECH_TERMS.filter((t) => lower.includes(t.match)).map((t) => t.display)
}

function findHackathonBlocks(text: string): string[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim())
  const blocks: string[] = []
  let current = ""
  for (const line of lines) {
    if (!line) {
      if (current) {
        blocks.push(current)
        current = ""
      }
      continue
    }
    if (current && HACKATHON_RE.test(line)) {
      blocks.push(current)
      current = line
    } else if (current) {
      current += ` ${line}`
    } else if (HACKATHON_RE.test(line)) {
      current = line
    }
  }
  if (current) blocks.push(current)
  return blocks
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

function hackathonProjectName(block: string): string {
  const stripped = block.replace(/^\s*hackathon\s*[-–:]\s*/i, "").trim()
  const m = stripped.match(
    /(?:developed|built|created|designed|engineered)\s+(?:a|an)\s+([a-z][a-z0-9' ]{4,80}?)(?=\s+(?:to|for|that|which|using|in|with|by)|[,.;]|\s*$)/i,
  )
  if (m) return titleCase(m[1].trim())
  const first = stripped.split(/[.\n]/)[0].trim()
  if (first && first.length < 60) return titleCase(first)
  return "Hackathon Project"
}

function toBullets(text: string, max = 3): string[] {
  const flattened = text.replace(/\s*\n+\s*/g, ". ")
  return flattened
    .split(".")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max)
    .map((s) => (s.endsWith(".") ? s : `${s}.`))
}

function injectMissingHackathons(
  resume: ResumeData,
  questionnaire?: Omit<ResumeQuestionnaire, "targetRole" | "customRoleTitle">,
): ResumeData {
  const sources = [questionnaire?.extraNotes, questionnaire?.uploadedResumeText]
    .filter((s): s is string => !!s && s.trim().length > 0)
    .join("\n\n")
  if (!sources) return resume

  const existing = (resume.projects || [])
    .map((p) => `${p.name} ${p.description} ${p.highlights.join(" ")}`)
    .join(" ")
    .toLowerCase()

  for (const block of findHackathonBlocks(sources)) {
    const blockKey = block.toLowerCase()
    const name = hackathonProjectName(block)
    const nameKey = name.toLowerCase()
    const represented =
      existing.includes(blockKey) ||
      existing.includes(blockKey.slice(0, 60)) ||
      (nameKey.length > 8 && existing.includes(nameKey))
    if (represented) continue

    const description = block.replace(/^\s*hackathon\s*[-–:]\s*/i, "").trim()
    resume.projects.push({
      name,
      tech: extractTech(description).join(", "),
      description,
      highlights: toBullets(description),
    })
  }
  return resume
}

export async function generateResume(
  userId: string,
  targetRole: TargetRole,
  customRoleTitle?: string,
  questionnaire?: Omit<ResumeQuestionnaire, "targetRole" | "customRoleTitle">,
): Promise<ResumeData> {
  const client = getClient()
  if (!client) {
    throw new Error("OpenAI API key not configured")
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, bio: true, school: true, year: true },
  })

  if (!user) throw new Error("User not found")

  const name = user.name || "Student Developer"
  const email = user.email || ""
  const bio = user.bio || ""
  const school = user.school || ""
  const year = user.year || ""

  const [computedSkills, rawLogs, rawProjects, rawGoals] = await Promise.all([
    getComputedSkills(userId),
    prisma.studyLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        skillTags: { include: { skill: true } },
      },
    }),
    prisma.project.findMany({
      where: { userId, status: { not: "archived" } },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: {
        steps: { orderBy: { order: "asc" } },
        updates: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    }),
    prisma.goal.findMany({
      where: { userId, status: "active" },
      include: { roadmapItems: true },
    }),
  ])

  const skills = computedSkills.map((s) => ({
    name: s.skill.name,
    logCount: s.logCount,
    category: s.skill.category,
  }))

  const logs = rawLogs.map((l) => ({
    title: l.title,
    summary: l.aiSummary || "",
    date: l.createdAt.toISOString().split("T")[0],
    tags: l.skillTags.map((st) => st.skill.name),
  }))

  const projects = rawProjects.map((p) => ({
    title: p.title,
    description: p.description || "",
    techStack: p.techStack || "",
    status: p.status,
    steps: p.steps.map((s) => ({ topic: s.topic, isComplete: s.isComplete })),
    updates: p.updates.map((u) => u.content || "").filter(Boolean),
  }))

  const goals = rawGoals.map((g) => {
    const total = g.roadmapItems.length
    const complete = g.roadmapItems.filter((r) => r.isComplete).length
    return {
      title: g.title,
      progress: total > 0 ? Math.round((complete / total) * 100) : 0,
    }
  })

  const prompt = buildResumePrompt({
    userData: { name, email, bio, school, year, skills, logs, projects, goals },
    targetRole,
    customRoleTitle,
    questionnaire,
  })

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      console.error("generateResume: empty response from OpenAI")
      return fallbackResume(name, email, bio, school, year, customRoleTitle || targetRole)
    }

    const parsed = JSON.parse(content) as ResumeData

    const resume = normalizeResumeData(parsed, school, year)
    resume.personalInfo = {
      name: parsed.personalInfo?.name || name,
      email: parsed.personalInfo?.email || email,
      bio: parsed.personalInfo?.bio || bio,
      school: parsed.personalInfo?.school || school,
      year: parsed.personalInfo?.year || year,
      phone: parsed.personalInfo?.phone,
      github: parsed.personalInfo?.github,
      linkedin: parsed.personalInfo?.linkedin,
      portfolio: cleanPortfolio(parsed.personalInfo?.portfolio),
    }
    resume.targetRole = customRoleTitle || targetRole

    injectMissingHackathons(resume, questionnaire)

    return resume
  } catch (err) {
    console.error("generateResume failed:", err)
    throw new Error("Failed to generate resume. Please try again.")
  }
}
