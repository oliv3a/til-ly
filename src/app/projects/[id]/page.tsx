import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ProjectDetailClient from "./ProjectDetailClient"

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")

  const { id } = await params
  const userId = (session.user as any).id

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      files: true,
      steps: { orderBy: { order: "asc" } },
      updates: { orderBy: { createdAt: "desc" } },
    },
  })

  if (!project || project.userId !== userId) redirect("/projects")

  return (
    <div>
      <ProjectDetailClient initialProject={JSON.parse(JSON.stringify(project))} />
    </div>
  )
}
