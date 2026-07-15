import type { ResumeData, ATSSuggestion, TargetRole } from "./types"
import { getKeywordsForRole } from "./keyword-engine"

function hasMetrics(bullet: string): boolean {
  return /\d+%|\d+x|\d+\s*users|\d+\s*requests|\d+\s*queries|\d+\s*milliseconds|\d+\s*seconds|\d+\s*concurrent/i.test(bullet)
}

function countWeakVerbs(bullet: string): number {
  const weak = ["helped", "worked on", "responsible for", "participated in", "was involved in"]
  return weak.filter((w) => bullet.toLowerCase().includes(w)).length
}

export function analyzeATS(data: ResumeData, targetRole: TargetRole): ATSSuggestion[] {
  const suggestions: ATSSuggestion[] = []

  if (!data.summary || data.summary.length < 30) {
    suggestions.push({
      type: "warning",
      category: "Summary",
      message: "Professional summary is missing or too short. A strong summary helps recruiters quickly understand your profile.",
    })
  } else {
    suggestions.push({
      type: "success",
      category: "Summary",
      message: "Professional summary is present and well-formed.",
    })
  }

  const weakVerbs: string[] = []
  let bulletsWithMetrics = 0
  let totalBullets = 0
  for (const exp of data.experience) {
    for (const bullet of exp.bullets) {
      totalBullets++
      if (hasMetrics(bullet)) bulletsWithMetrics++
      if (countWeakVerbs(bullet) > 0) weakVerbs.push(bullet)
    }
  }

  if (totalBullets === 0) {
    suggestions.push({
      type: "error",
      category: "Experience",
      message: "No experience bullets found. Add study logs to generate experience entries.",
    })
  } else {
    if (bulletsWithMetrics === 0) {
      suggestions.push({
        type: "warning",
        category: "Experience",
        message: "No measurable achievements found. Consider adding metrics (percentages, users, response times) to demonstrate impact.",
      })
    } else {
      const pct = Math.round((bulletsWithMetrics / totalBullets) * 100)
      suggestions.push({
        type: "success",
        category: "Experience",
        message: `${bulletsWithMetrics}/${totalBullets} bullets include measurable metrics (${pct}%).`,
      })
    }

    if (weakVerbs.length > 0) {
      suggestions.push({
        type: "warning",
        category: "Experience",
        message: `${weakVerbs.length} bullet(s) use weak verbs like "helped" or "worked on". Replace with strong action verbs.`,
      })
    } else {
      suggestions.push({
        type: "success",
        category: "Experience",
        message: "All bullets use strong action verbs.",
      })
    }
  }

  const keywordHits: string[] = []
  const keywordMisses: string[] = []
  const targetKeywords = getKeywordsForRole(targetRole)

  const allText = [
    data.summary,
    ...data.skills.flatMap((s) => s.items),
    ...data.experience.flatMap((e) => e.bullets),
    ...data.projects.flatMap((p) => [p.description, ...p.highlights, p.tech]),
  ].join(" ").toLowerCase()

  for (const kw of targetKeywords) {
    if (allText.includes(kw.toLowerCase())) {
      keywordHits.push(kw)
    } else {
      keywordMisses.push(kw)
    }
  }

  if (keywordMisses.length > 0) {
    suggestions.push({
      type: keywordMisses.length > 5 ? "error" : "warning",
      category: "ATS Keywords",
      message: `Missing ${keywordMisses.length} ATS keywords for this role: ${keywordMisses.slice(0, 5).join(", ")}${keywordMisses.length > 5 ? ` and ${keywordMisses.length - 5} more` : ""}. Integrate them naturally into your experience bullets.`,
    })
  } else {
    suggestions.push({
      type: "success",
      category: "ATS Keywords",
      message: `All ${targetKeywords.length} target role keywords are well-integrated.`,
    })
  }

  if (data.skills.length === 0) {
    suggestions.push({
      type: "error",
      category: "Skills",
      message: "No skills found. Add skill tags to your study logs to populate this section.",
    })
  } else {
    suggestions.push({
      type: "success",
      category: "Skills",
      message: `${data.skills.length} skill categories with ${data.skills.reduce((s, c) => s + c.items.length, 0)} total skills.`,
    })
  }

  if (data.projects.length === 0) {
    suggestions.push({
      type: "warning",
      category: "Projects",
      message: "No projects listed. Adding projects significantly strengthens a tech resume.",
    })
  } else {
    suggestions.push({
      type: "success",
      category: "Projects",
      message: `${data.projects.length} projects showcased with enhanced descriptions.`,
    })
  }

  const totalBulletCount = data.experience.reduce((s, e) => s + e.bullets.length, 0)
  if (totalBulletCount > 25) {
    suggestions.push({
      type: "warning",
      category: "Length",
      message: `Resume has ${totalBulletCount} bullet points. Consider trimming to 15-20 for a 1-page resume.`,
    })
  } else if (totalBulletCount < 5) {
    suggestions.push({
      type: "warning",
      category: "Length",
      message: `Only ${totalBulletCount} bullet points. Add more experience from study logs to build a stronger resume.`,
    })
  } else {
    suggestions.push({
      type: "success",
      category: "Length",
      message: `${totalBulletCount} bullet points across experience — good length.`,
    })
  }

  const hasEducation = data.education?.school || data.personalInfo?.school
  if (!hasEducation) {
    suggestions.push({
      type: "warning",
      category: "Education",
      message: "Education section is missing. Add your school and graduation year in profile settings.",
    })
  } else {
    suggestions.push({
      type: "success",
      category: "Education",
      message: "Education section present.",
    })
  }

  return suggestions
}
