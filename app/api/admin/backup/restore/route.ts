import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { adminLogs } from '@/lib/db/schema'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { backupFile, restoreType = 'database', confirmRestore = false } = await request.json()
    
    if (!confirmRestore) {
      return NextResponse.json(
        { error: 'Restore confirmation required. This will overwrite existing data.' },
        { status: 400 }
      )
    }

    // Log restore initiation
    await db.insert(adminLogs).values({
      action: 'Backup Restore Initiated',
      details: `Starting restore from ${backupFile}`,
      createdAt: new Date(),
      userId: 'admin-user-id', // Would get from auth session
    })

    let restoreResult

    switch (restoreType) {
      case 'database':
        restoreResult = await restoreDatabase(backupFile)
        break
      case 'files':
        restoreResult = await restoreFiles(backupFile)
        break
      case 'full':
        restoreResult = await restoreFull(backupFile)
        break
      default:
        throw new ValidationError('Invalid restore type')
    }

    // Log restore completion
    await db.insert(adminLogs).values({
      action: 'Backup Restore Completed',
      details: `Restore completed successfully from ${backupFile}`,
      createdAt: new Date(),
      userId: 'admin-user-id',
    })

    return NextResponse.json({
      success: true,
      message: 'Restore completed successfully',
      details: restoreResult
    })

  } catch (error) {
    logger.error('Restore failed:', error)
    
    // Log restore failure
    await db.insert(adminLogs).values({
      action: 'Backup Restore Failed',
      details: `Restore failed: ${error}`,
      createdAt: new Date(),
      userId: 'admin-user-id',
    })

    return NextResponse.json(
      { error: 'Restore failed', details: error },
      { status: 500 }
    )
  }
}

async function restoreDatabase(backupFile: string) {
  const backupPath = path.join(process.cwd(), 'backups', 'database', backupFile)
  
  // Check if backup file exists
  try {
    await fs.access(backupPath)
  } catch {
    throw new NotFoundError('Backup file not found')
  }

  const dbUrl = process.env.DATABASE_URL || ''
  let command

  if (backupFile.endsWith('.gz')) {
    // Compressed backup
    command = `gunzip -c "${backupPath}" | psql "${dbUrl}"`
  } else {
    // Uncompressed backup
    command = `psql "${dbUrl}" < "${backupPath}"`
  }

  try {
    await execAsync(command)
    return { type: 'database', status: 'restored', file: backupFile }
  } catch (error) {
    throw new AppError(`Database restore failed: ${error}`)
  }
}

async function restoreFiles(backupFile: string) {
  const backupPath = path.join(process.cwd(), 'backups', 'files', backupFile)
  
  // Check if backup file exists
  try {
    await fs.access(backupPath)
  } catch {
    throw new NotFoundError('Backup file not found')
  }

  // Extract files to their original locations
  const extractPath = process.cwd()
  let command

  if (backupFile.endsWith('.tar.gz')) {
    command = `tar -xzf "${backupPath}" -C "${extractPath}"`
  } else if (backupFile.endsWith('.tar')) {
    command = `tar -xf "${backupPath}" -C "${extractPath}"`
  } else {
    throw new AppError('Unsupported backup file format')
  }

  try {
    await execAsync(command)
    return { type: 'files', status: 'restored', file: backupFile }
  } catch (error) {
    throw new AppError(`Files restore failed: ${error}`)
  }
}

async function restoreFull(manifestFile: string) {
  const manifestPath = path.join(process.cwd(), 'backups', manifestFile)
  
  // Read manifest file
  try {
    const manifestContent = await fs.readFile(manifestPath, 'utf8')
    const manifest = JSON.parse(manifestContent)
    
    const results = []
    
    // Restore database if available
    if (manifest.components?.database) {
      const dbBackupFile = path.basename(manifest.components.database.location)
      const dbResult = await restoreDatabase(dbBackupFile)
      results.push(dbResult)
    }
    
    // Restore files if available
    if (manifest.components?.files) {
      const filesBackupFile = path.basename(manifest.components.files.location)
      const filesResult = await restoreFiles(filesBackupFile)
      results.push(filesResult)
    }
    
    return { type: 'full', status: 'restored', components: results, manifest }
  } catch (error) {
    throw new AppError(`Full restore failed: ${error}`)
  }
}

export async function GET() {
  try {
    // List available backup files
    const backupDirs = [
      { type: 'database', path: path.join(process.cwd(), 'backups', 'database') },
      { type: 'files', path: path.join(process.cwd(), 'backups', 'files') },
      { type: 'manifest', path: path.join(process.cwd(), 'backups') }
    ]

    const availableBackups = []

    for (const dir of backupDirs) {
      try {
        const files = await fs.readdir(dir.path)
        for (const file of files) {
          if (dir.type === 'manifest' && !file.includes('manifest')) continue
          if (dir.type !== 'manifest' && file.includes('manifest')) continue
          
          const filePath = path.join(dir.path, file)
          const stats = await fs.stat(filePath)
          
          availableBackups.push({
            type: dir.type,
            filename: file,
            size: `${Math.round(stats.size / 1024 / 1024 * 100) / 100} MB`,
            created: stats.birthtime.toISOString(),
            modified: stats.mtime.toISOString()
          })
        }
      } catch {
        // Directory doesn't exist or is empty
      }
    }

    return NextResponse.json({
      availableBackups: availableBackups.sort((a, b) => 
        new Date(b.created).getTime() - new Date(a.created).getTime()
      )
    })
  } catch (error) {
    logger.error('Error listing backups:', error)
    return NextResponse.json(
      { error: 'Failed to list available backups' },
      { status: 500 }
    )
  }
}
