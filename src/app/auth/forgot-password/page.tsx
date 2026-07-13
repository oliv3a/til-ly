"use client"

import { useState } from "react"
import Link from "next/link"
import AnimatedButton from "@/lib/motion/components/AnimatedButton"
import AnimatedOnigiri from "@/components/AnimatedOnigiri"
import PageShell from "@/components/PageShell"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Something went wrong")
        setLoading(false)
        return
      }

      setSent(true)
    } catch {
      setError("Something went wrong")
    }

    setLoading(false)
  }

  if (sent) {
    return (
      <PageShell showNav={false} showFooter={false}>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="w-full max-w-sm animate-fade-in-up">
            <div className="text-center mb-6">
              <AnimatedOnigiri size={72} emotion="happy" />
            </div>
            <div className="frame-block">
              <h2 className="font-serif text-xl text-warm-brown text-center mb-4">Check your email</h2>
              <p className="text-[0.65rem] font-mono text-muted-ink text-center leading-relaxed">
                If an account with that email exists, we&apos;ve sent a password reset link.
                <br />
                It expires in 1 hour.
              </p>
              <p className="text-center mt-6">
                <Link href="/auth/login" className="text-[0.6rem] font-mono text-soft-coral underline hover:text-warm-brown">
                  Back to login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell showNav={false} showFooter={false}>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="text-center mb-6">
            <Link href="/" className="inline-block group">
              <AnimatedOnigiri size={72} emotion="neutral" />
            </Link>
          </div>

          <div className="frame-block">
            <h2 className="font-serif text-xl text-warm-brown text-center mb-4">Reset your password</h2>
            <p className="text-[0.6rem] font-mono text-muted-ink text-center mb-4 leading-relaxed">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            <form id="forgot-password-form" onSubmit={handleSubmit} className="space-y-3">
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

              {error && (
                <p className="text-[0.65rem] font-mono text-warm-brown bg-peach/50 px-2 py-1 border-2 border-warm-brown">
                  {error}
                </p>
              )}

              <AnimatedButton type="submit" variant="coral" className="w-full justify-center" disabled={loading}>
                {loading ? "Sending..." : "Send reset link"}
              </AnimatedButton>
            </form>

            <p className="text-center text-[0.6rem] font-mono text-muted-ink/50 mt-4">
              <Link href="/auth/login" className="text-soft-coral underline hover:text-warm-brown">
                Back to login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
