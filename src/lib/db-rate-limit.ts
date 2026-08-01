import { prisma } from "./prisma"

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for")
  const ip = xff?.split(",")[0]?.trim()
  return ip || "unknown"
}

export async function dbRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now()
  const entry = await prisma.rateLimit.findUnique({ where: { key } })

  if (!entry || now > entry.resetAt.getTime()) {
    await prisma.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, resetAt: new Date(now + windowMs) },
      update: { count: 1, resetAt: new Date(now + windowMs) },
    })
    return { allowed: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 }
  }

  await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  })
  return { allowed: true, remaining: limit - (entry.count + 1) }
}

export async function resetRateLimit(key: string): Promise<void> {
  await prisma.rateLimit.delete({ where: { key } }).catch(() => {})
}

export function aiDailyKey(userId: string, scope: string): string {
  return `ai:${scope}:${userId}`
}

export const DAILY_MS = 24 * 60 * 60 * 1000
export const HOUR_MS = 60 * 60 * 1000
export const MINUTE_MS = 60 * 1000
