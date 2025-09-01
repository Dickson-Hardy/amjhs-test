import { readFileSync } from 'fs'
import { join } from 'path'
import postgres from 'postgres'

async function runSqlMigration(filename: string) {
  const sql = postgres(process.env.DATABASE_URL!, {
    max: 1, // Single connection for migration
    ssl: "require"
  })

  try {
    console.log(`🚀 Running migration: ${filename}`)
    
    // Read the SQL file
    const sqlContent = readFileSync(join(__dirname, filename), 'utf-8')
    
    // Execute the SQL
    await sql.unsafe(sqlContent)
    
    console.log(`✅ Successfully ran migration: ${filename}`)
  } catch (error) {
    console.error(`❌ Failed to run migration ${filename}:`, error)
    throw error
  } finally {
    await sql.end()
  }
}

async function main() {
  const filename = process.argv[2]
  
  if (!filename) {
    console.error('Usage: npx tsx scripts/run-sql-migration.ts <filename>')
    process.exit(1)
  }
  
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required')
    process.exit(1)
  }
  
  await runSqlMigration(filename)
}

if (require.main === module) {
  main().catch(console.error)
}