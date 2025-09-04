import postgres from 'postgres'

const DATABASE_URL = "postgresql://neondb_owner:npg_gifD5p1lIBTc@ep-fragrant-bonus-abz6h9us-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require";

const sql = postgres(DATABASE_URL, {
  ssl: 'require'
});

async function fixNotificationConstraints() {
  try {
    console.log('🔧 Fixing notification type constraints...');

    // Add constraint with all required notification types including the existing 'system' type
    console.log('Adding notification type constraint...');
    await sql`
      ALTER TABLE notifications 
      ADD CONSTRAINT notifications_type_check 
      CHECK (type IN (
        'SUBMISSION', 'REVIEW_REQUEST', 'REVIEW_REMINDER', 'REVIEW_SUBMITTED', 
        'DECISION', 'REVISION_REQUEST', 'ACCEPTANCE', 'REJECTION', 
        'ASSOCIATE_EDITOR_ASSIGNMENT', 'REVIEWER_ASSIGNMENT', 'SYSTEM', 
        'REVIEWS_COMPLETE', 'WORKFLOW_UPDATE', 'screening', 'submission', 'system'
      ));
    `;
    console.log('✅ Notification type constraint added successfully');

    console.log('🎉 Notification constraints fixed!');
    
  } catch (error) {
    console.error('❌ Error fixing notification constraints:', error);
  } finally {
    await sql.end();
  }
}

fixNotificationConstraints();