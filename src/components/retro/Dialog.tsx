interface Props {
  title: string
  children: React.ReactNode
  className?: string
  actions?: React.ReactNode
}

export default function Dialog({ title, children, className = "", actions }: Props) {
  return (
    <div className={`retro-dialog flex flex-col ${className}`}>
      <div className="retro-titlebar dim">
        <span className="truncate">{title}</span>
        <span className="retro-titlebar-btn text-[10px]">✕</span>
      </div>
      <div className="p-4 space-y-3">
        {children}
      </div>
      {actions && (
        <div className="flex justify-end gap-2 px-4 pb-4">
          {actions}
        </div>
      )}
    </div>
  )
}
