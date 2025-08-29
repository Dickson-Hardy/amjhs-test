import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

// Create connection with pooling - postgres.js supports transactions
const sql = postgres(process.env.DATABASE_URL!, {
  max: 20, // Maximum number of connections
  idle_timeout: 20, // Idle timeout in seconds
  connect_timeout: 10, // Connect timeout in seconds
  ssl: "require", // Require SSL for Neon
})

// Create Drizzle instance with schema
export const db = drizzle(sql, { 
  schema,
  logger: process.env.NODE_ENV === "development",
})

// Expose raw SQL connection for direct queries
export { sql }

// Database health check function
export async function testConnection() {
  try {
    const result = await sql`SELECT 1 as test`
    return result[0].test === 1
  } catch (error) {
    logger.error("Database connection failed:", error)
    return false
  }
}

// Connection status monitoring
export async function getConnectionStatus() {
  try {
    const start = Date.now()
    await sql`SELECT 1`
    const latency = Date.now() - start
    
    return {
      connected: true,
      latency,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }
  }
}
