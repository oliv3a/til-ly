export default function ProjectsLoading() {
  return (
    <div className="min-h-screen bg-cream">
      <main className="max-w-4xl mx-auto px-6 pt-10 pb-20">
        <div className="w-48 h-8 rounded bg-warm-paper animate-pulse mb-6" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-48 rounded-xl bg-warm-paper animate-pulse" />
          <div className="h-48 rounded-xl bg-warm-paper animate-pulse" />
        </div>
      </main>
    </div>
  )
}
