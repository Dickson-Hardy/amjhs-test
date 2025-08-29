-- Simple Single Editorial Assistant Constraint
-- This script ensures only one user can have the 'editorial-assistant' role

-- Check current editorial assistants
SELECT 
  COUNT(*) as editorial_assistant_count,
  STRING_AGG(name || ' (' || email || ')', ', ') as current_editorial_assistants
FROM users 
WHERE role = 'editorial-assistant';

-- Create a simple unique constraint approach
-- We'll use a materialized approach by creating a constraint table

-- Create a constraint table to track editorial assistants
CREATE TABLE IF NOT EXISTS editorial_assistant_constraint (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert the current editorial assistant if exists
INSERT INTO editorial_assistant_constraint (user_id)
SELECT id FROM users WHERE role = 'editorial-assistant'
ON CONFLICT DO NOTHING;

-- Create a unique constraint on user_id to ensure only one entry
ALTER TABLE editorial_assistant_constraint 
ADD CONSTRAINT uk_editorial_assistant_single UNIQUE (user_id);

-- Create a function to manage editorial assistant assignments
CREATE OR REPLACE FUNCTION manage_editorial_assistant_role()
RETURNS TRIGGER AS $$
BEGIN
  -- If we're setting the role to editorial-assistant
  IF NEW.role = 'editorial-assistant' THEN
    -- Check if there's already an editorial assistant
    IF EXISTS (SELECT 1 FROM editorial_assistant_constraint) THEN
      RAISE EXCEPTION 'Only one editorial assistant is allowed in the system';
    END IF;
    
    -- Insert into constraint table
    INSERT INTO editorial_assistant_constraint (user_id) VALUES (NEW.id);
    
  -- If we're changing from editorial-assistant to something else
  ELSIF OLD.role = 'editorial-assistant' AND NEW.role != 'editorial-assistant' THEN
    -- Remove from constraint table
    DELETE FROM editorial_assistant_constraint WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS manage_editorial_assistant_role_trigger ON users;
CREATE TRIGGER manage_editorial_assistant_role_trigger
  AFTER INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION manage_editorial_assistant_role();

-- Create an index for performance
CREATE INDEX IF NOT EXISTS idx_editorial_assistant_constraint_user_id 
ON editorial_assistant_constraint(user_id);

-- Add comments for documentation
COMMENT ON TABLE editorial_assistant_constraint IS 'Tracks the single editorial assistant user';
COMMENT ON FUNCTION manage_editorial_assistant_role() IS 'Manages editorial assistant role assignments to ensure only one exists';
