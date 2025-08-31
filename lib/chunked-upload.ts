// Utility for chunked file uploads to work around Vercel payload limits
export interface ChunkedUploadOptions {
  onProgress?: (progress: { chunksUploaded: number; totalChunks: number; percentage: number }) => void
  chunkSize?: number // Default 3MB to stay well under Vercel's 4.5MB limit
}

export interface UploadResult {
  success: boolean
  file?: {
    id: string
    originalName: string
    url: string
    downloadUrl: string
    previewUrl: string
  }
  error?: string
}

export async function uploadFileChunked(
  file: File, 
  category: string, 
  description?: string,
  options: ChunkedUploadOptions = {}
): Promise<UploadResult> {
  const { onProgress, chunkSize = 3 * 1024 * 1024 } = options // 3MB chunks
  
  try {
    // Check if file is small enough for regular upload
    if (file.size <= 4 * 1024 * 1024) { // 4MB or smaller
      return await uploadFileRegular(file, category, description)
    }

    // Calculate chunks
    const totalChunks = Math.ceil(file.size / chunkSize)
    let uploadId: string | undefined

    // Upload chunks sequentially
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const chunk = file.slice(start, end)

      // Convert chunk to base64
      const chunkBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          // Remove data URL prefix if present
          const base64 = result.includes(',') ? result.split(',')[1] : result
          resolve(base64)
        }
        reader.readAsDataURL(chunk)
      })

      // Upload chunk
      const response = await fetch('/api/upload/chunked', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uploadId,
          fileName: file.name,
          fileType: file.type,
          totalSize: file.size,
          chunkIndex,
          totalChunks,
          chunkData: chunkBase64,
          category,
          description
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Chunk upload failed: ${errorText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Chunk upload failed')
      }

      // Store upload ID from first chunk
      if (chunkIndex === 0 && result.uploadId) {
        uploadId = result.uploadId
      }

      // Report progress
      if (onProgress) {
        onProgress({
          chunksUploaded: chunkIndex + 1,
          totalChunks,
          percentage: Math.round(((chunkIndex + 1) / totalChunks) * 100)
        })
      }

      // If upload is complete, return result
      if (result.completed) {
        return {
          success: true,
          file: result.file
        }
      }
    }

    throw new Error('Upload completed but no final result received')

  } catch (error) {
    console.error('Chunked upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}

// Fallback to regular upload for smaller files
async function uploadFileRegular(file: File, category: string, description?: string): Promise<UploadResult> {
  try {
    // Convert file to base64
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileData: base64,
        category,
        description
      })
    })

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text()
      
      if (textResponse.includes('Request Entity Too Large') || textResponse.includes('413')) {
        throw new Error('File too large for regular upload. Please try again with chunked upload.')
      } else if (textResponse.includes('timeout') || textResponse.includes('504') || textResponse.includes('502')) {
        throw new Error('Upload timeout. Please try again.')
      } else {
        throw new Error('Server error. Please try again later.')
      }
    }

    const result = await response.json()

    if (response.ok && result.success) {
      return {
        success: true,
        file: {
          id: result.file.id,
          originalName: result.file.originalName,
          url: result.file.url,
          downloadUrl: result.file.downloadUrl,
          previewUrl: result.file.previewUrl
        }
      }
    } else {
      throw new Error(result.error || 'Upload failed')
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}

// Helper to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}