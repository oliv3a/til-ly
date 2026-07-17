"use client"

import { useState, useEffect, useRef } from "react"

const prompts = [
  "Ask me anything — coding, debugging, or just chat.",
  "Got a coding question? I'm here to help.",
  "Stuck on something? Talk it through with me.",
  "Want a second pair of eyes on your code?",
  "Need advice on learning or career stuff? Let's talk.",
]

const LIMIT_WARN_1 = 10
const LIMIT_WARN_2 = 18
const MAX_MESSAGES = 20

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  type?: "review" | "chat"
  style?: string
  strengths?: string[]
  weaknesses?: string[]
  improvements?: string[]
  summary?: string
}

export default function MascotChat() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"review" | "chat">("review")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [code, setCode] = useState("")
  const [fileName, setFileName] = useState("")
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState("")
  const [messageCount, setMessageCount] = useState(0)
  const [sentCode, setSentCode] = useState("")
  const [showCode, setShowCode] = useState<string | false>(false)
  const [currentPrompt, setCurrentPrompt] = useState(0)
  const [showLabel, setShowLabel] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPrompt((prev) => (prev + 1) % prompts.length)
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setShowLabel((prev) => !prev)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  useEffect(() => {
    if (open && !loading) {
      if (mode === "chat") inputRef.current?.focus()
      else textareaRef.current?.focus()
    }
  }, [open, mode, loading])

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
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

  async function sendMessage() {
    if (mode === "review" && messages.length === 0) {
      if (!code.trim()) return
      setSentCode(code)
      const userMsg: ChatMessage = { role: "user", content: code }
      setMessages([userMsg])
      setLoading(true)
      try {
        const res = await fetch("/api/code-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "review", code, fileName: fileName || undefined, messages: [] }),
        })
        const data = await res.json()
        if (data.type === "limit") {
          setMessageCount(data.messageCount)
          return
        }
        setMessageCount(data.messageCount)
        setMessages([userMsg, {
          role: "assistant",
          content: "",
          type: "review",
          style: data.style,
          strengths: data.strengths,
          weaknesses: data.weaknesses,
          improvements: data.improvements,
          summary: data.summary,
        }])
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
      return
    }

    if (!input.trim()) return
    const text = input.trim()
    setInput("")

    const userMsg: ChatMessage = { role: "user", content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setLoading(true)

    try {
      const res = await fetch("/api/code-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          code: mode === "review" ? sentCode : undefined,
          fileName: mode === "review" ? fileName : undefined,
          messages: updated.map((m) => ({ role: m.role, content: m.type === "review" ? "I shared my code for review earlier." : m.content })),
        }),
      })
      const data = await res.json()
      setMessageCount(data.messageCount)

      if (data.type === "limit") {
        setMessages(updated)
        return
      }

      if (data.type === "review") {
        setMessages([...updated, {
          role: "assistant",
          content: "",
          type: "review",
          style: data.style,
          strengths: data.strengths,
          weaknesses: data.weaknesses,
          improvements: data.improvements,
          summary: data.summary,
        }])
      } else if (data.type === "chat") {
        setMessages([...updated, {
          role: "assistant",
          content: data.text,
          type: "chat",
        }])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setMessages([])
    setCode("")
    setFileName("")
    setSentCode("")
    setShowCode(false)
    setMessageCount(0)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const hasMessages = messages.length > 0

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="frame-block w-[420px] max-w-[calc(100vw-2rem)] max-h-[80vh] flex flex-col bg-warm-paper shadow-xl">
          <div className="flex items-center justify-between p-3 border-b border-warm-brown/10">
            <div className="flex items-center gap-2">
              <OnigiriIcon className="w-6 h-6" />
              <span className="text-[0.65rem] font-mono text-warm-brown font-semibold">Keizo</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-ink/40 hover:text-warm-brown text-[0.7rem] cursor-pointer">✕</button>
          </div>

          <div className="px-3 pt-2 pb-1">
            <div className="flex bg-warm-brown/5 rounded-sm p-0.5">
              <button
                onClick={() => { if (!loading) { setMode("review"); if (!hasMessages) setCode("") } }}
                className={`flex-1 text-[0.55rem] font-mono py-1 rounded-sm transition-colors cursor-pointer ${
                  mode === "review" ? "bg-white text-warm-brown font-medium shadow-sm" : "text-muted-ink/50 hover:text-warm-brown"
                }`}
              >
                Code Review
              </button>
              <button
                onClick={() => { if (!loading) setMode("chat") }}
                className={`flex-1 text-[0.55rem] font-mono py-1 rounded-sm transition-colors cursor-pointer ${
                  mode === "chat" ? "bg-white text-warm-brown font-medium shadow-sm" : "text-muted-ink/50 hover:text-warm-brown"
                }`}
              >
                Chat
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 px-3 py-2 space-y-3 min-h-[200px] max-h-[400px]">
            {messageCount >= LIMIT_WARN_1 && messageCount < LIMIT_WARN_2 && (
              <p className="text-[0.5rem] font-mono text-warm-brown/60 text-center py-1 px-2 bg-warm-brown/5 rounded-sm">
                You're having a good chat! About {MAX_MESSAGES - messageCount} replies left on the free plan.
              </p>
            )}
            {messageCount >= LIMIT_WARN_2 && messageCount < MAX_MESSAGES && (
              <p className="text-[0.5rem] font-mono text-warm-brown text-center py-1 px-2 bg-warm-brown/10 rounded-sm">
                Almost at the chat limit! You'll be able to get more soon.
              </p>
            )}
            {messageCount >= MAX_MESSAGES && (
              <div className="text-center py-4">
                <p className="text-[0.6rem] font-mono text-muted-ink/50">Chat limit reached for now.</p>
                <p className="text-[0.55rem] font-mono text-muted-ink/40 mt-0.5">More will be available soon!</p>
              </div>
            )}

            {!hasMessages && !loading && (
              <div className="flex items-center gap-2 py-3">
                <OnigiriIcon className="w-5 h-5 shrink-0" />
                <span className="text-[0.6rem] font-mono text-muted-ink/60">{prompts[currentPrompt]}</span>
              </div>
            )}

            {mode === "review" && !hasMessages && !loading && (
                <div className="space-y-2">
                  <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Paste your code here..."
                    rows={6}
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
                    onClick={sendMessage}
                    disabled={!code.trim()}
                    className="w-full py-2.5 bg-warm-brown text-white text-[0.6rem] font-mono font-semibold rounded-sm hover:bg-warm-brown/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Send for Review
                  </button>
                </div>
            )}

            {hasMessages && messages.map((msg, i) => (
              <div key={i}>
                {msg.role === "user" && (
                  <div className="flex justify-end">
                    <div className="bg-warm-brown/10 rounded-sm px-3 py-2 max-w-[85%]">
                      {i === 0 && mode === "review" && sentCode ? (
                        <div>
                          <button
                            onClick={() => setShowCode(showCode === msg.content ? false : msg.content)}
                            className="text-[0.55rem] font-mono text-warm-brown underline cursor-pointer"
                          >
                            {showCode === msg.content ? "Hide code" : "View code"}
                          </button>
                          {showCode === msg.content && (
                            <pre className="text-[0.5rem] font-mono text-ink/70 mt-1 whitespace-pre-wrap max-h-24 overflow-y-auto">{sentCode}</pre>
                          )}
                        </div>
                      ) : (
                        <p className="text-[0.6rem] font-mono text-ink/80 whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  </div>
                )}

                {msg.role === "assistant" && msg.type === "review" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <OnigiriIcon className="w-4 h-4" />
                      <span className="text-[0.5rem] font-mono text-muted-ink/50">Keizo</span>
                    </div>
                    <div className="space-y-2 pl-6">
                      {/* @ts-ignore */}
                      {msg.style && (
                        <div className="frame-block p-2.5 bg-white/70">
                          <p className="text-[0.55rem] font-mono text-ink font-bold mb-0.5">🎨 Style</p>
                          <p className="text-[0.6rem] font-mono text-ink/85 leading-relaxed">{msg.style}</p>
                        </div>
                      )}
                      {msg.strengths && msg.strengths.length > 0 && (
                        <div className="frame-block p-2.5 bg-muted-teal/5 border-l-2 border-muted-teal">
                          <p className="text-[0.55rem] font-mono text-ink font-bold mb-0.5">✅ Strengths</p>
                          <ul className="space-y-0.5">
                            {msg.strengths.map((s, si) => (
                              <li key={si} className="text-[0.6rem] font-mono text-ink/85 flex items-start gap-1.5">
                                <span className="text-muted-teal shrink-0">•</span>
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {msg.weaknesses && msg.weaknesses.length > 0 && (
                        <div className="frame-block p-2.5 bg-warm-brown/5 border-l-2 border-warm-brown">
                          <p className="text-[0.55rem] font-mono text-ink font-bold mb-0.5">🔧 Areas to Improve</p>
                          <ul className="space-y-0.5">
                            {msg.weaknesses.map((w, wi) => (
                              <li key={wi} className="text-[0.6rem] font-mono text-ink/85 flex items-start gap-1.5">
                                <span className="text-warm-brown shrink-0">•</span>
                                <span>{w}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {msg.improvements && msg.improvements.length > 0 && (
                        <div className="frame-block p-2.5 bg-[#FFF5E6]/80 border-l-2 border-[#D4A574]">
                          <p className="text-[0.55rem] font-mono text-ink font-bold mb-0.5">💡 Suggestions</p>
                          <ul className="space-y-0.5">
                            {msg.improvements.map((imp, ii) => (
                              <li key={ii} className="text-[0.6rem] font-mono text-ink/85 flex items-start gap-1.5">
                                <span className="text-[#D4A574] shrink-0">•</span>
                                <span>{imp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {msg.summary && (
                        <div className="pt-1">
                          <p className="text-[0.65rem] font-serif text-ink font-medium leading-relaxed italic">{msg.summary}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {msg.role === "assistant" && msg.type === "chat" && msg.content && (
                  <div className="flex items-start gap-2">
                    <OnigiriIcon className="w-4 h-4 shrink-0 mt-1" />
                    <p className="text-[0.6rem] font-mono text-ink/85 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 py-3">
                <OnigiriIcon className="w-5 h-5 animate-bounce" />
                <span className="text-[0.6rem] font-mono text-warm-brown/60">Keizo is thinking...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {messageCount < MAX_MESSAGES && (
            <div className="border-t border-warm-brown/10 p-3 space-y-2">
              {mode === "review" && !hasMessages && null}
              {mode === "chat" && !hasMessages && (
                <p className="text-[0.55rem] font-mono text-muted-ink/50 text-center py-2">
                  Ask me anything — coding, debugging, career, study tips.
                </p>
              )}
              {(hasMessages || mode === "chat") && (
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={mode === "review" ? "Ask a follow-up..." : "Ask me anything..."}
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
                  {(hasMessages || !hasMessages) && (
                    <button
                      onClick={reset}
                      className="btn-base btn-outline btn-interact text-[0.5rem] cursor-pointer"
                      title="New conversation"
                    >
                      ↺
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <div
          className={`transition-opacity duration-500 ease-in-out ${showLabel && !open ? "opacity-100" : "opacity-0"}`}
        >
          <div className="bg-warm-brown text-white text-[0.55rem] font-mono px-3 py-1.5 rounded-sm shadow-md relative whitespace-nowrap">
            Chat with Keizo
            <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-warm-brown rotate-45" />
          </div>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="w-12 h-12 rounded-full bg-warm-brown text-white flex items-center justify-center shadow-lg hover:bg-warm-brown/90 transition-colors cursor-pointer"
          title={open ? "Close" : prompts[currentPrompt]}
        >
          <OnigiriIcon className="w-7 h-7" />
        </button>
      </div>
    </div>
  )
}

function OnigiriIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M 50 8 C 56 8 62 18 68 30 L 84 72 C 88 80 82 88 74 88 L 26 88 C 18 88 12 80 16 72 L 32 30 C 38 18 44 8 50 8 Z" fill="#FFF5E6" stroke="#E8D5C4" strokeWidth="1.5" />
      <path d="M 16 62 L 84 62 C 86 70 86 78 74 88 L 26 88 C 14 78 14 70 16 62 Z" fill="#2D4A3E" />
      <path d="M 33 45 Q 36 40 39 45" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 61 45 Q 64 40 67 45" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="26" cy="51" rx="5" ry="3" fill="#F2C4C4" opacity="0.7" />
      <ellipse cx="74" cy="51" rx="5" ry="3" fill="#F2C4C4" opacity="0.7" />
      <path d="M 42 56 Q 50 64 58 56" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
