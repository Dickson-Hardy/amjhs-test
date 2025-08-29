-- Editorial Board Applications Schema
-- Add this to your existing database migration

-- Editorial Board Applications Table
CREATE TABLE IF NOT EXISTS editorial_board_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id UUID REFERENCES users(id) ON DELETE CASCADE,
    position VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    
    -- Professional Information
    current_position VARCHAR(255),
    institution VARCHAR(255),
    department VARCHAR(255),
    address TEXT,
    country VARCHAR(100),
    
    -- Academic Background
    highest_degree VARCHAR(100),
    field_of_study VARCHAR(255),
    years_of_experience INTEGER,
    research_interests TEXT,
    expertise_areas TEXT[], -- Array of expertise areas
    
    -- Professional Experience
    academic_positions TEXT, -- JSON or structured text
    industry_experience TEXT,
    editorial_experience TEXT,
    
    -- Publications and Achievements
    total_publications INTEGER,
    h_index INTEGER,
    major_publications TEXT, -- Key publications
    awards_honors TEXT,
    
    -- Additional Information
    motivation_statement TEXT,
    availability_commitment TEXT,
    language_proficiency TEXT,
    
    -- File Attachments
    cv_file_url VARCHAR(500),
    cover_letter_url VARCHAR(500),
    additional_documents_urls TEXT[], -- Array of document URLs
    
    -- Application Metadata
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    decision_at TIMESTAMP,
    reviewer_id UUID REFERENCES users(id),
    
    -- Review Information
    review_comments TEXT,
    decision_comments TEXT,
    internal_notes TEXT,
    
    -- Tracking
    application_source VARCHAR(50) DEFAULT 'website',
    referrer VARCHAR(255),
    
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Editorial Board Members Table (for approved applications)
CREATE TABLE IF NOT EXISTS editorial_board_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    application_id UUID REFERENCES editorial_board_applications(id),
    
    -- Position Information
    position VARCHAR(100) NOT NULL,
    position_type VARCHAR(50) DEFAULT 'editor' CHECK (position_type IN ('editor', 'associate_editor', 'advisory_board', 'guest_editor')),
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'retired')),
    
    -- Permissions and Access
    can_review_submissions BOOLEAN DEFAULT true,
    can_assign_reviewers BOOLEAN DEFAULT false,
    can_make_decisions BOOLEAN DEFAULT false,
    can_access_statistics BOOLEAN DEFAULT false,
    
    -- Performance Tracking
    reviews_completed INTEGER DEFAULT 0,
    reviews_pending INTEGER DEFAULT 0,
    average_review_time INTEGER, -- in days
    
    -- Contact Preferences
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, position)
);

-- Editorial Board Positions Table (available positions)
CREATE TABLE IF NOT EXISTS editorial_board_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    requirements TEXT,
    responsibilities TEXT,
    
    -- Position Details
    position_type VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    max_positions INTEGER DEFAULT 1,
    current_positions INTEGER DEFAULT 0,
    
    -- Application Settings
    application_deadline DATE,
    auto_accept_applications BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Application Reviews Table (for tracking review process)
CREATE TABLE IF NOT EXISTS editorial_application_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES editorial_board_applications(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id),
    
    -- Review Details
    review_stage VARCHAR(50) DEFAULT 'initial' CHECK (review_stage IN ('initial', 'committee', 'final')),
    recommendation VARCHAR(20) CHECK (recommendation IN ('approve', 'reject', 'needs_more_info')),
    
    -- Scoring (1-10 scale)
    qualifications_score INTEGER CHECK (qualifications_score BETWEEN 1 AND 10),
    experience_score INTEGER CHECK (experience_score BETWEEN 1 AND 10),
    fit_score INTEGER CHECK (fit_score BETWEEN 1 AND 10),
    overall_score DECIMAL(3,1) CHECK (overall_score BETWEEN 1.0 AND 10.0),
    
    -- Comments
    review_comments TEXT,
    strengths TEXT,
    weaknesses TEXT,
    suggestions TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_editorial_applications_status ON editorial_board_applications(status);
CREATE INDEX IF NOT EXISTS idx_editorial_applications_position ON editorial_board_applications(position);
CREATE INDEX IF NOT EXISTS idx_editorial_applications_submitted ON editorial_board_applications(submitted_at);
CREATE INDEX IF NOT EXISTS idx_editorial_applications_applicant ON editorial_board_applications(applicant_id);

CREATE INDEX IF NOT EXISTS idx_editorial_members_user ON editorial_board_members(user_id);
CREATE INDEX IF NOT EXISTS idx_editorial_members_position ON editorial_board_members(position);
CREATE INDEX IF NOT EXISTS idx_editorial_members_status ON editorial_board_members(status);

CREATE INDEX IF NOT EXISTS idx_editorial_positions_active ON editorial_board_positions(is_active);
CREATE INDEX IF NOT EXISTS idx_editorial_positions_type ON editorial_board_positions(position_type);

CREATE INDEX IF NOT EXISTS idx_application_reviews_application ON editorial_application_reviews(application_id);
CREATE INDEX IF NOT EXISTS idx_application_reviews_reviewer ON editorial_application_reviews(reviewer_id);

-- Insert default positions
INSERT INTO editorial_board_positions (title, description, requirements, responsibilities, position_type, max_positions) VALUES
('Associate Editor', 'Assist in peer review process and editorial decisions', 
 'PhD in relevant field, 5+ years experience, strong publication record', 
 'Review manuscripts, assign reviewers, make editorial recommendations', 
 'associate_editor', 5),
 
('Editorial Board Member', 'Provide expertise in specific research areas', 
 'PhD in relevant field, established research reputation', 
 'Review manuscripts, provide expert opinions, attend board meetings', 
 'editor', 15),
 
('Advisory Board Member', 'Provide strategic guidance and oversight', 
 'Senior academic or industry leader, extensive experience', 
 'Strategic planning, journal development, policy recommendations', 
 'advisory_board', 8),
 
('Guest Editor', 'Lead special issues and themed publications', 
 'Recognized expert in specific domain, editorial experience preferred', 
 'Organize special issues, invite submissions, coordinate reviews', 
 'guest_editor', 10)
ON CONFLICT (title) DO NOTHING;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_editorial_members_updated_at 
    BEFORE UPDATE ON editorial_board_members 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_editorial_positions_updated_at 
    BEFORE UPDATE ON editorial_board_positions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_application_reviews_updated_at 
    BEFORE UPDATE ON editorial_application_reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
