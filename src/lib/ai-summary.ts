const SEPARATOR = "\n\n—\n💡 "

export function parseAiSummary(raw: string | null): { summary: string; motivation: string | null } {
  if (!raw) return { summary: "", motivation: null }
  const idx = raw.indexOf(SEPARATOR)
  if (idx === -1) return { summary: raw, motivation: null }
  return {
    summary: raw.slice(0, idx),
    motivation: raw.slice(idx + SEPARATOR.length),
  }
}

export function combineAiSummary(summary: string, motivation: string | null | undefined): string {
  if (motivation) return `${summary}${SEPARATOR}${motivation}`
  return summary
}

export function summaryToBullets(text: string): string[] {
  if (text.includes("•")) {
    return text.split("•").map((s) => s.trim()).filter(Boolean)
  }
  const parts = text.split(/\.\s+(?=[A-Z])/).map((s) => s.trim()).filter(Boolean)
  return parts.length > 0 ? parts : [text]
}
