-- Enforce single editorial assistant constraint
-- This script ensures only one user can have the 'editorial-assistant' role

-- First, let's check how many editorial assistants currently exist
SELECT 
  COUNT(*) as editorial_assistant_count,
  STRING_AGG(name || ' (' || email || ')', ', ') as current_editorial_assistants
FROM users 
WHERE role = 'editorial-assistant';

-- Create a unique constraint on the role column for editorial-assistant
-- This will prevent multiple users from having the same role
-- Note: This is a simplified approach - in production you might want a more sophisticated solution

-- Option 1: Add a check constraint (PostgreSQL)
-- This will prevent inserting/updating multiple editorial assistants
ALTER TABLE users 
ADD CONSTRAINT chk_single_editorial_assistant 
CHECK (
  (role = 'editorial-assistant' AND 
   (SELECT COUNT(*) FROM users u2 WHERE u2.role = 'editorial-assistant') <= 1) OR
  role != 'editorial-assistant'
);

-- Option 2: Create a function to enforce the constraint
CREATE OR REPLACE FUNCTION enforce_single_editorial_assistant()
RETURNS TRIGGER AS $$
BEGIN
  -- If we're setting the role to editorial-assistant
  IF NEW.role = 'editorial-assistant' THEN
    -- Check if there's already an editorial assistant (excluding the current user if updating)
    IF EXISTS (
      SELECT 1 FROM users 
      WHERE role = 'editorial-assistant' 
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
    ) THEN
      RAISE EXCEPTION 'Only one editorial assistant is allowed in the system';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS enforce_single_editorial_assistant_trigger ON users;
CREATE TRIGGER enforce_single_editorial_assistant_trigger
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION enforce_single_editorial_assistant();

-- Option 3: Create a view that only shows one editorial assistant
CREATE OR REPLACE VIEW users_with_role_constraints AS
SELECT 
  u.*,
  CASE 
    WHEN u.role = 'editorial-assistant' THEN
      CASE 
        WHEN u.id = (SELECT id FROM users WHERE role = 'editorial-assistant' ORDER BY created_at ASC LIMIT 1) 
        THEN u.role
        ELSE 'author' -- Demote additional editorial assistants to author
      END
    ELSE u.role
  END as effective_role
FROM users u;

-- Grant permissions on the view
GRANT SELECT ON users_with_role_constraints TO PUBLIC;

-- Create an index to optimize role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add a comment to document the constraint
COMMENT ON TABLE users IS 'Users table with single editorial assistant constraint enforced via trigger';
COMMENT ON FUNCTION enforce_single_editorial_assistant() IS 'Enforces that only one user can have editorial-assistant role';
