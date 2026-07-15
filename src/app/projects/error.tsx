"use client"

import AnimatedButton from "@/lib/motion/components/AnimatedButton"

export default function ProjectsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="max-w-md w-full frame-block text-center p-8">
        <div className="text-4xl mb-4">📂</div>
        <h1 className="poster-heading text-xl mb-2">Projects error</h1>
        <p className="text-sm font-mono text-muted-ink/60 mb-6 line-clamp-2">
          {error.message || "Could not load your projects"}
        </p>
        <AnimatedButton onClick={reset} variant="coral">
          Try again
        </AnimatedButton>
      </div>
    </div>
  )
}
