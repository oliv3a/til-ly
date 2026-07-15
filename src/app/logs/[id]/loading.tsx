export default function LogDetailLoading() {
  return (
    <div className="min-h-screen bg-cream">
      <main className="max-w-3xl mx-auto px-6 pt-10 pb-20">
        <div className="w-64 h-8 rounded bg-warm-paper animate-pulse mb-6" />
        <div className="space-y-4">
          <div className="h-48 rounded-xl bg-warm-paper animate-pulse" />
          <div className="h-32 rounded-xl bg-warm-paper animate-pulse" />
        </div>
      </main>
    </div>
  )
}
