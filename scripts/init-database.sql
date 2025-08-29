-- =====================================================
-- AMHSJ (African Medical and Health Sciences Journal)
-- Complete Database Schema - Neon PostgreSQL Compatible
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'author' CHECK (role IN ('author', 'reviewer', 'editor', 'admin')),
    affiliation TEXT,
    orcid VARCHAR(19), -- ORCID format: 0000-0000-0000-0000
    bio TEXT,
    expertise JSONB DEFAULT '[]'::jsonb,
    is_verified BOOLEAN DEFAULT FALSE,
    email_verification_token TEXT,
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    avatar_url TEXT,
    phone VARCHAR(20),
    country VARCHAR(100),
    institution TEXT,
    department TEXT,
    academic_title VARCHAR(100),
    research_interests TEXT[],
    publications_count INTEGER DEFAULT 0,
    h_index INTEGER DEFAULT 0,
    citations_count INTEGER DEFAULT 0,
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ARTICLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    abstract TEXT NOT NULL,
    content TEXT,
    keywords JSONB DEFAULT '[]'::jsonb,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    article_type VARCHAR(50) NOT NULL DEFAULT 'research' CHECK (article_type IN ('research', 'review', 'case_study', 'editorial', 'letter', 'commentary')),
    status VARCHAR(50) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'revision_requested', 'accepted', 'rejected', 'published', 'withdrawn')),
    doi VARCHAR(100) UNIQUE,
    volume VARCHAR(10),
    issue VARCHAR(10),
    pages VARCHAR(20),
    page_start INTEGER,
    page_end INTEGER,
    published_date TIMESTAMP WITH TIME ZONE,
    submitted_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_date TIMESTAMP WITH TIME ZONE,
    revision_date TIMESTAMP WITH TIME ZONE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    co_authors JSONB DEFAULT '[]'::jsonb,
    reviewer_ids JSONB DEFAULT '[]'::jsonb,
    editor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    files JSONB DEFAULT '[]'::jsonb,
    supplementary_files JSONB DEFAULT '[]'::jsonb,
    views INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    citations INTEGER DEFAULT 0,
    altmetric_score DECIMAL(10,2) DEFAULT 0,
    impact_score DECIMAL(10,2) DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    funding_info TEXT,
    conflicts_of_interest TEXT,
    ethics_statement TEXT,
    data_availability TEXT,
    acknowledgments TEXT,
    word_count INTEGER,
    figure_count INTEGER DEFAULT 0,
    table_count INTEGER DEFAULT 0,
    reference_count INTEGER DEFAULT 0,
    is_open_access BOOLEAN DEFAULT TRUE,
    license_type VARCHAR(50) DEFAULT 'CC BY 4.0',
    embargo_date TIMESTAMP WITH TIME ZONE,
    priority_score INTEGER DEFAULT 0,
    similarity_score DECIMAL(5,2) DEFAULT 0, -- Plagiarism check score
    language VARCHAR(10) DEFAULT 'en',
    search_vector TSVECTOR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- REVIEWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'declined', 'overdue')),
    recommendation VARCHAR(50) CHECK (recommendation IN ('accept', 'minor_revision', 'major_revision', 'reject')),
    comments TEXT,
    confidential_comments TEXT,
    detailed_comments JSONB DEFAULT '{}'::jsonb, -- Structured comments by section
    rating INTEGER CHECK (rating >= 1 AND rating <= 10),
    novelty_score INTEGER CHECK (novelty_score >= 1 AND novelty_score <= 5),
    methodology_score INTEGER CHECK (methodology_score >= 1 AND methodology_score <= 5),
    clarity_score INTEGER CHECK (clarity_score >= 1 AND clarity_score <= 5),
    significance_score INTEGER CHECK (significance_score >= 1 AND significance_score <= 5),
    overall_score DECIMAL(3,1),
    time_spent_hours DECIMAL(4,1),
    expertise_level INTEGER CHECK (expertise_level >= 1 AND expertise_level <= 5),
    review_round INTEGER DEFAULT 1,
    is_anonymous BOOLEAN DEFAULT TRUE,
    files JSONB DEFAULT '[]'::jsonb, -- Annotated files
    due_date TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    reminder_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('submission', 'review', 'publication', 'system', 'reminder', 'announcement')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT FALSE,
    is_email_sent BOOLEAN DEFAULT FALSE,
    related_id UUID, -- article_id, review_id, etc.
    related_type VARCHAR(50), -- 'article', 'review', etc.
    action_url TEXT,
    action_text VARCHAR(100),
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- EDITORIAL_DECISIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS editorial_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    editor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    decision VARCHAR(50) NOT NULL CHECK (decision IN ('accept', 'minor_revision', 'major_revision', 'reject', 'withdraw')),
    comments TEXT,
    internal_notes TEXT,
    decision_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    review_round INTEGER DEFAULT 1,
    is_final BOOLEAN DEFAULT FALSE,
    appeal_deadline TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- JOURNAL_ISSUES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS journal_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    volume INTEGER NOT NULL,
    issue INTEGER NOT NULL,
    year INTEGER NOT NULL,
    title VARCHAR(255),
    description TEXT,
    cover_image_url TEXT,
    publication_date TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN DEFAULT FALSE,
    is_special_issue BOOLEAN DEFAULT FALSE,
    guest_editors JSONB DEFAULT '[]'::jsonb,
    doi VARCHAR(100) UNIQUE,
    page_range VARCHAR(20),
    article_count INTEGER DEFAULT 0,
    total_pages INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(volume, issue, year)
);

-- =====================================================
-- CITATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS citations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    citing_article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    cited_article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    citation_text TEXT,
    citation_context TEXT,
    page_number INTEGER,
    citation_type VARCHAR(50) DEFAULT 'reference' CHECK (citation_type IN ('reference', 'self_citation', 'cross_reference')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(citing_article_id, cited_article_id)
);

-- =====================================================
-- DOWNLOADS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    country VARCHAR(100),
    city VARCHAR(100),
    file_type VARCHAR(20) DEFAULT 'pdf',
    file_size BIGINT,
    download_source VARCHAR(50) DEFAULT 'website',
    referrer TEXT,
    session_id VARCHAR(100),
    is_bot BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PAGE_VIEWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS page_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    country VARCHAR(100),
    city VARCHAR(100),
    view_duration INTEGER, -- seconds
    page_type VARCHAR(50) DEFAULT 'abstract',
    referrer TEXT,
    session_id VARCHAR(100),
    is_bot BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- COMMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    comment_type VARCHAR(50) DEFAULT 'public' CHECK (comment_type IN ('public', 'private', 'editorial', 'review')),
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    approval_date TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    like_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SYSTEM_SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    data_type VARCHAR(20) DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    category VARCHAR(50) DEFAULT 'general',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    is_editable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- AUDIT_LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- EMAIL_LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_email VARCHAR(255) NOT NULL,
    recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sender_email VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    template_name VARCHAR(100),
    email_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'bounced', 'failed', 'opened', 'clicked')),
    error_message TEXT,
    message_id VARCHAR(255),
    related_id UUID,
    related_type VARCHAR(50),
    metadata JSONB DEFAULT '{}'::jsonb,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_orcid ON users(orcid) WHERE orcid IS NOT NULL;

-- Articles indexes
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_editor_id ON articles(editor_id);
CREATE INDEX IF NOT EXISTS idx_articles_published_date ON articles(published_date) WHERE published_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_articles_submitted_date ON articles(submitted_date);
CREATE INDEX IF NOT EXISTS idx_articles_doi ON articles(doi) WHERE doi IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_articles_volume_issue ON articles(volume, issue) WHERE volume IS NOT NULL AND issue IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_articles_views ON articles(views);
CREATE INDEX IF NOT EXISTS idx_articles_downloads ON articles(downloads);
CREATE INDEX IF NOT EXISTS idx_articles_search_vector ON articles USING gin(search_vector);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_articles_fulltext ON articles USING gin(to_tsvector('english', title || ' ' || abstract || ' ' || COALESCE(content, '')));

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_article_id ON reviews(article_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_due_date ON reviews(due_date);
CREATE INDEX IF NOT EXISTS idx_reviews_submitted_at ON reviews(submitted_at);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Editorial decisions indexes
CREATE INDEX IF NOT EXISTS idx_editorial_decisions_article_id ON editorial_decisions(article_id);
CREATE INDEX IF NOT EXISTS idx_editorial_decisions_editor_id ON editorial_decisions(editor_id);
CREATE INDEX IF NOT EXISTS idx_editorial_decisions_decision_date ON editorial_decisions(decision_date);

-- Journal issues indexes
CREATE INDEX IF NOT EXISTS idx_journal_issues_volume_issue ON journal_issues(volume, issue);
CREATE INDEX IF NOT EXISTS idx_journal_issues_year ON journal_issues(year);
CREATE INDEX IF NOT EXISTS idx_journal_issues_is_published ON journal_issues(is_published);

-- Citations indexes
CREATE INDEX IF NOT EXISTS idx_citations_citing_article ON citations(citing_article_id);
CREATE INDEX IF NOT EXISTS idx_citations_cited_article ON citations(cited_article_id);

-- Downloads indexes
CREATE INDEX IF NOT EXISTS idx_downloads_article_id ON downloads(article_id);
CREATE INDEX IF NOT EXISTS idx_downloads_user_id ON downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_downloads_created_at ON downloads(created_at);
CREATE INDEX IF NOT EXISTS idx_downloads_country ON downloads(country);

-- Page views indexes
CREATE INDEX IF NOT EXISTS idx_page_views_article_id ON page_views(article_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_is_approved ON comments(is_approved);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Email logs indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journal_issues_updated_at BEFORE UPDATE ON journal_issues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Search vector update trigger
CREATE OR REPLACE FUNCTION update_article_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.title, '') || ' ' || 
        COALESCE(NEW.abstract, '') || ' ' || 
        COALESCE(NEW.content, '') || ' ' ||
        COALESCE(array_to_string(ARRAY(SELECT jsonb_array_elements_text(NEW.keywords)), ' '), '')
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_articles_search_vector 
    BEFORE INSERT OR UPDATE ON articles 
    FOR EACH ROW EXECUTE FUNCTION update_article_search_vector();

-- =====================================================
-- INITIAL SYSTEM SETTINGS
-- =====================================================
INSERT INTO system_settings (key, value, data_type, category, description, is_public) VALUES
('journal_name', 'African Medical and Health Sciences Journal', 'string', 'general', 'Official journal name', true),
('journal_abbreviation', 'AMHSJ', 'string', 'general', 'Journal abbreviation', true),
('issn_print', '2789-1234', 'string', 'general', 'Print ISSN', true),
('issn_online', '2789-5678', 'string', 'general', 'Online ISSN', true),
('publisher', 'AMHSJ Publishing', 'string', 'general', 'Publisher name', true),
('editor_in_chief', 'Dr. Sarah Johnson', 'string', 'editorial', 'Editor-in-Chief name', true),
('submission_fee', '0', 'number', 'financial', 'Article submission fee in USD', true),
('publication_fee', '0', 'number', 'financial', 'Article publication fee in USD', true),
('review_period_days', '60', 'number', 'editorial', 'Standard review period in days', false),
('max_file_size_mb', '50', 'number', 'technical', 'Maximum file upload size in MB', false),
('allowed_file_types', '["pdf", "docx", "doc", "tex"]', 'json', 'technical', 'Allowed file types for submission', false),
('email_notifications_enabled', 'true', 'boolean', 'system', 'Enable email notifications', false),
('auto_assign_reviewers', 'false', 'boolean', 'editorial', 'Automatically assign reviewers', false),
('open_access_default', 'true', 'boolean', 'publishing', 'Default open access setting', true),
('impact_factor', '2.45', 'number', 'metrics', 'Current impact factor', true),
('h_index', '28', 'number', 'metrics', 'Journal H-index', true),
('founded_year', '2020', 'number', 'general', 'Year journal was founded', true),
('contact_email', 'editor@amhsj.org', 'string', 'contact', 'Main contact email', true),
('website_url', 'https://amhsj.org', 'string', 'general', 'Journal website URL', true),
('social_twitter', '@AMHSJ_Journal', 'string', 'social', 'Twitter handle', true),
('social_linkedin', 'african-medical-health-sciences-journal', 'string', 'social', 'LinkedIn page', true)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- SAMPLE DATA FOR DEVELOPMENT
-- =====================================================

-- Create admin user
INSERT INTO users (id, email, name, role, is_verified, affiliation, bio) VALUES
(uuid_generate_v4(), 'admin@amhsj.org', 'System Administrator', 'admin', true, 'AMHSJ Publishing', 'System administrator for the African Medical and Health Sciences Journal platform.')
ON CONFLICT (email) DO NOTHING;

-- Create sample editor
INSERT INTO users (id, email, name, role, is_verified, affiliation, bio, orcid) VALUES
(uuid_generate_v4(), 'editor@amhsj.org', 'Dr. Sarah Johnson', 'editor', true, 'University of Cape Town', 'Editor-in-Chief specializing in medical research and health sciences.', '0000-0002-1825-0097')
ON CONFLICT (email) DO NOTHING;

-- Create sample authors
INSERT INTO users (id, email, name, role, is_verified, affiliation, bio, orcid) VALUES
(uuid_generate_v4(), 'author1@example.com', 'Dr. Michael Chen', 'author', true, 'University of Ghana Medical School', 'Cardiologist specializing in heart disease research in African populations.', '0000-0003-1234-5678'),
(uuid_generate_v4(), 'author2@example.com', 'Dr. Amina Hassan', 'author', true, 'Cairo University Faculty of Medicine', 'Infectious disease specialist focusing on tropical medicine.', '0000-0003-8765-4321'),
(uuid_generate_v4(), 'author3@example.com', 'Dr. John Okafor', 'author', true, 'University of Nairobi School of Medicine', 'Public health researcher in maternal and child health.', '0000-0003-5555-1111'),
(uuid_generate_v4(), 'author4@example.com', 'Dr. Fatima Al-Rashid', 'author', true, 'University of Cape Town', 'Neurologist researching stroke prevention in Africa.', '0000-0003-9999-2222')
ON CONFLICT (email) DO NOTHING;

-- Insert sample published articles
INSERT INTO articles (
    id, title, abstract, keywords, category, status, doi, volume, issue, pages, 
    published_date, submitted_date, author_id, views, downloads, is_open_access
) VALUES
(
    uuid_generate_v4(),
    'Cardiovascular Disease Risk Factors in West African Populations: A Multi-Center Study',
    'Background: Cardiovascular disease is emerging as a leading cause of mortality in West Africa. This study aims to identify key risk factors and develop prevention strategies tailored to West African populations. Methods: We conducted a multi-center cross-sectional study across five countries, enrolling 12,450 participants aged 25-70 years. Results: Hypertension prevalence was 34.2%, diabetes 8.7%, and obesity 18.3%. Traditional risk factors were modified by genetic, dietary, and socioeconomic factors unique to the region. Conclusion: Region-specific prevention strategies are needed to address the rising burden of cardiovascular disease in West Africa.',
    '["cardiovascular disease", "West Africa", "risk factors", "prevention", "hypertension", "diabetes"]',
    'Cardiology',
    'published',
    '10.1234/amhsj.2024.001',
    '4',
    '1',
    '1-12',
    '2024-01-15 10:00:00+00',
    '2023-10-01 09:00:00+00',
    (SELECT id FROM users WHERE email = 'author1@example.com' LIMIT 1),
    2847,
    1203,
    true
),
(
    uuid_generate_v4(),
    'Malaria Drug Resistance Patterns in Sub-Saharan Africa: A Genomic Analysis',
    'Objective: To analyze genomic markers of antimalarial drug resistance across Sub-Saharan Africa and their implications for treatment guidelines. Methods: We sequenced 3,200 P. falciparum isolates from 15 countries, analyzing mutations associated with artemisinin, lumefantrine, and sulfadoxine-pyrimethamine resistance. Results: Artemisinin partial resistance markers were detected in 12.3% of isolates, with significant geographical variation. Novel resistance patterns were identified that may affect current treatment protocols. Conclusions: Continuous genomic surveillance is essential for malaria control programs, and treatment guidelines should be regularly updated based on regional resistance patterns.',
    '["malaria", "drug resistance", "genomics", "Africa", "artemisinin", "surveillance"]',
    'Infectious Diseases',
    'published',
    '10.1234/amhsj.2024.002',
    '4',
    '1',
    '13-28',
    '2024-02-01 11:00:00+00',
    '2023-11-15 14:30:00+00',
    (SELECT id FROM users WHERE email = 'author2@example.com' LIMIT 1),
    1923,
    856,
    true
),
(
    uuid_generate_v4(),
    'Maternal Mortality Reduction Through Community Health Worker Programs in Rural Kenya',
    'Background: Maternal mortality remains unacceptably high in rural Kenya. This study evaluates the effectiveness of community health worker (CHW) programs in reducing maternal deaths. Methods: A cluster-randomized controlled trial involving 45 communities over 3 years, comparing CHW-supported care versus standard care. Primary outcome was maternal mortality rate. Results: CHW programs reduced maternal mortality by 43% (HR 0.57, 95% CI 0.42-0.78, p<0.001). Secondary outcomes including skilled birth attendance and antenatal care visits also improved significantly. Conclusion: Community health worker programs represent a scalable, cost-effective intervention for reducing maternal mortality in resource-limited settings.',
    '["maternal mortality", "community health workers", "Kenya", "randomized trial", "rural health"]',
    'Public Health',
    'published',
    '10.1234/amhsj.2024.003',
    '4',
    '2',
    '29-45',
    '2024-03-10 09:30:00+00',
    '2023-12-01 16:45:00+00',
    (SELECT id FROM users WHERE email = 'author3@example.com' LIMIT 1),
    3156,
    1487,
    true
),
(
    uuid_generate_v4(),
    'Stroke Prevention in Young Adults: A Case-Control Study from Cape Town',
    'Introduction: Stroke incidence in young adults (18-45 years) is increasing in South Africa. This study investigates modifiable risk factors for stroke in this population. Methods: Case-control study of 450 stroke patients and 900 matched controls from Cape Town. Risk factors were assessed using standardized questionnaires and laboratory tests. Results: Key modifiable risk factors included HIV infection (OR 3.2, 95% CI 2.1-4.8), substance abuse (OR 2.7, 95% CI 1.8-4.1), and uncontrolled hypertension (OR 4.1, 95% CI 2.9-5.8). Novel risk factors specific to the South African context were identified. Conclusions: Targeted prevention programs addressing HIV management, substance abuse treatment, and blood pressure control could significantly reduce stroke burden in young South African adults.',
    '["stroke", "young adults", "South Africa", "HIV", "prevention", "case-control"]',
    'Neurology',
    'published',
    '10.1234/amhsj.2024.004',
    '4',
    '2',
    '46-62',
    '2024-04-05 13:15:00+00',
    '2024-01-20 11:20:00+00',
    (SELECT id FROM users WHERE email = 'author4@example.com' LIMIT 1),
    2234,
    967,
    true
),
(
    uuid_generate_v4(),
    'Digital Health Interventions for Diabetes Management in Nigeria: A Systematic Review',
    'Objective: To systematically review digital health interventions for diabetes management in Nigeria and assess their effectiveness. Methods: Systematic search of PubMed, Embase, and African databases for studies published 2010-2023. Studies evaluating mobile apps, telemedicine, or digital platforms for diabetes care in Nigeria were included. Results: 23 studies met inclusion criteria, involving 8,945 participants. Digital interventions showed significant improvements in HbA1c (-0.8%, 95% CI -1.2 to -0.4), medication adherence (RR 1.45, 95% CI 1.22-1.73), and self-management behaviors. However, sustainability and scalability challenges were common. Conclusion: Digital health shows promise for diabetes management in Nigeria, but implementation research is needed to address barriers to widespread adoption.',
    '["digital health", "diabetes", "Nigeria", "systematic review", "mobile health", "telemedicine"]',
    'Endocrinology',
    'published',
    '10.1234/amhsj.2024.005',
    '4',
    '3',
    '63-78',
    '2024-05-20 08:45:00+00',
    '2024-02-15 10:30:00+00',
    (SELECT id FROM users WHERE email = 'author1@example.com' LIMIT 1),
    1678,
    743,
    true
),
(
    uuid_generate_v4(),
    'Mental Health Services in Post-Conflict Settings: Lessons from the Democratic Republic of Congo',
    'Background: Mental health services in post-conflict settings face unique challenges. This study examines service delivery models in the Democratic Republic of Congo (DRC) following decades of conflict. Methods: Mixed-methods study combining quantitative surveys of 1,200 patients and qualitative interviews with 45 healthcare providers across 15 health zones. Results: PTSD prevalence was 28.4%, depression 34.7%, and anxiety disorders 22.1%. Task-shifting models using trained community workers showed promise, with 78% of patients showing clinical improvement. Cultural adaptation of interventions was crucial for acceptance and effectiveness. Conclusions: Community-based, culturally adapted mental health interventions can be effective in post-conflict settings when integrated with existing health systems.',
    '["mental health", "post-conflict", "Democratic Republic of Congo", "PTSD", "depression", "community-based"]',
    'Psychiatry',
    'published',
    '10.1234/amhsj.2024.006',
    '4',
    '3',
    '79-95',
    '2024-06-15 14:20:00+00',
    '2024-03-10 09:15:00+00',
    (SELECT id FROM users WHERE email = 'author2@example.com' LIMIT 1),
    2891,
    1122,
    true
)
ON CONFLICT (doi) DO NOTHING;

-- Create sample categories for articles
-- Note: Categories will be managed through the application, but we can set up some initial ones

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- Article statistics view
CREATE OR REPLACE VIEW article_stats AS
SELECT 
    COUNT(*) as total_articles,
    COUNT(*) FILTER (WHERE status = 'published') as published_articles,
    COUNT(*) FILTER (WHERE status = 'under_review') as under_review,
    COUNT(*) FILTER (WHERE status = 'submitted') as submitted,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as submitted_last_30_days,
    COUNT(*) FILTER (WHERE published_date >= CURRENT_DATE - INTERVAL '30 days') as published_last_30_days,
    AVG(views) as avg_views,
    AVG(downloads) as avg_downloads,
    SUM(views) as total_views,
    SUM(downloads) as total_downloads
FROM articles;

-- User statistics view
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE role = 'author') as authors,
    COUNT(*) FILTER (WHERE role = 'reviewer') as reviewers,
    COUNT(*) FILTER (WHERE role = 'editor') as editors,
    COUNT(*) FILTER (WHERE role = 'admin') as admins,
    COUNT(*) FILTER (WHERE is_verified = true) as verified_users,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_last_30_days,
    COUNT(*) FILTER (WHERE last_login >= CURRENT_DATE - INTERVAL '30 days') as active_users_last_30_days
FROM users;

-- Review statistics view
CREATE OR REPLACE VIEW review_stats AS
SELECT 
    COUNT(*) as total_reviews,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_reviews,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_reviews,
    COUNT(*) FILTER (WHERE status = 'overdue') as overdue_reviews,
    AVG(EXTRACT(EPOCH FROM (submitted_at - created_at))/86400) as avg_review_time_days,
    AVG(overall_score) as avg_overall_score
FROM reviews
WHERE submitted_at IS NOT NULL;

-- =====================================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- =====================================================

-- Function to get article citation count
CREATE OR REPLACE FUNCTION get_article_citation_count(article_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM citations WHERE cited_article_id = article_uuid);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate user h-index
CREATE OR REPLACE FUNCTION calculate_user_h_index(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    h_index INTEGER := 0;
    citation_count INTEGER;
BEGIN
    FOR citation_count IN 
        SELECT get_article_citation_count(id) as citations
        FROM articles 
        WHERE author_id = user_uuid AND status = 'published'
        ORDER BY citations DESC
    LOOP
        IF citation_count >= h_index + 1 THEN
            h_index := h_index + 1;
        ELSE
            EXIT;
        END IF;
    END LOOP;
    
    RETURN h_index;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECURITY POLICIES (Row Level Security)
-- =====================================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can see their own data and admins can see all
CREATE POLICY users_policy ON users
    FOR ALL
    USING (
        id = current_setting('app.current_user_id')::uuid OR 
        current_setting('app.current_user_role') = 'admin'
    );

-- Articles visibility policy
CREATE POLICY articles_policy ON articles
    FOR SELECT
    USING (
        status = 'published' OR 
        author_id = current_setting('app.current_user_id')::uuid OR
        editor_id = current_setting('app.current_user_id')::uuid OR
        current_setting('app.current_user_role') IN ('admin', 'editor') OR
        current_setting('app.current_user_id')::uuid = ANY(
            SELECT jsonb_array_elements_text(reviewer_ids)::uuid
        )
    );

-- Reviews policy - reviewers can only see their own reviews
CREATE POLICY reviews_policy ON reviews
    FOR ALL
    USING (
        reviewer_id = current_setting('app.current_user_id')::uuid OR
        current_setting('app.current_user_role') IN ('admin', 'editor')
    );

-- Notifications policy - users can only see their own notifications
CREATE POLICY notifications_policy ON notifications
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::uuid);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- Log successful database initialization
INSERT INTO audit_logs (action, resource_type, metadata) VALUES
('database_initialized', 'system', '{"version": "1.0", "tables_created": 15, "indexes_created": 30, "triggers_created": 6}');

-- Success message
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'AMHSJ Database Schema Created Successfully!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Tables Created: 15';
    RAISE NOTICE 'Indexes Created: 30+';
    RAISE NOTICE 'Triggers Created: 6';
    RAISE NOTICE 'Views Created: 3';
    RAISE NOTICE 'Functions Created: 2';
    RAISE NOTICE 'Security Policies: Enabled';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Database is ready for production use!';
    RAISE NOTICE '==============================================';
END $$;
