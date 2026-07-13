import Image from "next/image"
import Onigiri from "./Onigiri"

interface Props {
  size?: number
  className?: string
  variant?: "stamp" | "onigiri"
}

export default function BrandLogo({ size = 32, className = "", variant = "onigiri" }: Props) {
  if (variant === "stamp") {
    return (
      <Image
        src="/logo.svg"
        alt="KeizoKode"
        width={size}
        height={size}
        className={`inline-block ${className}`}
        priority
      />
    )
  }

  return <Onigiri size={size} emotion="happy" className={className} />
}
