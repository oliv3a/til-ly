"use client"

interface MenuItem {
  label: string
  onClick?: () => void
  active?: boolean
}

interface Props {
  items: MenuItem[]
}

export default function MenuBar({ items }: Props) {
  return (
    <>
      {items.map((item) => (
        <span
          key={item.label}
          className={`retro-menubar-item ${item.active ? "bg-muted-blue text-white" : ""}`}
          onClick={item.onClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && item.onClick?.()}
        >
          {item.label}
        </span>
      ))}
    </>
  )
}
