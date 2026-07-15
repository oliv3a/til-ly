"use client"

import localFont from "next/font/local"
import { Inter, IBM_Plex_Mono } from "next/font/google"
import Onigiri from "@/components/Onigiri"

const satoshi = localFont({
  src: "../fonts/Satoshi-Variable.woff2",
  variable: "--font-serif",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en" className={`${satoshi.variable} ${inter.variable} ${ibmPlexMono.variable}`}>
      <body>
        <div className="min-h-screen bg-cream flex items-center justify-center px-6">
          <div className="max-w-md w-full frame-block text-center p-8">
            <Onigiri size={64} emotion="sleepy" className="mx-auto mb-4" />
            <h1 className="poster-heading text-xl mb-2">Something went wrong</h1>
            <p className="text-sm font-mono text-muted-ink/60 mb-6 line-clamp-2">
              {error.message || "A critical error occurred"}
            </p>
            <button onClick={reset} className="btn-base btn-coral btn-interact mx-auto">
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
