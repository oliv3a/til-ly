import Link from "next/link"
import PageShell from "@/components/PageShell"
import Onigiri from "@/components/Onigiri"
import AnimatedCard from "@/lib/motion/components/AnimatedCard"

export default function LandingPage() {
  return (
    <PageShell showNav={false} showFooter={false}>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        {/* hero */}
        <div className="max-w-2xl mx-auto text-center animate-fade-in-up">
          {/* onigiri hero */}
          <div className="mb-6 inline-block group">
            <Onigiri size={140} emotion="happy" accessory="laptop" className="animate-breathe group-hover:animate-keizo-wiggle" />
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
            Every day you code is a step forward. KeizoKode keeps track, AI summarizes
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-20 w-full animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          {[
            { title: "📝 Daily Logs", desc: "Write what you learned. AI summarizes and extracts your skills automatically." },
            { title: "🎯 Smart Goals", desc: "Set learning goals. AI builds a roadmap and tracks your progress." },
            { title: "📂 Portfolio Wall", desc: "Your skills and projects visible to recruiters. Watch yourself grow." },
          ].map((card) => (
            <AnimatedCard key={card.title} className="frame-block">
              <h3 className="font-serif text-base text-warm-brown mb-1">{card.title}</h3>
              <p className="text-[0.7rem] font-mono text-muted-ink leading-relaxed">{card.desc}</p>
            </AnimatedCard>
          ))}
        </div>

        {/* bottom mascot */}
        <div className="mt-16 text-center animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <Onigiri size={48} emotion="sleepy" className="animate-breathe" />
          <p className="text-[0.55rem] font-mono text-muted-ink/40 mt-2">keizo the onigiri · keizokode</p>
        </div>
      </div>
    </PageShell>
  )
}
