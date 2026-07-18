import Link from "next/link"
import Mascot from "@/components/Mascot"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="max-w-md w-full frame-block text-center p-8">
        <Mascot size={64} emotion="thinking" className="mx-auto mb-4" />
        <h1 className="poster-heading text-xl mb-2">Page not found</h1>
        <p className="text-sm font-mono text-muted-ink/60 mb-6">
          This page doesn&apos;t exist or has been moved.
        </p>
        <Link href="/dashboard" className="btn-base btn-coral btn-interact inline-flex">
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
