import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { users } from "./lib/db/schema.ts"
import { eq } from "drizzle-orm"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is required')
}

const client = postgres(connectionString)
const db = drizzle(client)

async function checkEditorialAssistants() {
  try {
    const assistants = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive
    })
    .from(users)
    .where(eq(users.role, "editorial-assistant"))

    console.log('Editorial assistants found:', assistants.length)
    console.log('Assistants:', assistants)

    // Create one for testing if none exist
    if (assistants.length === 0) {
      console.log('No editorial assistants found. You need to create one in the database.')
      console.log('You can either:')
      console.log('1. Change an existing user role to "editorial-assistant"')
      console.log('2. Create a new user with role "editorial-assistant"')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.end()
  }
}

checkEditorialAssistants()