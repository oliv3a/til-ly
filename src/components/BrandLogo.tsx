import Image from "next/image"
import type { CSSProperties } from "react"

interface Props {
  size?: number
  className?: string
  style?: CSSProperties
}

export default function BrandLogo({ size = 32, className = "", style }: Props) {
  const asp = 620 / 330
  return (
    <Image
      src="/logo-brand.webp"
      alt="til.ly"
      width={Math.round(size * asp)}
      height={size}
      className={`inline-block ${className}`}
      style={style}
      priority
    />
  )
}
