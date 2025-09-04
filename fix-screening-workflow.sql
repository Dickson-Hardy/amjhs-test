-- Fix all database constraints to allow the screening workflow to work properly

-- 1. Fix notification type constraint to allow screening-related notifications
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('submission', 'review', 'publication', 'system', 'screening', 'screening_completed', 'editorial'));

-- 2. Fix manuscript screening score constraints (we already did this but let's verify)
ALTER TABLE manuscript_screenings 
DROP CONSTRAINT IF EXISTS manuscript_screenings_quality_score_check;

ALTER TABLE manuscript_screenings 
DROP CONSTRAINT IF EXISTS manuscript_screenings_completeness_score_check;

ALTER TABLE manuscript_screenings 
ADD CONSTRAINT manuscript_screenings_quality_score_check 
CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 100));

ALTER TABLE manuscript_screenings 
ADD CONSTRAINT manuscript_screenings_completeness_score_check 
CHECK (completeness_score IS NULL OR (completeness_score >= 0 AND completeness_score <= 100));

-- 3. Fix screening status constraints to match what the application uses
ALTER TABLE manuscript_screenings 
DROP CONSTRAINT IF EXISTS manuscript_screenings_screening_status_check;

ALTER TABLE manuscript_screenings 
ADD CONSTRAINT manuscript_screenings_screening_status_check 
CHECK (screening_status IN ('pending', 'in_progress', 'completed'));

-- 4. Fix screening decision constraints to match what the application uses
ALTER TABLE manuscript_screenings 
DROP CONSTRAINT IF EXISTS manuscript_screenings_screening_decision_check;

ALTER TABLE manuscript_screenings 
ADD CONSTRAINT manuscript_screenings_screening_decision_check 
CHECK (screening_decision IN ('pending', 'pass', 'fail', 'revision_required'));

-- Verify the changes
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE table_name IN ('notifications', 'manuscript_screenings')
ORDER BY table_name, constraint_name;