import postgres from 'postgres';

// Use the DATABASE_URL directly from environment
const DATABASE_URL = "postgresql://neondb_owner:npg_gifD5p1lIBTc@ep-fragrant-bonus-abz6h9us-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require";

const sql = postgres(DATABASE_URL, {
  ssl: "require"
});

async function fixScreeningConstraints() {
  try {
    console.log('🔧 Fixing manuscript screening score constraints...');
    
    // Check current constraints
    console.log('📋 Checking current constraints...');
    const currentConstraints = await sql`
      SELECT conname as constraint_name, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'manuscript_screenings'::regclass 
      AND conname LIKE '%score%'
    `;
    
    console.log('Current constraints:', currentConstraints);
    
    // Drop existing constraints if they exist
    console.log('🗑️ Dropping old constraints...');
    try {
      await sql`
        ALTER TABLE manuscript_screenings 
        DROP CONSTRAINT IF EXISTS manuscript_screenings_quality_score_check
      `;
      console.log('✅ Dropped quality_score constraint');
    } catch (e) {
      console.log('ℹ️ Quality score constraint may not exist');
    }
    
    try {
      await sql`
        ALTER TABLE manuscript_screenings 
        DROP CONSTRAINT IF EXISTS manuscript_screenings_completeness_score_check
      `;
      console.log('✅ Dropped completeness_score constraint');
    } catch (e) {
      console.log('ℹ️ Completeness score constraint may not exist');
    }
    
    // Add new constraints for 0-100 scale
    console.log('➕ Adding new constraints for 0-100 scale...');
    
    await sql`
      ALTER TABLE manuscript_screenings 
      ADD CONSTRAINT manuscript_screenings_quality_score_check 
      CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 100))
    `;
    console.log('✅ Added quality_score constraint (0-100)');
    
    await sql`
      ALTER TABLE manuscript_screenings 
      ADD CONSTRAINT manuscript_screenings_completeness_score_check 
      CHECK (completeness_score IS NULL OR (completeness_score >= 0 AND completeness_score <= 100))
    `;
    console.log('✅ Added completeness_score constraint (0-100)');
    
    // Verify the changes
    console.log('🔍 Verifying new constraints...');
    const newConstraints = await sql`
      SELECT conname as constraint_name, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'manuscript_screenings'::regclass 
      AND conname LIKE '%score%'
    `;
    
    console.log('New constraints:', newConstraints);
    
    // Check current screening records
    console.log('📊 Checking current screening records...');
    const recordCount = await sql`SELECT COUNT(*) as count FROM manuscript_screenings`;
    console.log(`Current manuscript_screenings records: ${recordCount[0].count}`);
    
    console.log('🎉 Constraint fix completed successfully!');
    console.log('📝 Summary:');
    console.log('   - Score constraints updated to allow 0-100 range');
    console.log('   - Previous screening failures should now work');
    console.log('   - Application can now save screening results properly');
    
  } catch (error) {
    console.error('❌ Error fixing constraints:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the fix
fixScreeningConstraints()
  .then(() => {
    console.log('✨ All done! Try running the screening process again.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to fix constraints:', error);
    process.exit(1);
  });