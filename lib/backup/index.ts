import { backupScheduler } from './scheduler'
import { logInfo } from '@/lib/logger'

// Initialize backup scheduler when the application starts
export function initializeBackupScheduler() {
  if (process.env.NODE_ENV === 'production') {
    logInfo('🔄 Initializing backup scheduler for production...')
    
    // The scheduler is automatically initialized when imported
    // Additional schedules can be added here if needed
    
    logInfo('✅ Backup scheduler initialized')
    
    // Log active schedules
    const activeSchedules = backupScheduler.listActiveSchedules()
    logInfo(`📅 Active backup schedules: ${activeSchedules.length}`)
    
    activeSchedules.forEach(schedule => {
      logInfo(`   - ${schedule.id}: Next run at ${schedule.nextExecution}`)
    })
  } else {
    logInfo('🔧 Backup scheduler disabled in development mode')
  }
}

// Export the scheduler for manual control
export { backupScheduler }
