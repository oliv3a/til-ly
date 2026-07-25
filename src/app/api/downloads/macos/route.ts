import { type NextRequest } from "next/server"

const RELEASE_URL = "https://github.com/oliv3a/keizokode/releases/latest/download/til-ly-macos.zip"

export async function GET(_req: NextRequest) {
  return Response.redirect(RELEASE_URL, 302)
}
