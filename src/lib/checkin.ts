import { prisma } from "@/lib/prisma"

export async function processCheckin(
  userId: string,
  timezoneOffset?: number,
): Promise<{ streak: number; alreadyCheckedIn: boolean }> {
  const offsetMs = (timezoneOffset || 0) * 60 * 1000
  const now = new Date()

  // Compute UTC midnight of the user's local day
  const localMs = now.getTime() - offsetMs
  const localDayStart = localMs - (localMs % 86400000)
  const todayUTC = new Date(localDayStart + offsetMs)

  const existing = await prisma.dailyCheckin.findUnique({
    where: { userId_date: { userId, date: todayUTC } },
  })

  if (existing) {
    return { streak: 0, alreadyCheckedIn: true }
  }

  await prisma.dailyCheckin.create({
    data: { userId, date: todayUTC, studied: true },
  })

  const previousCheckin = await prisma.dailyCheckin.findFirst({
    where: { userId, studied: true, date: { lt: todayUTC } },
    orderBy: { date: "desc" },
  })

  let newStreak = 1
  if (previousCheckin) {
    const diffMs = todayUTC.getTime() - previousCheckin.date.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays === 1) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { streakCount: true },
      })
      newStreak = (user?.streakCount || 0) + 1
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { streakCount: newStreak },
  })

  return { streak: newStreak, alreadyCheckedIn: false }
}
