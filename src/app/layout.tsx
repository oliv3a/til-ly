import type { Metadata } from "next"
import localFont from "next/font/local"
import { Inter, IBM_Plex_Mono } from "next/font/google"
import { auth } from "@/lib/auth"
import SessionProvider from "@/components/SessionProvider"
import DashboardShell from "@/components/DashboardShell"
import MascotChat from "@/components/MascotChat"
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
  title: "KeizoKode",
  description: "Track your coding journey, one log at a time.",
  icons: { icon: "/onigiri-icon.svg" },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <html lang="en" className={`${satoshi.variable} ${inter.variable} ${ibmPlexMono.variable}`}>
      <body>
        <SessionProvider>
          {session?.user ? (
            <>
              <DashboardShell>{children}</DashboardShell>
              <MascotChat />
            </>
          ) : (
            children
          )}
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
