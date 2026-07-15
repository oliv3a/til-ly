export interface LogFormData {
  title: string
  content?: string
  files?: File[]
}

export interface AiSummaryResult {
  summary: string
  skills: { name: string; category: string; depth: "surface" | "moderate" | "deep" }[]
  mappedGoalIds?: string[]
  nextRecommendation?: string
}

export interface Recommendation {
  topic: string
  reason: string
  estimatedTime: string
  goalProgressAfter?: string
}

export interface UserSkillWithSkill {
  id: string
  logCount: number
  skill: {
    id: string
    name: string
    category: string | null
  }
}

export interface StudyLogWithRelations {
  id: string
  title: string
  content: string | null
  type: string
  aiSummary: string | null
  createdAt: Date
  files: { id: string; fileUrl: string; fileType: string; fileName: string }[]
  skillTags: { skill: { id: string; name: string; category: string | null } }[]
  goalLinks: { goal: { id: string; title: string } }[]
  roadmapLinks: { id: string; roadmapItem: { id: string; topic: string; goal: { id: string; title: string } } }[]
}

export interface GoalWithRoadmap {
  id: string
  title: string
  description: string | null
  targetDate: Date | null
  category: string | null
  status: string
  roadmapItems: RoadmapItemType[]
}

export interface RoadmapItemType {
  id: string
  order: number
  topic: string
  description: string | null
  estimatedLogs: number
  isComplete: boolean
  _count: { studyLogLinks: number }
}

export interface ProjectType {
  id: string
  title: string
  description: string | null
  techStack: string | null
  repoUrl: string | null
  status: string
  aiOverallFeedback: string | null
  notes: string | null
  progressPct: number
  createdAt: Date
  updatedAt: Date
  files: ProjectFileType[]
  steps: ProjectStepType[]
  updates: ProjectUpdateType[]
}

export interface ProjectFileType {
  id: string
  fileUrl: string
  fileType: string
  fileName: string
  extractedText: string | null
}

export interface ProjectStepType {
  id: string
  topic: string
  order: number
  isComplete: boolean
}

export interface DashboardGoal {
  id: string
  title: string
  roadmapItems?: { isComplete: boolean; order: number; _count?: { studyLogLinks: number } }[]
}

export interface DashboardSkill {
  id: string
  logCount: number
  skill: { id: string; name: string; category: string | null }
}

export interface PortfolioLog {
  id: string
  title: string
  createdAt: string
  aiSummary: string | null
  skillTags: { id: string; xp: number; skill: { id: string; name: string } }[]
}

export interface PortfolioGoal {
  id: string
  title: string
  roadmapItems?: { isComplete: boolean; _count?: { studyLogLinks: number } }[]
}

export interface PortfolioSkill {
  id: string
  logCount: number
  skill: { id: string; name: string }
}

export interface PortfolioProject {
  id: string
  title: string
  status: string
  progressPct: number
}

export interface ProjectUpdateType {
  id: string
  content: string | null
  aiComment: string | null
  onTrack: boolean | null
  createdAt: Date
}
