# File Upload Fix for Vercel Deployment

## Problem
The application was encountering "Request Entity Too Large" errors and "FUNCTION_PAYLOAD_TOO_LARGE" when uploading supplementary files. This was caused by Vercel's strict payload size limits:

- **Hobby Plan**: 4.5MB request/response limit
- **Pro Plan**: 50MB request/response limit  
- **Function execution time**: 10s (Hobby) / 300s (Pro)

## Solution: Chunked Upload System

### 1. Backend Changes

#### New Chunked Upload API (`/app/api/upload/chunked/route.ts`)
- Accepts file uploads in 3MB chunks
- Maintains upload sessions in memory
- Reassembles chunks when upload is complete
- Uploads final file to Cloudinary
- Provides progress tracking

#### Enhanced Vercel Configuration (`vercel.json`)
- Increased function timeout to 300s for upload endpoints
- Allocated more memory (1024MB) for upload functions
- Specific configurations for both regular and chunked upload endpoints

### 2. Frontend Changes

#### New Chunked Upload Utility (`/lib/chunked-upload.ts`)
- Automatically detects if file needs chunking (>4MB)
- Splits large files into 3MB chunks
- Uploads chunks sequentially
- Provides progress callbacks
- Falls back to regular upload for small files

#### Updated Submit Page (`/app/author/submit/page.tsx`)
- Replaced regular upload with chunked upload
- Added progress tracking
- Better error handling with user-friendly messages
- Improved file size validation with proper formatting

#### Upload Progress Component (`/components/upload-progress.tsx`)
- Visual progress indicator for chunked uploads
- Shows chunk upload progress
- Displays file size and status
- Error state handling

### 3. Infrastructure Changes

#### Nginx Configuration (`nginx.conf`)
- Increased `client_max_body_size` to 100M
- Added extended timeouts for upload operations
- Special handling for `/api/upload` endpoints
- Bypassed rate limiting for file uploads

#### Next.js Configuration (`next.config.mjs`)
- Added `bodySizeLimit: '100mb'` for large payloads

## How It Works

### Small Files (≤4MB)
1. Uses regular `/api/upload` endpoint
2. Single request with base64 encoded file
3. Direct upload to Cloudinary

### Large Files (>4MB)
1. File is split into 3MB chunks
2. Each chunk is uploaded via `/api/upload/chunked`
3. Server maintains upload session in memory
4. When all chunks received, file is reassembled
5. Complete file uploaded to Cloudinary
6. Upload session cleaned up

### Progress Tracking
- Frontend receives progress updates after each chunk
- Users see real-time upload progress
- Chunk-by-chunk status reporting
- Error handling for failed chunks

## File Size Limits

| Category | Limit | Chunked Upload |
|----------|-------|----------------|
| Manuscript | 10MB | Auto-enabled >4MB |
| Supplementary | 50MB | Auto-enabled >4MB |
| Cover Letter | 5MB | Auto-enabled >4MB |
| Ethics Approval | 5MB | Auto-enabled >4MB |
| Conflict Disclosure | 2MB | No (under limit) |

## Error Handling

### Client-Side
- File size validation before upload
- Automatic detection of server error types
- User-friendly error messages
- Progress state management

### Server-Side  
- Content-length checks
- Chunk validation and reassembly
- Upload session cleanup
- Cloudinary error handling

## Deployment Notes

1. **Redeploy after changes** to apply new Vercel configuration
2. **Monitor function execution time** in Vercel dashboard
3. **Check memory usage** for large file uploads
4. **Test with various file sizes** to ensure smooth operation

## Testing

Use files of different sizes to test:
- <1MB: Regular upload
- 1-4MB: Regular upload  
- 4-10MB: Chunked upload (manuscript category)
- 10-50MB: Chunked upload (supplementary category)

## Future Improvements

1. **Redis/Database storage** for upload sessions (current: in-memory)
2. **Parallel chunk uploads** for faster processing
3. **Resume capability** for interrupted uploads
4. **Client-side progress bars** with detailed status
5. **File type validation** on chunk level
6. **Virus scanning** integration

This solution maintains compatibility with Vercel's limits while providing a seamless user experience for large file uploads.