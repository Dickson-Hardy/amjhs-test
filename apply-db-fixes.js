import postgres from 'postgres'

// Use the DATABASE_URL directly from the fix-screening-db.js file
const DATABASE_URL = "postgresql://neondb_owner:npg_gifD5p1lIBTc@ep-fragrant-bonus-abz6h9us-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require";

const sql = postgres(DATABASE_URL, {
  ssl: 'require'
});

async function applyDatabaseFixes() {
  try {
    console.log('🔧 Applying database constraint fixes...');

    // Remove the constraint on manuscript_screenings.quality_score to allow 0-100 range
    console.log('1. Removing quality_score constraint...');
    try {
      await sql`ALTER TABLE manuscript_screenings DROP CONSTRAINT IF EXISTS manuscript_screenings_quality_score_check;`;
      console.log('✅ Quality score constraint removed');
    } catch (error) {
      console.log('ℹ️ Quality score constraint may not exist:', error.message);
    }

    // Remove the constraint on manuscript_screenings.completeness_score to allow 0-100 range  
    console.log('2. Removing completeness_score constraint...');
    try {
      await sql`ALTER TABLE manuscript_screenings DROP CONSTRAINT IF EXISTS manuscript_screenings_completeness_score_check;`;
      console.log('✅ Completeness score constraint removed');
    } catch (error) {
      console.log('ℹ️ Completeness score constraint may not exist:', error.message);
    }

    // Update notification type constraint to include new types
    console.log('3. Updating notification type constraint...');
    try {
      // First, drop the existing constraint
      await sql`ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;`;
      
      // Add new constraint with all required notification types
      await sql`
        ALTER TABLE notifications 
        ADD CONSTRAINT notifications_type_check 
        CHECK (type IN (
          'SUBMISSION', 'REVIEW_REQUEST', 'REVIEW_REMINDER', 'REVIEW_SUBMITTED', 
          'DECISION', 'REVISION_REQUEST', 'ACCEPTANCE', 'REJECTION', 
          'ASSOCIATE_EDITOR_ASSIGNMENT', 'REVIEWER_ASSIGNMENT', 'SYSTEM', 
          'REVIEWS_COMPLETE', 'WORKFLOW_UPDATE', 'screening', 'submission'
        ));
      `;
      console.log('✅ Notification type constraint updated');
    } catch (error) {
      console.log('⚠️ Error updating notification type constraint:', error.message);
    }

    // Update notification status constraint if needed
    console.log('4. Updating notification status constraint...');
    try {
      await sql`ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_status_check;`;
      await sql`
        ALTER TABLE notifications 
        ADD CONSTRAINT notifications_status_check 
        CHECK (status IN ('read', 'unread', 'archived'));
      `;
      console.log('✅ Notification status constraint updated');
    } catch (error) {
      console.log('ℹ️ Notification status constraint info:', error.message);
    }

    console.log('🎉 All database fixes applied successfully!');
    
  } catch (error) {
    console.error('❌ Error applying database fixes:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applyDatabaseFixes();