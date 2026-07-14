"use client"

import { useState } from "react"
import { signIn, signOut } from "next-auth/react"
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

function openInBrowser(path: string) {
  window.open(`http://localhost:3000${path}`, "_blank")
}

export default function MenuBarClient({ user }: { user: { name: string } | null }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

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

    window.location.reload()
  }

  if (user) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-xs text-center">
          <AnimatedOnigiri size={64} emotion="happy" />

          <h2 className="font-serif text-lg text-warm-brown mt-3 mb-1">
            {greeting()}, {user.name}!
          </h2>
          <p className="text-[0.6rem] font-mono text-muted-ink/50 mb-6">
            What do you want to do?
          </p>

          <button
            onClick={() => openInBrowser("/logs/new")}
            className="block w-full font-mono text-[0.7rem] text-warm-paper bg-soft-coral py-3 border-2 border-warm-brown text-center hover:opacity-90 transition-opacity mb-2"
          >
            ✏️  Create a new log
          </button>

          <button
            onClick={() => openInBrowser("/logs")}
            className="block w-full text-[0.6rem] font-mono text-muted-ink underline hover:text-soft-coral transition-colors text-center"
          >
            View my study logs →
          </button>

          <hr className="my-5 border-t border-warm-brown/20" />

          <button
            onClick={() => signOut({ callbackUrl: "/menu-bar" })}
            className="text-[0.55rem] font-mono text-muted-ink/40 hover:text-soft-coral transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-xs animate-fade-in-up">
        <div className="text-center mb-4">
          <AnimatedOnigiri size={64} emotion="neutral" />
        </div>

        <div className="frame-block">
          <h2 className="font-serif text-lg text-warm-brown text-center mb-1">{greeting()}!</h2>
          <p className="text-[0.6rem] font-mono text-muted-ink/50 text-center mb-4">Log in to continue</p>

          <form id="menu-bar-login" onSubmit={handleSubmit} className="space-y-2">
            <div>
              <label className="block text-[0.6rem] font-mono text-muted-ink mb-0.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="field-coral text-[0.7rem]"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-[0.6rem] font-mono text-muted-ink mb-0.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="field-coral text-[0.7rem]"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <motion.p
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="text-[0.6rem] font-mono text-warm-brown bg-peach/50 px-2 py-1 border-2 border-warm-brown"
              >
                {error}
              </motion.p>
            )}

            <AnimatedButton type="submit" variant="coral" className="w-full justify-center !text-[0.65rem]" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </AnimatedButton>
          </form>

          <p className="text-center text-[0.55rem] font-mono text-muted-ink/50 mt-3">
            Don&apos;t have an account?{" "}
            <button
              onClick={() => openInBrowser("/auth/signup")}
              className="text-soft-coral underline hover:text-warm-brown bg-transparent border-none p-0 cursor-pointer"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
