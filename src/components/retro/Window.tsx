interface Props {
  title: string
  children: React.ReactNode
  className?: string
  menuBar?: React.ReactNode
  toolbar?: React.ReactNode
  statusBar?: React.ReactNode
  dimTitle?: boolean
}

export default function Window({ title, children, className = "", menuBar, toolbar, statusBar, dimTitle }: Props) {
  return (
    <div className={`retro-window flex flex-col ${className}`}>
      <div className={`retro-titlebar ${dimTitle ? "dim" : ""}`}>
        <span className="truncate">{title}</span>
        <div className="flex gap-[2px] shrink-0">
          <span className="retro-titlebar-btn">_</span>
          <span className="retro-titlebar-btn">□</span>
          <span className="retro-titlebar-btn text-[10px]">✕</span>
        </div>
      </div>
      {menuBar && <div className="retro-menubar">{menuBar}</div>}
      {toolbar && <div className="retro-toolbar">{toolbar}</div>}
      <div className="flex-1 min-h-0 overflow-auto p-3">
        {children}
      </div>
      {statusBar && <div className="retro-statusbar">{statusBar}</div>}
    </div>
  )
}
