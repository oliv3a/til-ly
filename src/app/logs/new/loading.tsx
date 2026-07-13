export default function NewLogLoading() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="flex items-center justify-between px-6 py-4 max-w-3xl mx-auto border-b border-softgray">
        <div className="w-28 h-6 rounded bg-warm-paper animate-pulse" />
      </div>
      <main className="max-w-2xl mx-auto px-6 pt-10 pb-20">
        <div className="w-64 h-8 rounded bg-warm-paper animate-pulse mb-6" />
        <div className="space-y-5">
          <div className="h-12 rounded-xl bg-warm-paper animate-pulse" />
          <div className="h-40 rounded-xl bg-warm-paper animate-pulse" />
          <div className="h-32 rounded-xl bg-warm-paper animate-pulse" />
          <div className="h-12 rounded-full bg-warm-paper animate-pulse" />
        </div>
      </main>
    </div>
  )
}
