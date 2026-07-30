import { NextResponse, type NextRequest } from "next/server"

export async function GET(_req: NextRequest) {
  const url = new URL("/downloads/til-ly-macos.zip", _req.url)
  return NextResponse.redirect(url, 302)
}
