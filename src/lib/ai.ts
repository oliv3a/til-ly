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

Respond with JSON with two text fields:
1. "summary" — A clear 2-3 sentence recap of what they learned and did. Factual, specific, concise. This is for the student to review their own learning.
2. "motivation" — A brief, encouraging insight (1-2 sentences) connecting this log to their broader learning journey. Why this matters, what it unlocks, or how it builds on previous work. This is a side note for extra clarity and motivation.

Example:
{
  "summary": "You built a REST API with Express and PostgreSQL — defined routes, connected to a database, and tested endpoints with curl.",
  "motivation": "You've now built a full CRUD backend from scratch. This skill transfers directly to any web framework and is the foundation for your goal of building a full-stack app.",
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
