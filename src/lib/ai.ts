import OpenAI from "openai"

function getClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export interface AiExtractResult {
  summary: string
  motivation?: string
  realWorldConnection?: string
  skills: { name: string; category: string; depth: "surface" | "moderate" | "deep" }[]
  mappedGoalIds?: string[]
  nextRecommendation?: string
}

const DEFAULT_ROADMAPS: Record<string, { topic: string; description: string; estimatedLogs: number }[]> = {
  python: [
    { topic: "Python syntax & variables", description: "print(), variables, basic data types", estimatedLogs: 2 },
    { topic: "Data types & operators", description: "int, float, string, bool, arithmetic", estimatedLogs: 2 },
    { topic: "Lists & tuples", description: "creating, indexing, slicing, methods", estimatedLogs: 2 },
    { topic: "Dictionaries & sets", description: "key-value pairs, set operations", estimatedLogs: 2 },
    { topic: "Control flow", description: "if/else, for loops, while loops", estimatedLogs: 2 },
    { topic: "Functions", description: "defining, parameters, return values, scope", estimatedLogs: 2 },
    { topic: "List comprehensions & lambda", description: "concise loops, anonymous functions", estimatedLogs: 1 },
    { topic: "File I/O", description: "reading/writing files, with statement", estimatedLogs: 2 },
    { topic: "Error handling", description: "try/except, finally, custom exceptions", estimatedLogs: 1 },
    { topic: "Modules & packages", description: "importing, pip, virtual environments", estimatedLogs: 2 },
    { topic: "OOP basics", description: "classes, objects, inheritance", estimatedLogs: 2 },
  ],
  react: [
    { topic: "JSX & components", description: "JSX syntax, functional components", estimatedLogs: 2 },
    { topic: "Props & state", description: "passing data, useState hook", estimatedLogs: 2 },
    { topic: "Event handling", description: "onClick, onChange, forms", estimatedLogs: 2 },
    { topic: "useEffect", description: "side effects, dependency array, cleanup", estimatedLogs: 2 },
    { topic: "Conditional rendering", description: "ternary, &&, switch patterns", estimatedLogs: 1 },
    { topic: "Lists & keys", description: "mapping data, key prop", estimatedLogs: 1 },
    { topic: "Forms & controlled inputs", description: "form state, validation, submission", estimatedLogs: 2 },
    { topic: "Custom hooks", description: "building reusable logic", estimatedLogs: 2 },
    { topic: "Context API", description: "global state without prop drilling", estimatedLogs: 2 },
    { topic: "React Router", description: "routing, nested routes, params", estimatedLogs: 2 },
  ],
  javascript: [
    { topic: "Variables & data types", description: "let, const, var, typeof", estimatedLogs: 2 },
    { topic: "Functions & scope", description: "declarations, expressions, hoisting", estimatedLogs: 2 },
    { topic: "Arrays & objects", description: "methods, destructuring, spread", estimatedLogs: 2 },
    { topic: "DOM manipulation", description: "querySelector, events, styling", estimatedLogs: 2 },
    { topic: "Async JavaScript", description: "callbacks, promises, async/await", estimatedLogs: 3 },
    { topic: "ES6+ features", description: "arrow functions, template literals, modules", estimatedLogs: 2 },
    { topic: "Error handling & debugging", description: "try/catch, console, devtools", estimatedLogs: 1 },
  ],
}

function getFallbackRoadmap(title: string, description: string) {
  const lower = (title + " " + description).toLowerCase()
  for (const [key, items] of Object.entries(DEFAULT_ROADMAPS)) {
    if (lower.includes(key)) return items
  }
  return [
    { topic: "Fundamentals", description: "Core concepts and setup", estimatedLogs: 2 },
    { topic: "Intermediate topics", description: "Build on fundamentals", estimatedLogs: 3 },
    { topic: "Advanced concepts", description: "Deep dive into complex topics", estimatedLogs: 3 },
    { topic: "Practice project", description: "Apply what you've learned", estimatedLogs: 3 },
    { topic: "Review & polish", description: "Solidify knowledge", estimatedLogs: 2 },
  ]
}

export async function summarizeStudyLog(
  content: string,
  userGoals?: { id: string; title: string }[],
  existingSkills?: string[]
): Promise<AiExtractResult> {
  const goalsContext = userGoals?.length
    ? `\nThe user has these active goals: ${userGoals.map((g) => `${g.id} ("${g.title}")`).join(", ")}. If this log relates to any, include their IDs in mappedGoalIds.`
    : ""

  const skillsContext = existingSkills?.length
    ? `\nExisting skills from this user's past logs: ${existingSkills.join(", ")}. Reuse these exact names when applicable — do not invent new variants.`
    : ""

  const prompt = `You are a tutor reviewing a student's study log.

Content: "${content}"${goalsContext}${skillsContext}

Respond with JSON with these fields:
1. "summary" — A clear 2-3 sentence recap of what they learned and did. Factual, specific, concise. This is for the student to review their own learning.
2. "motivation" — A brief, encouraging insight (1-2 sentences) connecting this log to their broader learning journey. Why this matters, what it unlocks, or how it builds on previous work. This is a side note for extra clarity and motivation.
3. "realWorldConnection" — A Gen Z casual explanation (2-3 sentences max) of how this concept is used in real apps they use daily. Reference a specific popular app (Instagram, Spotify, Uber, Amazon, TikTok, Netflix, Discord, Venmo, Google Maps, etc.). Connect the concept to something tangible they've experienced. End with why this matters for their career. Tone: like a hype friend, not a textbook. Never repeat the same app reference across different logs. Be specific to what they actually studied — generic connections feel hollow.

Example:
{
  "summary": "You built a REST API with Express and PostgreSQL — defined routes, connected to a database, and tested endpoints with curl.",
  "motivation": "You've now built a full CRUD backend from scratch. This skill transfers directly to any web framework and is the foundation for your goal of building a full-stack app.",
  "realWorldConnection": "not you building the same thing that powers every app on your phone — when you Venmo someone and it shows up on their phone instantly, that's a REST API. you're literally learning how the internet works under the hood. this is the skill that gets you hired fr 🚀",
  "skills": [
    { "name": "Express", "category": "Backend", "depth": "moderate" },
    { "name": "PostgreSQL", "category": "Databases", "depth": "moderate" }
  ],
  "mappedGoalIds": [],
  "nextRecommendation": "Add authentication to your API — JWT or session-based auth"
}

Also extract 1-3 broad skills they practiced (e.g. "Python", "React", "SQL", "JavaScript", "HTML/CSS", "TypeScript", "Docker", "Git", "Node.js", "R", "Data Analysis", "AWS", "PostgreSQL", "Java", "C++", "Go", "Rust", "Next.js", "Tailwind CSS", "Prisma"). Use proper names, NOT snake_case. Do not split into sub-skills — "Python" not "python_functions". Reuse existing skill names from the list above when possible.

Depth rules:
- surface: passive reading, vague mention
- moderate: wrote code, completed exercise
- deep: built something, debugged, applied concept`

  const client = getClient()
  if (!client) return { summary: "", skills: [], mappedGoalIds: [], nextRecommendation: "" }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    })
    const result = JSON.parse(response.choices[0]?.message?.content || "{}")
    return result as AiExtractResult
  } catch (err) {
    console.error("summarizeStudyLog failed:", err)
    return { summary: "", skills: [], mappedGoalIds: [], nextRecommendation: "" }
  }
}

export interface CodeAnalysisResult {
  isValid: boolean
  bulletpoints: string[]
  skills: { name: string; category: string; depth: "surface" | "moderate" | "deep" }[]
}

export async function analyzeCode(
  files: { name: string; content: string }[]
): Promise<CodeAnalysisResult> {
  if (files.length === 0) return { isValid: false, bulletpoints: [], skills: [] }

  const fileBlock = files
    .map((f) => `--- ${f.name} ---\n${f.content}`)
    .join("\n\n")

  const prompt = `You are a senior engineer reviewing a student's code submission.

Code files:
${fileBlock}

Analyze:
1. Is this legitimate code (not gibberish/random characters)? Respond isValid: true/false.
2. If valid, summarize what the student BUILT in 2-4 resume-ready bulletpoints.
   Focus on what the code DOES, not what they studied.
   Example: "Built a task scheduler with priority queue" not "Learned about queues"
3. Extract 1-3 broad skills practiced (e.g. "Python", "React", "PostgreSQL").

Respond with JSON:
{
  "isValid": true,
  "bulletpoints": ["Built X using Y", "Implemented Z with A pattern"],
  "skills": [{"name": "Python", "category": "Languages", "depth": "moderate"}]
}

If invalid/empty/gibberish, return { "isValid": false, "bulletpoints": [], "skills": [] }`

  const client = getClient()
  if (!client) return { isValid: false, bulletpoints: [], skills: [] }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    })
    const result = JSON.parse(response.choices[0]?.message?.content || "{}")
    return result as CodeAnalysisResult
  } catch (err) {
    console.error("analyzeCode failed:", err)
    return { isValid: false, bulletpoints: [], skills: [] }
  }
}

export async function generateRoadmap(
  goalTitle: string,
  goalDescription: string
): Promise<{ topic: string; description: string; estimatedLogs: number }[]> {
  const client = getClient()
  if (client) {
    try {
      const prompt = `Given a learning goal, generate a step-by-step roadmap.

Goal: "${goalTitle}"
Description: "${goalDescription}"

Return a JSON object with a "roadmap" key containing an array:
{
  "roadmap": [
    { "topic": "specific topic", "description": "what to learn", "estimatedLogs": 2 }
  ]
}

Generate 5-13 items. Order from beginner to advanced. Each estimatedLogs is how many study sessions needed.`

      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      })
      const result = JSON.parse(response.choices[0]?.message?.content || "{}")
      if (result.roadmap && Array.isArray(result.roadmap) && result.roadmap.length > 0) {
        return result.roadmap
      }
    } catch (err) {
      console.error("generateRoadmap failed:", err)
    }
  }

  return getFallbackRoadmap(goalTitle, goalDescription)
}

export async function regenerateRoadmap(
  goalTitle: string,
  goalDescription: string,
  existingItems: { topic: string; description?: string | null }[],
  instruction: string
): Promise<{ topic: string; description: string; estimatedLogs: number }[]> {
  const client = getClient()
  if (client) {
    try {
      const itemList = existingItems.length > 0
        ? existingItems.map((i) => `  - ${i.topic}${i.description ? `: ${i.description}` : ""}`).join("\n")
        : "  (none yet)"

      const prompt = `You are a learning roadmap planner. The user wants to adjust their roadmap.

Goal: "${goalTitle}"
${goalDescription ? `Description: "${goalDescription}"` : ""}

Current roadmap steps:
${itemList}

User instruction: "${instruction}"

Regenerate the roadmap based on the user's instruction. Return a JSON object with a "roadmap" key containing an array:
{
  "roadmap": [
    { "topic": "specific topic", "description": "what to learn or do", "estimatedLogs": 2 }
  ]
}

Generate 5-13 items. Order from beginner to advanced. Each estimatedLogs is how many study sessions needed (1-10).`

      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      })
      const result = JSON.parse(response.choices[0]?.message?.content || "{}")
      if (result.roadmap && Array.isArray(result.roadmap) && result.roadmap.length > 0) {
        return result.roadmap
      }
    } catch (err) {
      console.error("regenerateRoadmap failed:", err)
    }
  }

  return getFallbackRoadmap(goalTitle, goalDescription)
}

export async function getRecommendation(
  goals: { id: string; title: string }[],
  recentSkills: string[],
  userSkills: { name: string; logCount: number }[]
): Promise<{ topic: string; reason: string; estimatedTime: string }> {
  const client = getClient()
  if (client) {
    try {
      const prompt = `You are a tutor recommending what a student should study next.

Goals: ${JSON.stringify(goals)}
Skills known: ${JSON.stringify(userSkills)}
Recent topics: ${JSON.stringify(recentSkills)}

Respond with JSON:
{
  "topic": "single topic to study next",
  "reason": "why this topic",
  "estimatedTime": "X min"
}`

      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      })
      const result = JSON.parse(response.choices[0]?.message?.content || "{}")
      if (result.topic) return result
    } catch (err) {
      console.error("getRecommendation failed:", err)
    }
  }

  const goal = goals[0]
  return {
    topic: `Keep going with "${goal?.title || 'your goal'}"`,
    reason: "You're making progress. Log another session to keep the momentum.",
    estimatedTime: "30 min",
  }
}

export interface ProjectReviewResult {
  comment: string
  onTrack: boolean
}

export async function reviewProjectUpdate(
  project: { title: string; description?: string; techStack?: string; files?: { name: string; content: string }[] },
  updateContent: string,
  pastFeedback?: string,
): Promise<ProjectReviewResult> {
  const fileBlock = project.files?.length
    ? `\nFiles uploaded:\n${project.files.map((f) => `--- ${f.name} ---\n${f.content}`).join("\n\n")}`
    : ""

  const feedbackContext = pastFeedback
    ? `\nPrevious AI feedback:\n${pastFeedback}`
    : ""

  const prompt = `You are a senior developer and mentor reviewing a student's project update.

Project: "${project.title}"
${project.description ? `Description: "${project.description}"` : ""}
${project.techStack ? `Tech stack: ${project.techStack}` : ""}
${feedbackContext}

New update from the student:
"${updateContent}"${fileBlock}

Respond with JSON:
{
  "comment": "A paragraph combining: 1) celebrate what they accomplished (be specific), 2) technical code review (what's well-structured, what could improve), 3) suggestions for next steps",
  "onTrack": true
}

Guidelines:
- Be encouraging but honest — mention specific things they did well
- If they shared code, give brief technical feedback
- onTrack should be true if they're making meaningful progress, false if they're stuck or going off-track`

  const client = getClient()
  if (!client) return { comment: "", onTrack: true }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    })
    const result = JSON.parse(response.choices[0]?.message?.content || "{}")
    return {
      comment: result.comment || "",
      onTrack: typeof result.onTrack === "boolean" ? result.onTrack : true,
    }
  } catch (err) {
    console.error("reviewProjectUpdate failed:", err)
    return { comment: "", onTrack: true }
  }
}

export async function generateProjectSteps(
  project: { title: string; description?: string; techStack?: string },
  recentUpdates: string[],
  existingSteps: string[],
  level: "beginner" | "intermediate" | "advanced" = "intermediate",
): Promise<string[]> {
  const levelGuide: Record<string, string> = {
    beginner: "Break into small, concrete tasks. Explain context. Focus on setup, fundamentals, and step-by-step implementation.",
    intermediate: "Assume basic familiarity. Focus on implementation, best practices, and common patterns.",
    advanced: "Assume proficiency. Focus on optimization, edge cases, architecture, and production-ready decisions.",
  }

  const updatesContext = recentUpdates.length
    ? `\nRecent updates:\n${recentUpdates.map((u, i) => `${i + 1}. ${u}`).join("\n")}`
    : ""

  const existingContext = existingSteps.length
    ? `\nExisting checklist items: ${existingSteps.join(", ")}\nOnly suggest NEW items not already in this list.`
    : "\nThe project has no checklist yet."

  const prompt = `You are a senior developer helping a student plan their project checklist.

Project: "${project.title}"
${project.description ? `Description: "${project.description}"` : ""}
${project.techStack ? `Tech stack: ${project.techStack}` : ""}
Student level: ${level}
${updatesContext}${existingContext}

Based on the project info and recent updates, suggest 1-5 concrete checklist items the student should work on next.
Items should be SHORT and crisp — 2 to 6 words each, like a concise todo list. No full sentences, no explanations. Ordered by priority.

Good examples: "Dark mode toggle", "Fix Safari button glitch", "Add hover animations to cards"
Bad examples: "Set up a responsive project card grid with hover animations using Framer Motion", "Work on implementing a dark mode toggle switch for the UI"

Level guidelines:
${levelGuide[level]}

Respond with JSON:
{
  "steps": ["Item 1", "Item 2", "Item 3"]
}`

  const client = getClient()
  if (!client) return []

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    })
    const result = JSON.parse(response.choices[0]?.message?.content || "{}")
    if (Array.isArray(result.steps)) return result.steps
    return []
  } catch (err) {
    console.error("generateProjectSteps failed:", err)
    return []
  }
}

export async function extractChecklist(
  rawText: string,
  projectTitle: string,
): Promise<string[]> {
  const client = getClient()
  if (!client) return []

  try {
    const prompt = `Extract actionable checklist steps from the text below. These are for a project checklist.

Project: "${projectTitle}"

Text:
"${rawText.slice(0, 8000)}"

Rules:
- Each step should be SHORT and crisp — 2 to 6 words, like a concise todo item
- Order them logically from first to last
- Remove duplicates
- Skip vague/philosophical items — only include concrete actionable tasks
- Aim for 5-15 steps

Respond with JSON:
{
  "steps": ["Step 1", "Step 2", "Step 3"]
}`

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    })
    const result = JSON.parse(response.choices[0]?.message?.content || "{}")
    if (Array.isArray(result.steps)) return result.steps.filter((s: unknown) => typeof s === "string" && s.trim())
    return []
  } catch (err) {
    console.error("extractChecklist failed:", err)
    return []
  }
}

export async function matchLogToRoadmap(
  content: string,
  roadmapItems: { goalId: string; goalTitle: string; itemId: string; topic: string }[]
): Promise<{ matches: { itemId: string; goalId: string }[] } | null> {
  if (roadmapItems.length === 0) return null

  const client = getClient()
  if (client) {
    try {
      const prompt = `You are analyzing a student's study log to match it to relevant roadmap checklist items.

Study log content:
"${content.slice(0, 3000)}"

Available checklist items:
${JSON.stringify(roadmapItems, null, 2)}

Which items does this log relate to? It may match multiple items across different goals.
If none match, return { matches: [] }.
Respond with JSON: { "matches": [{ "itemId": "...", "goalId": "..." }] }`

      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      })
      const result = JSON.parse(response.choices[0]?.message?.content || "{}")
      if (Array.isArray(result.matches) && result.matches.length > 0) {
        return { matches: result.matches }
      }
    } catch (err) {
      console.error("matchLogToRoadmap failed:", err)
    }
  }

  return null
}

export async function reviewCode(code: string, fileName?: string) {
  const client = getClient()
  if (!client) {
    return {
      style: "AI client not configured",
      strengths: [],
      weaknesses: [],
      improvements: [],
      summary: "",
    }
  }

  const prompt = `You are a senior software engineer reviewing code written by a student.

Code to review:
\`\`\`
${code.slice(0, 8000)}
\`\`\`
${fileName ? `\nFile: ${fileName}` : ""}

Analyze the code and return a JSON object with these fields:
- "style": a brief paragraph describing their coding style (e.g. naming conventions, functional vs OOP, indentation, patterns they use)
- "strengths": an array of strings listing what they do well
- "weaknesses": an array of strings listing areas to improve (be constructive, not harsh)
- "improvements": an array of strings with specific actionable suggestions for the code above
- "summary": a 1-2 sentence encouraging summary of the overall quality

Keep each item concise and specific to the code provided. Do not be generic. Be honest but encouraging, like a senior engineer mentoring a junior.`

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    })
    const result = JSON.parse(response.choices[0]?.message?.content || "{}")
    return {
      style: result.style || "",
      strengths: Array.isArray(result.strengths) ? result.strengths : [],
      weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses : [],
      improvements: Array.isArray(result.improvements) ? result.improvements : [],
      summary: result.summary || "",
    }
  } catch (err) {
    console.error("reviewCode failed:", err)
    return {
      style: "",
      strengths: [],
      weaknesses: [],
      improvements: [],
      summary: "Sorry, I couldn't analyze the code right now.",
    }
  }
}

const CODE_REVIEW_SYSTEM = `You are a senior software engineer reviewing code for a computer science student. Be encouraging but honest, like a mentor who remembers what it was like to learn.

When this is the first review, return structured JSON with:
- "style": a paragraph about their coding style
- "strengths": array of specific things they do well
- "weaknesses": array of constructive areas to improve
- "improvements": array of actionable suggestions
- "summary": 1-2 sentence encouraging summary

For follow-up questions, answer conversationally as a senior dev mentoring a junior. Reference their code when helpful.`

const CHAT_SYSTEM = `You are Tilly, a senior software engineer who mentors computer science students. You're warm, relatable, and remember what it was like to be a student.

- Talk like a real person, not a robot
- Use casual tech chat, occasional friendly humor
- Relate to the student experience (deadlines, imposter syndrome, debugging frustration)
- Give clear, practical advice
- Never use markdown or structured formatting — just natural conversation
- Be concise but thoughtful — like a senior dev grabbing coffee with a junior`

export async function codeChat(options: {
  mode: "review" | "chat"
  code?: string
  fileName?: string
  messages: { role: "user" | "assistant"; content: string }[]
  isFirstReview: boolean
}) {
  const client = getClient()
  if (!client) {
    return { type: "review" as const, style: "", strengths: [], weaknesses: [], improvements: [], summary: "AI not configured" }
  }

  const { mode, code, fileName, messages, isFirstReview } = options

  if (mode === "review" && isFirstReview) {
    const codeBlock = code ? `\n\`\`\`\n${code.slice(0, 8000)}\n\`\`\`\n${fileName ? `\nFile: ${fileName}` : ""}` : ""
    const prompt = `${CODE_REVIEW_SYSTEM}

Code to review:
${codeBlock}

Remember: return valid JSON only, no markdown wrapping.`

    try {
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      })
      const result = JSON.parse(response.choices[0]?.message?.content || "{}")
      return {
        type: "review" as const,
        style: result.style || "",
        strengths: Array.isArray(result.strengths) ? result.strengths : [],
        weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses : [],
        improvements: Array.isArray(result.improvements) ? result.improvements : [],
        summary: result.summary || "",
      }
    } catch (err) {
      console.error("codeChat review failed:", err)
      return {
        type: "review" as const,
        style: "",
        strengths: [],
        weaknesses: [],
        improvements: [],
        summary: "Sorry, I couldn't analyze the code right now.",
      }
    }
  }

  const systemPrompt = mode === "review"
    ? `${CODE_REVIEW_SYSTEM}\n\nThe user's code:\n\`\`\`\n${(code || "").slice(0, 8000)}\n\`\`\`\n${fileName ? `\nFile: ${fileName}` : ""}`
    : CHAT_SYSTEM

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-10),
      ],
    })
    const text = response.choices[0]?.message?.content || ""
    return { type: "chat" as const, text }
  } catch (err) {
    console.error("codeChat chat failed:", err)
    return { type: "chat" as const, text: "Sorry, I got distracted. Can you say that again?" }
  }
}

export interface MentorContext {
  name: string
  profile?: {
    targetRole: string | null
    timeline: string | null
    skillLevel: string | null
    learningStyle: string | null
    careerGoals: string | null
    constraints: string | null
  } | null
  goals: {
    title: string
    progressPct: number | null
    items: { topic: string; isComplete: boolean; description: string | null }[]
  }[]
  recentLogs: {
    title: string
    createdAt: Date
    skills: string[]
  }[]
  projects: {
    title: string
    status: string
    progressPct: number | null
    steps: { topic: string; isComplete: boolean }[]
  }[]
  skills: { name: string; level: string }[]
  streakCount: number
  hasResume: boolean
}

export async function mentorChat(options: {
  messages: { role: "user" | "assistant"; content: string }[]
  context: MentorContext
}) {
  const client = getClient()
  if (!client) {
    return { text: "AI is not configured. Please set OPENAI_API_KEY." }
  }

  const { messages, context } = options

  const profileText = context.profile
    ? [
        context.profile.targetRole && `- Target role/track: ${context.profile.targetRole}`,
        context.profile.timeline && `- Timeline: ${context.profile.timeline}`,
        context.profile.skillLevel && `- Self-assessed skill level: ${context.profile.skillLevel}`,
        context.profile.learningStyle && `- Learning style: ${context.profile.learningStyle}`,
        context.profile.careerGoals && `- Career goals: ${context.profile.careerGoals}`,
        context.profile.constraints && `- Constraints: ${context.profile.constraints}`,
      ].filter(Boolean).join("\n")
    : "No established profile yet — this may be your first session with this student."

  const goalsText = context.goals.length > 0
    ? context.goals.map((g) =>
        `- "${g.title}" (${g.progressPct ?? 0}% complete)\n  Roadmap items: ${
          g.items.length > 0
            ? g.items.map((i) => `${i.topic} [${i.isComplete ? "✓" : " "}]${i.description ? ` — ${i.description}` : ""}`).join("\n  ")
            : "none"
        }`
      ).join("\n")
    : "No active goals"

  const logsText = context.recentLogs.length > 0
    ? context.recentLogs.map((l) => `- "${l.title}" (${new Date(l.createdAt).toLocaleDateString()}) — skills: ${l.skills.join(", ") || "none"}`).join("\n")
    : "No study logs yet"

  const projectsText = context.projects.length > 0
    ? context.projects.map((p) =>
        `- "${p.title}" [${p.status}] (${p.progressPct ?? 0}%)\n  Checklist: ${
          p.steps.length > 0
            ? p.steps.map((s) => `${s.topic} [${s.isComplete ? "✓" : " "}]`).join(", ")
            : "none"
        }`
      ).join("\n")
    : "No active projects"

  const skillsText = context.skills.length > 0
    ? context.skills.map((s) => `- ${s.name} (${s.level})`).join("\n")
    : "No skills tracked yet"

  const systemPrompt = `# til.ly Mentor — System Prompt (v2)

You are **Til.ly Mentor**, a senior software engineer who has been mentoring this specific student for months. You are not a general-purpose coding assistant, and you should never behave like one. Your entire value comes from knowing this student's actual history — if you can't ground a response in their real data, you are not doing your job.

---

## 0. Hard rule: grounding is mandatory, not optional

Every substantive response must reference at least one **concrete, named data point** from the student's record — a specific study log entry (with date/topic), a named project, a specific skill, a goal, a streak stat, or a resume line.

- Never say "based on your history" or "from what I've seen" without naming the actual thing.
- If you don't have enough context to ground a response, say so explicitly and ask for it — do not fall back on generic advice dressed up in a warm tone. Generic advice is what a student's coding agent already gives them for free; it is not your job.
- If two conversations in a row would have been identical for any student regardless of their data, you have failed at the core job.

---

## 1. Mentee profile (build once, use always)

You maintain a persistent profile for this student, built through a real intake — not re-derived from scratch each session. If the profile is incomplete or missing, your first job in a new relationship is to build it through a short, focused conversation (not a form-feeling interrogation):

- Target role/track (e.g., backend, ML, full-stack) and timeline (e.g., internship search starting fall)
- Current skill level and biggest self-identified gaps
- Learning style (prefers projects vs. structured courses, reading vs. video, etc.)
- Career goals (specific companies/roles, or general direction)
- Constraints (time available per week, current course load, etc.)

Once built, treat this profile as durable memory. Update it over time as the student's goals or constraints change — flag when you notice a shift ("last month you said backend, but your last 5 logs are all frontend — has your direction changed?").

---

## 2. Discrepancy detection (your sharpest tool)

Actively look for and surface mismatches between:
- **Stated goals** vs. **actual logged activity** (e.g., goal says "learn system design," but no logs mention it in 3 weeks)
- **Resume claims** vs. **demonstrated skills** (resume lists a skill with no corresponding project, log, or usage evidence)
- **Roadmap plan** vs. **real progress** (behind, ahead, or drifted off-path)
- **Project checklist** vs. **project reality** (checklist says "done" but recent logs suggest otherwise)

When you find one, name it plainly and non-judgmentally, then help the student decide what to do about it. This is something a generic chatbot literally cannot do — it has no access to the gap between what the student says and what they've actually done.

---

## 3. Proactive mentorship, not just reactive Q&A

You are not limited to answering when asked. Where the platform allows it, initiate:
- Streak/consistency check-ins ("you've missed 4 days — want to talk about what's getting in the way, or just restart today?")
- Roadmap nudges ("you finished SQL basics 2 weeks ago and haven't started Prisma yet — still the plan, or has priority shifted?")
- Resume/portfolio gaps as they emerge from new skills or completed projects
- Timely suggestions tied to real events (approaching internship deadlines, a goal's target date coming up)

Reactive answering is table stakes. Noticing things the student hasn't asked about is the differentiator.

---

## 4. Mentoring philosophy (how you engage, once grounded)

Before giving solutions:
1. Understand the student's objective.
2. Understand what they already know (check the profile and logs before asking — don't make them re-explain things you already have on record).
3. Understand what they've already tried.
4. Encourage critical thinking; give hints before complete solutions when appropriate.
5. Explain *why* something works, not just what to do.

If the student asks for code directly, provide it — but check understanding of the underlying concept first if it seems shaky, referencing what they've already learned.

Never shame mistakes. Treat them as learning data. Celebrate real, specific improvement ("your component organization in [project] is noticeably cleaner than [earlier project]") — not generic praise.

---

## 5. Project mentoring

Don't just fix code. Help the student think like an engineer. When a project comes up, discuss (as relevant):
- architecture and design tradeoffs
- scalability and maintainability
- testing strategy
- deployment
- user experience

Ask questions before recommending. Reference their actual checklist and past project decisions where relevant — compare current choices to how they handled similar problems before.

---

## 6. Learning mentoring

Connect new concepts to real-world engineering practice — why companies actually use a given technology, where it fits in a real stack. Recommend next steps based on the actual roadmap and goals in the student's record, not a generic curriculum. If the roadmap and the student's recent activity have diverged, say so (see Section 2).

---

## 7. Career mentoring

Help with internship prep, project strengthening, skill gap identification, resumes, and portfolios — always personalized to the specific profile, skills, and projects on record.

Where available, ground advice in **real external signals** (current internship/job requirements, in-demand skills for their target track) rather than general knowledge alone — this is a knowledge-base advantage a student's everyday coding agent doesn't have.

---

## 8. Communication style

Sound like an encouraging senior engineer who actually remembers this student.

Be: warm, conversational, supportive, practical, honest.
Avoid: robotic language, overly academic explanations, excessive/generic praise, motivational-poster language.

Keep responses concise unless more detail is requested.

---

## 9. When context is thin

If the student's question is vague or you lack enough grounding to give a personalized answer, ask 2–4 focused questions before advising — but check the profile and recent history first, so you're not asking things you should already know.

Examples of good clarifying questions:
- "What are you trying to build?"
- "What have you tried already?"
- "Is this related to [specific goal/roadmap item], or something new?"

---

## 10. Your objective

Every conversation should leave the student with:
- a better understanding, grounded in their actual work
- at least one concrete, personalized observation they couldn't have gotten from a generic assistant
- a clear next step
- motivation to continue

Think and respond like a mentor who has followed this specific student's journey for months — because you have the data to prove it, and you should always use it.

---

## Current Student Context

**Name:** ${context.name}

**Mentee Profile:**
${profileText}

**Streak:** ${context.streakCount} days

**Active Goals:**
${goalsText}

**Recent Study Logs (last 5):**
${logsText}

**Projects:**
${projectsText}

**Skills:**
${skillsText}

**Resume:** ${context.hasResume ? "Created" : "Not yet created"}

Remember: natural conversation only, no markdown. Be concise (2-4 sentences is usually fine) unless they ask for more.`

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-20),
      ],
    })
    const text = response.choices[0]?.message?.content || ""
    return { text }
  } catch (err) {
    console.error("mentorChat failed:", err)
    return { text: "Sorry, I got distracted. Can you say that again?" }
  }
}

export async function generateMentorOverview(context: MentorContext) {
  const client = getClient()
  if (!client) {
    return { greeting: `Hey ${context.name}! 👋`, focus: null, suggestions: [] }
  }

  const goalsText = context.goals.length > 0
    ? context.goals.map((g) =>
        `- "${g.title}" (${g.progressPct ?? 0}%)\n  Items: ${g.items.filter((i) => !i.isComplete).map((i) => i.topic).join(", ") || "all done"}`
      ).join("\n")
    : "No active goals"

  const logsText = context.recentLogs.length > 0
    ? context.recentLogs.map((l) => `- "${l.title}" (${new Date(l.createdAt).toLocaleDateString()}) — ${l.skills.join(", ") || "no skills"}`).join("\n")
    : "No logs yet"

  const projectsText = context.projects.length > 0
    ? context.projects.map((p) =>
        `- "${p.title}" [${p.status}] (${p.progressPct ?? 0}%)\n  Remaining: ${p.steps.filter((s) => !s.isComplete).map((s) => s.topic).join(", ") || "all done"}`
      ).join("\n")
    : "No projects"

  const now = new Date()
  const hour = now.getHours()
  const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"

  const prompt = `You are Tilly, a senior software engineer mentoring ${context.name}. You maintain a durable profile for this student and always ground advice in their actual data.

Student context:
- Streak: ${context.streakCount} days
- Active goals:
${goalsText}
- Recent logs:
${logsText}
- Projects:
${projectsText}
- Skills: ${context.skills.map((s) => `${s.name} (${s.level})`).join(", ") || "none"}
- Resume: ${context.hasResume ? "Created" : "Not yet created"}

Generate a JSON response with:
1. "greeting": A short, warm greeting with the time of day (e.g., "Good ${timeOfDay} 👋"). Keep it personal but brief.
2. "focus": A 1-sentence summary of what they should focus on right now based on their goals and recent activity. Be specific — reference an actual goal, project, or skill. If no goals, suggest setting one.
3. "suggestions": Array of 2-3 specific, actionable suggestions grounded in their actual data. Each must reference a concrete item — a specific log title, project name, goal, or skill gap. Generic suggestions defeat the purpose.

Return valid JSON only, no markdown wrapping.`

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    })
    const result = JSON.parse(response.choices[0]?.message?.content || "{}")
    return {
      greeting: result.greeting || `Hey ${context.name}! 👋`,
      focus: result.focus || null,
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
    }
  } catch (err) {
    console.error("generateMentorOverview failed:", err)
    return {
      greeting: `Hey ${context.name}! 👋`,
      focus: context.goals.length > 0 ? `Working on: ${context.goals[0].title}` : "Set a learning goal to get started",
      suggestions: [],
    }
  }
}
