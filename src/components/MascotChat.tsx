"use client"

import { useState, useEffect, useRef } from "react"

const prompts = [
  "Want me to review your code?",
  "Need feedback on your code?",
  "Want me to identify your strengths and weaknesses?",
  "Want me to suggest what you can improve?",
  "Got some code you want a senior dev to look at?",
]

export default function MascotChat() {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const [fileName, setFileName] = useState("")
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<{
    style: string
    strengths: string[]
    weaknesses: string[]
    improvements: string[]
    summary: string
  } | null>(null)
  const [currentPrompt, setCurrentPrompt] = useState(0)
  const [sentCode, setSentCode] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPrompt((prev) => (prev + 1) % prompts.length)
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (open && textareaRef.current) textareaRef.current.focus()
  }, [open])

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

  async function sendForReview() {
    if (!code.trim()) return
    setLoading(true)
    setAnalysis(null)
    setSentCode(code)
    try {
      const res = await fetch("/api/code-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, fileName: fileName || undefined }),
      })
      if (res.ok) {
        const data = await res.json()
        setAnalysis(data)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setCode("")
    setFileName("")
    setAnalysis(null)
    setSentCode("")
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="frame-block w-[400px] max-w-[calc(100vw-2rem)] max-h-[75vh] flex flex-col bg-warm-paper shadow-lg">
          <div className="flex items-center justify-between p-3 border-b border-warm-brown/10">
            <div className="flex items-center gap-2">
              <OnigiriIcon className="w-6 h-6" />
              <span className="text-[0.65rem] font-mono text-warm-brown font-medium">Keizo</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-ink/40 hover:text-warm-brown text-[0.65rem]">✕</button>
          </div>

          <div className="p-3 overflow-y-auto flex-1 space-y-3">
            {!analysis && !loading && (
              <>
                <div className="flex items-center gap-2 pb-1">
                  <OnigiriIcon className="w-5 h-5" />
                  <span className="text-[0.65rem] font-mono text-warm-brown font-medium">{prompts[currentPrompt]}</span>
                </div>
                <textarea
                  ref={textareaRef}
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
                    className="btn-base btn-outline btn-interact text-[0.5rem]"
                  >
                    {fileName ? `📎 ${fileName}` : "+ Upload file"}
                  </button>
                  <button
                    onClick={sendForReview}
                    disabled={!code.trim()}
                    className="btn-base btn-interact-bg text-[0.55rem] ml-auto disabled:opacity-40"
                  >
                    Send for Review
                  </button>
                </div>
              </>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <OnigiriIcon className="w-10 h-10 animate-bounce" />
                <span className="text-[0.65rem] font-mono text-warm-brown/70">Keizo is reviewing your code...</span>
              </div>
            )}

            {analysis && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-warm-brown/20">
                  <OnigiriIcon className="w-5 h-5" />
                  <span className="text-[0.65rem] font-mono text-warm-brown font-semibold">Keizo's Review</span>
                </div>

                {analysis.style && (
                  <div className="frame-block p-3 bg-white/60">
                    <p className="text-[0.65rem] font-mono text-ink font-bold mb-1">🎨 Style</p>
                    <p className="text-[0.65rem] font-mono text-ink/90 leading-relaxed">{analysis.style}</p>
                  </div>
                )}

                {analysis.strengths.length > 0 && (
                  <div className="frame-block p-3 bg-muted-teal/5 border-l-2 border-muted-teal">
                    <p className="text-[0.65rem] font-mono text-ink font-bold mb-1">✅ Strengths</p>
                    <ul className="space-y-1">
                      {analysis.strengths.map((s, i) => (
                        <li key={i} className="text-[0.65rem] font-mono text-ink/90 flex items-start gap-2">
                          <span className="text-muted-teal shrink-0 mt-0.5">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.weaknesses.length > 0 && (
                  <div className="frame-block p-3 bg-warm-brown/5 border-l-2 border-warm-brown">
                    <p className="text-[0.65rem] font-mono text-ink font-bold mb-1">🔧 Areas to Improve</p>
                    <ul className="space-y-1">
                      {analysis.weaknesses.map((w, i) => (
                        <li key={i} className="text-[0.65rem] font-mono text-ink/90 flex items-start gap-2">
                          <span className="text-warm-brown shrink-0 mt-0.5">•</span>
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.improvements.length > 0 && (
                  <div className="frame-block p-3 bg-[#FFF5E6]/80 border-l-2 border-[#D4A574]">
                    <p className="text-[0.65rem] font-mono text-ink font-bold mb-1">💡 Suggestions</p>
                    <ul className="space-y-1">
                      {analysis.improvements.map((imp, i) => (
                        <li key={i} className="text-[0.65rem] font-mono text-ink/90 flex items-start gap-2">
                          <span className="text-[#D4A574] shrink-0 mt-0.5">•</span>
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.summary && (
                  <div className="pt-3 border-t-2 border-warm-brown/10 mt-4">
                    <p className="text-[0.7rem] font-serif text-ink font-medium leading-relaxed italic">
                      {analysis.summary}
                    </p>
                  </div>
                )}

                <button onClick={reset} className="btn-base btn-interact-bg text-[0.6rem] w-full mt-2 font-medium">
                  Review more code
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="w-12 h-12 rounded-full bg-warm-brown text-white flex items-center justify-center shadow-lg hover:bg-warm-brown/90 transition-colors cursor-pointer"
        title={open ? "Close" : prompts[currentPrompt]}
      >
        <OnigiriIcon className="w-7 h-7" />
      </button>
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
