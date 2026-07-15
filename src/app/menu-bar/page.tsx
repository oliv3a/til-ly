import { auth } from "@/lib/auth"
import MenuBarClient from "./MenuBarClient"

export default async function MenuBarPage() {
  const session = await auth()

  return <MenuBarClient user={session?.user ? { name: session.user.name || "there" } : null} />
}
