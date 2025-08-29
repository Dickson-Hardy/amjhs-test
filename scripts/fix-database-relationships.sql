-- Fix Database Relationships SQL
-- This file contains SQL commands to fix database relationships and constraints

-- Ensure proper foreign key constraints
ALTER TABLE user_applications 
ADD CONSTRAINT fk_user_applications_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_applications 
ADD CONSTRAINT fk_user_applications_reviewer 
FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

-- Ensure proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_editor_id ON articles(editor_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);

CREATE INDEX IF NOT EXISTS idx_submissions_author_id ON submissions(author_id);
CREATE INDEX IF NOT EXISTS idx_submissions_article_id ON submissions(article_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

CREATE INDEX IF NOT EXISTS idx_reviews_article_id ON reviews(article_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);

-- Update any existing null values to proper defaults
UPDATE users SET profile_completeness = 0 WHERE profile_completeness IS NULL;
UPDATE users SET is_active = true WHERE is_active IS NULL;
UPDATE users SET is_verified = false WHERE is_verified IS NULL;

-- Ensure role constraints
UPDATE users SET role = 'author' WHERE role NOT IN ('author', 'reviewer', 'editor', 'admin', 'editor-in-chief', 'managing-editor', 'section-editor', 'guest-editor', 'production-editor', 'associate-editor');

-- Add check constraints for data integrity
ALTER TABLE users ADD CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
ALTER TABLE users ADD CONSTRAINT check_profile_completeness CHECK (profile_completeness >= 0 AND profile_completeness <= 100);

-- Add any missing columns with default values
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_active_at') THEN
        ALTER TABLE users ADD COLUMN last_active_at TIMESTAMP;
    END IF;
END $$;

-- Update timestamps
UPDATE users SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE articles SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE submissions SET updated_at = NOW() WHERE updated_at IS NULL;

-- Clean up any orphaned records (be careful with this in production)
-- DELETE FROM submissions WHERE article_id NOT IN (SELECT id FROM articles);
-- DELETE FROM reviews WHERE article_id NOT IN (SELECT id FROM articles);

COMMIT;
