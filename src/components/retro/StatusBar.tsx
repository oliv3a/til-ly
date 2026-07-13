interface Props {
  left?: string
  right?: string
}

export default function StatusBar({ left, right }: Props) {
  return (
    <>
      <span>{left ?? ""}</span>
      <span>{right ?? ""}</span>
    </>
  )
}
