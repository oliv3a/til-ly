import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { parseNotebook } from "@/lib/notebook-parser"
import { dbRateLimit, aiDailyKey, DAILY_MS } from "@/lib/db-rate-limit"
import OpenAI from "openai"

const CODE_EXTENSIONS = new Set([
  ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".cpp", ".c", ".h",
  ".go", ".rs", ".rb", ".php", ".swift", ".kt", ".css", ".html",
  ".sql", ".sh", ".yaml", ".yml", ".json", ".md", ".txt", ".csv",
  ".xml", ".toml", ".cfg", ".ini", ".mjs", ".cjs", ".mts", ".cts",
  ".vue", ".svelte", ".astro", ".prisma", ".graphql", ".svg",
  ".ipynb",
])

const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/tiff"])

const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_TOTAL_SIZE = 50 * 1024 * 1024
const MAX_FILES = 20

class UploadError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

function isCodeFile(fileName: string, fileType: string): boolean {
  const ext = "." + fileName.split(".").pop()?.toLowerCase()
  if (CODE_EXTENSIONS.has(ext)) return true
  if (fileType.startsWith("text/")) return true
  return false
}

function isImageFile(fileType: string): boolean {
  return IMAGE_MIMES.has(fileType)
}

function sniffImageType(buffer: Buffer): string | null {
  if (buffer.length < 12) return null
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg"
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png"
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp"
  if (buffer.subarray(0, 6).toString("ascii") === "GIF87a" || buffer.subarray(0, 6).toString("ascii") === "GIF89a") return "image/gif"
  if (buffer.subarray(0, 2).toString("ascii") === "BM") return "image/bmp"
  if (buffer.subarray(0, 4).equals(Buffer.from([0x49, 0x49, 0x2a, 0x00])) || buffer.subarray(0, 4).equals(Buffer.from([0x4d, 0x4d, 0x00, 0x2a]))) return "image/tiff"
  return null
}

async function extractTextFromImage(base64: string, mimeType: string): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Read and transcribe ALL text visible in this image. If it's handwritten notes, transcribe them as accurately as possible. Preserve the structure (bullet points, numbered lists, headings). If there are code snippets, include them. If the image contains no readable text, respond with just the word NONE.",
            },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
          ],
        },
      ],
      max_tokens: 2000,
    })
    const text = response.choices[0]?.message?.content?.trim() || ""
    if (!text || text === "NONE") return null
    return text
  } catch (err) {
    console.error("Image text extraction failed:", err)
    return null
  }
}

async function processFile(file: File, filePath: string | null) {
  if (file.size > MAX_FILE_SIZE) {
    throw new UploadError(`File "${file.name}" exceeds the ${MAX_FILE_SIZE / 1024 / 1024}MB size limit`)
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = buffer.toString("base64")

  const mimeType = isImageFile(file.type) ? sniffImageType(buffer) : null
  if (isImageFile(file.type) && !mimeType) {
    throw new UploadError(`File "${file.name}" is not a valid image (content does not match its declared type)`)
  }
  const dataUri = `data:${mimeType || file.type};base64,${base64}`

  let extractedText: string | null = null

  if (mimeType) {
    extractedText = await extractTextFromImage(base64, mimeType)
  } else if (isCodeFile(file.name, file.type)) {
    try {
      const decoded = buffer.toString("utf-8")
      const notebook = parseNotebook(decoded)
      if (notebook) {
        extractedText = notebook.formattedContent
      } else {
        extractedText = decoded
      }
    } catch {
      extractedText = null
    }
  }

  return {
    url: dataUri,
    type: mimeType || file.type,
    name: file.name,
    extractedText,
    filePath: filePath || null,
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { allowed } = await dbRateLimit(aiDailyKey(session.user.id, "upload"), 100, DAILY_MS)
    if (!allowed) {
      return NextResponse.json({ error: "Daily upload limit reached. Try again tomorrow." }, { status: 429 })
    }

    const contentLength = Number(req.headers.get("content-length") || 0)
    if (contentLength > MAX_TOTAL_SIZE + 1024 * 1024) {
      throw new UploadError(`Upload exceeds the ${MAX_TOTAL_SIZE / 1024 / 1024}MB total size limit`, 413)
    }

    const formData = await req.formData()

    // Batch mode: multiple files under "files" key
    const batchFiles = formData.getAll("files") as File[]
    if (batchFiles.length > 0) {
      if (batchFiles.length > MAX_FILES) {
        throw new UploadError(`Upload exceeds the ${MAX_FILES} file limit`)
      }
      const filePaths = formData.getAll("filePaths") as string[]
      const results = await Promise.all(
        batchFiles.map((file, i) => processFile(file, filePaths[i] || null))
      )
      return NextResponse.json(results)
    }

    // Single file mode (backward compat)
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    const filePath = formData.get("filePath") as string | null
    const result = await processFile(file, filePath)
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
