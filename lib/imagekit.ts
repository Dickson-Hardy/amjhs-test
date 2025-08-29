import ImageKit from "imagekit"

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
})

export async function uploadFile(file: File, folder = "articles") {
  try {
    const buffer = await file.arrayBuffer()
    const result = await imagekit.upload({
      file: Buffer.from(buffer),
      fileName: file.name,
      folder: `amhsj/${folder}`,
      useUniqueFileName: true,
    })

    return {
      fileId: result.fileId,
      url: result.url,
      name: result.name,
      size: result.size,
    }
  } catch (error) {
    logger.error("ImageKit upload error:", error)
    throw new AppError("File upload failed")
  }
}

export async function deleteFile(fileId: string) {
  try {
    await imagekit.deleteFile(fileId)
  } catch (error) {
    logger.error("ImageKit delete error:", error)
    throw new AppError("File deletion failed")
  }
}

export function getAuthenticationParameters() {
  const token = imagekit.getAuthenticationParameters()
  return token
}
