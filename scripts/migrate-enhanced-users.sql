-- Enhanced User Registration and Role Management System Migration
-- Run this after the conversations migration

-- Update users table with new fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS application_status TEXT DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS specializations JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS languages_spoken JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS research_interests JSONB;

-- Create user applications table
CREATE TABLE IF NOT EXISTS user_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    requested_role TEXT NOT NULL,
    current_role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    application_data JSONB,
    review_notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    submitted_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user qualifications table
CREATE TABLE IF NOT EXISTS user_qualifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    institution TEXT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    description TEXT,
    is_verified BOOLEAN DEFAULT false,
    verification_documents JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create user publications table
CREATE TABLE IF NOT EXISTS user_publications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    title TEXT NOT NULL,
    journal TEXT,
    year INTEGER,
    doi TEXT,
    author_role TEXT,
    citation_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create user references table
CREATE TABLE IF NOT EXISTS user_references (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    reference_name TEXT NOT NULL,
    reference_email TEXT NOT NULL,
    reference_affiliation TEXT,
    relationship TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    response TEXT,
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create reviewer profiles table
CREATE TABLE IF NOT EXISTS reviewer_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    availability_status TEXT DEFAULT 'available',
    max_reviews_per_month INTEGER DEFAULT 3,
    current_review_load INTEGER DEFAULT 0,
    average_review_time INTEGER,
    completed_reviews INTEGER DEFAULT 0,
    late_reviews INTEGER DEFAULT 0,
    quality_score INTEGER DEFAULT 0,
    last_review_date TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create editor profiles table
CREATE TABLE IF NOT EXISTS editor_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    editor_type TEXT NOT NULL,
    assigned_sections JSONB,
    current_workload INTEGER DEFAULT 0,
    max_workload INTEGER DEFAULT 10,
    is_accepting_submissions BOOLEAN DEFAULT true,
    editorial_experience TEXT,
    start_date TIMESTAMP DEFAULT NOW(),
    end_date TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_applications_user_id ON user_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_applications_status ON user_applications(status);
CREATE INDEX IF NOT EXISTS idx_user_applications_requested_role ON user_applications(requested_role);
CREATE INDEX IF NOT EXISTS idx_user_qualifications_user_id ON user_qualifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_publications_user_id ON user_publications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_references_user_id ON user_references(user_id);
CREATE INDEX IF NOT EXISTS idx_reviewer_profiles_user_id ON reviewer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_editor_profiles_user_id ON editor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_application_status ON users(application_status);

-- Update existing users to set appropriate application status
UPDATE users SET application_status = 'approved' WHERE role = 'author';
UPDATE users SET application_status = 'approved' WHERE role = 'admin';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to relevant tables
CREATE TRIGGER update_user_applications_updated_at BEFORE UPDATE ON user_applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviewer_profiles_updated_at BEFORE UPDATE ON reviewer_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_editor_profiles_updated_at BEFORE UPDATE ON editor_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
-- This creates a test reviewer application
-- INSERT INTO user_applications (user_id, requested_role, current_role, status, application_data)
-- SELECT id, 'reviewer', 'author', 'pending', '{"maxReviewsPerMonth": 3, "researchAreas": ["Cardiology", "Internal Medicine"]}'
-- FROM users WHERE role = 'author' LIMIT 1;

COMMENT ON TABLE user_applications IS 'Store applications for elevated roles (reviewer, editor)';
COMMENT ON TABLE user_qualifications IS 'Store user academic and professional qualifications';
COMMENT ON TABLE user_publications IS 'Store user publications and research output';
COMMENT ON TABLE user_references IS 'Store professional references for applications';
COMMENT ON TABLE reviewer_profiles IS 'Store reviewer-specific profile information and workload';
COMMENT ON TABLE editor_profiles IS 'Store editor-specific profile information and assignments';
