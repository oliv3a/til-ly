import Image from "next/image"
import Mascot from "./Mascot"

interface Props {
  size?: number
  className?: string
  variant?: "stamp" | "mascot"
}

export default function BrandLogo({ size = 32, className = "", variant = "mascot" }: Props) {
  if (variant === "stamp") {
    return (
      <Image
        src="/logo.svg"
        alt="til.ly"
        width={size}
        height={size}
        className={`inline-block ${className}`}
        priority
      />
    )
  }

  return <Mascot size={size} emotion="happy" className={className} />
}
