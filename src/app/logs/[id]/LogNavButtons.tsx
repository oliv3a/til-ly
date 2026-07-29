"use client"

import { useRouter } from "next/navigation"

export function BackButton({ className }: { className?: string }) {
  const router = useRouter()
  return (
    <button onClick={() => router.push("/logs")} className={className}>
      ← Back
    </button>
  )
}

export function DoneButton({ className }: { className?: string }) {
  const router = useRouter()
  return (
    <button onClick={() => router.push("/dashboard")} className={className}>
      Done ✨
    </button>
  )
}
