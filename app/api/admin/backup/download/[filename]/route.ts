import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { adminLogs } from '@/lib/db/schema'
import path from 'path'
import fs from 'fs/promises'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params
    
    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      )
    }

    // Log download request
    await db.insert(adminLogs).values({
      action: 'Backup Downloaded',
      details: `Backup file ${filename} was downloaded`,
      createdAt: new Date(),
      userId: 'admin-user-id', // Would get from auth session
    })

    // Determine backup type from filename
    let backupPath: string
    if (filename.includes('-database.')) {
      backupPath = path.join(process.cwd(), 'backups', 'database', filename)
    } else if (filename.includes('-files.')) {
      backupPath = path.join(process.cwd(), 'backups', 'files', filename)
    } else if (filename.includes('-manifest.')) {
      backupPath = path.join(process.cwd(), 'backups', filename)
    } else {
      return NextResponse.json(
        { error: 'Unknown backup file type' },
        { status: 400 }
      )
    }

    // Check if file exists
    try {
      await fs.access(backupPath)
    } catch {
      return NextResponse.json(
        { error: 'Backup file not found' },
        { status: 404 }
      )
    }

    // Read file
    const fileBuffer = await fs.readFile(backupPath)
    
    // Determine content type
    let contentType = 'application/octet-stream'
    if (filename.endsWith('.sql')) {
      contentType = 'application/sql'
    } else if (filename.endsWith('.gz')) {
      contentType = 'application/gzip'
    } else if (filename.endsWith('.tar')) {
      contentType = 'application/x-tar'
    } else if (filename.endsWith('.json')) {
      contentType = 'application/json'
    }

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    logger.error('Error downloading backup:', error)
    return NextResponse.json(
      { error: 'Failed to download backup file' },
      { status: 500 }
    )
  }
}
