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
          <div className="mb-3">
            <BrandLogo size={200} className="animate-breathe group-hover:animate-tilly-wiggle mx-auto" />
          </div>

          {/* badge */}
          <div className="inline-block px-3 py-1 bg-warm-paper border-2 border-warm-brown text-xs font-mono text-muted-ink tracking-widest uppercase mb-6">
            Today I Learned &middot; your coding journal
          </div>

          {/* poster heading */}
          <h1 className="poster-heading mb-2 text-lg sm:text-xl">
            Your grind deserves
            <br />
            a portfolio,
            <br />
            not just a GitHub.
          </h1>

          <span className="deco-dash deco-dash-wide mx-auto" />

          <p className="font-mono text-sm text-muted-ink leading-relaxed max-w-md mx-auto mb-10">
            til.ly turns your daily coding into a living portfolio — skills, projects, and progress that actually get you hired.
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
            { title: "📚 Stop Forgetting Everything", desc: "Stop forgetting everything. Keep your notes, understand what you learned, and always know what's next." },
            { title: "🚀 Stop Abandoning Projects", desc: "No more abandoned side projects. Turn ideas into finished projects with clear next steps." },
            { title: "💼 Stop Starting Your Resume Too Late", desc: "Internship season? You're already preparing. Your skills, projects, and resume grow while you learn." },
            { title: "💬 Stop Learning Alone", desc: "When you're stuck, don't spiral. Get guidance from a mentor that actually knows what you've been working on." },
          ].map((card) => (
            <AnimatedCard key={card.title} className="frame-block">
              <h3 className="font-serif text-base text-warm-brown mb-1">{card.title}</h3>
              <p className="text-sm font-mono text-muted-ink leading-relaxed">{card.desc}</p>
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
                  <span className="tag text-xs py-0.5">Mac only</span>
                </div>
                <p className="text-xs font-mono font-medium text-muted-ink/80">
                  One-click logging from your menu bar. No browser needed. Tilly&apos;s always there.
                </p>
                <div className="mt-3">
                  <a
                    href="/api/downloads/macos"
                    className="btn-base btn-coral btn-interact text-xs"
                    download
                  >
                    ⬇ Download
                  </a>
                </div>
                <div className="text-xs font-mono font-bold text-muted-ink/50 mt-2 space-y-0.5">
                  <p>1. Download &amp; unzip</p>
                  <p>2. Drag Tilly.app to Applications</p>
                  <p>3. Open from Spotlight or Finder</p>
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
          <p className="text-xs font-mono text-muted-ink/40 mt-2">Today I Learned</p>
        </div>
      </div>
    </PageShell>
  )
}
