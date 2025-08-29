import { logger } from "@/lib/logger";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import { migrate } from "drizzle-orm/neon-http/migrator"

async function runMigrations() {
  logger.info("🚀 Starting database migrations...")
  
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const db = drizzle(sql)
    
    await migrate(db, { migrationsFolder: "./drizzle" })
    
    logger.info("✅ Database migrations completed successfully!")
  } catch (error) {
    logger.error("❌ Migration failed:", error)
    process.exit(1)
  }
}

// Seed initial data
async function seedDatabase() {
  logger.info("🌱 Seeding database with initial data...")
  
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const db = drizzle(sql)
    
    // Import schema
    const { users } = await import("../lib/db/schema")
    const bcrypt = await import("bcryptjs")
    const { v4: uuidv4 } = await import("uuid")
    
    // Create admin user if it doesn't exist
    const adminEmail = process.env.ADMIN_EMAIL || "admin@amhsj.com"
    const adminPassword = process.env.ADMIN_PASSWORD || process.env.DEFAULT_ADMIN_PASSWORD
    
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1)
    
    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12)
      
      await db.insert(users).values({
        id: uuidv4(),
        email: adminEmail,
        name: "System Administrator",
        password: hashedPassword,
        role: "admin",
        isVerified: true,
        isActive: true,
        profileCompleteness: 100,
        lastActiveAt: new Date(),
      })
      
      logger.info(`✅ Admin user created: ${adminEmail}`)
    } else {
      logger.info("ℹ️ Admin user already exists")
    }
    
    logger.info("✅ Database seeding completed!")
  } catch (error) {
    logger.error("❌ Seeding failed:", error)
    process.exit(1)
  }
}

// Database health check
async function healthCheck() {
  logger.info("🔍 Performing database health check...")
  
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const db = drizzle(sql)
    
    // Test basic query
    const result = await sql`SELECT NOW() as current_time`
    logger.info(`✅ Database connected successfully at ${result[0].current_time}`)
    
    // Test schema access
    const { users } = await import("../lib/db/schema")
    const userCount = await db.select().from(users).limit(1)
    logger.info("✅ Schema access verified")
    
    return true
  } catch (error) {
    logger.error("❌ Health check failed:", error)
    return false
  }
}

// Main migration runner
async function main() {
  const command = process.argv[2]
  
  switch (command) {
    case "migrate":
      await runMigrations()
      break
    case "seed":
      await seedDatabase()
      break
    case "health":
      await healthCheck()
      break
    case "setup":
      await runMigrations()
      await seedDatabase()
      await healthCheck()
      break
    default:
      logger.info(`
Usage: node migrate-database.js <command>

Commands:
  migrate  - Run database migrations
  seed     - Seed database with initial data
  health   - Perform database health check
  setup    - Run migrations, seed data, and health check

Environment Variables Required:
  DATABASE_URL     - PostgreSQL connection string
  ADMIN_EMAIL      - Admin user email (optional, default: admin@amhsj.com)
  ADMIN_PASSWORD   - Admin user password (required)
      `)
      process.exit(1)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

export { runMigrations, seedDatabase, healthCheck }
