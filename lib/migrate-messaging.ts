import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function fixMessagingSchema() {
  try {
    console.log('Starting messaging schema migration...')

    // Add participant columns to conversations table if they don't exist
    await db.execute(sql`
      ALTER TABLE conversations 
      ADD COLUMN IF NOT EXISTS participant1_id UUID REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS participant2_id UUID REFERENCES users(id)
    `)

    // Remove recipient_id from messages table if it exists
    await db.execute(sql`
      ALTER TABLE messages 
      DROP COLUMN IF EXISTS recipient_id
    `)

    // Create indexes for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant1_id, participant2_id)
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_conversations_related ON conversations(related_id)
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id)
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_messages_submission ON messages(submission_id)
    `)

    console.log('Messaging schema migration completed successfully!')
    return { success: true }

  } catch (error) {
    console.error('Migration failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}