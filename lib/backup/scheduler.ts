import cron from 'node-cron'
import { db } from '@/lib/db'
import { adminLogs } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'
import { logError, logInfo, logWarn } from '@/lib/logger'

// Simple error classes since @/lib/errors doesn't exist
class AppError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AppError'
  }
}

function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

interface BackupSchedule {
  id: string
  name: string
  frequency: string
  time: string
  backupType: 'database' | 'files' | 'full'
  storage: 'local' | 's3' | 'cloudinary'
  enabled: boolean
  cronExpression: string
}

class BackupScheduler {
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map()

  constructor() {
    this.initializeDefaultSchedules()
  }

  private initializeDefaultSchedules() {
    // Default daily database backup at 2:00 AM
    this.addSchedule({
      id: 'daily-database',
      name: 'Daily Database Backup',
      frequency: 'daily',
      time: '02:00',
      backupType: 'database',
      storage: 's3',
      enabled: true,
      cronExpression: '0 2 * * *'
    })

    // Default weekly full backup on Sunday at 1:00 AM
    this.addSchedule({
      id: 'weekly-full',
      name: 'Weekly Full Backup',
      frequency: 'weekly',
      time: '01:00',
      backupType: 'full',
      storage: 's3',
      enabled: true,
      cronExpression: '0 1 * * 0'
    })
  }

  addSchedule(schedule: BackupSchedule) {
    if (!schedule.enabled) {
      logInfo(`Schedule ${schedule.name} is disabled, skipping...`)
      return
    }

    try {
      const task = cron.schedule(schedule.cronExpression, async () => {
        await this.executeBackup(schedule)
      }, {
        scheduled: true,
        timezone: "America/New_York" // Adjust to your timezone
      })

      this.scheduledJobs.set(schedule.id, task)
      logInfo(`✅ Scheduled: ${schedule.name} - ${schedule.cronExpression}`)

      // Log schedule creation
      this.logActivity('Backup Schedule Created', `Scheduled ${schedule.name} with cron: ${schedule.cronExpression}`)

    } catch (error) {
      logError(error as Error, {
        context: 'addSchedule',
        scheduleName: schedule.name,
        cronExpression: schedule.cronExpression
      })
      this.logActivity('Backup Schedule Failed', `Failed to schedule ${schedule.name}: ${error}`)
    }
  }

  removeSchedule(scheduleId: string) {
    const task = this.scheduledJobs.get(scheduleId)
    if (task) {
      task.stop()
      task.destroy()
      this.scheduledJobs.delete(scheduleId)
      logInfo(`🗑️ Removed schedule: ${scheduleId}`)
      this.logActivity('Backup Schedule Removed', `Removed backup schedule: ${scheduleId}`)
    }
  }

  private async executeBackup(schedule: BackupSchedule) {
    try {
      logInfo(`🔄 Starting scheduled backup: ${schedule.name}`)
      
      // Log backup start
      await this.logActivity('Scheduled Backup Started', `Starting ${schedule.backupType} backup to ${schedule.storage}`)

      // Make API call to create backup
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL'}/api/admin/backup/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: schedule.backupType,
          storage: schedule.storage,
          compression: true,
          encryption: true
        })
      })

      const result = await response.json()

      if (response.ok) {
        logInfo(`✅ Scheduled backup completed: ${schedule.name}`)
        logInfo(`   Size: ${result.size}`)
        logInfo(`   Location: ${result.location}`)
        
        await this.logActivity('Scheduled Backup Completed', 
          `${schedule.name} completed successfully. Size: ${result.size}, Location: ${result.location}`)

        // Send success notification if configured
        await this.sendNotification('success', schedule, result)
      } else {
        throw new AppError(result.error || 'Unknown backup error')
      }

    } catch (error) {
      logError(error as Error, {
        context: 'executeBackup',
        scheduleName: schedule.name,
        backupType: schedule.backupType
      })
      await this.logActivity('Scheduled Backup Failed', `${schedule.name} failed: ${error}`)
      
      // Send failure notification
      await this.sendNotification('failure', schedule, { error: error.toString() })
    }
  }

  private async logActivity(action: string, details: string) {
    try {
      // Use the actual admin_logs table structure
      await db.execute(sql`
        INSERT INTO admin_logs (action, performed_by, details, created_at)
        VALUES (${action}, ${'backup-system'}, ${JSON.stringify({ details, ipAddress: 'localhost', userAgent: 'backup-scheduler' })}, NOW())
      `)
    } catch (error) {
      // If the insert fails, just log it and continue
      // This prevents backup operations from failing due to logging issues
      logWarn(`Failed to log backup activity (continuing without logging): ${isAppError(error) ? error.message : (error instanceof Error ? error.message : String(error))}`)
    }
  }

  private async sendNotification(type: 'success' | 'failure', schedule: BackupSchedule, result: unknown) {
    // Only send notifications if email settings are configured
    if (!process.env.SMTP_HOST || !process.env.BACKUP_NOTIFICATION_EMAIL) {
      return
    }

    try {
      const nodemailer = require('nodemailer')
      
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      })

      const subject = type === 'success' 
        ? `✅ Backup Success: ${schedule.name}`
        : `❌ Backup Failed: ${schedule.name}`

      const text = type === 'success'
        ? `Backup completed successfully!\n\nSchedule: ${schedule.name}\nType: ${schedule.backupType}\nStorage: ${schedule.storage}\nSize: ${result.size}\nLocation: ${result.location}\nTime: ${new Date().toISOString()}`
        : `Backup failed!\n\nSchedule: ${schedule.name}\nType: ${schedule.backupType}\nStorage: ${schedule.storage}\nError: ${result.error}\nTime: ${new Date().toISOString()}`

      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.BACKUP_NOTIFICATION_EMAIL,
        subject,
        text
      })

      logInfo(`📧 Notification sent for ${schedule.name}`)
    } catch (error) {
      logError(error as Error, {
        context: 'sendNotification',
        scheduleName: schedule.name,
        notificationType: type
      })
    }
  }

  listActiveSchedules() {
    const schedules = []
    for (const [id, task] of this.scheduledJobs) {
      schedules.push({
        id,
        running: task.getStatus() === 'scheduled',
        nextExecution: 'Next execution time not available'
      })
    }
    return schedules
  }

  stopAllSchedules() {
    logInfo('🛑 Stopping all backup schedules...')
    for (const [id, task] of this.scheduledJobs) {
      task.stop()
      task.destroy()
    }
    this.scheduledJobs.clear()
    logInfo('✅ All backup schedules stopped')
  }
}

// Export singleton instance
export const backupScheduler = new BackupScheduler()

// Graceful shutdown handling
process.on('SIGINT', () => {
  logInfo('📝 Gracefully shutting down backup scheduler...')
  backupScheduler.stopAllSchedules()
  process.exit(0)
})

process.on('SIGTERM', () => {
  logInfo('📝 Gracefully shutting down backup scheduler...')
  backupScheduler.stopAllSchedules()
  process.exit(0)
})
