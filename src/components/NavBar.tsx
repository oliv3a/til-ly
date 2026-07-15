"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import Onigiri from "./Onigiri"

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/logs", label: "Logs" },
  { href: "/projects", label: "Projects" },
  { href: "/goals", label: "Goals" },
  { href: "/resume", label: "Resume" },
]

export default function NavBar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userId = session?.user?.id
  const [menuOpen, setMenuOpen] = useState(false)

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  const portfolioHref = userId ? `/portfolio/${userId}` : "/portfolio"

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <nav className="nav-bar">
      <div className="nav-bar-inner">
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={closeMenu}>
            <Onigiri size={28} emotion="happy" />
            <span className="font-serif text-sm text-warm-brown hidden sm:inline">KeizoKode</span>
          </Link>
        </div>

        {/* Desktop nav links */}
        <div className="nav-links hidden sm:flex">
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
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMenu}
              className={`block font-mono text-[0.6rem] py-1.5 px-2 ${
                isActive(link.href) ? "text-warm-brown font-bold" : "text-muted-ink/70"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={portfolioHref}
            onClick={closeMenu}
            className={`block font-mono text-[0.6rem] py-1.5 px-2 ${
              pathname.startsWith("/portfolio") ? "text-warm-brown font-bold" : "text-muted-ink/70"
            }`}
          >
            Portfolio
          </Link>
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
