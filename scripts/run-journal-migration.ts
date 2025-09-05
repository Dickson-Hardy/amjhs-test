import { sql } from "@/lib/db"
import fs from "fs"
import path from "path"

async function runMigration() {
  try {
    console.log("Running journal metrics migration...")
    
    const migrationPath = path.join(process.cwd(), "migrations", "add-journal-metrics.sql")
    const migrationSQL = fs.readFileSync(migrationPath, "utf8")
    
    // Split the SQL by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
    
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`)
      await sql.unsafe(statement)
    }
    
    console.log("✅ Journal metrics table created successfully!")
    
    // Verify the data was inserted
    const result = await sql`SELECT * FROM journal_metrics WHERE id = 'current'`
    console.log("✅ Verification:", result[0])
    
  } catch (error) {
    console.error("❌ Migration error:", error)
  } finally {
    process.exit()
  }
}

runMigration()