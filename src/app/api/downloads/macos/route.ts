import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { type NextRequest } from "next/server"

export async function GET(_req: NextRequest) {
  try {
    const filePath = join(process.cwd(), "public", "downloads", "til-ly-macos.zip")
    const data = await readFile(filePath)

    return new Response(data, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="til-ly-macos.zip"',
      },
    })
  } catch {
    return Response.json({ error: "Not found" }, { status: 404 })
  }
}
