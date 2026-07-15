import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import ProjectsClient from "./ProjectsClient"
export default async function ProjectsPage() {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")

  const userId = session.user.id
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { updates: true, steps: true } },
      steps: { orderBy: { order: "asc" } },
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="poster-heading text-2xl">📦 Projects</h1>
        <Link href="/projects/new" className="btn-base btn-coral btn-interact text-[0.65rem]">+ New Project</Link>
      </div>
      <ProjectsClient initialProjects={JSON.parse(JSON.stringify(projects))} />
    </div>
  )
}
