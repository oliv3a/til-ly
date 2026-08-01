import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import UserList from "./UserList"
import FeedbackList from "./FeedbackList"

export const dynamic = "force-dynamic"

function dayKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function daysAgo(n: number) {
  const d = startOfToday()
  d.setDate(d.getDate() - n)
  return d
}

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")
  if (session.user.email !== process.env.ADMIN_EMAIL) redirect("/dashboard")

  const [
    totalUsers,
    demoUsers,
    totalLogs,
    totalGoals,
    totalProjects,
    users,
    recentUsers,
    streakCounts,
    recentCheckins,
    logs7,
    logs30,
    allLogs,
    feedback,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { email: { startsWith: "demo-" } } }),
    prisma.studyLog.count(),
    prisma.goal.count(),
    prisma.project.count(),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, createdAt: true, isPublic: true, streakCount: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: daysAgo(29) } },
      select: { createdAt: true },
    }),
    prisma.user.findMany({ select: { streakCount: true } }),
    prisma.dailyCheckin.findMany({
      where: { date: { gte: daysAgo(6) } },
      select: { userId: true, studied: true },
    }),
    prisma.studyLog.count({ where: { createdAt: { gte: daysAgo(7) } } }),
    prisma.studyLog.count({ where: { createdAt: { gte: daysAgo(30) } } }),
    prisma.studyLog.findMany({
      select: { userId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        message: true,
        isAnonymous: true,
        status: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
  ])

  const signupMap = new Map<string, number>()
  for (let i = 29; i >= 0; i--) signupMap.set(dayKey(daysAgo(i)), 0)
  for (const u of recentUsers) {
    const key = dayKey(u.createdAt)
    if (signupMap.has(key)) signupMap.set(key, (signupMap.get(key) ?? 0) + 1)
  }
  const signupDays = [...signupMap.entries()].map(([day, count]) => ({ day, count }))
  const maxSignups = Math.max(1, ...signupDays.map((s) => s.count))

  const activeStreak1 = streakCounts.filter((u) => u.streakCount >= 1).length
  const activeStreak7 = streakCounts.filter((u) => u.streakCount >= 7).length
  const activeStreak30 = streakCounts.filter((u) => u.streakCount >= 30).length
  const checkinUsers = new Set(recentCheckins.filter((c) => c.studied === true).map((c) => c.userId)).size

  const lastLogMap = new Map<string, string>()
  for (const log of allLogs) {
    if (!lastLogMap.has(log.userId)) lastLogMap.set(log.userId, log.createdAt.toISOString())
  }

  const userRows = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    createdAt: u.createdAt.toISOString(),
    isPublic: u.isPublic,
    streakCount: u.streakCount,
    lastLogAt: lastLogMap.get(u.id) ?? null,
  }))

  const feedbackRows = feedback.map((f) => ({
    id: f.id,
    message: f.message,
    isAnonymous: f.isAnonymous,
    status: f.status,
    createdAt: f.createdAt.toISOString(),
    userName: f.user.name,
    userEmail: f.user.email,
  }))

  const statCards = [
    { label: "Users", value: totalUsers },
    { label: "Study Logs", value: totalLogs },
    { label: "Goals", value: totalGoals },
    { label: "Projects", value: totalProjects },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="poster-heading text-2xl">Admin</h1>
        <Link href="/dashboard" className="btn-base btn-sm btn-interact-bg">← Dashboard</Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className="frame-block p-3 text-center">
            <p className="text-2xl font-bold font-serif text-warm-brown">{card.value}</p>
            <p className="text-[0.55rem] font-mono text-muted-ink/60">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="frame-block p-3 text-center">
          <p className="text-2xl font-bold font-serif text-warm-brown">{totalUsers - demoUsers}</p>
          <p className="text-[0.55rem] font-mono text-muted-ink/60">Real users</p>
        </div>
        <div className="frame-block p-3 text-center">
          <p className="text-2xl font-bold font-serif text-soft-coral">{demoUsers}</p>
          <p className="text-[0.55rem] font-mono text-muted-ink/60">Demo accounts</p>
        </div>
        <div className="frame-block p-3 text-center">
          <p className="text-2xl font-bold font-serif text-warm-brown">{checkinUsers}</p>
          <p className="text-[0.55rem] font-mono text-muted-ink/60">Active (7d)</p>
        </div>
        <div className="frame-block p-3 text-center">
          <p className="text-2xl font-bold font-serif text-warm-brown">{logs7}</p>
          <p className="text-[0.55rem] font-mono text-muted-ink/60">Logs (7d) / {logs30} (30d)</p>
        </div>
      </div>

      <div className="frame-block p-4">
        <h2 className="section-header mb-3">Signups — last 30 days</h2>
        <div className="flex items-end gap-[3px] h-24">
          {signupDays.map((s) => (
            <div key={s.day} className="flex-1 flex flex-col justify-end h-full" title={`${s.day}: ${s.count}`}>
              <div
                className="w-full bg-warm-brown/70 hover:bg-soft-coral rounded-sm transition-colors"
                style={{ height: `${Math.max(6, (s.count / maxSignups) * 100)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1 text-[0.5rem] font-mono text-muted-ink/50">
          <span>{signupDays[0]?.day.slice(5)}</span>
          <span>{signupDays[15]?.day.slice(5)}</span>
          <span>{signupDays[29]?.day.slice(5)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="frame-block p-3 text-center">
          <p className="text-2xl font-bold font-serif text-warm-brown">{activeStreak1}</p>
          <p className="text-[0.55rem] font-mono text-muted-ink/60">Streak ≥ 1 day</p>
        </div>
        <div className="frame-block p-3 text-center">
          <p className="text-2xl font-bold font-serif text-warm-brown">{activeStreak7}</p>
          <p className="text-[0.55rem] font-mono text-muted-ink/60">Streak ≥ 7 days</p>
        </div>
        <div className="frame-block p-3 text-center">
          <p className="text-2xl font-bold font-serif text-soft-coral">{activeStreak30}</p>
          <p className="text-[0.55rem] font-mono text-muted-ink/60">Streak ≥ 30 days</p>
        </div>
      </div>

      <UserList users={userRows} />
      <FeedbackList feedback={feedbackRows} />
    </div>
  )
}
