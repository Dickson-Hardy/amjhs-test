import { sql } from "@/lib/db"

async function updateJournalMetrics() {
  try {
    console.log("Updating journal metrics with correct data...")
    
    // Update the existing record with correct values
    await sql`
      UPDATE journal_metrics 
      SET 
        impact_factor = NULL,
        jci_score = NULL,
        h_index = NULL,
        total_citations = 0,
        online_issn = NULL,
        print_issn = NULL,
        established_year = 2025,
        publisher = 'AMHSJ Publishing',
        frequency = 'By volumes (continuous publishing)',
        subject_areas = '["Medicine", "Health Sciences", "Clinical Research", "Public Health", "Biomedical Sciences", "Medical Education", "Healthcare Policy"]'::jsonb,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 'current'
    `
    
    console.log("✅ Journal metrics updated successfully!")
    
    // Verify the updated data
    const result = await sql`SELECT * FROM journal_metrics WHERE id = 'current'`
    console.log("✅ Updated data:", result[0])
    
  } catch (error) {
    console.error("❌ Update error:", error)
  } finally {
    process.exit()
  }
}

updateJournalMetrics()