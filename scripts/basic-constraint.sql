-- Basic Single Editorial Assistant Constraint
-- This script ensures only one user can have the 'editorial-assistant' role

-- Check current editorial assistants
SELECT 
  COUNT(*) as editorial_assistant_count,
  STRING_AGG(name || ' (' || email || ')', ', ') as current_editorial_assistants
FROM users 
WHERE role = 'editorial-assistant';

-- First, let's clean up any duplicate editorial assistants
-- Keep only the first one created
UPDATE users 
SET role = 'author' 
WHERE role = 'editorial-assistant' 
AND id NOT IN (
  SELECT id FROM users 
  WHERE role = 'editorial-assistant' 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- Verify we now have only one
SELECT 
  COUNT(*) as editorial_assistant_count,
  STRING_AGG(name || ' (' || email || ')', ', ') as current_editorial_assistants
FROM users 
WHERE role = 'editorial-assistant';

-- Create a simple unique constraint table
CREATE TABLE IF NOT EXISTS editorial_assistant_single (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Clear any existing entries
DELETE FROM editorial_assistant_single;

-- Insert the current editorial assistant
INSERT INTO editorial_assistant_single (user_id)
SELECT id FROM users WHERE role = 'editorial-assistant' LIMIT 1;

-- Add unique constraint
ALTER TABLE editorial_assistant_single 
ADD CONSTRAINT uk_editorial_assistant_single UNIQUE (user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_editorial_assistant_single_user_id 
ON editorial_assistant_single(user_id);

-- Add comment
COMMENT ON TABLE editorial_assistant_single IS 'Tracks the single editorial assistant user';
