import { prisma } from "@/lib/prisma"
import {
  type MilestoneKey,
  type UserMilestoneState,
  MILESTONE_KEYS,
  MILESTONE_BY_KEY,
} from "./milestoneDefinitions"

export interface MilestoneEntry {
  key: MilestoneKey
  achievedAt: Date
}

type Condition = (state: UserMilestoneState) => boolean

const CONDITIONS: Partial<Record<MilestoneKey, Condition>> = {
  // ── Study ──────────────────────────────────────────────
  logs_1:   (s) => s.totalLogs >= 1,
  logs_10:  (s) => s.totalLogs >= 10,
  logs_25:  (s) => s.totalLogs >= 25,
  logs_50:  (s) => s.totalLogs >= 50,
  logs_100: (s) => s.totalLogs >= 100,
  logs_250: (s) => s.totalLogs >= 250,
  logs_365: (s) => s.totalLogs >= 365,

  // ── Streaks ────────────────────────────────────────────
  streak_3:   (s) => s.streakCount >= 3,
  streak_7:   (s) => s.streakCount >= 7,
  streak_14:  (s) => s.streakCount >= 14,
  streak_30:  (s) => s.streakCount >= 30,
  streak_50:  (s) => s.streakCount >= 50,
  streak_100: (s) => s.streakCount >= 100,

  // ── Goals ──────────────────────────────────────────────
  goal_created_1:    (s) => s.totalGoalsCreated >= 1,
  goal_completed_1:  (s) => s.totalGoalsCompleted >= 1,
  goal_completed_5:  (s) => s.totalGoalsCompleted >= 5,
  goal_completed_10: (s) => s.totalGoalsCompleted >= 10,

  // ── Skills ──────────────────────────────────────────────
  skill_first: (s) => s.uniqueSkills >= 1,
  skill_10:    (s) => s.uniqueSkills >= 10,
  skill_25:    (s) => s.uniqueSkills >= 25,
  skill_mastered: (s) => Object.values(s.skillLogCounts).some((count) => count >= 20),

  // ── Projects ───────────────────────────────────────────
  project_1:            (s) => s.totalProjectsCreated >= 1,
  project_completed_5:  (s) => s.totalProjectsCompleted >= 5,
  project_completed_10: (s) => s.totalProjectsCompleted >= 10,

  // ── Resume ─────────────────────────────────────────────
  resume_created:    (s) => s.hasResume,
  resume_entry_1:    (s) => s.resumeEntries >= 1,
  resume_entries_10: (s) => s.resumeEntries >= 10,

  // ── Portfolio ──────────────────────────────────────────
  portfolio_published:  (s) => s.portfolioPublished,
  portfolio_projects_5: (s) => s.totalProjectsCompleted >= 5,

  // ── Learning time (requires duration tracking — currently estimated at 30 min per log) ──
  learning_time_1h:   (s) => s.totalLogs >= 2,
  learning_time_10h:  (s) => s.totalLogs >= 20,
  learning_time_50h:  (s) => s.totalLogs >= 100,
  learning_time_100h: (s) => s.totalLogs >= 200,
  learning_time_500h: (s) => s.totalLogs >= 1000,

  // ── Consistency ───────────────────────────────────────
  consistency_week:  (s) => s.weekdaysLogged >= 5,
  consistency_month: (s) => s.consecutiveDays >= 30,
  welcome_back:      (s) => s.daysSinceLastLog != null && s.daysSinceLastLog >= 7 && s.daysSinceLastLog <= 90,

  // ── Mentor ──────────────────────────────────────────────
  mentor_first_chat: (s) => s.totalConversations >= 1,
  mentor_50:         (s) => s.totalConversations >= 50,
  mentor_100:        (s) => s.totalConversations >= 100,
  year_together:     (s) => s.accountAgeDays >= 365,
}

export async function computeUserState(userId: string): Promise<UserMilestoneState> {
  const now = new Date()

  const [user, logCount, goalCounts, skillCounts, projectCounts, resumeEntryCount, conversationCount, checkins, lastLog] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { streakCount: true, createdAt: true },
      }),
      prisma.studyLog.count({ where: { userId } }),
      prisma.goal.findMany({
        where: { userId },
        select: { status: true },
      }),
      prisma.userSkill.count({ where: { userId } }),
      prisma.project.findMany({
        where: { userId },
        select: { status: true },
      }),
      prisma.resume.findUnique({
        where: { userId },
        select: { content: true },
      }),
      prisma.mentorConversation.count({ where: { userId } }),
      prisma.dailyCheckin.findMany({
        where: { userId, studied: true },
        orderBy: { date: "desc" },
        select: { date: true },
      }),
      prisma.studyLog.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ])

  if (!user) throw new Error("User not found")

  const totalGoalsCreated = goalCounts.length
  const totalGoalsCompleted = goalCounts.filter((g) => g.status === "completed").length
  const totalProjectsCreated = projectCounts.length
  const totalProjectsCompleted = projectCounts.filter((p) => p.status === "completed").length

  const resumeEntries = resumeEntryCount?.content
    ? (resumeEntryCount.content.match(/- /g) || []).length
    : 0

  const daysSinceLastLog = lastLog
    ? Math.floor((now.getTime() - lastLog.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    : null

  const weekdaysLogged = checkins.filter((c) => {
    const day = c.date.getDay()
    return day >= 1 && day <= 5
  }).length

  let consecutiveDays = 0
  if (checkins.length > 0) {
    const sorted = [...checkins].sort((a, b) => b.date.getTime() - a.date.getTime())
    consecutiveDays = 1
    for (let i = 1; i < sorted.length; i++) {
      const diff = Math.round(
        (sorted[i - 1].date.getTime() - sorted[i].date.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (diff === 1) consecutiveDays++
      else break
    }
  }

  return {
    totalLogs: logCount,
    streakCount: user.streakCount,
    totalGoalsCreated,
    totalGoalsCompleted,
    uniqueSkills: skillCounts,
    skillLogCounts: {},
    totalProjectsCreated,
    totalProjectsCompleted,
    hasResume: !!resumeEntryCount,
    resumeEntries,
    portfolioPublished: projectCounts.length > 0,
    totalConversations: conversationCount,
    accountAgeDays: Math.floor((now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
    daysSinceLastLog,
    weekdaysLogged,
    consecutiveDays,
  }
}

export async function checkMilestones(userId: string): Promise<MilestoneEntry[]> {
  const state = await computeUserState(userId)

  const existing = await prisma.userMilestone.findMany({
    where: { userId },
    select: { key: true },
  })
  const existingKeys = new Set(existing.map((m) => m.key))

  const created: MilestoneEntry[] = []

  for (const key of MILESTONE_KEYS) {
    const condition = CONDITIONS[key]
    if (!condition || existingKeys.has(key)) continue
    if (condition(state)) {
      const record = await prisma.userMilestone.create({
        data: { userId, key },
        select: { key: true, achievedAt: true },
      })
      created.push({ key: record.key as MilestoneKey, achievedAt: record.achievedAt })
    }
  }

  return created
}

export async function getUnshownMilestones(userId: string): Promise<MilestoneEntry[]> {
  const records = await prisma.userMilestone.findMany({
    where: { userId, shownAt: null },
  })
  const sorted = records
    .map((m) => ({ key: m.key as MilestoneKey, achievedAt: m.achievedAt }))
    .sort((a, b) => {
      const pa = MILESTONE_BY_KEY[a.key]?.priority ?? 99
      const pb = MILESTONE_BY_KEY[b.key]?.priority ?? 99
      return pa - pb
    })
    .slice(0, 3)
  return sorted
}

export async function markMilestonesShown(userId: string, keys: MilestoneKey[]): Promise<void> {
  await prisma.userMilestone.updateMany({
    where: { userId, key: { in: keys }, shownAt: null },
    data: { shownAt: new Date() },
  })
}
