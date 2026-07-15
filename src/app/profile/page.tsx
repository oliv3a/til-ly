import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getComputedSkills } from "@/lib/skills"
import ProfileClient from "./ProfileClient"
import ManageSkillsClient from "./ManageSkillsClient"

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")

  const userId = session.user.id
  const initialSkills = await getComputedSkills(userId)

  return (
    <div>
      <h1 className="poster-heading text-2xl mb-6">Profile Settings</h1>
      <ProfileClient />
      <div className="mt-8">
        <ManageSkillsClient initialSkills={JSON.parse(JSON.stringify(initialSkills))} />
      </div>
    </div>
  )
}
