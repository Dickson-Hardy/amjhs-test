import { sql } from "@/lib/db"

async function testScreeningWorkflow() {
  try {
    console.log("🧪 Testing Editorial Screening Workflow...")
    
    // Test 1: Check for submissions in editorial_assistant_review status
    console.log("\n1. Checking for submissions needing screening...")
    const pendingScreenings = await sql`
      SELECT s.id, s.status, s.created_at, a.title 
      FROM submissions s 
      LEFT JOIN articles a ON s.article_id = a.id 
      WHERE s.status = 'editorial_assistant_review'
      LIMIT 5
    `
    
    console.log(`Found ${pendingScreenings.length} submissions needing screening:`)
    pendingScreenings.forEach(sub => {
      console.log(`- ${sub.id}: "${sub.title}" (Status: ${sub.status})`)
    })
    
    // Test 2: Check for submissions in editor_in_chief_review status
    console.log("\n2. Checking for submissions awaiting Editor-in-Chief review...")
    const eicReview = await sql`
      SELECT s.id, s.status, s.created_at, a.title 
      FROM submissions s 
      LEFT JOIN articles a ON s.article_id = a.id 
      WHERE s.status = 'editor_in_chief_review'
      LIMIT 5
    `
    
    console.log(`Found ${eicReview.length} submissions awaiting EIC review:`)
    eicReview.forEach(sub => {
      console.log(`- ${sub.id}: "${sub.title}" (Status: ${sub.status})`)
    })
    
    // Test 3: Check screening records
    console.log("\n3. Checking recent screening records...")
    const screenings = await sql`
      SELECT ms.manuscript_id, ms.screening_status, ms.screening_decision, ms.created_at
      FROM manuscript_screenings ms
      ORDER BY ms.created_at DESC
      LIMIT 5
    `
    
    console.log(`Found ${screenings.length} recent screening records:`)
    screenings.forEach(screening => {
      console.log(`- ${screening.manuscript_id}: ${screening.screening_status} (${screening.screening_decision})`)
    })
    
    // Test 4: Check status transitions
    console.log("\n4. Testing status transitions...")
    const { canTransition } = await import("@/lib/status")
    
    const transitions = [
      { from: "submitted", to: "editorial_assistant_review" },
      { from: "editorial_assistant_review", to: "editor_in_chief_review" },
      { from: "editor_in_chief_review", to: "associate_editor_assignment" },
      { from: "associate_editor_assignment", to: "associate_editor_review" }
    ]
    
    transitions.forEach(({ from, to }) => {
      const valid = canTransition(from, to)
      console.log(`${from} → ${to}: ${valid ? '✅' : '❌'}`)
    })
    
    console.log("\n✅ Workflow test completed!")
    
  } catch (error) {
    console.error("❌ Test error:", error)
  } finally {
    process.exit()
  }
}

testScreeningWorkflow()