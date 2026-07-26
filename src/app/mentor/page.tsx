import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import MentorClient from "./MentorClient"

export default async function MentorPage() {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")

  return <MentorClient />
}
