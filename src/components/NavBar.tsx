"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import BrandLogo from "./BrandLogo"

interface NavItem {
  href: string
  label: string
}

interface NavGroup {
  label?: string
  emoji?: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    items: [{ href: "/dashboard", label: "Home" }],
  },
  {
    label: "Learn",
    emoji: "📚",
    items: [
      { href: "/goals", label: "Learning Paths" },
      { href: "/logs", label: "Study Logs" },
    ],
  },
  {
    label: "Build",
    emoji: "🚀",
    items: [{ href: "/projects", label: "Projects" }],
  },
  {
    label: "Career",
    emoji: "💼",
    items: [
      { href: "/portfolio", label: "Portfolio" },
      { href: "/resume", label: "Resume" },
    ],
  },
  {
    items: [{ href: "/mentor", label: "Mentor" }],
  },
]

export default function NavBar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userId = session?.user?.id
  const [menuOpen, setMenuOpen] = useState(false)

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    if (href === "/portfolio") return pathname.startsWith("/portfolio")
    return pathname.startsWith(href)
  }

  function getHref(item: NavItem) {
    if (item.href === "/portfolio" && userId) return `/portfolio/${userId}`
    return item.href
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <nav className="nav-bar">
      <div className="nav-bar-inner">
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={closeMenu}>
            <BrandLogo size={28} />
          </Link>
        </div>

        {/* Desktop nav links */}
        <div className="nav-links hidden sm:flex items-center">
          {navGroups.map((group, gi) => (
            <div key={gi} className="flex items-center">
              {gi > 0 && <span className="nav-group-divider" />}
              {group.label && (
                <span className="nav-group-label">{group.emoji} {group.label}</span>
              )}
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={getHref(item)}
                  className={`nav-link ${isActive(item.href) ? "nav-link--active" : ""}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-1 shrink-0">
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

        {/* Hamburger button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="sm:hidden text-warm-brown text-lg leading-none px-1"
          aria-label="Toggle menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="sm:hidden frame-block border-t-0 p-2 space-y-1">
          {navGroups.map((group, gi) => (
            <div key={gi}>
              {gi > 0 && <hr className="border-t border-warm-brown/10 my-1" />}
              {group.label && (
                <p className="text-[0.5rem] font-mono text-muted-ink/40 uppercase tracking-wider px-2 pt-1 pb-0.5">
                  {group.emoji} {group.label}
                </p>
              )}
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={getHref(item)}
                  onClick={closeMenu}
                  className={`block font-mono text-[0.6rem] py-1.5 px-2 ${
                    isActive(item.href) ? "text-warm-brown font-bold" : "text-muted-ink/70"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
          <hr className="border-t border-warm-brown/20 my-1" />
          <Link
            href="/profile"
            onClick={closeMenu}
            className="block font-mono text-[0.6rem] py-1.5 px-2 text-muted-ink/70"
          >
            Profile
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="block w-full text-left font-mono text-[0.6rem] py-1.5 px-2 text-soft-coral"
          >
            Sign out
          </button>
        </div>
      )}
    </nav>
  )
}
