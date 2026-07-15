import "./resume.css"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import ResumeClient from "./ResumeClient"

export default async function ResumePage() {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <ResumeClient />
    </div>
  )
}
