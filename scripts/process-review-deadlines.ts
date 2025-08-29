// scripts/process-review-deadlines.ts

import { logger } from "@/lib/logger";
import { reviewDeadlineManager } from '../lib/review-deadline-manager'

/**
 * Scheduled script to process review invitation deadlines
 * This should be run daily via cron job or similar scheduler
 */
async function processReviewDeadlines() {
  logger.info('🕒 Starting scheduled review deadline processing...')
  logger.info('Time:', new Date().toISOString())
  
  try {
    const results = await reviewDeadlineManager.processDeadlines()
    
    logger.info('\n📊 Processing Results:')
    logger.info(`✉️  Reminders sent: ${results.remindersProcessed}`)
    logger.info(`🚫 Withdrawals processed: ${results.withdrawalsProcessed}`)
    logger.info(`❌ Errors encountered: ${results.errors.length}`)
    
    if (results.errors.length > 0) {
      logger.info('\n🚨 Errors:')
      results.errors.forEach((error, index) => {
        logger.info(`   ${index + 1}. ${error}`)
      })
    }
    
    logger.info('\n✅ Scheduled deadline processing completed successfully')
    process.exit(0)
    
  } catch (error) {
    logger.error('\n❌ Fatal error during deadline processing:', error)
    process.exit(1)
  }
}

// Run if this script is executed directly
if (require.main === module) {
  processReviewDeadlines()
}

export { processReviewDeadlines }
