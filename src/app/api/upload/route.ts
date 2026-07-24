import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { parseNotebook } from "@/lib/notebook-parser"

const CODE_EXTENSIONS = new Set([
  ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".cpp", ".c", ".h",
  ".go", ".rs", ".rb", ".php", ".swift", ".kt", ".css", ".html",
  ".sql", ".sh", ".yaml", ".yml", ".json", ".md", ".txt", ".csv",
  ".xml", ".toml", ".cfg", ".ini", ".mjs", ".cjs", ".mts", ".cts",
  ".vue", ".svelte", ".astro", ".prisma", ".graphql", ".svg",
  ".ipynb",
])

function isCodeFile(fileName: string, fileType: string): boolean {
  const ext = "." + fileName.split(".").pop()?.toLowerCase()
  if (CODE_EXTENSIONS.has(ext)) return true
  if (fileType.startsWith("text/")) return true
  return false
}

async function processFile(file: File, filePath: string | null) {
  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = buffer.toString("base64")
  const dataUri = `data:${file.type};base64,${base64}`

  let extractedText: string | null = null
  if (isCodeFile(file.name, file.type)) {
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
    type: file.type,
    name: file.name,
    extractedText,
    filePath: filePath || null,
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const formData = await req.formData()

    // Batch mode: multiple files under "files" key
    const batchFiles = formData.getAll("files") as File[]
    if (batchFiles.length > 0) {
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
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
