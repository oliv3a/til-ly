interface NotebookCell {
  cell_type: "markdown" | "code"
  source: string[]
  outputs?: {
    output_type: string
    text?: string[]
    data?: Record<string, string[]>
    name?: string
  }[]
}

interface NotebookJson {
  cells?: NotebookCell[]
  nbformat?: number
  metadata?: Record<string, unknown>
}

export interface ParsedNotebook {
  formattedContent: string
}

export function parseNotebook(raw: string): ParsedNotebook | null {
  let nb: NotebookJson
  try {
    nb = JSON.parse(raw)
  } catch {
    return null
  }

  if (!nb.cells || !Array.isArray(nb.cells) || nb.cells.length === 0) {
    return null
  }

  const markdownCells: string[] = []
  const codeCells: string[] = []
  const outputs: string[] = []

  for (const cell of nb.cells) {
    const source = cell.source?.join("") ?? ""

    if (cell.cell_type === "markdown") {
      if (source.trim()) markdownCells.push(source)
    } else if (cell.cell_type === "code") {
      if (source.trim()) codeCells.push(source)

      for (const output of cell.outputs ?? []) {
        const textParts: string[] = []

        if (output.text) {
          textParts.push(output.text.join(""))
        }
        if (output.data) {
          for (const val of Object.values(output.data)) {
            if (Array.isArray(val)) textParts.push(val.join(""))
          }
        }

        const combined = textParts.join("\n").trim()
        if (combined) {
          outputs.push(combined)
        }
      }
    }
  }

  const parts: string[] = []

  if (markdownCells.length > 0) {
    parts.push("### Notes")
    parts.push(markdownCells.join("\n\n"))
  }

  if (codeCells.length > 0) {
    parts.push("### Code")
    parts.push(codeCells.join("\n\n"))
  }

  if (outputs.length > 0) {
    parts.push("### Outputs")
    parts.push(outputs.join("\n\n"))
  }

  return { formattedContent: parts.join("\n\n") }
}
