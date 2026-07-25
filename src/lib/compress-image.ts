const MAX_WIDTH = 1024
const JPEG_QUALITY = 0.8

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/heic", "image/heif", "image/webp", "image/bmp", "image/tiff"])

export function isImageFile(file: File): boolean {
  if (IMAGE_TYPES.has(file.type)) return true
  const ext = file.name.split(".").pop()?.toLowerCase()
  return ["jpg", "jpeg", "png", "heic", "heif", "webp", "bmp", "tiff"].includes(ext || "")
}

export async function compressImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement("canvas")

  const scale = Math.min(1, MAX_WIDTH / bitmap.width)
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)

  const ctx = canvas.getContext("2d")!
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }))
        } else {
          resolve(file)
        }
      },
      "image/jpeg",
      JPEG_QUALITY
    )
  })
}
