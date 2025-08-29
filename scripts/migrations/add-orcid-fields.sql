-- Add missing ORCID and other enhanced user fields
-- This migration adds the columns that are in the Drizzle schema but missing from the database

-- Add ORCID-related columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS orcid_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS orcid_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS orcid_refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS orcid_profile JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS orcid_last_sync TIMESTAMP;

-- Add other missing enhanced user fields if they don't already exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS application_status TEXT DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS specializations JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS languages_spoken JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS research_interests JSONB;

-- Update existing users to have proper defaults
UPDATE users SET 
  orcid_verified = false,
  is_active = true,
  application_status = CASE 
    WHEN role = 'admin' THEN 'approved'
    WHEN role = 'author' THEN 'approved' 
    ELSE 'pending'
  END,
  profile_completeness = CASE
    WHEN name IS NOT NULL AND email IS NOT NULL AND affiliation IS NOT NULL THEN 60
    WHEN name IS NOT NULL AND email IS NOT NULL THEN 40
    ELSE 20
  END
WHERE orcid_verified IS NULL OR is_active IS NULL OR application_status IS NULL;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_users_orcid_verified ON users(orcid_verified);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_application_status ON users(application_status);

COMMENT ON COLUMN users.orcid_verified IS 'Whether the ORCID ID has been verified';
COMMENT ON COLUMN users.orcid_access_token IS 'OAuth access token for ORCID API';
COMMENT ON COLUMN users.orcid_refresh_token IS 'OAuth refresh token for ORCID API';
COMMENT ON COLUMN users.orcid_profile IS 'Cached ORCID profile data';
COMMENT ON COLUMN users.orcid_last_sync IS 'Last time ORCID profile was synchronized';
