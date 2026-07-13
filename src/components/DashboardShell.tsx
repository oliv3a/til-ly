import NavBar from "./NavBar"

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <NavBar />
      <main className="flex-1 p-4 md:p-6">
        {children}
      </main>
    </div>
  )
}
