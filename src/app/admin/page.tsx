import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const [totalUsers, users, totalLogs, totalGoals, totalProjects] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.studyLog.count(),
    prisma.goal.count(),
    prisma.project.count(),
  ])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="poster-heading text-2xl">Admin</h1>
        <Link href="/dashboard" className="btn-base btn-sm btn-interact-bg">← Dashboard</Link>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="frame-block p-3 text-center">
          <p className="text-2xl font-bold font-serif text-warm-brown">{totalUsers}</p>
          <p className="text-[0.55rem] font-mono text-muted-ink/60">Users</p>
        </div>
        <div className="frame-block p-3 text-center">
          <p className="text-2xl font-bold font-serif text-warm-brown">{totalLogs}</p>
          <p className="text-[0.55rem] font-mono text-muted-ink/60">Study Logs</p>
        </div>
        <div className="frame-block p-3 text-center">
          <p className="text-2xl font-bold font-serif text-warm-brown">{totalGoals}</p>
          <p className="text-[0.55rem] font-mono text-muted-ink/60">Goals</p>
        </div>
        <div className="frame-block p-3 text-center">
          <p className="text-2xl font-bold font-serif text-warm-brown">{totalProjects}</p>
          <p className="text-[0.55rem] font-mono text-muted-ink/60">Projects</p>
        </div>
      </div>

      <div className="frame-block p-4">
        <h2 className="section-header mb-3">Users</h2>
        <div className="space-y-1">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between text-[0.65rem] font-mono py-1 border-b border-warm-brown/10 last:border-0">
              <div className="min-w-0 flex-1">
                <span className="text-warm-brown truncate block">{u.name || "Unnamed"}</span>
                <span className="text-muted-ink/50 text-[0.55rem]">{u.email}</span>
              </div>
              <span className="text-muted-ink/40 shrink-0 ml-2">
                {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
