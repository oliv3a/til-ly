"use client"

import { useState, useEffect, useRef } from "react"
import AnimatedButton from "@/lib/motion/components/AnimatedButton"

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

export default function MentorClient() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [overview, setOverview] = useState<Overview | null>(null)
  const [overviewLoading, setOverviewLoading] = useState(true)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchConversations()
    fetchOverview()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

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

  async function startNewConversation() {
    try {
      const res = await fetch("/api/mentor/conversations", { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setConversations((prev) => [{ ...data.conversation, _count: { messages: 0 } }, ...prev])
        setActiveConversationId(data.conversation.id)
        setMessages([])
      }
    } catch {}
  }

  async function loadConversation(id: string) {
    setActiveConversationId(id)
    setMessages([])
    try {
      const res = await fetch(`/api/mentor/conversations/${id}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages.map((m: { role: string; content: string }) => ({ role: m.role as "user" | "assistant", content: m.content })))
      }
    } catch {}
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
      sendMessage()
    }
  }

  function handleSuggestionClick(suggestion: string) {
    setInput(suggestion)
    inputRef.current?.focus()
  }

  return (
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

          <div className="flex-1 frame-block p-4 flex flex-col min-h-[400px]">
            <div className="flex-1 overflow-y-auto space-y-3 mb-3">
              {messages.length === 0 && !loading && (
                <div className="text-center py-8">
                  <p className="text-[0.7rem] font-mono text-muted-ink/40">
                    Ask me anything — coding, debugging, career advice, or study tips.
                  </p>
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
                  placeholder="Ask me anything..."
                  disabled={loading}
                  className="field-coral flex-1 text-[0.6rem] font-mono disabled:opacity-40"
                />
                <button
                  onClick={sendMessage}
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
  )
}
