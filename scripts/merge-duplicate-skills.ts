import { prisma } from "../src/lib/prisma"

async function main() {
  console.log("Fetching all skills...")
  const allSkills = await prisma.skill.findMany({
    include: { _count: { select: { studyLogSkills: true } } },
    orderBy: { name: "asc" },
  })

  const groups = new Map<string, typeof allSkills>()
  for (const skill of allSkills) {
    const key = skill.name.toLowerCase()
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(skill)
  }

  let merged = 0
  for (const [key, skills] of groups) {
    if (skills.length <= 1) continue

    console.log(`\nGroup: "${key}" → ${skills.map((s) => `"${s.name}"`).join(", ")}`)

    const canonical = skills.sort((a, b) => b._count.studyLogSkills - a._count.studyLogSkills)[0]
    console.log(`  Canonical: "${canonical.name}" (${canonical._count.studyLogSkills} logs)`)

    for (const skill of skills) {
      if (skill.id === canonical.id) continue

      const studyLogSkills = await prisma.studyLogSkill.findMany({
        where: { skillId: skill.id },
        select: { id: true, studyLogId: true },
      })

      for (const sls of studyLogSkills) {
        const exists = await prisma.studyLogSkill.findUnique({
          where: {
            studyLogId_skillId: { studyLogId: sls.studyLogId, skillId: canonical.id },
          },
        })
        if (!exists) {
          await prisma.studyLogSkill.update({
            where: { id: sls.id },
            data: { skillId: canonical.id },
          })
        } else {
          await prisma.studyLogSkill.delete({ where: { id: sls.id } })
        }
      }

      await prisma.skill.delete({ where: { id: skill.id } })
      console.log(`  Merged "${skill.name}" → "${canonical.name}"`)
      merged++
    }
  }

  console.log(`\nDone. Merged ${merged} duplicate skill(s).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
