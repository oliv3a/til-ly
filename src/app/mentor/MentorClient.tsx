"use client"

import { useState, useEffect, useRef } from "react"
import AnimatedButton from "@/lib/motion/components/AnimatedButton"
import MentorOnboardingModal from "./MentorOnboardingModal"

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

interface Overview {
  greeting: string
  focus: string | null
  suggestions: string[]
}

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
  const [mode, setMode] = useState<"chat" | "review">("chat")
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
      const res = await fetch("/api/mentor/overview")
      if (res.ok) {
        const data = await res.json()
        setOverview(data.overview)
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

  async function sendMessage() {
    if (!input.trim()) return
    const text = input.trim()
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
    setInput(suggestion)
    setMode("chat")
    inputRef.current?.focus()
  }

  return (
    <>
    <div className="max-w-4xl mx-auto">
      <div className="flex gap-4 min-h-[calc(100vh-8rem)]">
        {/* Sidebar — conversations */}
        <div className="w-48 shrink-0 hidden md:block">
          <AnimatedButton onClick={startNewConversation} variant="coral" className="w-full mb-3 text-[0.6rem]">
            + New Chat
          </AnimatedButton>
          <div className="space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`block w-full text-left px-2 py-1.5 font-mono text-[0.55rem] rounded-sm transition-colors cursor-pointer ${
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
        </div>

        {/* Main — overview + chat */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Overview */}
          {overviewLoading ? (
            <div className="frame-block p-6 mb-4 text-center">
              <p className="text-[0.65rem] font-mono text-muted-ink/40">Loading your context...</p>
            </div>
          ) : overview ? (
            <div className="frame-block p-6 mb-4">
              <h1 className="poster-heading text-2xl mb-2">{overview.greeting}</h1>
              {overview.focus && (
                <p className="text-[0.7rem] font-mono text-muted-ink/70 mb-3">{overview.focus}</p>
              )}
              {overview.suggestions.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[0.55rem] font-mono text-muted-ink/40 uppercase tracking-wider">Suggestions</p>
                  {overview.suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(s)}
                      className="block w-full text-left text-[0.65rem] font-mono text-warm-brown/80 hover:text-warm-brown px-2 py-1.5 bg-warm-brown/5 hover:bg-warm-brown/10 rounded-sm transition-colors cursor-pointer"
                    >
                      💡 {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {/* Mode tabs */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => { setMode("chat"); resetReview() }}
              className={`font-mono text-[0.6rem] px-3 py-1 rounded-sm transition-colors cursor-pointer ${
                mode === "chat" ? "bg-warm-brown text-warm-paper" : "text-muted-ink/50 hover:text-warm-brown"
              }`}
            >
              💬 Chat
            </button>
            <button
              onClick={() => setMode("review")}
              className={`font-mono text-[0.6rem] px-3 py-1 rounded-sm transition-colors cursor-pointer ${
                mode === "review" ? "bg-warm-brown text-warm-paper" : "text-muted-ink/50 hover:text-warm-brown"
              }`}
            >
              🔍 Code Review
            </button>
            {activeConversationId && (
              <button
                onClick={startNewConversation}
                className="ml-auto font-mono text-[0.55rem] text-muted-ink/40 hover:text-warm-brown cursor-pointer"
              >
                + New Chat
              </button>
            )}
          </div>

          {/* Chat area */}
          <div className="flex-1 frame-block p-4 flex flex-col min-h-[400px]">
            <div className="flex-1 overflow-y-auto space-y-3 mb-3">
              {mode === "chat" && messages.length === 0 && !loading && (
                <div className="text-center py-12 px-4">
                  <div className="text-3xl mb-2">🧠</div>
                  <h2 className="poster-heading text-2xl text-warm-brown mt-1 mb-2">
                    {mentorName}
                  </h2>
                  <p className="text-[0.7rem] font-mono text-muted-ink/70 mb-1">
                    I remember everything you&apos;ve learned.
                  </p>
                  <p className="text-[0.55rem] font-mono text-muted-ink/40">
                    Learning from your study logs, goals and resume.
                  </p>
                </div>
              )}

              {mode === "review" && !reviewResult && !loading && (
                <div className="space-y-2">
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
                      className="btn-base btn-outline btn-interact text-[0.5rem] cursor-pointer"
                    >
                      {fileName ? `📎 ${fileName}` : "+ Upload file"}
                    </button>
                  </div>
                  <button
                    onClick={sendReview}
                    disabled={!code.trim()}
                    className="w-full py-2.5 bg-warm-brown text-white text-[0.6rem] font-mono font-semibold rounded-sm hover:bg-warm-brown/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Send for Review
                  </button>
                </div>
              )}

              {mode === "review" && reviewResult && (
                <div className="space-y-2">
                  {reviewResult.style && (
                    <div className="frame-block p-2.5 bg-white/70">
                      <p className="text-[0.55rem] font-mono text-ink font-bold mb-0.5">🎨 Style</p>
                      <p className="text-[0.6rem] font-mono text-ink/85 leading-relaxed">{reviewResult.style}</p>
                    </div>
                  )}
                  {reviewResult.strengths && reviewResult.strengths.length > 0 && (
                    <div className="frame-block p-2.5 bg-muted-teal/5 border-l-2 border-muted-teal">
                      <p className="text-[0.55rem] font-mono text-ink font-bold mb-0.5">✅ Strengths</p>
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
                      <p className="text-[0.55rem] font-mono text-ink font-bold mb-0.5">🔧 Areas to Improve</p>
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
                      <p className="text-[0.55rem] font-mono text-ink font-bold mb-0.5">💡 Suggestions</p>
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
                    className="text-[0.55rem] font-mono text-muted-ink/50 hover:text-warm-brown cursor-pointer"
                  >
                    ↺ Review new code
                  </button>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i}>
                  {msg.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="bg-warm-brown/10 rounded-sm px-3 py-2 max-w-[85%]">
                        <p className="text-[0.6rem] font-mono text-ink/80 whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <p className="text-[0.6rem] font-mono text-ink/85 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 py-3">
                  <span className="text-[0.6rem] font-mono text-warm-brown/60">Thinking...</span>
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
                        : "Ask me anything..."
                  }
                  disabled={loading}
                  className="field-coral flex-1 text-[0.6rem] font-mono disabled:opacity-40"
                />
                <button
                  onClick={mode === "review" && reviewFollowUp ? sendReviewFollowUp : sendMessage}
                  disabled={!input.trim() || loading}
                  className="px-4 py-2 bg-warm-brown text-white text-[0.55rem] font-mono font-semibold rounded-sm hover:bg-warm-brown/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
                >
                  Send →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {showOnboarding && (
      <MentorOnboardingModal onComplete={handleOnboardingComplete} />
    )}
    </>
  )
}
