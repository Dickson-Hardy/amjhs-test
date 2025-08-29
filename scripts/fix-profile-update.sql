-- Fix Profile Update Database Migration
-- This script adds missing fields that are causing profile updates to fail

-- Add missing fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS orcid_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS orcid_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS orcid_refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS orcid_profile JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS orcid_last_sync TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS specializations JSONB DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS languages_spoken JSONB DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS research_interests JSONB DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS application_status TEXT DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE;

-- Update existing records to have default values for JSONB fields
-- Only update columns that exist
UPDATE users SET 
    specializations = '[]'::jsonb,
    languages_spoken = '[]'::jsonb,
    research_interests = '[]'::jsonb
WHERE specializations IS NULL 
   OR languages_spoken IS NULL 
   OR research_interests IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_profile_completeness ON users(profile_completeness);

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
