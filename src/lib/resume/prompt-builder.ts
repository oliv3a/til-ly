import type { TargetRole } from "./types"
import { getKeywordsForRole } from "./keyword-engine"

interface UserData {
  name: string
  email: string
  bio: string
  school: string
  year: string
  skills: { name: string; logCount: number; category: string | null }[]
  logs: { title: string; summary: string; date: string; tags: string[] }[]
  projects: {
    title: string
    description: string
    techStack: string
    status: string
    steps: { topic: string; isComplete: boolean }[]
    updates: string[]
  }[]
  goals: { title: string; progress: number }[]
}

interface QuestionnaireInput {
  experienceYears?: string
  githubUrl?: string
  linkedinUrl?: string
  portfolioUrl?: string
  emphasizeTech?: string
  resumeLength?: "one-page" | "two-page"
  uploadedResumeText?: string
  extraNotes?: string
}

const ACTION_VERBS = [
  "Designed", "Implemented", "Optimized", "Developed", "Engineered",
  "Architected", "Built", "Automated", "Reduced", "Scaled",
  "Improved", "Migrated", "Integrated", "Created", "Refactored",
  "Deployed", "Streamlined", "Enhanced", "Led", "Collaborated",
]

const WEAK_VERBS = ["Helped", "Worked on", "Responsible for", "Participated in"]

const RESUME_FORMULA_GUIDE = `
## Resume Writing Frameworks

### 1. STAR Method
- **S**ituation: The context or challenge
- **T**ask: What needed to be done
- **A**ction: What you specifically did
- **R**esult: The measurable outcome

Example: "Led migration of legacy REST APIs to GraphQL (Situation/Task), designing schema resolvers and migrating 15+ endpoints (Action), reducing frontend data fetching time by 40% and eliminating N+1 queries (Result)."

### 2. XYZ Formula (Google)
Accomplished [X] as measured by [Y] by doing [Z].

Example: "Accomplished a 35% reduction in login failures by implementing JWT authentication with token refresh logic serving 5,000+ users."

### 3. Google's Resume Formula
[Action Verb] + [What was done] + [Specific Technologies] + [Business Impact]

Example: "Designed and implemented a Redis caching layer using Node.js, reducing API response times by 42%."
`

function buildActionVerbSection(): string {
  return `
## Action Verbs
PREFER these strong verbs: ${ACTION_VERBS.join(", ")}.

AVOID these weak verbs: ${WEAK_VERBS.join(", ")}.

Each bullet point MUST start with a strong action verb from the PREFERRED list.
`
}

function buildKeywordSection(targetRole: string, customRoleTitle?: string): string {
  const roleLabel = customRoleTitle || targetRole.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())
  const keywords = getKeywordsForRole(targetRole)

  let section = `
## Keyword Optimization

Target Role: ${roleLabel}

### ATS Keywords to naturally integrate:
${keywords.map((k) => `- ${k}`).join("\n")}

These keywords should appear naturally within experience bullets and project descriptions — never as a flat list. Integrate them contextually into responsibilities and achievements.
`

  if (keywords.length > 10) {
    section += `\nAim to include at least 60% of these keywords across the resume sections.`
  }

  return section
}

function buildSkillCategorizationSection(): string {
  return `
## Skill Categorization
Organize skills into these exact categories:
- Languages
- Frameworks & Libraries
- Databases & Storage
- Cloud & Infrastructure
- DevOps & CI/CD
- Testing
- Tools & Editors

Each skill should appear in the most appropriate category. A skill may appear in multiple categories if relevant.`
}

function buildProjectEnhancementSection(): string {
  return `
## Project Enhancement Rules
For each project, enhance the description by explaining:

1. **Problem** — What challenge did the project solve?
2. **Solution** — What did you build?
3. **Technologies** — What specific tech stack was used?
4. **Scale/Impact** — Performance improvements, user impact, or scale

Example transformation:
Input: "Movie Recommendation App"
Output: "Developed a full-stack movie recommendation platform using React, Node.js, and MongoDB that generated personalized recommendations based on collaborative filtering algorithms, improving recommendation relevance and supporting over 2,000 concurrent users."

Input: "Task Manager API"
Output: "Designed and built a RESTful task management API with Node.js and Express, implementing JWT authentication and role-based access control, serving 500+ daily active users."

The highlights array should contain 1-3 specific, achievement-oriented bullet points about the project.`
}

function buildExperienceSection(): string {
  return `
## Experience Bullet Transformation Rules
Transform study log entries into achievement-oriented experience bullets using this approach:

1. Identify the core technical achievement
2. Apply the STAR/XYZ/Google formula
3. Use a strong action verb
4. Include specific technologies
5. Add impact or scale where possible

Example transformations:
Input: "Built REST APIs"
Output: "Designed and developed 15+ RESTful APIs using Node.js and Express, reducing frontend integration time by 40% while improving application scalability."

Input: "Worked on React components"
Output: "Architected reusable React component library with TypeScript and Storybook, reducing UI development time by 30% across 4 team projects."

IMPORTANT: Group related log entries into experience entries. Each entry represents a role/area (e.g., "Full Stack Development" or "Backend Engineering"). Use "Student Developer" as the role title if no specific role context exists. Use the date range of the logs as the date.`
}

function buildSummarySection(): string {
  return `
## Professional Summary Rules
Generate a 2-3 sentence professional summary that:
1. States the developer's identity (e.g., "Full-stack software engineer")
2. Highlights key technologies and skills
3. Mentions career goals or strengths
4. Is tailored to the target role

Example: "Full-stack software engineer with strong experience in React, Node.js, TypeScript, and cloud deployment. Passionate about building scalable web applications and optimizing system performance through clean architecture and automation."
`
}

function buildOutputFormatSection(): string {
  return `
## Output Format
Respond ONLY with a valid JSON object matching this exact structure:

{
  "personalInfo": {
    "name": "string — user's name",
    "email": "string — user's email",
    "bio": "string — short bio",
    "school": "string",
    "year": "string",
    "github": "string or null",
    "linkedin": "string or null",
    "portfolio": "string or null"
  },
  "summary": "string — 2-3 sentence professional summary",
  "skills": [
    {
      "category": "Languages | Frameworks & Libraries | Databases & Storage | Cloud & Infrastructure | DevOps & CI/CD | Testing | Tools & Editors",
      "items": ["string — skill name"]
    }
  ],
  "experience": [
    {
      "title": "string — role or area (e.g., 'Full Stack Development')",
      "date": "string — date range (e.g., 'Jan 2025 - Present')",
      "bullets": ["string — achievement-oriented bullet point starting with strong action verb"]
    }
  ],
  "projects": [
    {
      "name": "string — project name",
      "tech": "string — comma-separated technologies",
      "description": "string — enhanced project description (problem, solution, tech, impact)",
      "highlights": ["string — 1-3 achievement bullet points about this project"]
    }
  ],
  "education": {
    "school": "string",
    "year": "string"
  },
  "certifications": ["string — leave empty if none"],
  "targetRole": "string — the target role this resume is optimized for"
}
`
}

function buildConstraintsSection(): string {
  return `
## CRITICAL RULES — You MUST follow ALL of these:
1. **NEVER fabricate experience** — Only use the data provided. Never invent companies, job titles, or roles.
2. **NEVER invent specific metrics** — If metrics are missing, use placeholders like "X%" or "X+" (e.g., "reducing load time by X%"). Never make up exact numbers.
3. **PRESERVE factual accuracy** — All technologies, skills, and project names must come from the provided data. Do not add technologies the user hasn't used.
4. **NO generic filler** — Every bullet must be specific and substantive. Avoid vague statements like "Worked on various projects."
5. **Each bullet MUST start with a strong action verb** from the preferred list.
6. **Keep bullets concise** — 1-2 lines each, maximum 3 lines. No paragraphs.
7. **Organize skills logically** — Use only the 7 categories specified.
8. **Tech stack detection**: If the user mentions a technology, expand it with related keywords (e.g., React → Component Architecture, Hooks; Node → Express, Middleware, JWT).
`
}

export interface BuildPromptParams {
  userData: UserData
  targetRole: TargetRole
  customRoleTitle?: string
  questionnaire?: QuestionnaireInput
}

function buildQuestionnaireSection(q: QuestionnaireInput): string {
  const parts: string[] = []
  if (q.experienceYears) parts.push(`- Years of relevant experience: ${q.experienceYears}`)
  if (q.githubUrl) parts.push(`- GitHub: ${q.githubUrl}`)
  if (q.linkedinUrl) parts.push(`- LinkedIn: ${q.linkedinUrl}`)
  if (q.portfolioUrl) parts.push(`- Portfolio: ${q.portfolioUrl}`)
  if (q.emphasizeTech) parts.push(`- Technologies to emphasize: ${q.emphasizeTech}`)
  if (q.resumeLength) parts.push(`- Target resume length: ${q.resumeLength === "one-page" ? "1 page (keep concise)" : "1-2 pages (detailed but focused)"}`)
  if (q.extraNotes) parts.push(`- Extra notes from user: ${q.extraNotes}`)
  if (q.uploadedResumeText) parts.push(`
### Uploaded Existing Resume Content
The user uploaded their existing resume or other documents. Extract and merge any relevant experience, skills, projects, and certifications from this content into the new resume. Do NOT discard this data — treat it as the user's most complete self-representation.

Uploaded content:
"""
${q.uploadedResumeText.slice(0, 5000)}
"""`)
  if (parts.length === 0) return ""
  return `
## User Preferences
${parts.join("\n")}
`
}

export function buildResumePrompt(params: BuildPromptParams): string {
  const { userData, targetRole, customRoleTitle, questionnaire } = params

  const userBlock = `
## User Data

### Profile
Name: ${userData.name}
Email: ${userData.email}
Bio: ${userData.bio || "N/A"}
School: ${userData.school || "N/A"}
Year: ${userData.year || "N/A"}

### Skills (with log counts — higher = more experience)
${userData.skills.map((s) => `- ${s.name} (${s.logCount} logs) — category: ${s.category || "uncategorized"}`).join("\n")}

### Study Logs (recent activity)
${userData.logs.slice(0, 30).map((l) => `- "${l.title}" (${l.date})${l.summary ? `\n  Summary: ${l.summary}` : ""}${l.tags.length ? `\n  Tags: ${l.tags.join(", ")}` : ""}`).join("\n")}

### Projects
${userData.projects.slice(0, 10).map((p) => `- "${p.title}" [${p.status}]
  Description: ${p.description || "N/A"}
  Tech Stack: ${p.techStack || "N/A"}
  Step Progress: ${p.steps.filter((s) => s.isComplete).length}/${p.steps.length} complete
  Updates: ${p.updates.slice(0, 3).join("; ") || "None"}`).join("\n")}

### Goals
${userData.goals.slice(0, 5).map((g) => `- "${g.title}" (${g.progress}% complete)`).join("\n")}
`

  const roleLabel = customRoleTitle || targetRole.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())

  const prompt = `You are a professional resume writer specializing in technology careers. Your task is to generate a polished, ATS-optimized resume for a software engineer targeting a ${roleLabel} position.

${userBlock}
${questionnaire ? buildQuestionnaireSection(questionnaire) : ""}
${buildActionVerbSection()}
${RESUME_FORMULA_GUIDE}
${buildKeywordSection(targetRole, customRoleTitle)}
${buildSkillCategorizationSection()}
${buildProjectEnhancementSection()}
${buildExperienceSection()}
${buildSummarySection()}
${buildOutputFormatSection()}
${buildConstraintsSection()}
`

  return prompt
}
