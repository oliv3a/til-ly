import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { getComputedSkills } from "@/lib/skills"
import { buildResumePrompt } from "./prompt-builder"
import type { ResumeData, TargetRole, ResumeQuestionnaire } from "./types"

function getClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

function fallbackResume(name: string, email: string, bio: string, school: string, year: string, targetRole: string): ResumeData {
  return {
    personalInfo: { name, email, bio: bio || "", school: school || "", year: year || "" },
    summary: "",
    skills: [],
    experience: [],
    projects: [],
    education: { school: school || "", year: year || "" },
    certifications: [],
    targetRole,
  }
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

    const resume: ResumeData = {
      personalInfo: {
        name: parsed.personalInfo?.name || name,
        email: parsed.personalInfo?.email || email,
        bio: parsed.personalInfo?.bio || bio,
        school: parsed.personalInfo?.school || school,
        year: parsed.personalInfo?.year || year,
      },
      summary: parsed.summary || "",
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      experience: Array.isArray(parsed.experience) ? parsed.experience : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      education: parsed.education || { school, year },
      certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
      targetRole: customRoleTitle || targetRole,
    }

    return resume
  } catch (err) {
    console.error("generateResume failed:", err)
    throw new Error("Failed to generate resume. Please try again.")
  }
}
