"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "motion/react"
import AnimatedButton from "@/lib/motion/components/AnimatedButton"
import AnimatedOnigiri from "@/components/AnimatedOnigiri"
import PageShell from "@/components/PageShell"
import { fadeIn } from "@/lib/motion/variants"

export default function LoginPage() {
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

    router.push("/dashboard")
  }

  return (
    <PageShell showNav={false} showFooter={false}>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="text-center mb-6">
            <Link href="/" className="inline-block group">
              <AnimatedOnigiri size={72} emotion={loading ? "thinking" : "neutral"} />
            </Link>
          </div>

          <div className="frame-block">
            <h2 className="font-serif text-xl text-warm-brown text-center mb-4">Welcome back</h2>

            <form id="login-form" onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[0.65rem] font-mono text-muted-ink mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="field-coral"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-[0.65rem] font-mono text-muted-ink mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="field-coral"
                  placeholder="••••••••"
                />
              </div>
              <div className="text-right -mt-1">
                <Link href="/auth/forgot-password" className="text-[0.55rem] font-mono text-muted-ink/50 underline hover:text-soft-coral">
                  Forgot password?
                </Link>
              </div>

              {error && (
                <motion.p
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                  className="text-[0.65rem] font-mono text-warm-brown bg-peach/50 px-2 py-1 border-2 border-warm-brown"
                >
                  {error}
                </motion.p>
              )}

              <AnimatedButton type="submit" variant="coral" className="w-full justify-center" disabled={loading}>
                {loading ? "Logging in..." : "Log in"}
              </AnimatedButton>
            </form>

            <p className="text-center text-[0.6rem] font-mono text-muted-ink/50 mt-4">
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="text-soft-coral underline hover:text-warm-brown">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
