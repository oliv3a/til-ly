import type { ReactNode } from "react"

interface ToolbarBtn {
  label: string
  icon?: string
  onClick?: () => void
}

interface Props {
  buttons: ToolbarBtn[]
  children?: ReactNode
}

export default function Toolbar({ buttons, children }: Props) {
  return (
    <>
      {buttons.map((btn) => (
        <button key={btn.label} className="retro-toolbar-btn" onClick={btn.onClick}>
          {btn.icon && <span>{btn.icon}</span>}
          {btn.label}
        </button>
      ))}
      {buttons.length > 0 && children && <div className="retro-toolbar-sep" />}
      {children}
    </>
  )
}
