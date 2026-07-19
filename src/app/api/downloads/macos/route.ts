import { NextResponse } from "next/server"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

export async function GET() {
  try {
    const filePath = join(process.cwd(), "public", "downloads", "til-ly-macos.zip")
    const data = await readFile(filePath)

    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="til-ly-macos.zip"',
      },
    })
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}
