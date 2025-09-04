-- Migration: Fix messaging system schema inconsistencies
-- Date: 2025-09-04

-- Add participant columns to conversations table (without foreign key constraints initially)
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS participant1_id UUID,
ADD COLUMN IF NOT EXISTS participant2_id UUID;

-- Add missing columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'unread',
ADD COLUMN IF NOT EXISTS submission_id UUID,
ADD COLUMN IF NOT EXISTS is_reply BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS parent_message_id UUID;

-- Update conversation participants from JSON field, but only with valid user IDs
UPDATE conversations 
SET 
  participant1_id = CASE 
    WHEN participants IS NOT NULL 
         AND jsonb_array_length(participants) >= 1 
         AND EXISTS (SELECT 1 FROM users WHERE id = (participants->0->>'id')::UUID)
    THEN (participants->0->>'id')::UUID
    ELSE NULL
  END,
  participant2_id = CASE 
    WHEN participants IS NOT NULL 
         AND jsonb_array_length(participants) >= 2 
         AND EXISTS (SELECT 1 FROM users WHERE id = (participants->1->>'id')::UUID)
    THEN (participants->1->>'id')::UUID
    ELSE NULL
  END
WHERE participant1_id IS NULL AND participant2_id IS NULL;

-- Now add foreign key constraints only for non-null values
DO $$ 
BEGIN
    -- Add foreign key constraint for participant1_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'conversations_participant1_id_fkey'
    ) THEN
        ALTER TABLE conversations 
        ADD CONSTRAINT conversations_participant1_id_fkey 
        FOREIGN KEY (participant1_id) REFERENCES users(id);
    END IF;
    
    -- Add foreign key constraint for participant2_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'conversations_participant2_id_fkey'
    ) THEN
        ALTER TABLE conversations 
        ADD CONSTRAINT conversations_participant2_id_fkey 
        FOREIGN KEY (participant2_id) REFERENCES users(id);
    END IF;
    
    -- Add foreign key constraint for submission_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_submission_id_fkey'
    ) THEN
        ALTER TABLE messages 
        ADD CONSTRAINT messages_submission_id_fkey 
        FOREIGN KEY (submission_id) REFERENCES articles(id);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant1_id, participant2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_related ON conversations(related_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_submission ON messages(submission_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);