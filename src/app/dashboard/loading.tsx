export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto border-b border-softgray">
        <div className="w-28 h-6 rounded bg-warm-paper animate-pulse" />
        <div className="flex gap-4">
          <div className="w-12 h-4 rounded bg-warm-paper animate-pulse" />
          <div className="w-16 h-4 rounded bg-warm-paper animate-pulse" />
          <div className="w-12 h-4 rounded bg-warm-paper animate-pulse" />
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 pt-10 pb-20">
        <div className="h-32 rounded-xl bg-warm-paper animate-pulse mb-8" />

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="h-24 rounded-xl bg-warm-paper animate-pulse" />
          <div className="h-24 rounded-xl bg-warm-paper animate-pulse" />
          <div className="h-24 rounded-xl bg-warm-paper animate-pulse" />
        </div>

        <div className="h-44 rounded-xl bg-warm-paper animate-pulse mb-8" />
        <div className="h-36 rounded-xl bg-warm-paper animate-pulse mb-8" />
        <div className="h-52 rounded-xl bg-warm-paper animate-pulse" />
      </main>
    </div>
  )
}
