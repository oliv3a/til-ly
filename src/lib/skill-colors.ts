const skillColors = [
  { bg: "#fce4d6", text: "#c55a11", border: "#c55a11" },
  { bg: "#dae8fc", text: "#2b6cb0", border: "#2b6cb0" },
  { bg: "#e2f0d9", text: "#38761d", border: "#38761d" },
  { bg: "#fce4ec", text: "#c62828", border: "#c62828" },
  { bg: "#f3e5f5", text: "#7b1fa2", border: "#7b1fa2" },
  { bg: "#e0f7fa", text: "#00838f", border: "#00838f" },
  { bg: "#fff3e0", text: "#e65100", border: "#e65100" },
  { bg: "#e8eaf6", text: "#283593", border: "#283593" },
]

export function colorForSkill(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return skillColors[Math.abs(hash) % skillColors.length]
}
