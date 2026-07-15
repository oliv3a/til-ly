export default function RecruitStudentsLoading() {
  return (
    <div className="min-h-screen bg-cream">
      <main className="max-w-5xl mx-auto px-6 pt-10 pb-20">
        <div className="w-48 h-8 rounded bg-warm-paper animate-pulse mb-6" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="h-36 rounded-xl bg-warm-paper animate-pulse" />
          <div className="h-36 rounded-xl bg-warm-paper animate-pulse" />
          <div className="h-36 rounded-xl bg-warm-paper animate-pulse" />
        </div>
      </main>
    </div>
  )
}
