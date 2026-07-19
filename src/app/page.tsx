import Link from "next/link"
import dynamic from "next/dynamic"
import PageShell from "@/components/PageShell"
import BrandLogo from "@/components/BrandLogo"
import AnimatedCard from "@/lib/motion/components/AnimatedCard"

const MacMenuBarDemo = dynamic(() => import("@/components/MacMenuBarDemo"))

export default function LandingPage() {
  return (
    <PageShell showNav={false} showFooter={false}>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        {/* hero */}
        <div className="max-w-2xl mx-auto text-center animate-fade-in-up">
          {/* mascot hero */}
          <div className="mb-6 inline-block group">
            <BrandLogo size={140} className="animate-breathe group-hover:animate-tilly-wiggle" />
          </div>

          {/* badge */}
          <div className="inline-block px-3 py-1 bg-warm-paper border-2 border-warm-brown text-[0.55rem] font-mono text-muted-ink tracking-widest uppercase mb-5">
            your coding journal · reimagined
          </div>

          {/* poster heading */}
          <h1 className="poster-heading mb-2">
            Track your coding
            <br />
            journey, one log
            <br />
            at a time.
          </h1>

          <span className="deco-dash deco-dash-wide mx-auto" />

          <p className="font-mono text-sm text-muted-ink leading-relaxed max-w-md mx-auto mb-8">
            Every day you code is a step forward. til.ly keeps track, AI summarizes
            your work, and your portfolio shows recruiters exactly what you&apos;ve been building.
          </p>

          {/* cta */}
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/auth/signup" className="btn-base btn-coral btn-interact">
              Start your journey →
            </Link>
            <Link href="/auth/login" className="btn-base btn-outline btn-interact-bg">
              I already have an account
            </Link>
          </div>
        </div>

        {/* features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto mt-20 w-full animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          {[
            { title: "📝 Daily Logs", desc: "Write what you learned. AI summarizes and extracts your skills automatically." },
            { title: "🎯 Smart Goals", desc: "Set learning goals. AI builds a roadmap and tracks your progress." },
            { title: "🤖 Tilly Chat", desc: "Paste code for AI review or chat with a senior dev who gets the student grind." },
            { title: "📄 AI Resume", desc: "Generate a polished, ATS-optimized resume from your logs and projects. Edit anytime, export as PDF." },
          ].map((card) => (
            <AnimatedCard key={card.title} className="frame-block">
              <h3 className="font-serif text-base text-warm-brown mb-1">{card.title}</h3>
              <p className="text-[0.7rem] font-mono text-muted-ink leading-relaxed">{card.desc}</p>
            </AnimatedCard>
          ))}
        </div>

        {/* macOS download + demo */}
        <div className="max-w-3xl mx-auto mt-6 w-full animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <div className="frame-block p-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="shrink-0 mt-0.5">
                <BrandLogo size={40} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-serif text-sm text-warm-brown">til.ly: Always There.</h3>
                  <span className="tag text-[0.45rem] py-0.5">Mac only</span>
                </div>
                <p className="text-[0.65rem] font-mono font-medium text-muted-ink/80">
                  One-click logging from your menu bar. Tilly stays in your status bar — no browser needed.
                </p>
                <div className="mt-3">
                  <a
                    href="/api/downloads/macos"
                    className="btn-base btn-coral btn-interact text-[0.6rem]"
                    download
                  >
                    ⬇ Download
                  </a>
                </div>
                <div className="text-[0.5rem] font-mono font-bold text-muted-ink/50 mt-2 space-y-0.5">
                  <p>1. Download &amp; unzip</p>
                  <p>2. Run <code className="text-muted-ink/60">xattr -c ~/Downloads/til.ly.app</code> in Terminal</p>
                  <p>3. Right‑click → Open (first launch)</p>
                </div>
              </div>
            </div>

            <div className="section-divider" />

            <MacMenuBarDemo />
          </div>
        </div>

        {/* bottom mascot */}
        <div className="mt-16 text-center animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <BrandLogo size={48} className="animate-breathe" />
          <p className="text-[0.55rem] font-mono text-muted-ink/40 mt-2">tilly · til.ly</p>
        </div>
      </div>
    </PageShell>
  )
}
