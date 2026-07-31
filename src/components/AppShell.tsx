"use client"

import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import DashboardShell from "./DashboardShell"

const PUBLIC_PREFIXES = ["/auth/", "/privacy", "/terms"]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()

  const isPublicRoute = PUBLIC_PREFIXES.some((p) => pathname?.startsWith(p))
  const isLandingPage = pathname === "/"

  if (session?.user && !isPublicRoute && !isLandingPage) {
    return <DashboardShell>{children}</DashboardShell>
  }

  return <>{children}</>
}
