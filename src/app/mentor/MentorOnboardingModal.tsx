"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { staggerContainer, staggerItem } from "@/lib/motion/variants"

const SUGGESTED_NAMES = ["Brain", "Atlas", "Nova", "Jarvis", "Mochi"]

interface Props {
  onComplete: (name: string) => void
}

export default function MentorOnboardingModal({ onComplete }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step === 2) inputRef.current?.focus()
  }, [step])

  async function finish() {
    setSaving(true)
    const finalName = name.trim() || "Tilly"
    try {
      const res = await fetch("/api/mentor/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: finalName, completed: true }),
      })
      if (res.ok) onComplete(finalName)
    } catch {} finally {
      setSaving(false)
    }
  }

  function handleNotNow() {
    router.push("/dashboard")
  }

  function handleChipClick(value: string) {
    setName(value)
    setStep(3)
  }

  return (
    <div className="fixed inset-0 z-50 bg-warm-brown/20 backdrop-blur-sm flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            className="frame-block max-w-md w-full p-8"
          >
            <motion.div variants={staggerItem} className="mb-6">
              <div className="text-4xl mb-3">🧠</div>
              <h2 className="poster-heading text-2xl mb-3">
                Ready to adopt your academic weapon?
              </h2>
              <p className="text-[0.7rem] font-mono text-muted-ink/70 leading-relaxed">
                This isn&apos;t just another AI chatbot. It remembers everything you learn, so every conversation becomes more personal over time.
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="flex items-center gap-3">
              <button
                onClick={handleNotNow}
                className="font-mono text-[0.6rem] text-muted-ink/50 hover:text-warm-brown transition-colors cursor-pointer"
              >
                Not now
              </button>
              <button
                onClick={() => setStep(2)}
                className="btn-base btn-coral btn-interact text-[0.55rem] cursor-pointer"
              >
                Let&apos;s go →
              </button>
            </motion.div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            className="frame-block max-w-md w-full p-8"
          >
            <motion.div variants={staggerItem} className="mb-6">
              <h2 className="poster-heading text-2xl mb-3">
                What should I call myself?
              </h2>
              <p className="text-[0.7rem] font-mono text-muted-ink/70">
                I&apos;ll be with you through every study session.
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="space-y-4">
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && name.trim()) setStep(3)
                }}
                placeholder="Type a name..."
                className="field-coral text-[0.7rem]"
              />

              <div className="flex flex-wrap gap-2">
                {SUGGESTED_NAMES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleChipClick(s)}
                    className="px-3 py-1.5 text-[0.6rem] font-mono text-warm-brown/80 bg-warm-brown/5 hover:bg-warm-brown/10 border border-warm-brown/10 rounded-full transition-colors cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div variants={staggerItem} className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="font-mono text-[0.6rem] text-muted-ink/50 hover:text-warm-brown transition-colors cursor-pointer"
              >
                ← Back
              </button>
              <button
                onClick={() => {
                  if (name.trim()) setStep(3)
                }}
                disabled={!name.trim()}
                className="btn-base btn-coral btn-interact text-[0.55rem] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Continue →
              </button>
            </motion.div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            className="frame-block max-w-md w-full p-8 text-center"
          >
            <motion.div variants={staggerItem} className="mb-6">
              <div className="text-4xl mb-3">🧠</div>
              <p className="text-[0.7rem] font-mono text-muted-ink/70 mb-2">
                Nice to meet you 👋
              </p>
              <h2 className="poster-heading text-3xl mb-4">
                {name.trim() || "Tilly"}
              </h2>
              <div className="space-y-1">
                <p className="text-[0.65rem] font-mono text-muted-ink/70">
                  I know everything you log.
                </p>
                <p className="text-[0.65rem] font-mono text-muted-ink/70">
                  The more you use til.ly, the more context I build.
                </p>
                <p className="text-[0.65rem] font-mono text-muted-ink/70">
                  Use me to my fullest,
                </p>
                <p className="text-[0.65rem] font-mono text-muted-ink/70">
                  and I&apos;ll help you reach yours.
                </p>
              </div>
            </motion.div>

            <motion.div variants={staggerItem}>
              <button
                onClick={finish}
                disabled={saving}
                className="btn-base btn-coral btn-interact text-[0.55rem] cursor-pointer disabled:opacity-30"
              >
                {saving ? "Entering..." : "Enter Workspace →"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
