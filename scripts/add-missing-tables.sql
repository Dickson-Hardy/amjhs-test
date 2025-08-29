-- =====================================================
-- Add Missing Tables for AMHSJ Database
-- =====================================================

-- Create submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'accepted', 'rejected')),
    status_history JSONB DEFAULT '[]'::jsonb,
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table if it doesn't exist
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('review', 'submission', 'editorial', 'system')),
    related_id UUID,
    related_title TEXT,
    participants JSONB DEFAULT '[]'::jsonb,
    last_message_id UUID,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    read_by JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create article_versions table if it doesn't exist
CREATE TABLE IF NOT EXISTS article_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    abstract TEXT NOT NULL,
    content TEXT,
    files JSONB DEFAULT '[]'::jsonb,
    change_log TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create volumes table if it doesn't exist
CREATE TABLE IF NOT EXISTS volumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number TEXT NOT NULL,
    year INTEGER NOT NULL,
    title TEXT,
    description TEXT,
    cover_image TEXT,
    published_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create issues table if it doesn't exist
CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    volume_id UUID REFERENCES volumes(id) ON DELETE CASCADE,
    number TEXT NOT NULL,
    title TEXT,
    description TEXT,
    cover_image TEXT,
    published_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    special_issue BOOLEAN DEFAULT FALSE,
    guest_editors JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to users table if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS orcid_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS orcid_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS orcid_refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS orcid_profile JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS orcid_last_sync TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS application_status TEXT DEFAULT 'pending' CHECK (application_status IN ('pending', 'approved', 'rejected', 'under_review'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS specializations JSONB DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS languages_spoken JSONB DEFAULT '[]'::jsonb;

-- Add missing columns to articles table if they don't exist
ALTER TABLE articles ADD COLUMN IF NOT EXISTS doi_registered BOOLEAN DEFAULT FALSE;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS doi_registered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS crossref_metadata JSONB;

-- Create user_applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    requested_role VARCHAR(50) NOT NULL CHECK (requested_role IN ('reviewer', 'editor')),
    "current_role" VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
    application_data JSONB,
    review_notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_qualifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_qualifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('degree', 'certification', 'experience')),
    title TEXT NOT NULL,
    institution TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    description TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_documents JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_publications table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_publications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    journal TEXT,
    year INTEGER,
    doi TEXT,
    author_role VARCHAR(50) CHECK (author_role IN ('first_author', 'corresponding_author', 'co_author')),
    citation_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_references table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reference_name TEXT NOT NULL,
    reference_email TEXT NOT NULL,
    reference_affiliation TEXT,
    relationship TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'completed')),
    response TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviewer_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS reviewer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    availability_status VARCHAR(50) DEFAULT 'available' CHECK (availability_status IN ('available', 'limited', 'unavailable')),
    max_reviews_per_month INTEGER DEFAULT 3,
    current_review_load INTEGER DEFAULT 0,
    average_review_time INTEGER, -- in days
    completed_reviews INTEGER DEFAULT 0,
    late_reviews INTEGER DEFAULT 0,
    quality_score INTEGER DEFAULT 0, -- 0-100 based on editor feedback
    last_review_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create editor_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS editor_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    editor_type VARCHAR(50) NOT NULL CHECK (editor_type IN ('chief', 'associate', 'section', 'guest')),
    assigned_sections JSONB DEFAULT '[]'::jsonb,
    current_workload INTEGER DEFAULT 0,
    max_workload INTEGER DEFAULT 10,
    is_accepting_submissions BOOLEAN DEFAULT TRUE,
    editorial_experience TEXT,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for the new tables
CREATE INDEX IF NOT EXISTS idx_submissions_article_id ON submissions(article_id);
CREATE INDEX IF NOT EXISTS idx_submissions_author_id ON submissions(author_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_related_id ON conversations(related_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_article_versions_article_id ON article_versions(article_id);

CREATE INDEX IF NOT EXISTS idx_user_applications_user_id ON user_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_applications_status ON user_applications(status);

CREATE INDEX IF NOT EXISTS idx_user_qualifications_user_id ON user_qualifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_publications_user_id ON user_publications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_references_user_id ON user_references(user_id);

CREATE INDEX IF NOT EXISTS idx_reviewer_profiles_user_id ON reviewer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_editor_profiles_user_id ON editor_profiles(user_id);

-- Add updated_at triggers for new tables
CREATE TRIGGER IF NOT EXISTS update_submissions_updated_at 
    BEFORE UPDATE ON submissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_volumes_updated_at 
    BEFORE UPDATE ON volumes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_issues_updated_at 
    BEFORE UPDATE ON issues 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_user_applications_updated_at 
    BEFORE UPDATE ON user_applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_reviewer_profiles_updated_at 
    BEFORE UPDATE ON reviewer_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_editor_profiles_updated_at 
    BEFORE UPDATE ON editor_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Missing Tables Added Successfully!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'New Tables: submissions, conversations, messages, article_versions, volumes, issues';
    RAISE NOTICE 'Enhanced Tables: user_applications, user_qualifications, user_publications, user_references';
    RAISE NOTICE 'Profile Tables: reviewer_profiles, editor_profiles';
    RAISE NOTICE 'Database schema is now complete!';
    RAISE NOTICE '==============================================';
END $$;
