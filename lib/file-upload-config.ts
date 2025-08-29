// File upload configuration and limits
export const FILE_UPLOAD_CONFIG = {
  // Maximum number of files per submission
  MAX_FILES_PER_SUBMISSION: 20,
  
  // Maximum total size for all files combined (in bytes)
  MAX_TOTAL_SIZE: 100 * 1024 * 1024, // 100MB
  
  // Maximum size per individual file (in bytes)
  MAX_FILE_SIZE: 2 * 1024 * 1024, // 2MB
  
  // Allowed file types by category
  ALLOWED_FILE_TYPES: {
    manuscript: ['.doc', '.docx'],
    figures: ['.png', '.jpg', '.jpeg', '.tiff', '.eps', '.svg'],
    tables: ['.doc', '.docx', '.xlsx', '.csv'],
    supplementary: ['.doc', '.docx', '.xlsx', '.csv', '.zip', '.rar'],
    other: ['.doc', '.docx']
  },
  
  // Required file categories
  REQUIRED_FILES: ['manuscript'],
  
  // Optional file categories
  OPTIONAL_FILES: ['figures', 'tables', 'supplementary', 'cover_letter', 'ethics_approval']
}

// File validation utilities
export function validateFileCount(files: File[]): { valid: boolean; message?: string } {
  if (files.length > FILE_UPLOAD_CONFIG.MAX_FILES_PER_SUBMISSION) {
    return {
      valid: false,
      message: `Maximum ${FILE_UPLOAD_CONFIG.MAX_FILES_PER_SUBMISSION} files allowed per submission`
    }
  }
  return { valid: true }
}

export function validateTotalSize(files: File[]): { valid: boolean; message?: string } {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  if (totalSize > FILE_UPLOAD_CONFIG.MAX_TOTAL_SIZE) {
    return {
      valid: false,
      message: `Total file size cannot exceed ${Math.round(FILE_UPLOAD_CONFIG.MAX_TOTAL_SIZE / (1024 * 1024))}MB`
    }
  }
  return { valid: true }
}

export function validateFileSize(file: File): { valid: boolean; message?: string } {
  if (file.size > FILE_UPLOAD_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      message: `File "${file.name}" exceeds maximum size of ${Math.round(FILE_UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024))}MB`
    }
  }
  return { valid: true }
}

export function validateFileType(file: File, category: keyof typeof FILE_UPLOAD_CONFIG.ALLOWED_FILE_TYPES): { valid: boolean; message?: string } {
  const allowedTypes = FILE_UPLOAD_CONFIG.ALLOWED_FILE_TYPES[category]
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
  
  if (!allowedTypes.includes(fileExtension)) {
    return {
      valid: false,
      message: `File type "${fileExtension}" not allowed for ${category}. Allowed types: ${allowedTypes.join(', ')}`
    }
  }
  return { valid: true }
}
