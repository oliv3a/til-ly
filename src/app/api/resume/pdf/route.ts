import { NextResponse } from "next/server"
import { createElement } from "react"
import { renderToBuffer } from "@react-pdf/renderer"
import { auth } from "@/lib/auth"
import { normalizeResumeData } from "@/lib/resume/generator"
import ResumePdf from "@/app/resume/ResumePdf"
import type { ResumeData } from "@/lib/resume/types"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const data = normalizeResumeData(body?.data as ResumeData | undefined)

    if (!data.personalInfo.name && data.experience.length === 0 && data.projects.length === 0) {
      return NextResponse.json({ error: "No resume data to export" }, { status: 400 })
    }

    const element = createElement(ResumePdf, { data }) as Parameters<typeof renderToBuffer>[0]
    const buffer = await renderToBuffer(element)
    const name = (data.personalInfo.name || "resume").trim().replace(/[^a-zA-Z0-9]+/g, "_")

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${name}_resume.pdf"`,
        "Content-Length": String(buffer.byteLength),
      },
    })
  } catch (err) {
    console.error("Resume PDF generation failed:", err)
    return NextResponse.json({ error: "Failed to generate PDF. Please try again." }, { status: 500 })
  }
}
