import Link from "next/link"

export default function Footer() {
  return (
    <footer className="text-center py-6 px-4 flex items-center justify-center gap-4">
      <p className="text-[0.55rem] font-mono text-muted-ink/30">
        © 2026 til.ly
      </p>
      <span className="text-muted-ink/20">·</span>
      <Link href="/privacy" className="text-[0.55rem] font-mono text-muted-ink/30 hover:text-muted-ink/60 transition-colors">
        Privacy
      </Link>
    </footer>
  )
}
