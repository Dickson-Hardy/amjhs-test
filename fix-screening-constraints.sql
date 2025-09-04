-- Fix the manuscript screening score constraints to allow 0-100 scale
-- This fixes the issue where screened items are not being saved due to constraint violations

-- Drop existing constraints
ALTER TABLE manuscript_screenings 
DROP CONSTRAINT IF EXISTS manuscript_screenings_quality_score_check;

ALTER TABLE manuscript_screenings 
DROP CONSTRAINT IF EXISTS manuscript_screenings_completeness_score_check;

-- Add new constraints for 0-100 scale
ALTER TABLE manuscript_screenings 
ADD CONSTRAINT manuscript_screenings_quality_score_check 
CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 100));

ALTER TABLE manuscript_screenings 
ADD CONSTRAINT manuscript_screenings_completeness_score_check 
CHECK (completeness_score IS NULL OR (completeness_score >= 0 AND completeness_score <= 100));

-- Verify the changes
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE table_name = 'manuscript_screenings' 
AND constraint_name LIKE '%score%';