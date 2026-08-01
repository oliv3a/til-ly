import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limiter"

export async function proxy(req: Request) {
  const { pathname } = new URL(req.url)

  if (pathname.startsWith("/api/auth/callback/credentials")) {
    const { allowed } = rateLimit(req, 5, 60_000)
    if (!allowed) {
      return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 })
    }
  }

  let session = null
  try {
    session = await auth()
  } catch {}

  const publicPaths = ["/auth/login", "/auth/signup", "/", "/api/auth", "/api/downloads", "/menu-bar", "/downloads"]
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))

  if (!session?.user && !isPublic) {
    return NextResponse.redirect(new URL("/auth/login", req.url))
  }

  if (session?.user && (pathname.startsWith("/auth/login") || pathname.startsWith("/auth/signup"))) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
}
