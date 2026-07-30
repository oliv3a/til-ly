import type { Metadata } from "next"
import localFont from "next/font/local"
import { Inter, IBM_Plex_Mono } from "next/font/google"
import SessionProvider from "@/components/SessionProvider"
import AppShell from "@/components/AppShell"
import { Toaster } from "sonner"
import "./globals.css"

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

export const metadata: Metadata = {
  title: "til.ly",
  description: "Stop feeling behind. Start seeing your progress. Your grind deserves a portfolio, not just a GitHub.",
  icons: { icon: "/logo-brand.png" },
  metadataBase: new URL("https://til-ly.vercel.app"),
  openGraph: {
    title: "til.ly — Your grind deserves a portfolio, not just a GitHub.",
    description: "Stop feeling behind. Start seeing your progress. til.ly turns your daily coding into a living portfolio.",
    url: "https://til-ly.vercel.app",
    siteName: "til.ly",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "til.ly — Your grind deserves a portfolio, not just a GitHub.",
    description: "Stop feeling behind. Start seeing your progress. til.ly turns your daily coding into a living portfolio.",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${satoshi.variable} ${inter.variable} ${ibmPlexMono.variable}`}>
      <body>
        <SessionProvider>
          <AppShell>{children}</AppShell>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#F0F0F0",
                border: "2px solid #1C1C1C",
                borderRadius: 0,
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: "0.75rem",
                color: "#1C1C1C",
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  )
}
