const ipMap = new Map<string, { count: number; resetAt: number }>()

function getIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
}

export function rateLimit(req: Request, maxRequests: number, windowMs: number): { allowed: boolean; remaining: number } {
  const ip = getIp(req)
  const now = Date.now()
  const entry = ipMap.get(ip)

  if (!entry || now > entry.resetAt) {
    ipMap.set(ip, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1 }
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: maxRequests - entry.count }
}

// Clean up stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [ip, entry] of ipMap) {
      if (now > entry.resetAt) ipMap.delete(ip)
    }
  }, 300_000)
}
