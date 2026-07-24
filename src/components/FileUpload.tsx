"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useDropzone } from "react-dropzone"

export interface UploadedFile {
  url: string
  type: string
  name: string
  extractedText?: string | null
  filePath?: string | null
}

interface FileUploadProps {
  files: UploadedFile[]
  onFilesChange: (files: UploadedFile[]) => void
}

export default function FileUpload({ files, onFilesChange }: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute("webkitdirectory", "")
      folderInputRef.current.setAttribute("directory", "")
    }
  }, [])

  async function uploadFiles(accepted: File[]) {
    setUploadProgress({ current: 0, total: accepted.length })
    const uploaded: UploadedFile[] = []
    for (let i = 0; i < accepted.length; i++) {
      const file = accepted[i]
      const formData = new FormData()
      formData.append("file", file)
      const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath || null
      if (path) formData.append("filePath", path)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (res.ok) {
        const data = await res.json()
        uploaded.push({ url: data.url, type: data.type, name: data.name, extractedText: data.extractedText, filePath: data.filePath })
      }
      setUploadProgress({ current: i + 1, total: accepted.length })
    }
    onFilesChange([...files, ...uploaded])
    setUploadProgress(null)
  }

  const onDrop = useCallback(async (accepted: File[]) => {
    await uploadFiles(accepted)
  }, [files, onFilesChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  async function handleFolderSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files
    if (!selected || selected.length === 0) return
    await uploadFiles(Array.from(selected))
    e.target.value = ""
  }

  function removeFile(index: number) {
    onFilesChange(files.filter((_, i) => i !== index))
  }

  const hasPaths = files.some((f) => f.filePath)

  return (
    <div>
      <div
        {...getRootProps()}
        className={`frame-block p-6 text-center cursor-pointer border-dashed ${
          isDragActive ? "bg-muted-blue/10" : ""
        }`}
      >
        <input {...getInputProps()} />
        {uploadProgress ? (
          <div className="space-y-2">
            <p className="text-[0.65rem] font-mono text-muted-ink/50">
              Uploading {uploadProgress.current} / {uploadProgress.total}...
            </p>
            <div className="w-full bg-warm-paper rounded-full h-2 overflow-hidden">
              <div
                className="bg-soft-coral h-full rounded-full transition-all duration-300"
                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[0.65rem] font-mono text-muted-ink/60">
              {isDragActive ? "Drop files or folder here" : "Click or drag files here"}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                folderInputRef.current?.click()
              }}
              className="text-[0.55rem] font-mono text-soft-coral hover:text-warm-brown underline"
            >
              or upload a folder
            </button>
          </div>
        )}
      </div>
      <input
        ref={folderInputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={handleFolderSelect}
      />
      {files.length > 0 && (
        <div className="mt-2 space-y-0.5">
          {hasPaths ? (
            <FileTree files={files} onRemove={removeFile} />
          ) : (
            <div className="flex flex-wrap gap-1">
              {files.map((f, i) => (
                <span key={i} className="tag flex items-center gap-1">
                  📎 {f.name}
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-muted-ink/50 hover:text-warm-brown"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function FileTree({ files, onRemove }: { files: UploadedFile[]; onRemove: (index: number) => void }) {
  const tree: Record<string, { file: UploadedFile; index: number }[]> = {}
  files.forEach((f, i) => {
    const parts = f.filePath?.split("/") || [f.name]
    const dir = parts.length > 1 ? parts.slice(0, -1).join("/") : ""
    if (!tree[dir]) tree[dir] = []
    tree[dir].push({ file: f, index: i })
  })

  return (
    <div className="frame-block p-2 text-[0.55rem] font-mono space-y-1 max-h-48 overflow-y-auto">
      {Object.entries(tree).map(([dir, items]) => (
        <div key={dir}>
          {dir && (
            <p className="text-muted-ink/60 font-medium">📁 {dir}</p>
          )}
          <div className={dir ? "ml-3" : ""}>
            {items.map(({ file, index }) => (
              <div key={index} className="flex items-center gap-1 text-warm-brown group">
                <span className="text-muted-ink/40">📄</span>
                <span className="truncate flex-1">{file.name}</span>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="text-muted-ink/30 hover:text-warm-brown opacity-0 group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
