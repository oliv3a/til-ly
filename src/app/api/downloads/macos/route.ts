import { readFile } from "fs/promises"
import { join } from "path"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const filePath = join(process.cwd(), "public", "downloads", "til-ly-macos.zip")
    const data = await readFile(filePath)

    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="til-ly-macos.zip"',
        "Cache-Control": "public, max-age=0",
      },
    })
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }
}
