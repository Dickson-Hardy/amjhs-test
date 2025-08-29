import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export { cloudinary }

// Upload file to Cloudinary
export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  folder: string = 'manuscript-submissions',
  resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: resourceType,
          folder: folder,
          public_id: filename,
          use_filename: true,
          unique_filename: true,
          overwrite: false,
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      .end(buffer)
  })
}

// Delete file from Cloudinary
export async function deleteFromCloudinary(publicId: string): Promise<unknown> {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return result
  } catch (error) {
    throw error
  }
}

// Get file URL from Cloudinary
export function getCloudinaryUrl(
  publicId: string,
  transformations?: object
): string {
  return cloudinary.url(publicId, {
    secure: true,
    ...transformations,
  })
}

// Generate signed URL for secure file access
export function generateSignedUrl(
  publicId: string,
  expiresAt?: number
): string {
  const timestamp = expiresAt || Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
  
  return cloudinary.utils.private_download_url(publicId, 'auto', {
    expires_at: timestamp,
  })
}