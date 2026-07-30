"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import AnimatedButton from "@/lib/motion/components/AnimatedButton"
import MentorOnboardingModal from "./MentorOnboardingModal"
import MentorJourneyRecap from "./MentorJourneyRecap"
import { MILESTONE_BY_KEY } from "@/lib/milestoneDefinitions"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface Conversation {
  id: string
  title: string | null
  createdAt: string
  updatedAt: string
  _count: { messages: number }
}

interface JourneyHighlight {
  icon: string
  title: string
  description: string
  priority: number
}

interface MilestoneEntry {
  key: string
  achievedAt: string
}

interface Overview {
  greeting: string
  focus: string | null
  suggestions: string[]
  promptSuggestions: string[]
  insight: string | null
}

const DEFAULT_PROMPTS = [
  "What should I study next?",
  "What am I strongest at?",
  "Summarize everything I've learned about React.",
  "Turn this week's study into interview questions.",
  "Update my resume from today's study log.",
]

interface ReviewResult {
  style?: string
  strengths?: string[]
  weaknesses?: string[]
  improvements?: string[]
  summary?: string
}

export default function MentorClient() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [overview, setOverview] = useState<Overview | null>(null)
  const [overviewLoading, setOverviewLoading] = useState(true)
  const [milestones, setMilestones] = useState<MilestoneEntry[]>([])
  const [mode, setMode] = useState<"chat" | "review">("chat")
  const [journeyRecap, setJourneyRecap] = useState<JourneyHighlight[] | null>(null)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [mentorName, setMentorName] = useState("Tilly")
  const [code, setCode] = useState("")
  const [fileName, setFileName] = useState("")
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null)
  const [reviewFollowUp, setReviewFollowUp] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading, reviewResult])

  useEffect(() => {
    if (!loading) inputRef.current?.focus()
  }, [loading])

  async function fetchConversations() {
    try {
      const res = await fetch("/api/mentor/conversations")
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations)
      }
    } catch {}
  }

  async function fetchOverview() {
    setOverviewLoading(true)
    try {
      const h = new Date().getHours()
      const tod = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening"
      const res = await fetch(`/api/mentor/overview?tod=${tod}`, {
        headers: { "x-tod": tod },
      })
      if (res.ok) {
        const data = await res.json()
        setOverview(data.overview)
        setJourneyRecap(Array.isArray(data.journeyRecap) && data.journeyRecap.length > 0 ? data.journeyRecap : null)
        const ms = (data.milestones || []) as MilestoneEntry[]
        setMilestones((prev) => {
          const existing = new Set(prev.map((m) => m.key))
          const newOnes = ms.filter((m) => !existing.has(m.key))
          if (newOnes.length === 0) return prev
          fetch("/api/mentor/overview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ keys: newOnes.map((m) => m.key) }),
          }).catch(() => {})
          return [...prev, ...newOnes]
        })
      }
    } catch {} finally {
      setOverviewLoading(false)
    }
  }

  async function fetchOnboarding() {
    try {
      const res = await fetch("/api/mentor/onboarding")
      if (res.ok) {
        const data = await res.json()
        if (data.completed) {
          setMentorName(data.name || "Tilly")
          fetchConversations()
          fetchOverview()
          return
        }
      }
    } catch {}
    setShowOnboarding(true)
  }

  async function handleJourneyRecapComplete() {
    try {
      await fetch("/api/mentor/overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journeyRecapCompleted: true }),
      })
    } catch {}
    setJourneyRecap(null)
  }

  function handleOnboardingComplete(name: string) {
    setMentorName(name)
    setShowOnboarding(false)
    fetchConversations()
    fetchOverview()
  }

  useEffect(() => {
    async function init() {
      await fetchOnboarding()
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startNewConversation() {
    try {
      const res = await fetch("/api/mentor/conversations", { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setConversations((prev) => [{ ...data.conversation, _count: { messages: 0 } }, ...prev])
        setActiveConversationId(data.conversation.id)
        setMessages([])
        setReviewResult(null)
        setReviewFollowUp(false)
        setCode("")
        setFileName("")
        setMode("chat")
      }
    } catch {}
  }

  async function loadConversation(id: string) {
    setActiveConversationId(id)
    setMessages([])
    setReviewResult(null)
    setReviewFollowUp(false)
    setMode("chat")
    try {
      const res = await fetch(`/api/mentor/conversations/${id}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages.map((m: { role: string; content: string }) => ({ role: m.role as "user" | "assistant", content: m.content })))
      }
    } catch {}
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result
      if (typeof text === "string") setCode(text)
    }
    reader.readAsText(file)
  }

  async function sendReview() {
    if (!code.trim()) return
    setLoading(true)
    setReviewResult(null)
    try {
      const res = await fetch("/api/code-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "review",
          code,
          fileName: fileName || undefined,
          messages: [],
          timezoneOffset: new Date().getTimezoneOffset(),
        }),
      })
      const data = await res.json()
      if (data.type === "review") {
        setReviewResult({
          style: data.style,
          strengths: data.strengths,
          weaknesses: data.weaknesses,
          improvements: data.improvements,
          summary: data.summary,
        })
        setReviewFollowUp(true)
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  async function sendReviewFollowUp() {
    if (!input.trim() || !reviewResult) return
    const text = input.trim()
    setInput("")
    setLoading(true)
    try {
      const res = await fetch("/api/code-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "chat",
          code,
          fileName: fileName || undefined,
          messages: [
            { role: "user", content: "I shared my code for review earlier." },
            { role: "assistant", content: reviewResult.summary || "Here's my review." },
            { role: "user", content: text },
          ],
          timezoneOffset: new Date().getTimezoneOffset(),
        }),
      })
      const data = await res.json()
      if (data.type === "chat") {
        setMessages((prev) => [...prev, { role: "user", content: text }, { role: "assistant", content: data.text }])
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  async function sendText(text: string) {
    if (!text.trim()) return
    setInput("")

    let convId = activeConversationId
    if (!convId) {
      try {
        const res = await fetch("/api/mentor/conversations", { method: "POST" })
        if (res.ok) {
          const data = await res.json()
          convId = data.conversation.id
          setActiveConversationId(convId)
          setConversations((prev) => [{ ...data.conversation, _count: { messages: 0 } }, ...prev])
        }
      } catch {}
    }
    if (!convId) return

    const userMsg: Message = { role: "user", content: text }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch("/api/mentor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId, content: text }),
      })
      const data = await res.json()
      if (data.text) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.text }])
      }
      fetchConversations()
    } catch {} finally {
      setLoading(false)
    }
  }

  async function sendMessage() {
    sendText(input.trim())
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (mode === "review" && reviewFollowUp) sendReviewFollowUp()
      else if (mode === "review") sendReview()
      else sendMessage()
    }
  }

  function resetReview() {
    setReviewResult(null)
    setReviewFollowUp(false)
    setCode("")
    setFileName("")
  }

  function handleSuggestionClick(suggestion: string) {
    setMode("chat")
    sendText(suggestion)
  }

  return (
    <>
    <div className="max-w-4xl mx-auto">
      <div className="flex gap-4 min-h-[calc(100vh-8rem)]">
        {/* Sidebar — conversations */}
        <div className="w-48 shrink-0 hidden md:block">
          <AnimatedButton onClick={startNewConversation} variant="coral" className="w-full mb-3 text-[0.6rem]" aria-label="Start new conversation">
            + New Chat
          </AnimatedButton>
          <div className="space-y-1">
            {conversations.length === 0 && (
              <p className="text-[0.55rem] font-mono text-muted-ink/30 text-center py-4">No conversations yet</p>
            )}
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`block w-full text-left px-2 py-1.5 font-mono text-[0.55rem] rounded-sm transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-warm-brown/40 outline-none ${
                  activeConversationId === conv.id
                    ? "bg-warm-brown text-warm-paper"
                    : "text-muted-ink/60 hover:bg-warm-brown/5 hover:text-warm-brown"
                }`}
                aria-label={`Conversation: ${conv.title || "Untitled"}`}
              >
                <span className="truncate block">{conv.title || "New conversation"}</span>
                <span className="text-[0.45rem] opacity-50">{conv._count.messages} messages</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main — overview + chat */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Journey Recap */}
          {journeyRecap && journeyRecap.length > 0 && (
            <div className="mb-4">
              <MentorJourneyRecap
                mentorName={mentorName}
                highlights={journeyRecap}
                onComplete={handleJourneyRecapComplete}
              />
            </div>
          )}

          {/* Overview */}
          {!journeyRecap && overviewLoading ? (
            <div className="frame-block p-6 mb-4 space-y-4 animate-pulse">
              <div className="h-5 bg-warm-brown/5 rounded w-3/5" />
              <div className="flex gap-2 pt-1">
                <div className="h-5 bg-warm-brown/5 rounded-full w-16" />
                <div className="h-5 bg-warm-brown/5 rounded-full w-24" />
              </div>
              <div className="h-3 bg-warm-brown/5 rounded w-full" />
              <div className="space-y-2 pt-1">
                <div className="h-3 bg-warm-brown/5 rounded w-full" />
                <div className="h-3 bg-warm-brown/5 rounded w-5/6" />
                <div className="h-3 bg-warm-brown/5 rounded w-3/4" />
              </div>
            </div>
          ) : !journeyRecap && overview ? (
            <motion.div
              className="frame-block p-6 mb-4"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
              }}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
                }}
              >
                <h1 className="poster-heading text-2xl mb-2">{overview.greeting}</h1>
              </motion.div>
              {milestones.length > 0 && (
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
                  }}
                >
                  <div className="flex flex-wrap gap-2 mb-8">
                    {milestones.map((m) => {
                      const def = MILESTONE_BY_KEY[m.key as keyof typeof MILESTONE_BY_KEY]
                      if (!def) return null
                      return (
                        <div key={m.key} className="flex items-center gap-1.5 bg-cream/60 rounded-sm px-2.5 py-1.5 hover:bg-cream/80 transition-colors">
                          <span className="text-sm">{def.emoji}</span>
                          <p className="text-[0.6rem] font-mono text-muted-ink/80">{def.message}</p>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
              {overview.insight && (
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
                  }}
                >
                  <div className="flex items-start gap-2 mb-3 pb-3 border-b border-warm-brown/10">
                    <span className="text-sm leading-none mt-0.5">✨</span>
                    <p className="text-[0.65rem] font-mono text-warm-brown/70 italic">{overview.insight}</p>
                  </div>
                </motion.div>
              )}
              {overview.focus && (
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
                  }}
                >
                  <p className="text-[0.7rem] font-mono text-muted-ink/70 mb-3">{overview.focus}</p>
                </motion.div>
              )}
              {overview.suggestions.length > 0 && (
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
                  }}
                >
                  <div className="space-y-1.5">
                    <p className="text-[0.55rem] font-mono text-muted-ink/40 uppercase tracking-wider">Suggestions</p>
                    {overview.suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick(s)}
                        className="block w-full text-left text-[0.65rem] font-mono text-warm-brown/80 hover:text-warm-brown px-2 py-1.5 bg-warm-brown/5 hover:bg-warm-brown/10 rounded-sm transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-warm-brown/40 outline-none"
                      >
                        💡 {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : null}

          {/* Mode tabs */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="md:hidden font-mono text-[0.6rem] px-2 py-1 rounded-sm text-muted-ink/50 hover:text-warm-brown transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-warm-brown/40 outline-none"
              aria-label="Open conversations"
            >
              ☰
            </button>
            <button
              onClick={() => { setMode("chat"); resetReview() }}
              className={`font-mono text-[0.6rem] px-3 py-1 rounded-sm transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-warm-brown/40 outline-none ${
                mode === "chat" ? "bg-warm-brown text-warm-paper" : "text-muted-ink/50 hover:text-warm-brown"
              }`}
              aria-label="Chat mode"
            >
              💬 Chat
            </button>
            <button
              onClick={() => setMode("review")}
              className={`font-mono text-[0.6rem] px-3 py-1 rounded-sm transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-warm-brown/40 outline-none ${
                mode === "review" ? "bg-warm-brown text-warm-paper" : "text-muted-ink/50 hover:text-warm-brown"
              }`}
              aria-label="Code review mode"
            >
              🔍 Code Review
            </button>
            {activeConversationId && (
              <button
                onClick={startNewConversation}
                className="ml-auto hidden md:block font-mono text-[0.55rem] text-muted-ink/40 hover:text-warm-brown cursor-pointer focus-visible:ring-2 focus-visible:ring-warm-brown/40 outline-none"
                aria-label="Start new conversation"
              >
                + New Chat
              </button>
            )}
          </div>

          {/* Chat area */}
          <div className="flex-1 frame-block p-4 flex flex-col min-h-[400px]">
            <div className="flex-1 overflow-y-auto space-y-3 mb-3" role="log" aria-live="polite" aria-busy={loading}>
              <AnimatePresence mode="wait">
                {mode === "chat" && messages.length === 0 && !loading && (
                  <motion.div
                    key="chat-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="text-center py-12 px-4">
                      <div className="text-3xl mb-2">🧠</div>
                      <h2 className="poster-heading text-2xl text-warm-brown mt-1 mb-2">
                        {mentorName}
                      </h2>
                      <p className="text-[0.7rem] font-mono text-muted-ink/70 mb-1">
                        I remember everything you&apos;ve learned.
                      </p>
                      <p className="text-[0.55rem] font-mono text-muted-ink/40 mb-6">
                        Learning from your study logs, goals and resume.
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                        {(overview?.promptSuggestions?.length ? overview.promptSuggestions : DEFAULT_PROMPTS).map((s) => (
                          <button
                            key={s}
                            onClick={() => handleSuggestionClick(s)}
                            className="px-3 py-1.5 text-[0.6rem] font-mono text-muted-ink/70 bg-warm-brown/5 hover:bg-warm-brown/10 hover:text-warm-brown border border-warm-brown/10 rounded-full transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-warm-brown/40 outline-none"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {mode === "review" && !reviewResult && !loading && (
                  <motion.div
                    key="review-input"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="space-y-2">
                      <p className="text-[0.6rem] font-mono text-muted-ink/60 leading-relaxed">
                        Paste your code below and I&apos;ll review the style, structure and logic.
                      </p>
                      <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Paste your code here..."
                        rows={8}
                        className="field-coral w-full resize-y text-[0.6rem] font-mono"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".js,.ts,.tsx,.jsx,.py,.rb,.go,.rs,.java,.cpp,.c,.h,.cs,.swift,.kt,.scala,.php,.html,.css,.scss,.sql,.sh,.yaml,.json,.xml,.md,.txt"
                          onChange={handleFile}
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="btn-base btn-outline btn-interact text-[0.5rem] cursor-pointer focus-visible:ring-2 focus-visible:ring-warm-brown/40 outline-none"
                        >
                          {fileName ? `📎 ${fileName}` : "+ Upload file"}
                        </button>
                      </div>
                      <button
                        onClick={sendReview}
                        disabled={!code.trim()}
                        className="w-full py-2.5 bg-warm-brown text-white text-[0.6rem] font-mono font-semibold rounded-sm hover:bg-warm-brown/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-warm-brown/40 outline-none"
                        aria-label="Send code for review"
                      >
                        Send for Review
                      </button>
                    </div>
                  </motion.div>
                )}

                {mode === "review" && reviewResult && (
                  <motion.div
                    key="review-result"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="space-y-2">
                      {reviewResult.style && (
                        <div className="frame-block p-2.5 bg-white/70">
                          <p className="text-[0.55rem] font-mono text-muted-ink/40 uppercase tracking-wider mb-0.5">Style</p>
                          <p className="text-[0.6rem] font-mono text-ink/85 leading-relaxed">{reviewResult.style}</p>
                        </div>
                      )}
                      {reviewResult.strengths && reviewResult.strengths.length > 0 && (
                        <div className="frame-block p-2.5 bg-muted-teal/5 border-l-2 border-muted-teal">
                          <p className="text-[0.55rem] font-mono text-muted-ink/40 uppercase tracking-wider mb-0.5">Strengths</p>
                          <ul className="space-y-0.5">
                            {reviewResult.strengths.map((s, i) => (
                              <li key={i} className="text-[0.6rem] font-mono text-ink/85 flex items-start gap-1.5">
                                <span className="text-muted-teal shrink-0">•</span><span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {reviewResult.weaknesses && reviewResult.weaknesses.length > 0 && (
                        <div className="frame-block p-2.5 bg-warm-brown/5 border-l-2 border-warm-brown">
                          <p className="text-[0.55rem] font-mono text-muted-ink/40 uppercase tracking-wider mb-0.5">Areas to Improve</p>
                          <ul className="space-y-0.5">
                            {reviewResult.weaknesses.map((w, i) => (
                              <li key={i} className="text-[0.6rem] font-mono text-ink/85 flex items-start gap-1.5">
                                <span className="text-warm-brown shrink-0">•</span><span>{w}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {reviewResult.improvements && reviewResult.improvements.length > 0 && (
                        <div className="frame-block p-2.5 bg-[#FFF5E6]/80 border-l-2 border-[#D4A574]">
                          <p className="text-[0.55rem] font-mono text-muted-ink/40 uppercase tracking-wider mb-0.5">Suggestions</p>
                          <ul className="space-y-0.5">
                            {reviewResult.improvements.map((imp, i) => (
                              <li key={i} className="text-[0.6rem] font-mono text-ink/85 flex items-start gap-1.5">
                                <span className="text-[#D4A574] shrink-0">•</span><span>{imp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {reviewResult.summary && (
                        <div className="pt-1">
                          <p className="text-[0.65rem] font-serif text-ink font-medium leading-relaxed italic">{reviewResult.summary}</p>
                        </div>
                      )}
                      <button
                        onClick={resetReview}
                        className="text-[0.55rem] font-mono text-muted-ink/50 hover:text-warm-brown cursor-pointer focus-visible:ring-2 focus-visible:ring-warm-brown/40 outline-none"
                      >
                        ↺ Review new code
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {msg.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="bg-warm-brown/10 rounded-sm px-3 py-2 max-w-[85%]">
                        <p className="text-[0.6rem] font-mono text-ink/80 whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <span className="text-sm leading-none mt-0.5 shrink-0" aria-hidden="true">🧠</span>
                      <div className="bg-warm-paper/80 rounded-sm px-3 py-2 max-w-[85%] border border-warm-brown/5">
                        <p className="text-[0.6rem] font-mono text-ink/85 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {loading && (
                <div className="flex items-center gap-1.5 py-3" aria-label="Mentor is typing">
                  <motion.span
                    className="w-1.5 h-1.5 bg-warm-brown/40 rounded-full inline-block"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                  />
                  <motion.span
                    className="w-1.5 h-1.5 bg-warm-brown/40 rounded-full inline-block"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.span
                    className="w-1.5 h-1.5 bg-warm-brown/40 rounded-full inline-block"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-warm-brown/10 pt-3">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    mode === "review" && reviewFollowUp
                      ? "Ask a follow-up about this review..."
                      : mode === "review"
                        ? "Paste code above first..."
                        : "Ask about your learning..."
                  }
                  disabled={loading}
                  className="field-coral flex-1 text-[0.6rem] font-mono disabled:opacity-40"
                />
                <button
                  onClick={mode === "review" && reviewFollowUp ? sendReviewFollowUp : sendMessage}
                  disabled={!input.trim() || loading}
                  className="px-4 py-2 bg-warm-brown text-white text-[0.55rem] font-mono font-semibold rounded-sm hover:bg-warm-brown/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-warm-brown/40 outline-none"
                  aria-label={mode === "review" && reviewFollowUp ? "Send follow-up" : "Send message"}
                >
                  Send →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Mobile sidebar drawer */}
    <AnimatePresence>
      {showMobileSidebar && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px] md:hidden"
            onClick={() => setShowMobileSidebar(false)}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-56 bg-warm-paper border-r border-warm-brown/10 p-4 md:hidden shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[0.55rem] font-mono text-muted-ink/40 uppercase tracking-wider">Conversations</p>
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="font-mono text-[0.55rem] text-muted-ink/40 hover:text-warm-brown cursor-pointer focus-visible:ring-2 focus-visible:ring-warm-brown/40 outline-none"
                aria-label="Close conversations"
              >
                ✕
              </button>
            </div>
            <AnimatedButton onClick={() => { startNewConversation(); setShowMobileSidebar(false) }} variant="coral" className="w-full mb-3 text-[0.6rem]">
              + New Chat
            </AnimatedButton>
            <div className="space-y-1">
              {conversations.length === 0 && (
                <p className="text-[0.55rem] font-mono text-muted-ink/30 text-center py-4">No conversations yet</p>
              )}
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => { loadConversation(conv.id); setShowMobileSidebar(false) }}
                  className={`block w-full text-left px-2 py-1.5 font-mono text-[0.55rem] rounded-sm transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-warm-brown/40 outline-none ${
                    activeConversationId === conv.id
                      ? "bg-warm-brown text-warm-paper"
                      : "text-muted-ink/60 hover:bg-warm-brown/5 hover:text-warm-brown"
                  }`}
                >
                  <span className="truncate block">{conv.title || "New conversation"}</span>
                  <span className="text-[0.45rem] opacity-50">{conv._count.messages} messages</span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {showOnboarding && (
      <MentorOnboardingModal onComplete={handleOnboardingComplete} />
    )}
    </>
  )
}
