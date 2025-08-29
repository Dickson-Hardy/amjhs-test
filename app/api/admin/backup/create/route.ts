import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { adminLogs } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'

const execAsync = promisify(exec)

interface BackupConfig {
  type: 'database' | 'files' | 'full'
  storage: 'local' | 'cloudinary' | 's3'
  compression: boolean
  encryption: boolean
}

export async function POST(request: NextRequest) {
  try {
    const { type = 'full', storage = 's3', compression = true, encryption = true }: BackupConfig = await request.json()
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupId = `backup-${timestamp}-${crypto.randomUUID().slice(0, 8)}`
    
    // Log backup initiation
    await db.insert(adminLogs).values({
      id: crypto.randomUUID(),
      adminId: 'admin-user-id', // Would get from auth session
      adminEmail: 'process.env.EMAIL_FROMjournal.com',
      action: 'Backup Initiated',
      resourceType: 'backup',
      resourceId: backupId,
      details: `Starting ${type} backup to ${storage} storage`,
      createdAt: new Date(),
    })

    let backupResult

    switch (type) {
      case 'database':
        backupResult = await createDatabaseBackup(backupId, storage, compression, encryption)
        break
      case 'files':
        backupResult = await createFilesBackup(backupId, storage, compression, encryption)
        break
      case 'full':
        backupResult = await createFullBackup(backupId, storage, compression, encryption)
        break
      default:
        throw new ValidationError('Invalid backup type')
    }

    // Log backup completion
    await db.insert(adminLogs).values({
      id: crypto.randomUUID(),
      adminId: 'admin-user-id',
      adminEmail: 'process.env.EMAIL_FROMjournal.com',
      action: 'Backup Completed',
      resourceType: 'backup',
      resourceId: backupId,
      details: `${type} backup completed successfully. Size: ${backupResult.size}, Location: ${backupResult.location}`,
      createdAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      backupId,
      type,
      storage,
      size: backupResult.size,
      location: backupResult.location,
      downloadUrl: backupResult.downloadUrl,
      message: 'Backup created successfully'
    })

  } catch (error) {
    logger.error('Backup creation failed:', error)
    
    // Log backup failure
    await db.insert(adminLogs).values({
      id: crypto.randomUUID(),
      adminId: 'admin-user-id',
      adminEmail: 'process.env.EMAIL_FROMjournal.com',
      action: 'Backup Failed',
      resourceType: 'backup',
      resourceId: 'failed-backup',
      details: `Backup failed: ${error}`,
      createdAt: new Date(),
    })

    return NextResponse.json(
      { error: 'Backup creation failed', details: error },
      { status: 500 }
    )
  }
}

async function createDatabaseBackup(backupId: string, storage: string, compression: boolean, encryption: boolean) {
  const backupPath = path.join(process.cwd(), 'backups', 'database')
  await fs.mkdir(backupPath, { recursive: true })
  
  const filename = `${backupId}-database.sql${compression ? '.gz' : ''}`
  const filePath = path.join(backupPath, filename)
  
  // Create PostgreSQL dump
  const dbUrl = process.env.DATABASE_URL || ''
  let command = `pg_dump "${dbUrl}" --no-owner --no-privileges`
  
  if (compression) {
    command += ' | gzip'
  }
  
  command += ` > "${filePath}"`
  
  try {
    await execAsync(command)
    
    // Get file size
    const stats = await fs.stat(filePath)
    const size = `${Math.round(stats.size / 1024 / 1024 * 100) / 100} MB`
    
    // Upload to cloud storage if specified
    let location = filePath
    let downloadUrl = `/api/admin/backup/download/${path.basename(filePath)}`
    
    if (storage !== 'local') {
      const uploadResult = await uploadToCloudStorage(filePath, filename, storage)
      location = uploadResult.location
      downloadUrl = uploadResult.downloadUrl
      
      // Optionally remove local file after cloud upload
      // await fs.unlink(filePath)
    }
    
    return { size, location, downloadUrl }
  } catch (error) {
    throw new AppError(`Database backup failed: ${error}`)
  }
}

async function createFilesBackup(backupId: string, storage: string, compression: boolean, encryption: boolean) {
  const backupPath = path.join(process.cwd(), 'backups', 'files')
  await fs.mkdir(backupPath, { recursive: true })
  
  const filename = `${backupId}-files.tar${compression ? '.gz' : ''}`
  const filePath = path.join(backupPath, filename)
  
  // Create tar archive of uploads and public files
  const sourcePaths = [
    path.join(process.cwd(), 'public', 'uploads'),
    path.join(process.cwd(), 'storage', 'submissions'),
    path.join(process.cwd(), 'storage', 'reviews')
  ]
  
  let command = `tar ${compression ? '-czf' : '-cf'} "${filePath}"`
  
  // Add existing directories to backup
  for (const sourcePath of sourcePaths) {
    try {
      await fs.access(sourcePath)
      command += ` "${sourcePath}"`
    } catch {
      // Directory doesn't exist, skip it
    }
  }
  
  try {
    await execAsync(command)
    
    const stats = await fs.stat(filePath)
    const size = `${Math.round(stats.size / 1024 / 1024 * 100) / 100} MB`
    
    let location = filePath
    let downloadUrl = `/api/admin/backup/download/${path.basename(filePath)}`
    
    if (storage !== 'local') {
      const uploadResult = await uploadToCloudStorage(filePath, filename, storage)
      location = uploadResult.location
      downloadUrl = uploadResult.downloadUrl
    }
    
    return { size, location, downloadUrl }
  } catch (error) {
    throw new AppError(`Files backup failed: ${error}`)
  }
}

async function createFullBackup(backupId: string, storage: string, compression: boolean, encryption: boolean) {
  const dbBackup = await createDatabaseBackup(`${backupId}-db`, storage, compression, encryption)
  const filesBackup = await createFilesBackup(`${backupId}-files`, storage, compression, encryption)
  
  // Create manifest file
  const manifestPath = path.join(process.cwd(), 'backups', `${backupId}-manifest.json`)
  const manifest = {
    backupId,
    createdAt: new Date().toISOString(),
    type: 'full',
    storage,
    compression,
    encryption,
    components: {
      database: dbBackup,
      files: filesBackup
    },
    version: process.env.npm_package_version || '1.0.0',
    nodeVersion: process.version
  }
  
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2))
  
  if (storage !== 'local') {
    await uploadToCloudStorage(manifestPath, `${backupId}-manifest.json`, storage)
  }
  
  const totalSizeNum = parseFloat(dbBackup.size.split(' ')[0]) + parseFloat(filesBackup.size.split(' ')[0])
  const totalSize = `${Math.round(totalSizeNum * 100) / 100} MB`
  
  return {
    size: totalSize,
    location: `Multiple locations - see manifest`,
    downloadUrl: `/api/admin/backup/download/${backupId}-manifest.json`
  }
}

async function uploadToCloudStorage(filePath: string, filename: string, storage: string) {
  switch (storage) {
    case 'cloudinary':
      return await uploadToCloudinary(filePath, filename)
    case 's3':
      return await uploadToS3(filePath, filename)
    default:
      throw new AppError(`Unsupported storage type: ${storage}`)
  }
}

async function uploadToCloudinary(filePath: string, filename: string) {
  // Cloudinary implementation (better for images, but can handle other files)
  const cloudinary = require('cloudinary').v2
  
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  })
  
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'raw', // For non-image files
      folder: 'amjhs-backups',
      public_id: filename.replace(/\.[^/.]+$/, ''), // Remove extension
      tags: ['backup', 'journal-system']
    })
    
    return {
      location: result.secure_url,
      downloadUrl: result.secure_url
    }
  } catch (error) {
    throw new AppError(`Cloudinary upload failed: ${error}`)
  }
}

async function uploadToS3(filePath: string, filename: string) {
  // AWS S3 implementation (recommended for backups)
  const AWS = require('aws-sdk')
  
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
  })
  
  const fileContent = await fs.readFile(filePath)
  const bucketName = process.env.AWS_S3_BACKUP_BUCKET || 'amjhs-backups'
  
  const params = {
    Bucket: bucketName,
    Key: `backups/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${filename}`,
    Body: fileContent,
    ServerSideEncryption: 'AES256',
    StorageClass: 'STANDARD_IA', // Infrequent Access for cost savings
    Metadata: {
      'backup-type': 'journal-system',
      'created-by': 'amjhs-admin'
    }
  }
  
  try {
    const result = await s3.upload(params).promise()
    
    // Generate presigned URL for download (valid for 24 hours)
    const downloadUrl = s3.getSignedUrl('getObject', {
      Bucket: bucketName,
      Key: params.Key,
      Expires: 86400 // 24 hours
    })
    
    return {
      location: result.Location,
      downloadUrl
    }
  } catch (error) {
    throw new AppError(`S3 upload failed: ${error}`)
  }
}

export async function GET() {
  try {
    // Get backup history from admin logs
    const backupLogs = await db
      .select({
        action: adminLogs.action,
        details: adminLogs.details,
        createdAt: adminLogs.createdAt,
        adminId: adminLogs.adminId
      })
      .from(adminLogs)
      .where(eq(adminLogs.action, 'Backup Completed'))
      .orderBy(desc(adminLogs.createdAt))
      .limit(20)

    return NextResponse.json({
      backupHistory: backupLogs,
      storageOptions: ['local', 's3', 'cloudinary'],
      backupTypes: ['database', 'files', 'full']
    })
  } catch (error) {
    logger.error('Error fetching backup history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch backup history' },
      { status: 500 }
    )
  }
}
