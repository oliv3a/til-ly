"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import Mascot from "./Mascot"

type Stage = "idle" | "menu-in" | "popover-open" | "typing-email" | "typing-pass" | "logging-in" | "logged-in"

export default function MacMenuBarDemo() {
  const [showPopover, setShowPopover] = useState(false)
  const [stage, setStage] = useState<Stage>("idle")
  const [emailText, setEmailText] = useState("")
  const [passText, setPassText] = useState("")
  const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  const fullEmail = "alice@example.com"
  const fullPass = "••••••••"

  function resetDemo() {
    setShowPopover(false)
    setStage("idle")
    setEmailText("")
    setPassText("")
  }

  function runCycle() {
    if (!mountedRef.current) return
    setStage("menu-in")
    setShowPopover(false)
    setEmailText("")
    setPassText("")

    // 1. show menu bar, wait, then open popover
    cycleRef.current = setTimeout(() => {
      if (!mountedRef.current) return
      setStage("popover-open")
      setShowPopover(true)

      // 2. start typing email
      cycleRef.current = setTimeout(() => {
        if (!mountedRef.current) return
        setStage("typing-email")
        let i = 0
        const emailInterval = setInterval(() => {
          if (!mountedRef.current) { clearInterval(emailInterval); return }
          i++
          setEmailText(fullEmail.slice(0, i))
          if (i >= fullEmail.length) {
            clearInterval(emailInterval)
            // 3. start typing password
            setStage("typing-pass")
            setTimeout(() => {
              if (!mountedRef.current) return
              let j = 0
              const passInterval = setInterval(() => {
                if (!mountedRef.current) { clearInterval(passInterval); return }
                j++
                setPassText(fullPass.slice(0, j))
                if (j >= fullPass.length) {
                  clearInterval(passInterval)
                  // 4. brief pause, then log in
                  setTimeout(() => {
                    if (!mountedRef.current) return
                    setStage("logging-in")
                    // 5. transition to logged-in
                    setTimeout(() => {
                      if (!mountedRef.current) return
                      setStage("logged-in")
                      // 6. stay logged in, then loop
                      setTimeout(() => {
                        if (!mountedRef.current) return
                        runCycle()
                      }, 2500)
                    }, 600)
                  }, 400)
                }
              }, 50)
            }, 300)
          }
        }, 40)
      }, 500)
    }, 600)
  }

  useEffect(() => {
    mountedRef.current = true
    const startTimer = setTimeout(() => runCycle(), 400)
    return () => {
      mountedRef.current = false
      if (cycleRef.current) clearTimeout(cycleRef.current)
      clearTimeout(startTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleToggle() {
    if (cycleRef.current) clearTimeout(cycleRef.current)
    if (showPopover) {
      resetDemo()
      setTimeout(() => runCycle(), 800)
    } else {
      resetDemo()
      setStage("popover-open")
      setShowPopover(true)
    }
  }

  const now = new Date()
  const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })

  return (
    <div className="w-full max-w-md mx-auto">
      {/* macOS menu bar */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex items-center px-3.5 h-7 bg-[#2b2b2b] rounded-t-lg border-b border-white/5 select-none"
      >
        {/* Left — menu items */}
        <div className="flex items-center gap-3 text-[0.45rem] font-mono text-white/70">
          <span className="text-sm leading-none"></span>
          <span className="font-semibold text-white/90">til.ly</span>
          <span className="hidden sm:inline">File</span>
          <span className="hidden sm:inline">Edit</span>
          <span className="hidden sm:inline">View</span>
          <span className="hidden sm:inline">Window</span>
        </div>

        {/* Right — status + mascot */}
        <div className="ml-auto flex items-center gap-2.5 text-[0.4rem] font-mono text-white/60">
          <span className="hidden sm:inline">📶</span>
          <span className="hidden sm:inline">🔋</span>
          <span>{time}</span>
          <motion.button
            onClick={handleToggle}
            className="relative focus:outline-none"
            aria-label="Toggle til.ly popover"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
          >
            <Mascot size={16} emotion={stage === "logged-in" ? "happy" : "neutral"} />
            {/* subtle pulse dot when closed */}
            {!showPopover && stage !== "idle" && (
              <motion.span
                className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-soft-coral rounded-full"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Popover */}
      <AnimatePresence>
        {showPopover && (
          <motion.div
            initial={{ y: -6, opacity: 0, scaleY: 0.92 }}
            animate={{ y: 0, opacity: 1, scaleY: 1 }}
            exit={{ y: -6, opacity: 0, scaleY: 0.92 }}
            transition={{ type: "spring", stiffness: 350, damping: 24 }}
            className="ml-auto w-72 origin-top-right"
          >
              <div className="frame-block p-5 shadow-xl border-t-0 rounded-t-none">

                {stage !== "logged-in" ? (
                  /* LOGGED OUT — login form */
                  <div className="text-center">
                    <motion.div
                      animate={stage === "logging-in" ? { scale: 0.85, opacity: 0 } : {}}
                      transition={{ duration: 0.25 }}
                    >
                      <Mascot size={40} emotion="neutral" />
                      <motion.h3
                        className="font-serif text-base text-warm-brown mt-2 mb-0.5"
                        animate={stage === "typing-email" || stage === "typing-pass" ? { y: [0, -1, 1, 0] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        {now.getHours() < 12 ? "Good morning!" : now.getHours() < 17 ? "Good afternoon!" : now.getHours() < 22 ? "Good evening!" : "Hey night owl!"}
                      </motion.h3>
                      <p className="text-[0.5rem] font-mono text-muted-ink/50 mb-4">Log in to continue</p>

                      <div className="space-y-2.5">
                        <div className="relative">
                          <input
                            type="email"
                            placeholder="you@example.com"
                            value={emailText}
                            readOnly
                            className="field-coral text-[0.65rem] w-full pr-7"
                          />
                          {stage === "typing-email" && (
                            <motion.span
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-soft-coral text-[0.5rem] font-mono"
                              animate={{ opacity: [1, 0, 1] }}
                              transition={{ duration: 0.5, repeat: Infinity }}
                            >
                              ▎
                            </motion.span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="password"
                            placeholder="••••••••"
                            value={passText}
                            readOnly
                            className="field-coral text-[0.65rem] w-full pr-7"
                          />
                          {stage === "typing-pass" && (
                            <motion.span
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-soft-coral text-[0.5rem] font-mono"
                              animate={{ opacity: [1, 0, 1] }}
                              transition={{ duration: 0.5, repeat: Infinity }}
                            >
                              ▎
                            </motion.span>
                          )}
                        </div>
                        <div className="pt-1">
                          <motion.div
                            className={`w-full font-mono text-[0.65rem] py-2.5 border-2 text-center rounded-none transition-colors ${
                              (stage as string) === "logging-in" || (stage as string) === "logged-in"
                                ? "text-warm-paper bg-soft-coral border-warm-brown"
                                : (stage as string) === "typing-pass" || (stage as string) === "typing-email"
                                ? "text-warm-paper bg-soft-coral border-warm-brown cursor-pointer"
                                : "text-muted-ink/30 bg-cream border-warm-brown/20"
                            }`}
                          >
                            {stage === "logging-in" ? (
                              <span className="flex items-center justify-center gap-2">
                                <motion.span
                                  className="inline-block w-2 h-2 border-2 border-warm-paper border-t-transparent rounded-full"
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                                />
                                Logging in…
                              </span>
                            ) : (
                              "Log in"
                            )}
                          </motion.div>
                        </div>
                      </div>

                      <p className="text-center text-[0.5rem] font-mono text-muted-ink/40 mt-3">
                        Don&apos;t have an account?{" "}
                        <span className="text-soft-coral underline">Sign up</span>
                      </p>
                    </motion.div>
                  </div>
                ) : (
                  /* LOGGED IN — quick actions */
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-center"
                  >
                    <Mascot size={40} emotion="happy" />
                    <motion.h3
                      className="font-serif text-base text-warm-brown mt-2 mb-0.5"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    >
                      Welcome back, Alice!
                    </motion.h3>
                    <p className="text-[0.5rem] font-mono text-muted-ink/50 mb-4">What do you want to do?</p>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 w-full font-mono text-[0.6rem] text-warm-paper bg-soft-coral py-2.5 px-3 border-2 border-warm-brown text-left hover:opacity-90 transition-opacity cursor-default">
                        <span className="text-xs">✏️</span>
                        <span>Create a new log</span>
                      </div>
                      <div className="flex items-center gap-2 w-full text-[0.55rem] font-mono text-muted-ink/60 hover:text-soft-coral transition-colors py-2 px-3 text-left cursor-default">
                        <span className="text-xs">📊</span>
                        <span>View my dashboard →</span>
                      </div>
                    </div>

                    <motion.div
                      className="mt-4 pt-3 border-t border-warm-brown/15 text-[0.45rem] font-mono text-muted-ink/30 flex items-center justify-center gap-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <motion.span
                        className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      Logged in · Auto-syncs
                    </motion.div>
                  </motion.div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Caption */}
      {!showPopover && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-[0.4rem] font-mono text-muted-ink/25 text-center mt-1.5"
        >
          Click the mascot to replay
        </motion.p>
      )}
    </div>
  )
}
