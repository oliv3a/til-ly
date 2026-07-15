import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import GoalsClient from "./GoalsClient"

export default async function GoalsPage() {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")

  const userId = session.user.id
  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      roadmapItems: {
        orderBy: { order: "asc" },
        include: { _count: { select: { studyLogLinks: true } } },
      },
    },
  })

  return (
    <div>
      <h1 className="poster-heading text-2xl mb-6">🎯 Learning Goals</h1>
      <GoalsClient initialGoals={JSON.parse(JSON.stringify(goals))} />
    </div>
  )
}
