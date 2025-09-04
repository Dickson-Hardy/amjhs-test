-- Migration script to update workflow statuses
-- Run this script to update existing records to use the new complex workflow statuses

-- Update articles table statuses
UPDATE articles 
SET status = 'editorial_assistant_review' 
WHERE status = 'technical_check';

-- Update submissions table statuses  
UPDATE submissions 
SET status = 'editorial_assistant_review' 
WHERE status = 'technical_check';

-- Update any status history records in submissions
UPDATE submissions 
SET status_history = REPLACE(status_history::text, 'technical_check', 'editorial_assistant_review')::jsonb
WHERE status_history::text LIKE '%technical_check%';

-- Update editor assignments to reflect new status flow
UPDATE editor_assignments 
SET status = 'active'
WHERE status = 'pending' AND created_at < NOW() - INTERVAL '3 days';

-- Add indexes for better performance on new status queries
CREATE INDEX IF NOT EXISTS idx_articles_complex_status ON articles(status) 
WHERE status IN ('editorial_assistant_review', 'associate_editor_assignment', 'associate_editor_review', 'reviewer_assignment');

CREATE INDEX IF NOT EXISTS idx_submissions_complex_status ON submissions(status)
WHERE status IN ('editorial_assistant_review', 'associate_editor_assignment', 'associate_editor_review', 'reviewer_assignment');

-- Update any notification records that reference old statuses
UPDATE notifications 
SET data = REPLACE(data::text, 'technical_check', 'editorial_assistant_review')::jsonb
WHERE data::text LIKE '%technical_check%';

COMMIT;


