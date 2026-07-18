"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "motion/react"
import AnimatedButton from "@/lib/motion/components/AnimatedButton"
import BrandLogo from "@/components/BrandLogo"
import PageShell from "@/components/PageShell"
import { fadeIn } from "@/lib/motion/variants"
import { signIn } from "next-auth/react"

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState("student")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Something went wrong")
      setLoading(false)
      return
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("Account created but auto-login failed. Please log in manually.")
      router.push("/auth/login")
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
              <BrandLogo size={72} />
            </Link>
          </div>

          <div className="frame-block">
            <h2 className="font-serif text-xl text-warm-brown text-center mb-4">Create your account</h2>

            <form id="signup-form" onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[0.65rem] font-mono text-muted-ink mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="field-coral"
                  placeholder="Alex"
                />
              </div>
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
                  minLength={6}
                  className="field-coral"
                  placeholder="At least 6 characters"
                />
              </div>
              <div>
                <label className="block text-[0.65rem] font-mono text-muted-ink mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="field-coral"
                  placeholder="Re-enter your password"
                />
              </div>
              <div>
                <label className="block text-[0.65rem] font-mono text-muted-ink mb-1">I am a...</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`flex-1 font-mono text-[0.65rem] py-2 border-2 border-warm-brown cursor-pointer transition-all ${
                      role === "student" ? "bg-soft-coral text-warm-brown" : "bg-transparent text-muted-ink"
                    }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("recruiter")}
                    className={`flex-1 font-mono text-[0.65rem] py-2 border-2 border-warm-brown cursor-pointer transition-all ${
                      role === "recruiter" ? "bg-soft-coral text-warm-brown" : "bg-transparent text-muted-ink"
                    }`}
                  >
                    Recruiter
                  </button>
                </div>
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

              <AnimatedButton
                type="submit"
                disabled={loading}
                variant="coral"
                className="w-full justify-center"
              >
                {loading ? "Creating..." : "Create account"}
              </AnimatedButton>
            </form>

            <p className="text-center text-[0.6rem] font-mono text-muted-ink/50 mt-4">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-soft-coral underline hover:text-warm-brown">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
