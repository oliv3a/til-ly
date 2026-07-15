export interface ResumeExperience {
  title: string
  date: string
  bullets: string[]
}

export interface ResumeProject {
  name: string
  tech: string
  description: string
  highlights: string[]
}

export interface ResumeSkillCategory {
  category: string
  items: string[]
}

export interface ResumePersonalInfo {
  name: string
  email: string
  bio: string
  school: string
  year: string
  github?: string
  linkedin?: string
  portfolio?: string
}

export interface ResumeData {
  personalInfo: ResumePersonalInfo
  summary: string
  skills: ResumeSkillCategory[]
  experience: ResumeExperience[]
  projects: ResumeProject[]
  education: {
    school: string
    year: string
  }
  certifications: string[]
  targetRole: string
}

export interface ResumeQuestionnaire {
  targetRole: TargetRole
  customRoleTitle?: string
  experienceYears?: string
  githubUrl?: string
  linkedinUrl?: string
  emphasizeTech?: string
  resumeLength?: "one-page" | "two-page"
  uploadedResumeText?: string
  extraNotes?: string
}

export interface ResumeRequest extends ResumeQuestionnaire {
  refresh?: boolean
}

export interface ATSSuggestion {
  type: "success" | "warning" | "error"
  category: string
  message: string
}

export interface ResumeApiResponse {
  data: ResumeData
  ats: ATSSuggestion[]
  cached: boolean
}

export type TargetRole =
  | "frontend-engineer"
  | "backend-engineer"
  | "full-stack"
  | "ai-engineer"
  | "data-engineer"
  | "cybersecurity"
  | "cloud-engineer"
  | "custom"

export const TARGET_ROLE_LABELS: Record<TargetRole, string> = {
  "frontend-engineer": "Frontend Engineer",
  "backend-engineer": "Backend Engineer",
  "full-stack": "Full Stack Engineer",
  "ai-engineer": "AI / ML Engineer",
  "data-engineer": "Data Engineer",
  "cybersecurity": "Cybersecurity Engineer",
  "cloud-engineer": "Cloud Engineer",
  "custom": "Custom Role",
}
