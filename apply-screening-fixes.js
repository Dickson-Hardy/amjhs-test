import { sql } from './lib/db/index.js';

(async () => {
  try {
    console.log('Applying database fixes for screening workflow...');

    // 1. Fix notification type constraint
    await sql`
      ALTER TABLE notifications 
      DROP CONSTRAINT IF EXISTS notifications_type_check
    `;
    
    await sql`
      ALTER TABLE notifications 
      ADD CONSTRAINT notifications_type_check 
      CHECK (type IN ('submission', 'review', 'publication', 'system', 'screening', 'screening_completed', 'editorial'))
    `;

    console.log('✅ Fixed notification type constraints');

    // 2. Fix manuscript screening constraints (already done but verify)
    await sql`
      ALTER TABLE manuscript_screenings 
      DROP CONSTRAINT IF EXISTS manuscript_screenings_quality_score_check
    `;
    
    await sql`
      ALTER TABLE manuscript_screenings 
      DROP CONSTRAINT IF EXISTS manuscript_screenings_completeness_score_check
    `;

    await sql`
      ALTER TABLE manuscript_screenings 
      ADD CONSTRAINT manuscript_screenings_quality_score_check 
      CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 100))
    `;

    await sql`
      ALTER TABLE manuscript_screenings 
      ADD CONSTRAINT manuscript_screenings_completeness_score_check 
      CHECK (completeness_score IS NULL OR (completeness_score >= 0 AND completeness_score <= 100))
    `;

    console.log('✅ Fixed screening score constraints');

    // 3. Check current constraints
    const constraints = await sql`
      SELECT table_name, constraint_name, check_clause 
      FROM information_schema.check_constraints 
      WHERE table_name IN ('notifications', 'manuscript_screenings')
      ORDER BY table_name, constraint_name
    `;
    
    console.log('Current constraints:', constraints);

    // 4. Clean up any failed screening records
    const failedScreenings = await sql`
      DELETE FROM manuscript_screenings 
      WHERE screening_status IS NULL OR screening_decision IS NULL
      RETURNING id
    `;
    
    console.log('Cleaned up failed screening records:', failedScreenings.length);

    console.log('✅ All database fixes applied successfully!');
    
  } catch (error) {
    console.error('❌ Error applying fixes:', error.message);
  }
  process.exit(0);
})();