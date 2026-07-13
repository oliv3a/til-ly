"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import Onigiri from "./Onigiri"

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/logs/new", label: "Logs" },
  { href: "/projects", label: "Projects" },
  { href: "/goals", label: "Goals" },
]

export default function NavBar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userId = (session?.user as any)?.id

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  const portfolioHref = userId ? `/portfolio/${userId}` : "/portfolio"

  return (
    <nav className="nav-bar">
      <div className="nav-bar-inner">
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Onigiri size={28} emotion="happy" />
            <span className="font-serif text-sm text-warm-brown hidden sm:inline">KeizoKode</span>
          </Link>
        </div>

        <div className="nav-links">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${isActive(link.href) ? "nav-link--active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={portfolioHref}
            className={`nav-link ${pathname.startsWith("/portfolio") ? "nav-link--active" : ""}`}
          >
            Portfolio
          </Link>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Link
            href="/profile"
            className={`nav-link ${pathname === "/profile" ? "nav-link--active" : ""}`}
          >
            Profile
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="nav-link text-soft-coral"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
