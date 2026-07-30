export type MilestoneKey =
  | "logs_1" | "logs_10" | "logs_25" | "logs_50" | "logs_100" | "logs_250" | "logs_365"
  | "streak_3" | "streak_7" | "streak_14" | "streak_30" | "streak_50" | "streak_100"
  | "goal_created_1" | "goal_completed_1" | "goal_completed_5" | "goal_completed_10"
  | "skill_first" | "skill_10" | "skill_25" | "skill_mastered"
  | "project_1" | "project_completed_5" | "project_completed_10"
  | "resume_created" | "resume_entry_1" | "resume_entries_10"
  | "portfolio_published" | "portfolio_projects_5"
  | "learning_time_1h" | "learning_time_10h" | "learning_time_50h" | "learning_time_100h" | "learning_time_500h"
  | "consistency_week" | "consistency_month" | "welcome_back"
  | "mentor_first_chat" | "mentor_50" | "mentor_100" | "year_together"

export interface MilestoneDef {
  key: MilestoneKey
  category: "study" | "streak" | "goal" | "skill" | "project" | "resume" | "portfolio" | "learning_time" | "consistency" | "mentor"
  title: string
  message: string
  emoji: string
  priority: number
}

const ALL: MilestoneDef[] = [
  // ── Streaks (hardest achievements — top priority) ──────
  { key: "streak_100",    category: "streak",  title: "100-day streak",         message: "100 days. You're in rare company",                             emoji: "👑",  priority: 1 },
  { key: "streak_50",     category: "streak",  title: "50-day streak",          message: "50 days of growth. Most people never get here",                emoji: "💎",  priority: 2 },
  { key: "streak_30",     category: "streak",  title: "30-day streak",          message: "30 days. That's a real habit now",                             emoji: "🏆",  priority: 3 },
  { key: "streak_14",     category: "streak",  title: "14-day streak",          message: "Two weeks straight — you're locked in",                        emoji: "⚡",  priority: 4 },
  { key: "streak_7",      category: "streak",  title: "7-day streak",           message: "One week already. Consistency beats intensity",                emoji: "📅",  priority: 5 },
  { key: "streak_3",      category: "streak",  title: "3-day streak",           message: "Three days strong. Keep the rhythm going",                     emoji: "🔥",  priority: 6 },

  // ── Study logs ─────────────────────────────────────────
  { key: "logs_365",      category: "study",   title: "365 study logs",         message: "A full year of learning. Incredible commitment",               emoji: "🌟",  priority: 7 },
  { key: "logs_250",      category: "study",   title: "250 study logs",         message: "250 logs — that's serious dedication",                         emoji: "💪",  priority: 8 },
  { key: "logs_100",      category: "study",   title: "100 study logs",         message: "We've built quite the knowledge base together",                emoji: "📖",  priority: 9 },
  { key: "logs_50",       category: "study",   title: "50 study logs",          message: "I've learned a lot about how you learn",                      emoji: "🧠",  priority: 10 },
  { key: "logs_25",       category: "study",   title: "25 study logs",          message: "25 logs — you're not messing around",                         emoji: "🔥",  priority: 11 },
  { key: "logs_10",       category: "study",   title: "10 study logs",          message: "You're building a real habit. That's worth celebrating",       emoji: "📚",  priority: 12 },
  { key: "logs_1",        category: "study",   title: "First study log",        message: "We've officially started your journey",                       emoji: "🚀",  priority: 13 },

  // ── Consistency ────────────────────────────────────────
  { key: "consistency_month", category: "consistency", title: "Logged every day for a month", message: "Every single day for a month. Unstoppable",            emoji: "🌙",  priority: 14 },
  { key: "consistency_week",  category: "consistency", title: "Every weekday logged",    message: "Logged every weekday — that's a full productive week",          emoji: "📆",  priority: 15 },
  { key: "welcome_back",      category: "consistency", title: "Welcome back",             message: "Welcome back — we kept your spot warm. Ready to pick up?",      emoji: "👋",  priority: 16 },

  // ── Mentor relationship ────────────────────────────────
  { key: "year_together",     category: "mentor",     title: "One year together",         message: "One year together. Look how far you've come",                   emoji: "🎂",  priority: 17 },
  { key: "mentor_100",        category: "mentor",     title: "100 conversations",         message: "100 conversations. This is a real mentorship now",              emoji: "🎓",  priority: 18 },
  { key: "mentor_50",         category: "mentor",     title: "50 conversations",          message: "50 chats together. We've built something real",                emoji: "🤝",  priority: 19 },
  { key: "mentor_first_chat", category: "mentor",     title: "First mentor chat",        message: "We just had our first conversation. I'm glad you're here",      emoji: "💬",  priority: 20 },

  // ── Goals ──────────────────────────────────────────────
  { key: "goal_completed_10",category: "goal", title: "10 goals completed",    message: "10 goals completed — look how far you've come",                 emoji: "🎖️",  priority: 21 },
  { key: "goal_completed_5", category: "goal", title: "5 goals completed",     message: "5 goals done. You're turning intention into outcomes",          emoji: "🏅",  priority: 22 },
  { key: "goal_completed_1", category: "goal", title: "First goal completed",  message: "First goal crossed off. That's how progress happens",           emoji: "✅",  priority: 23 },
  { key: "goal_created_1",   category: "goal", title: "First goal created",    message: "You've set your first goal — here's to going after it",        emoji: "🎯",  priority: 24 },

  // ── Skills ─────────────────────────────────────────────
  { key: "skill_mastered",  category: "skill", title: "Skill mastered",        message: "You've reached mastery in a skill — that's the real deal",      emoji: "⭐",  priority: 25 },
  { key: "skill_25",        category: "skill", title: "25 skills learned",     message: "25 skills. That's a serious toolkit",                          emoji: "📦",  priority: 26 },
  { key: "skill_10",        category: "skill", title: "10 skills learned",     message: "10 unique skills — you're building real range",                emoji: "🧰",  priority: 27 },
  { key: "skill_first",     category: "skill", title: "First skill extracted", message: "Your first skill is on the map. This is where it starts",       emoji: "🎯",  priority: 28 },

  // ── Projects ───────────────────────────────────────────
  { key: "project_completed_10",category: "project", title: "10 projects completed", message: "10 projects. Ship culture, defined",                           emoji: "🚢",  priority: 29 },
  { key: "project_completed_5", category: "project", title: "5 projects completed",  message: "5 finished projects — that's a portfolio that opens doors",     emoji: "📁",  priority: 30 },
  { key: "project_1",           category: "project", title: "First project logged",  message: "You've started your first project. Let's build something real", emoji: "🛠️",  priority: 31 },

  // ── Resume ─────────────────────────────────────────────
  { key: "resume_entries_10",category: "resume",  title: "10 resume entries",        message: "10 items on your resume. This is a solid start",                emoji: "📋",  priority: 32 },
  { key: "resume_entry_1",   category: "resume",  title: "First resume entry",       message: "First entry on the resume. More coming soon",                  emoji: "✍️",  priority: 33 },
  { key: "resume_created",   category: "resume",  title: "Resume created",           message: "Your resume exists — you're ready to put yourself out there",  emoji: "📄",  priority: 34 },

  // ── Portfolio ──────────────────────────────────────────
  { key: "portfolio_projects_5", category: "portfolio", title: "5 portfolio projects",   message: "5 projects displayed — recruiters are noticing",               emoji: "✨",  priority: 35 },
  { key: "portfolio_published",  category: "portfolio", title: "Portfolio published",    message: "Your portfolio is live for the world to see",                   emoji: "🌐",  priority: 36 },

  // ── Learning time (approximate — requires duration tracking) ──
  { key: "learning_time_500h", category: "learning_time", title: "500 hours studied",   message: "500 hours. You've invested like a professional",                emoji: "🏛️",  priority: 37 },
  { key: "learning_time_100h", category: "learning_time", title: "100 hours studied",   message: "100 hours of deliberate practice — elite territory",            emoji: "💯",  priority: 38 },
  { key: "learning_time_50h",  category: "learning_time", title: "50 hours studied",    message: "50 hours. That's a full course worth of learning",              emoji: "📈",  priority: 39 },
  { key: "learning_time_10h",  category: "learning_time", title: "10 hours studied",    message: "10 hours of study. You've put in real time",                    emoji: "⏳",  priority: 40 },
  { key: "learning_time_1h",   category: "learning_time", title: "1 hour studied",     message: "One hour of focused learning — every minute counts",            emoji: "⏰",  priority: 41 },
]

export const MILESTONES: MilestoneDef[] = ALL
export const MILESTONE_BY_KEY: Record<MilestoneKey, MilestoneDef> = Object.fromEntries(
  ALL.map((m) => [m.key, m])
) as Record<MilestoneKey, MilestoneDef>

export const MILESTONE_KEYS: MilestoneKey[] = ALL.map((m) => m.key)

export interface UserMilestoneState {
  totalLogs: number
  streakCount: number
  totalGoalsCreated: number
  totalGoalsCompleted: number
  uniqueSkills: number
  skillLogCounts: Record<string, number>
  totalProjectsCreated: number
  totalProjectsCompleted: number
  hasResume: boolean
  resumeEntries: number
  portfolioPublished: boolean
  totalConversations: number
  accountAgeDays: number
  daysSinceLastLog: number | null
  weekdaysLogged: number
  consecutiveDays: number
}
