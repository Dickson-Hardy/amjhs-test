import { sql } from "@/lib/db"

async function clearScreeningRecords() {
  try {
    console.log("🧹 Clearing all screening records and resetting submissions...")
    
    // Step 1: Show current state
    console.log("\n1. Current state before cleanup:")
    const currentScreenings = await sql`SELECT COUNT(*) as count FROM manuscript_screenings`
    console.log(`- Screening records: ${currentScreenings[0].count}`)
    
    const currentSubmissions = await sql`
      SELECT status, COUNT(*) as count 
      FROM submissions 
      GROUP BY status 
      ORDER BY status
    `
    console.log("- Submissions by status:")
    currentSubmissions.forEach(sub => {
      console.log(`  ${sub.status}: ${sub.count}`)
    })
    
    // Step 2: Clear all screening records
    console.log("\n2. Clearing all screening records...")
    const deletedScreenings = await sql`DELETE FROM manuscript_screenings`
    console.log(`✅ Deleted ${deletedScreenings.length} screening records`)
    
    // Step 3: Reset submissions that were in screening/review status back to editorial_assistant_review
    console.log("\n3. Resetting submission statuses...")
    const resetSubmissions = await sql`
      UPDATE submissions 
      SET 
        status = 'editorial_assistant_review',
        updated_at = NOW()
      WHERE status IN (
        'submitted',
        'associate_editor_assignment',
        'associate_editor_review', 
        'editor_in_chief_review',
        'screening_completed',
        'screening'
      )
    `
    console.log(`✅ Reset ${resetSubmissions.length} submissions to editorial_assistant_review status`)
    
    // Step 4: Reset articles that had editors assigned
    console.log("\n4. Clearing editor assignments...")
    const resetArticles = await sql`
      UPDATE articles 
      SET 
        editor_id = NULL,
        status = 'editorial_assistant_review',
        updated_at = NOW()
      WHERE status IN (
        'associate_editor_review',
        'under_review',
        'screening_completed'
      )
    `
    console.log(`✅ Cleared editor assignments from ${resetArticles.length} articles`)
    
    // Step 5: Clear editor assignment records
    console.log("\n5. Clearing editor assignment records...")
    const deletedAssignments = await sql`DELETE FROM editor_assignments`
    console.log(`✅ Deleted ${deletedAssignments.length} editor assignment records`)
    
    // Step 6: Show final state
    console.log("\n6. Final state after cleanup:")
    const finalSubmissions = await sql`
      SELECT s.id, s.status, a.title, a.editor_id
      FROM submissions s 
      LEFT JOIN articles a ON s.article_id = a.id 
      WHERE s.status = 'editorial_assistant_review'
      ORDER BY s.created_at DESC
      LIMIT 10
    `
    console.log(`- Submissions ready for screening: ${finalSubmissions.length}`)
    finalSubmissions.forEach(sub => {
      console.log(`  • ${sub.id}: "${sub.title}" (Editor: ${sub.editor_id || 'None'})`)
    })
    
    const finalScreeningCount = await sql`SELECT COUNT(*) as count FROM manuscript_screenings`
    console.log(`- Remaining screening records: ${finalScreeningCount[0].count}`)
    
    console.log("\n✅ Cleanup completed! The editorial screening system is now ready for fresh testing.")
    console.log("\n📋 Next steps:")
    console.log("1. Go to /editorial-assistant/screening to see submissions needing screening")
    console.log("2. Complete the screening process for a submission")
    console.log("3. Verify it goes to editor-in-chief review instead of auto-assigning to associate editor")
    
  } catch (error) {
    console.error("❌ Cleanup error:", error)
  } finally {
    process.exit()
  }
}

clearScreeningRecords()