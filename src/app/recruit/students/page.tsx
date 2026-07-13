import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import StudentsClient from "./StudentsClient"

export default async function RecruitStudentsPage() {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")
  if ((session.user as any).role !== "recruiter") redirect("/dashboard")

  return (
    <div>
      <h1 className="poster-heading text-2xl mb-6">Browse Students</h1>
      <StudentsClient />
    </div>
  )
}
