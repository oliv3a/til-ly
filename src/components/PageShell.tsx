import NavBar from "./NavBar"
import Footer from "./Footer"

interface Props {
  children: React.ReactNode
  showNav?: boolean
  showFooter?: boolean
  maxWidth?: string
}

export default function PageShell({ children, showNav = true, showFooter = true, maxWidth = "max-w-5xl" }: Props) {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {showNav && <NavBar />}
      <main className={`flex-1 w-full ${maxWidth} mx-auto p-4 md:p-6`}>
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  )
}
