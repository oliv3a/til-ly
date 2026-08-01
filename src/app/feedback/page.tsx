import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import FeedbackForm from "./FeedbackForm"

export const dynamic = "force-dynamic"

export default async function FeedbackPage() {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="poster-heading text-2xl mb-6">Send Feedback</h1>
      <p className="text-[0.65rem] font-mono text-muted-ink/70 mb-6 leading-relaxed">
        Spot a bug, have an idea, or just want to say hi? We read everything.
      </p>
      <FeedbackForm />
    </div>
  )
}
