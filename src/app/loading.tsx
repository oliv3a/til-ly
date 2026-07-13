export default function RootLoading() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-muted-teal/30 border-t-muted-teal animate-spin" />
        <p className="text-sm font-mono text-muted-ink/50">Loading...</p>
      </div>
    </div>
  )
}
