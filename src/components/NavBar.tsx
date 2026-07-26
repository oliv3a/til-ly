"use client"

import { useState, useRef, useEffect } from "react"
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
  const [hoveredGroup, setHoveredGroup] = useState<number | null>(null)
  const [mobileExpanded, setMobileExpanded] = useState<number | null>(null)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    }
  }, [])

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    if (href === "/portfolio") return pathname.startsWith("/portfolio")
    return pathname.startsWith(href)
  }

  function isGroupActive(group: NavGroup) {
    return group.items.some((item) => isActive(getHref(item)))
  }

  function getHref(item: NavItem) {
    if (item.href === "/portfolio" && userId) return `/portfolio/${userId}`
    return item.href
  }

  function closeMenu() {
    setMenuOpen(false)
    setHoveredGroup(null)
  }

  function handleGroupEnter(index: number) {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    const group = navGroups[index]
    if (group.items.length > 1 && group.label) {
      setHoveredGroup(index)
    }
  }

  function handleGroupLeave() {
    closeTimeoutRef.current = setTimeout(() => setHoveredGroup(null), 150)
  }

  function handleGroupClick(index: number) {
    const group = navGroups[index]
    if (group.items.length === 1) {
      closeMenu()
      return
    }
    setHoveredGroup(hoveredGroup === index ? null : index)
  }

  function handleMobileToggle(index: number) {
    setMobileExpanded(mobileExpanded === index ? null : index)
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setHoveredGroup(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <nav className="nav-bar">
      <div className="nav-bar-inner">
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={closeMenu}>
            <BrandLogo size={28} />
          </Link>
        </div>

        {/* Desktop nav links */}
        <div className="nav-links hidden sm:flex items-center" ref={navRef}>
          {navGroups.map((group, gi) => {
            const isDropdown = group.items.length > 1 && group.label
            const singleItem = group.items.length === 1 ? group.items[0] : null
            const groupActive = isGroupActive(group)
            const isOpen = hoveredGroup === gi

            return (
              <div key={gi} className="relative">
                {gi > 0 && <span className="nav-group-divider" />}

                {isDropdown ? (
                  <div
                    className="nav-dropdown-trigger"
                    onMouseEnter={() => handleGroupEnter(gi)}
                    onMouseLeave={handleGroupLeave}
                  >
                    <button
                      onClick={() => handleGroupClick(gi)}
                      className={`nav-group-btn ${groupActive ? "nav-group-btn--active" : ""} ${isOpen ? "nav-group-btn--open" : ""}`}
                    >
                      {group.emoji} {group.label}
                      <svg className={`nav-chevron ${isOpen ? "nav-chevron--open" : ""}`} width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2.5 3.75L5 6.25L7.5 3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div
                        className="nav-dropdown"
                        onMouseEnter={() => handleGroupEnter(gi)}
                        onMouseLeave={handleGroupLeave}
                      >
                        {group.items.map((item) => (
                          <Link
                            key={item.href}
                            href={getHref(item)}
                            className={`nav-dropdown-item ${isActive(getHref(item)) ? "nav-dropdown-item--active" : ""}`}
                            onClick={closeMenu}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : singleItem ? (
                  <Link
                    href={getHref(singleItem)}
                    className={`nav-link ${isActive(getHref(singleItem)) ? "nav-link--active" : ""}`}
                    onClick={closeMenu}
                  >
                    {group.emoji ? `${group.emoji} ` : ""}{singleItem.label}
                  </Link>
                ) : null}
              </div>
            )
          })}
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
          {navGroups.map((group, gi) => {
            const isDropdown = group.items.length > 1 && group.label
            const singleItem = group.items.length === 1 ? group.items[0] : null
            const groupActive = isGroupActive(group)
            const isExpanded = mobileExpanded === gi || (isDropdown && groupActive)

            return (
              <div key={gi}>
                {gi > 0 && <hr className="border-t border-warm-brown/10 my-1" />}

                {isDropdown ? (
                  <>
                    <button
                      onClick={() => handleMobileToggle(gi)}
                      className={`flex items-center justify-between w-full font-mono text-[0.6rem] py-1.5 px-2 rounded-sm transition-colors cursor-pointer ${
                        groupActive ? "text-warm-brown font-bold" : "text-muted-ink/70"
                      }`}
                    >
                      <span>{group.emoji} {group.label}</span>
                      <svg className={`nav-chevron ${isExpanded ? "nav-chevron--open" : ""}`} width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2.5 3.75L5 6.25L7.5 3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {isExpanded && (
                      <div className="ml-4 space-y-0.5">
                        {group.items.map((item) => (
                          <Link
                            key={item.href}
                            href={getHref(item)}
                            onClick={closeMenu}
                            className={`block font-mono text-[0.6rem] py-1.5 px-2 rounded-sm ${
                              isActive(getHref(item)) ? "text-warm-brown font-bold" : "text-muted-ink/60"
                            }`}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : singleItem ? (
                  <Link
                    href={getHref(singleItem)}
                    onClick={closeMenu}
                    className={`block font-mono text-[0.6rem] py-1.5 px-2 ${
                      isActive(getHref(singleItem)) ? "text-warm-brown font-bold" : "text-muted-ink/70"
                    }`}
                  >
                    {group.emoji ? `${group.emoji} ` : ""}{singleItem.label}
                  </Link>
                ) : null}
              </div>
            )
          })}
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
