-- Add DOI-related fields to articles table
-- Migration: add-doi-fields.sql
-- Date: 2025-07-06

BEGIN;

-- Add DOI registration tracking fields
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS doi_registered BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS doi_registered_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS crossref_metadata JSONB;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_articles_doi ON articles(doi);
CREATE INDEX IF NOT EXISTS idx_articles_doi_registered ON articles(doi_registered);
CREATE INDEX IF NOT EXISTS idx_articles_doi_registered_at ON articles(doi_registered_at);

-- Update existing articles with DOIs to mark as registered if DOI exists
UPDATE articles 
SET doi_registered = TRUE, 
    doi_registered_at = COALESCE(published_date, created_at)
WHERE doi IS NOT NULL AND doi != '';

COMMIT;
