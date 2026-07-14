"use client"

import { useState } from "react"
import { signIn, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "motion/react"
import AnimatedButton from "@/lib/motion/components/AnimatedButton"
import AnimatedOnigiri from "@/components/AnimatedOnigiri"
import { fadeIn } from "@/lib/motion/variants"

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return "Hey night owl"
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  if (h < 22) return "Good evening"
  return "Hey night owl"
}

export default function MenuBarClient({ user }: { user: { name: string } | null }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError("Invalid email or password")
      return
    }

    router.refresh()
  }

  if (user) {
    return (
      <div className="h-[660px] bg-cream flex flex-col justify-center px-8">
        <div className="w-full max-w-sm mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <AnimatedOnigiri size={40} emotion="happy" />
            <div>
              <h2 className="font-serif text-base text-warm-brown leading-tight">
                {greeting()}, {user.name}!
              </h2>
              <p className="text-[0.55rem] font-mono text-muted-ink/50">
                What do you want to do?
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/logs/new"
              className="flex items-center justify-center gap-2 font-mono text-[0.65rem] text-warm-paper bg-soft-coral py-3 border-2 border-warm-brown text-center hover:opacity-90 transition-opacity"
            >
              <span className="text-sm">✏️</span>
              <span>New log</span>
            </Link>
            <Link
              href="/logs"
              className="flex items-center justify-center gap-2 font-mono text-[0.65rem] text-warm-paper bg-soft-coral py-3 border-2 border-warm-brown text-center hover:opacity-90 transition-opacity"
            >
              <span className="text-sm">📊</span>
              <span>My logs</span>
            </Link>
          </div>

          <div className="mt-6 pt-4 border-t border-warm-brown/15 flex justify-between items-center">
            <span className="text-[0.45rem] font-mono text-muted-ink/30">
              <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1" />
              Logged in
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/menu-bar" })}
              className="text-[0.55rem] font-mono text-muted-ink/40 hover:text-soft-coral transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[660px] bg-cream flex flex-col justify-center px-8">
      <div className="w-full max-w-sm mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <AnimatedOnigiri size={40} emotion="neutral" />
          <div>
            <h2 className="font-serif text-base text-warm-brown leading-tight">{greeting()}!</h2>
            <p className="text-[0.55rem] font-mono text-muted-ink/50">Log in to continue</p>
          </div>
        </div>

        <div className="frame-block">
          <form id="menu-bar-login" onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[0.55rem] font-mono text-muted-ink mb-0.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="field-coral text-[0.65rem] w-full"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-[0.55rem] font-mono text-muted-ink mb-0.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="field-coral text-[0.65rem] w-full"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <motion.p
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="text-[0.55rem] font-mono text-warm-brown bg-peach/50 px-2 py-1 border-2 border-warm-brown"
              >
                {error}
              </motion.p>
            )}

            <AnimatedButton type="submit" variant="coral" className="w-full justify-center !text-[0.6rem]" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </AnimatedButton>
          </form>

          <p className="text-center text-[0.5rem] font-mono text-muted-ink/50 mt-4">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-soft-coral underline hover:text-warm-brown">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
