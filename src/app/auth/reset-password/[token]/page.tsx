"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import AnimatedButton from "@/lib/motion/components/AnimatedButton"
import BrandLogo from "@/components/BrandLogo"
import PageShell from "@/components/PageShell"

export default function ResetPasswordPage() {
  const params = useParams()
  const token = params.token as string

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Something went wrong")
        setLoading(false)
        return
      }

      setDone(true)
    } catch {
      setError("Something went wrong")
    }

    setLoading(false)
  }

  if (done) {
    return (
      <PageShell showNav={false} showFooter={false}>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="w-full max-w-sm animate-fade-in-up">
            <div className="text-center mb-6">
              <BrandLogo size={72} />
            </div>
            <div className="frame-block">
              <h2 className="font-serif text-xl text-warm-brown text-center mb-4">Password reset</h2>
              <p className="text-[0.65rem] font-mono text-muted-ink text-center leading-relaxed">
                Your password has been reset successfully.
              </p>
              <div className="mt-6 text-center">
                <Link
                  href="/auth/login"
                  className="inline-block font-mono text-[0.65rem] text-soft-coral underline hover:text-warm-brown"
                >
                  Log in with your new password
                </Link>
              </div>
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
            <BrandLogo size={72} />
          </div>

          <div className="frame-block">
            <h2 className="font-serif text-xl text-warm-brown text-center mb-4">Set new password</h2>

            <form id="reset-password-form" onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[0.65rem] font-mono text-muted-ink mb-1">New password</label>
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
                <label className="block text-[0.65rem] font-mono text-muted-ink mb-1">Confirm new password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="field-coral"
                  placeholder="Re-enter your password"
                />
              </div>

              {error && (
                <p className="text-[0.65rem] font-mono text-warm-brown bg-peach/50 px-2 py-1 border-2 border-warm-brown">
                  {error}
                </p>
              )}

              <AnimatedButton type="submit" variant="coral" className="w-full justify-center" disabled={loading}>
                {loading ? "Resetting..." : "Reset password"}
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
