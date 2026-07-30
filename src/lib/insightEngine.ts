interface InsightCandidate {
  text: string
  score: number
  fingerprint: string
}

interface DetectorInput {
  recentLogs: { id: string; title: string; createdAt: Date; skillNames: string[] }[]
  olderLogs: { id: string; title: string; createdAt: Date; skillNames: string[] }[]
  checkinDates: Date[]
  streakCount: number
  goals: { id: string; title: string; progressPct: number; lastLogDate: Date | null }[]
  projects: { id: string; title: string; status: string; progressPct: number; updatedAt: Date }[]
  skillCounts: Record<string, number>
  allSkillNames: string[]
}

const NOW = new Date()
const DAY_MS = 86400000

function daysAgo(d: Date): number {
  return Math.floor((NOW.getTime() - d.getTime()) / DAY_MS)
}

// ── Detectors ──────────────────────────────────────────

function risingSkill(input: DetectorInput): InsightCandidate | null {
  const recentSkillCounts: Record<string, number> = {}
  for (const log of input.recentLogs) {
    for (const s of log.skillNames) {
      recentSkillCounts[s] = (recentSkillCounts[s] || 0) + 1
    }
  }
  const entries = Object.entries(recentSkillCounts).sort((a, b) => b[1] - a[1])
  if (entries.length === 0) return null
  const [topSkill, count] = entries[0]
  if (count < 2) return null
  const total = input.skillCounts[topSkill] || 0
  if (total < 2) return null
  return {
    text: `${topSkill} is becoming one of your strongest skills.`,
    score: Math.min(0.5 + (count / total) * 0.5, 0.95),
    fingerprint: `rising_skill:${topSkill}`,
  }
}

function neglectedTopic(input: DetectorInput): InsightCandidate | null {
  const recentSkillSet = new Set(input.recentLogs.flatMap((l) => l.skillNames))
  const olderSkillSet = new Set(input.olderLogs.flatMap((l) => l.skillNames))
  const neglected = [...olderSkillSet].filter((s) => !recentSkillSet.has(s))
  if (neglected.length === 0) return null

  const oldestRecentDate = input.recentLogs.length > 0
    ? input.recentLogs[input.recentLogs.length - 1].createdAt
    : NOW
  const daysSinceAnyRecent = daysAgo(oldestRecentDate)

  const maxDays: Record<string, number> = {}
  for (const log of input.olderLogs) {
    for (const s of log.skillNames) {
      if (!neglected.includes(s)) continue
      const d = daysAgo(log.createdAt)
      maxDays[s] = Math.max(maxDays[s] || 0, d)
    }
  }

  const sorted = neglected
    .map((s) => ({ skill: s, days: maxDays[s] || 0 }))
    .sort((a, b) => b.days - a.days)

  const top = sorted[0]
  if (top.days < 30) return null

  return {
    text: `You haven't reviewed ${top.skill} in over ${Math.floor(top.days / 30)} month${Math.floor(top.days / 30) > 1 ? "s" : ""}.`,
    score: Math.min(0.4 + (top.days / 180) * 0.5, 0.9),
    fingerprint: `neglected:${top.skill}`,
  }
}

function studyPattern(input: DetectorInput): InsightCandidate | null {
  if (input.checkinDates.length < 10) return null
  let weekendCount = 0
  let weekdayCount = 0
  for (const d of input.checkinDates) {
    const day = d.getDay()
    if (day === 0 || day === 6) weekendCount++
    else weekdayCount++
  }
  if (weekendCount === 0 || weekdayCount === 0) return null
  const ratio = weekendCount / weekdayCount
  if (ratio < 1.5) return null
  const totalDays = weekendCount + weekdayCount
  return {
    text: `You usually study on weekends.`,
    score: Math.min(0.3 + (ratio / 3) * 0.5 * (totalDays / (totalDays + 20)), 0.85),
    fingerprint: `pattern:weekend_dominant`,
  }
}

function areaFocus(input: DetectorInput): InsightCandidate | null {
  const recentSkills = new Set(input.recentLogs.flatMap((l) => l.skillNames))
  const allSkills = new Set(input.allSkillNames)
  const olderSkills = new Set(input.olderLogs.flatMap((l) => l.skillNames))
  const droppedTopics = [...olderSkills].filter((s) => !recentSkills.has(s) && allSkills.has(s))
  const newTopics = [...recentSkills].filter((s) => !olderSkills.has(s))

  if (droppedTopics.length > 2) {
    const sample = droppedTopics.slice(0, 3).join(", ")
    return {
      text: `Most of your recent work is focused elsewhere compared to earlier logs.`,
      score: 0.55,
      fingerprint: `focus_shift`,
    }
  }
  if (newTopics.length > 2) {
    const sample = newTopics.slice(0, 3).join(", ")
    return {
      text: `You've been exploring new areas like ${sample}.`,
      score: 0.5,
      fingerprint: `new_focus:${newTopics.slice(0, 2).join("_")}`,
    }
  }
  return null
}

function goalAtRisk(input: DetectorInput): InsightCandidate | null {
  const atRisk = input.goals.filter((g) => {
    if (g.progressPct < 60 || g.progressPct >= 100) return false
    if (!g.lastLogDate) return true
    return daysAgo(g.lastLogDate) > 7
  })
  if (atRisk.length === 0) return null
  const worst = atRisk.sort((a, b) => a.progressPct - b.progressPct)[0]
  return {
    text: `Your "${worst.title}" goal is at ${worst.progressPct}% — a couple more logs could finish it.`,
    score: 0.65,
    fingerprint: `goal_risk:${worst.id}`,
  }
}

function staleProject(input: DetectorInput): InsightCandidate | null {
  const stale = input.projects.filter((p) => {
    if (p.status === "completed" || p.progressPct === null || p.progressPct >= 100) return false
    return daysAgo(p.updatedAt) > 14
  })
  if (stale.length === 0) return null
  const p = stale.sort((a, b) => daysAgo(b.updatedAt) - daysAgo(a.updatedAt))[0]
  return {
    text: `Your "${p.title}" project hasn't been updated in a while.`,
    score: 0.6,
    fingerprint: `stale_project:${p.id}`,
  }
}

function streakMomentum(input: DetectorInput): InsightCandidate | null {
  if (input.streakCount < 3) return null
  return {
    text: `You're on a ${input.streakCount}-day streak — keep it going.`,
    score: Math.min(0.3 + input.streakCount * 0.015, 0.8),
    fingerprint: `streak:${input.streakCount}`,
  }
}

function skillDiversity(input: DetectorInput): InsightCandidate | null {
  const count = input.allSkillNames.length
  if (count < 5) return null
  return {
    text: `You've explored ${count} different skills.`,
    score: Math.min(0.3 + count * 0.02, 0.7),
    fingerprint: `diversity:${count}`,
  }
}

function consistencyBurst(input: DetectorInput): InsightCandidate | null {
  const now = NOW.getTime()
  const oneWeek = 7 * DAY_MS
  const twoWeeks = 14 * DAY_MS

  const thisWeek = input.recentLogs.filter((l) => now - l.createdAt.getTime() < oneWeek).length
  const lastWeek = input.recentLogs.filter(
    (l) => now - l.createdAt.getTime() >= oneWeek && now - l.createdAt.getTime() < twoWeeks
  ).length

  if (thisWeek < 2) return null
  if (lastWeek === 0 && thisWeek >= 3) {
    return {
      text: `More logs than usual this week. Nice momentum.`,
      score: 0.55,
      fingerprint: `burst:this_week`,
    }
  }
  if (thisWeek > lastWeek * 1.5 && lastWeek > 0) {
    return {
      text: `More logs than usual this week. Nice momentum.`,
      score: 0.55,
      fingerprint: `burst:this_week`,
    }
  }
  return null
}

function returnAfterBreak(input: DetectorInput): InsightCandidate | null {
  if (input.recentLogs.length === 0) return null
  const newest = input.recentLogs[0].createdAt
  const oldestRecent = input.recentLogs[input.recentLogs.length - 1].createdAt
  const recentSpanDays = daysAgo(oldestRecent) - daysAgo(newest)

  const hasBigGap = input.olderLogs.some((l) => {
    const gapStart = l.createdAt
    const gapEnd = newest
    const gapDays = (gapEnd.getTime() - gapStart.getTime()) / DAY_MS
    return gapDays >= 7
  })

  if (!hasBigGap) return null

  return {
    text: `Welcome back — you're picking up right where you left off.`,
    score: 0.65,
    fingerprint: `return:${newest.toISOString().slice(0, 10)}`,
  }
}

// ── Engine ──────────────────────────────────────────────

const DETECTORS: ((input: DetectorInput) => InsightCandidate | null)[] = [
  risingSkill,
  goalAtRisk,
  staleProject,
  neglectedTopic,
  returnAfterBreak,
  consistencyBurst,
  streakMomentum,
  studyPattern,
  areaFocus,
  skillDiversity,
]

export interface InsightResult {
  text: string | null
  fingerprint: string | null
}

const SHOWN_PREFIX = "insight_shown:"

export async function runInsightEngine(
  input: DetectorInput,
  getShownFingerprints: () => Promise<string[]>,
): Promise<InsightResult> {
  const shown = new Set(await getShownFingerprints())

  const candidates: InsightCandidate[] = []
  for (const detect of DETECTORS) {
    const result = detect(input)
    if (result && result.score >= 0.4 && !shown.has(result.fingerprint)) {
      candidates.push(result)
    }
  }

  if (candidates.length === 0) return { text: null, fingerprint: null }

  candidates.sort((a, b) => b.score - a.score)
  const winner = candidates[0]
  return { text: winner.text, fingerprint: winner.fingerprint }
}

export { SHOWN_PREFIX }
