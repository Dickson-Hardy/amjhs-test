-- =====================================================
-- AMHSJ Editorial Assistant Database Schema
-- Complete SQL for Editorial Assistant Functionality
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- =====================================================
-- CORE EDITORIAL ASSISTANT TABLES
-- =====================================================

-- Editorial Assistant Profiles Table
CREATE TABLE IF NOT EXISTS editorial_assistant_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Profile Information
    specialization_areas JSONB DEFAULT '[]'::jsonb,
    screening_capacity INTEGER DEFAULT 20, -- manuscripts per day
    current_daily_screened INTEGER DEFAULT 0,
    
    -- Performance Metrics
    average_screening_time_minutes INTEGER DEFAULT 15,
    total_manuscripts_screened INTEGER DEFAULT 0,
    accuracy_rate DECIMAL(5,2) DEFAULT 95.00, -- percentage
    
    -- Work Preferences
    preferred_manuscript_types JSONB DEFAULT '["research", "review", "case_study"]'::jsonb,
    working_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00", "timezone": "UTC"}'::jsonb,
    auto_assignment_enabled BOOLEAN DEFAULT true,
    
    -- Status and Availability
    is_available BOOLEAN DEFAULT true,
    availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'unavailable', 'on_break')),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_editorial_assistant_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Manuscript Screening Records Table
CREATE TABLE IF NOT EXISTS manuscript_screenings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manuscript_id UUID NOT NULL,
    editorial_assistant_id UUID NOT NULL,
    
    -- Screening Results
    screening_status TEXT NOT NULL CHECK (screening_status IN ('passed', 'failed', 'needs_revision', 'under_review')),
    screening_decision TEXT NOT NULL CHECK (screening_decision IN ('proceed_to_associate_editor', 'return_to_author', 'desk_reject', 'hold_for_review')),
    
    -- Quality Checks
    file_completeness BOOLEAN NOT NULL,
    plagiarism_check BOOLEAN NOT NULL,
    format_compliance BOOLEAN NOT NULL,
    ethical_compliance BOOLEAN NOT NULL,
    language_quality BOOLEAN NOT NULL,
    
    -- Detailed Assessment
    quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 10),
    completeness_score INTEGER CHECK (completeness_score BETWEEN 1 AND 10),
    overall_assessment TEXT,
    
    -- Specific Issues Found
    identified_issues JSONB DEFAULT '[]'::jsonb,
    required_revisions JSONB DEFAULT '[]'::jsonb,
    revision_deadline DATE,
    
    -- Screening Process
    screening_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    screening_completed_at TIMESTAMP WITH TIME ZONE,
    screening_duration_minutes INTEGER,
    
    -- Notes and Comments
    screening_notes TEXT,
    internal_notes TEXT,
    author_feedback TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_screening_manuscript FOREIGN KEY (manuscript_id) REFERENCES submissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_screening_assistant FOREIGN KEY (editorial_assistant_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Screening Templates Table
CREATE TABLE IF NOT EXISTS screening_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name TEXT NOT NULL UNIQUE,
    template_description TEXT,
    
    -- Template Configuration
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    applicable_categories JSONB DEFAULT '[]'::jsonb,
    applicable_manuscript_types JSONB DEFAULT '[]'::jsonb,
    
    -- Screening Criteria
    required_checks JSONB DEFAULT '["file_completeness", "plagiarism_check", "format_compliance", "ethical_compliance"]'::jsonb,
    quality_thresholds JSONB DEFAULT '{"minimum_quality_score": 6, "minimum_completeness_score": 7}'::jsonb,
    
    -- Decision Rules
    decision_rules JSONB DEFAULT '{}'::jsonb,
    auto_decision_enabled BOOLEAN DEFAULT false,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Screening Workflow Rules Table
CREATE TABLE IF NOT EXISTS screening_workflow_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name TEXT NOT NULL UNIQUE,
    rule_description TEXT,
    
    -- Rule Configuration
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    applicable_stages JSONB DEFAULT '["submitted", "editorial_assistant_review"]'::jsonb,
    
    -- Rule Logic
    condition_type TEXT NOT NULL CHECK (condition_type IN ('all', 'any', 'none')),
    conditions JSONB NOT NULL, -- Array of condition objects
    actions JSONB NOT NULL, -- Array of action objects
    
    -- Execution Settings
    auto_execute BOOLEAN DEFAULT false,
    execution_order INTEGER DEFAULT 0,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ASSOCIATE EDITOR ASSIGNMENT TABLES
-- =====================================================

-- Associate Editor Assignment Records
CREATE TABLE IF NOT EXISTS associate_editor_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manuscript_id UUID NOT NULL,
    associate_editor_id UUID NOT NULL,
    assigned_by UUID NOT NULL, -- editorial assistant who made the assignment
    
    -- Assignment Details
    assignment_reason TEXT,
    assignment_notes TEXT,
    priority_level TEXT DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),
    
    -- Assignment Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'completed')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deadline TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    declined_at TIMESTAMP WITH TIME ZONE,
    
    -- Response Details
    response_notes TEXT,
    decline_reason TEXT,
    conflict_of_interest_declared BOOLEAN DEFAULT false,
    conflict_details TEXT,
    
    -- Performance Tracking
    time_to_accept_hours INTEGER,
    time_to_complete_hours INTEGER,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_assignment_manuscript FOREIGN KEY (manuscript_id) REFERENCES submissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_assignment_editor FOREIGN KEY (associate_editor_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_assignment_assistant FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Associate Editor Availability Table
CREATE TABLE IF NOT EXISTS associate_editor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    editor_id UUID NOT NULL,
    
    -- Availability Status
    is_accepting_assignments BOOLEAN DEFAULT true,
    current_workload INTEGER DEFAULT 0,
    max_workload INTEGER DEFAULT 5,
    
    -- Specialization Areas
    primary_specializations JSONB DEFAULT '[]'::jsonb,
    secondary_specializations JSONB DEFAULT '[]'::jsonb,
    preferred_manuscript_types JSONB DEFAULT '[]'::jsonb,
    
    -- Performance Metrics
    average_review_time_days INTEGER DEFAULT 14,
    completion_rate DECIMAL(5,2) DEFAULT 95.00,
    quality_rating DECIMAL(3,1) DEFAULT 8.0,
    
    -- Availability Schedule
    working_days JSONB DEFAULT '["monday", "tuesday", "wednesday", "thursday", "friday"]'::jsonb,
    working_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00"}'::jsonb,
    timezone TEXT DEFAULT 'UTC',
    
    -- Metadata
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_availability_editor FOREIGN KEY (editor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- WORKFLOW MANAGEMENT TABLES
-- =====================================================

-- Workflow Time Limits Table
CREATE TABLE IF NOT EXISTS workflow_time_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_stage TEXT NOT NULL UNIQUE,
    stage_description TEXT,
    
    -- Time Configuration
    time_limit_days INTEGER NOT NULL DEFAULT 7,
    reminder_days JSONB DEFAULT '[7, 3, 1]'::jsonb, -- Days before deadline to send reminders
    escalation_days JSONB DEFAULT '[7, 14, 21]'::jsonb, -- Days after deadline to escalate
    
    -- Escalation Settings
    auto_escalate BOOLEAN DEFAULT true,
    escalation_recipients JSONB DEFAULT '[]'::jsonb, -- Array of user IDs or roles
    escalation_actions JSONB DEFAULT '[]'::jsonb, -- Array of action objects
    
    -- Notification Settings
    reminder_enabled BOOLEAN DEFAULT true,
    escalation_notifications_enabled BOOLEAN DEFAULT true,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow History Table
CREATE TABLE IF NOT EXISTS workflow_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manuscript_id UUID NOT NULL,
    workflow_stage TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('status_change', 'assignment', 'decision', 'note', 'escalation')),
    
    -- Action Details
    action_description TEXT NOT NULL,
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Change Details
    previous_value TEXT,
    new_value TEXT,
    change_reason TEXT,
    
    -- Additional Context
    metadata JSONB DEFAULT '{}'::jsonb,
    related_entity_id UUID, -- ID of related entity (user, review, etc.)
    related_entity_type TEXT, -- Type of related entity
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_history_manuscript FOREIGN KEY (manuscript_id) REFERENCES submissions(id) ON DELETE CASCADE
);

-- =====================================================
-- QUALITY ASSURANCE TABLES
-- =====================================================

-- Quality Metrics Table
CREATE TABLE IF NOT EXISTS quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manuscript_id UUID NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('screening', 'editorial', 'review', 'overall')),
    
    -- Metric Values
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(5,2),
    metric_unit TEXT,
    target_value DECIMAL(5,2),
    threshold_min DECIMAL(5,2),
    threshold_max DECIMAL(5,2),
    
    -- Assessment Details
    assessed_by UUID REFERENCES users(id),
    assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assessment_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_metrics_manuscript FOREIGN KEY (manuscript_id) REFERENCES submissions(id) ON DELETE CASCADE
);

-- Quality Reports Table
CREATE TABLE IF NOT EXISTS quality_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual')),
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    
    -- Report Content
    report_data JSONB NOT NULL,
    summary_statistics JSONB,
    key_insights TEXT[],
    recommendations TEXT[],
    
    -- Report Status
    is_generated BOOLEAN DEFAULT false,
    generated_at TIMESTAMP WITH TIME ZONE,
    generated_by UUID REFERENCES users(id),
    
    -- Distribution
    recipients JSONB DEFAULT '[]'::jsonb,
    sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATION AND COMMUNICATION TABLES
-- =====================================================

-- Editorial Assistant Notifications Table
CREATE TABLE IF NOT EXISTS editorial_assistant_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('new_submission', 'screening_reminder', 'assignment_reminder', 'escalation', 'quality_alert', 'system_update')),
    
    -- Notification Content
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Related Entities
    related_manuscript_id UUID REFERENCES submissions(id),
    related_user_id UUID REFERENCES users(id),
    action_url TEXT,
    
    -- Delivery Status
    is_read BOOLEAN DEFAULT false,
    is_email_sent BOOLEAN DEFAULT false,
    is_sms_sent BOOLEAN DEFAULT false,
    is_push_sent BOOLEAN DEFAULT false,
    
    -- Delivery Tracking
    email_sent_at TIMESTAMP WITH TIME ZONE,
    sms_sent_at TIMESTAMP WITH TIME ZONE,
    push_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_notification_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Communication Templates Table
CREATE TABLE IF NOT EXISTS communication_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name TEXT NOT NULL UNIQUE,
    template_type TEXT NOT NULL CHECK (template_type IN ('email', 'sms', 'notification', 'letter')),
    
    -- Template Content
    subject TEXT,
    body TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb, -- Array of variable names that can be replaced
    
    -- Template Settings
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    applicable_roles JSONB DEFAULT '[]'::jsonb,
    applicable_workflow_stages JSONB DEFAULT '[]'::jsonb,
    
    -- Localization
    language TEXT DEFAULT 'en',
    locale TEXT DEFAULT 'en-US',
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Editorial Assistant Profiles Indexes
CREATE INDEX IF NOT EXISTS idx_editorial_assistant_profiles_user_id ON editorial_assistant_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_editorial_assistant_profiles_availability ON editorial_assistant_profiles(is_available, availability_status);
CREATE INDEX IF NOT EXISTS idx_editorial_assistant_profiles_specialization ON editorial_assistant_profiles USING GIN (specialization_areas);

-- Manuscript Screenings Indexes
CREATE INDEX IF NOT EXISTS idx_manuscript_screenings_manuscript_id ON manuscript_screenings(manuscript_id);
CREATE INDEX IF NOT EXISTS idx_manuscript_screenings_assistant_id ON manuscript_screenings(editorial_assistant_id);
CREATE INDEX IF NOT EXISTS idx_manuscript_screenings_status ON manuscript_screenings(screening_status);
CREATE INDEX IF NOT EXISTS idx_manuscript_screenings_created_at ON manuscript_screenings(created_at);
CREATE INDEX IF NOT EXISTS idx_manuscript_screenings_decision ON manuscript_screenings(screening_decision);

-- Associate Editor Assignments Indexes
CREATE INDEX IF NOT EXISTS idx_associate_editor_assignments_manuscript_id ON associate_editor_assignments(manuscript_id);
CREATE INDEX IF NOT EXISTS idx_associate_editor_assignments_editor_id ON associate_editor_assignments(associate_editor_id);
CREATE INDEX IF NOT EXISTS idx_associate_editor_assignments_status ON associate_editor_assignments(status);
CREATE INDEX IF NOT EXISTS idx_associate_editor_assignments_deadline ON associate_editor_assignments(deadline);

-- Workflow Management Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_history_manuscript_id ON workflow_history(manuscript_id);
CREATE INDEX IF NOT EXISTS idx_workflow_history_stage ON workflow_history(workflow_stage);
CREATE INDEX IF NOT EXISTS idx_workflow_history_action_type ON workflow_history(action_type);
CREATE INDEX IF NOT EXISTS idx_workflow_history_performed_at ON workflow_history(performed_at);

-- Quality Metrics Indexes
CREATE INDEX IF NOT EXISTS idx_quality_metrics_manuscript_id ON quality_metrics(manuscript_id);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_type ON quality_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_assessed_by ON quality_metrics(assessed_by);

-- Notification Indexes
CREATE INDEX IF NOT EXISTS idx_editorial_assistant_notifications_recipient_id ON editorial_assistant_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_editorial_assistant_notifications_type ON editorial_assistant_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_editorial_assistant_notifications_priority ON editorial_assistant_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_editorial_assistant_notifications_created_at ON editorial_assistant_notifications(created_at);

-- =====================================================
-- CONSTRAINTS AND VALIDATIONS
-- =====================================================

-- Add check constraints for data integrity
ALTER TABLE manuscript_screenings 
ADD CONSTRAINT chk_screening_scores 
CHECK (quality_score >= 1 AND quality_score <= 10 AND completeness_score >= 1 AND completeness_score <= 10);

ALTER TABLE associate_editor_assignments 
ADD CONSTRAINT chk_assignment_deadline 
CHECK (deadline > assigned_at);

ALTER TABLE workflow_time_limits 
ADD CONSTRAINT chk_workflow_time_limits 
CHECK (time_limit_days > 0);

-- =====================================================
-- SAMPLE DATA INSERTION
-- =====================================================

-- Insert default screening template
INSERT INTO screening_templates (id, template_name, template_description, is_default, applicable_categories, required_checks, quality_thresholds) 
VALUES (
    gen_random_uuid(),
    'Standard Medical Research Screening',
    'Default template for medical research manuscripts',
    true,
    '["clinical_research", "biomedical_sciences", "public_health", "epidemiology"]',
    '["file_completeness", "plagiarism_check", "format_compliance", "ethical_compliance", "language_quality"]',
    '{"minimum_quality_score": 6, "minimum_completeness_score": 7}'
) ON CONFLICT (template_name) DO NOTHING;

-- Insert default workflow time limits
INSERT INTO workflow_time_limits (workflow_stage, stage_description, time_limit_days, reminder_days, escalation_days) 
VALUES 
    ('editorial_assistant_review', 'Initial screening by editorial assistant', 7, '[7, 3, 1]', '[7, 14, 21]'),
    ('associate_editor_assignment', 'Associate editor assignment', 3, '[3, 1]', '[3, 7, 14]'),
    ('associate_editor_review', 'Associate editor content review', 14, '[14, 7, 3, 1]', '[14, 21, 28]'),
    ('reviewer_assignment', 'Reviewer assignment and invitation', 7, '[7, 3, 1]', '[7, 14, 21]'),
    ('under_review', 'Peer review process', 21, '[21, 14, 7, 3, 1]', '[21, 28, 35]')
ON CONFLICT (workflow_stage) DO UPDATE SET
    time_limit_days = EXCLUDED.time_limit_days,
    reminder_days = EXCLUDED.reminder_days,
    escalation_days = EXCLUDED.escalation_days;

-- Insert default communication templates
INSERT INTO communication_templates (template_name, template_type, subject, body, applicable_roles, applicable_workflow_stages) 
VALUES 
    (
        'Screening Completion Notification',
        'email',
        'Manuscript Screening Completed - {manuscript_title}',
        'Dear {associate_editor_name},\n\nA manuscript titled "{manuscript_title}" has completed initial screening and is ready for your review.\n\nManuscript ID: {manuscript_id}\nCategory: {category}\nPriority: {priority}\n\nPlease log into the system to review and make your decision.\n\nBest regards,\nEditorial Assistant Team',
        '["associate_editor", "editor"]',
        '["associate_editor_assignment"]'
    ),
    (
        'Screening Revision Request',
        'email',
        'Manuscript Revision Required - {manuscript_title}',
        'Dear {author_name},\n\nYour manuscript titled "{manuscript_title}" requires revisions based on our initial screening.\n\nIssues identified:\n{identified_issues}\n\nRequired revisions:\n{required_revisions}\n\nPlease address these issues and resubmit by {revision_deadline}.\n\nIf you have any questions, please contact our editorial team.\n\nBest regards,\nEditorial Assistant Team',
        '["author"]',
        '["revision_requested"]'
    )
ON CONFLICT (template_name) DO NOTHING;

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Editorial Assistant Dashboard View
CREATE OR REPLACE VIEW editorial_assistant_dashboard AS
SELECT 
    ea.user_id,
    ea.specialization_areas,
    ea.current_daily_screened,
    ea.screening_capacity,
    ea.accuracy_rate,
    ea.is_available,
    ea.availability_status,
    COUNT(ms.id) as total_screenings_today,
    COUNT(CASE WHEN ms.screening_status = 'passed' THEN 1 END) as passed_screenings_today,
    COUNT(CASE WHEN ms.screening_status = 'failed' THEN 1 END) as failed_screenings_today,
    AVG(ms.screening_duration_minutes) as avg_screening_time_today
FROM editorial_assistant_profiles ea
LEFT JOIN manuscript_screenings ms ON ea.user_id = ms.editorial_assistant_id 
    AND DATE(ms.created_at) = CURRENT_DATE
GROUP BY ea.id, ea.user_id, ea.specialization_areas, ea.current_daily_screened, 
         ea.screening_capacity, ea.accuracy_rate, ea.is_available, ea.availability_status;

-- Manuscript Queue View
CREATE OR REPLACE VIEW manuscript_queue AS
SELECT 
    s.id as submission_id,
    s.status,
    s.created_at as submitted_at,
    a.title,
    a.category,
    a.article_type,
    u.name as author_name,
    u.email as author_email,
    CASE 
        WHEN s.status = 'submitted' THEN 1
        WHEN s.status = 'editorial_assistant_review' THEN 2
        WHEN s.status = 'associate_editor_assignment' THEN 3
        ELSE 4
    END as priority_order,
    EXTRACT(EPOCH FROM (NOW() - s.created_at)) / 86400 as days_in_queue
FROM submissions s
JOIN articles a ON s.article_id = a.id
JOIN users u ON a.author_id = u.id
WHERE s.status IN ('submitted', 'editorial_assistant_review', 'associate_editor_assignment')
ORDER BY priority_order, s.created_at;

-- Associate Editor Workload View
CREATE OR REPLACE VIEW associate_editor_workload AS
SELECT 
    aea.editor_id,
    u.name as editor_name,
    u.email as editor_email,
    aea.current_workload,
    aea.max_workload,
    aea.is_accepting_assignments,
    COUNT(ae.id) as active_assignments,
    AVG(ae.time_to_accept_hours) as avg_acceptance_time,
    AVG(ae.time_to_complete_hours) as avg_completion_time
FROM associate_editor_availability aea
JOIN users u ON aea.editor_id = u.id
LEFT JOIN associate_editor_assignments ae ON aea.editor_id = ae.associate_editor_id 
    AND ae.status IN ('pending', 'accepted')
GROUP BY aea.id, aea.editor_id, u.name, u.email, aea.current_workload, 
         aea.max_workload, aea.is_accepting_assignments;

-- =====================================================
-- FUNCTIONS FOR AUTOMATION
-- =====================================================

-- Function to calculate screening priority
CREATE OR REPLACE FUNCTION calculate_screening_priority(
    submission_date TIMESTAMP WITH TIME ZONE,
    manuscript_category TEXT,
    author_experience_level TEXT DEFAULT 'standard'
) RETURNS INTEGER AS $$
DECLARE
    days_old INTEGER;
    priority_score INTEGER := 0;
BEGIN
    -- Calculate days since submission
    days_old := EXTRACT(EPOCH FROM (NOW() - submission_date)) / 86400;
    
    -- Base priority based on age
    IF days_old <= 1 THEN
        priority_score := 1; -- High priority for new submissions
    ELSIF days_old <= 3 THEN
        priority_score := 2; -- Medium-high priority
    ELSIF days_old <= 7 THEN
        priority_score := 3; -- Medium priority
    ELSIF days_old <= 14 THEN
        priority_score := 4; -- Medium-low priority
    ELSE
        priority_score := 5; -- Low priority for old submissions
    END IF;
    
    -- Adjust priority based on category (some categories may be more urgent)
    IF manuscript_category IN ('clinical_research', 'case_study') THEN
        priority_score := GREATEST(1, priority_score - 1); -- Increase priority
    END IF;
    
    -- Adjust priority based on author experience
    IF author_experience_level = 'new' THEN
        priority_score := GREATEST(1, priority_score - 1); -- Increase priority for new authors
    END IF;
    
    RETURN priority_score;
END;
$$ LANGUAGE plpgsql;

-- Function to check if editorial assistant is overloaded
CREATE OR REPLACE FUNCTION is_editorial_assistant_overloaded(
    assistant_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    current_load INTEGER;
    max_capacity INTEGER;
BEGIN
    SELECT 
        current_daily_screened,
        screening_capacity
    INTO current_load, max_capacity
    FROM editorial_assistant_profiles
    WHERE user_id = assistant_user_id;
    
    RETURN COALESCE(current_load, 0) >= COALESCE(max_capacity, 20);
END;
$$ LANGUAGE plpgsql;

-- Function to get next available associate editor
CREATE OR REPLACE FUNCTION get_next_available_associate_editor(
    manuscript_category TEXT,
    manuscript_type TEXT DEFAULT 'research'
) RETURNS UUID AS $$
DECLARE
    available_editor_id UUID;
BEGIN
    SELECT aea.editor_id
    INTO available_editor_id
    FROM associate_editor_availability aea
    WHERE aea.is_accepting_assignments = true
        AND aea.current_workload < aea.max_workload
        AND (
            manuscript_category = ANY(aea.primary_specializations) OR
            manuscript_category = ANY(aea.secondary_specializations)
        )
        AND manuscript_type = ANY(aea.preferred_manuscript_types)
    ORDER BY aea.current_workload ASC, aea.quality_rating DESC
    LIMIT 1;
    
    RETURN available_editor_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS FOR AUTOMATION
-- =====================================================

-- Trigger to update screening duration when screening is completed
CREATE OR REPLACE FUNCTION update_screening_duration() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.screening_completed_at IS NOT NULL AND OLD.screening_completed_at IS NULL THEN
        NEW.screening_duration_minutes := EXTRACT(EPOCH FROM (NEW.screening_completed_at - NEW.screening_started_at)) / 60;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_screening_duration
    BEFORE UPDATE ON manuscript_screenings
    FOR EACH ROW
    EXECUTE FUNCTION update_screening_duration();

-- Trigger to update editorial assistant daily count
CREATE OR REPLACE FUNCTION update_daily_screening_count() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.screening_completed_at IS NOT NULL AND OLD.screening_completed_at IS NULL THEN
        -- Reset daily count if it's a new day
        IF DATE(NEW.screening_completed_at) != DATE(OLD.screening_started_at) THEN
            UPDATE editorial_assistant_profiles 
            SET current_daily_screened = 1
            WHERE user_id = NEW.editorial_assistant_id;
        ELSE
            -- Increment daily count
            UPDATE editorial_assistant_profiles 
            SET current_daily_screened = current_daily_screened + 1
            WHERE user_id = NEW.editorial_assistant_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_screening_count
    AFTER UPDATE ON manuscript_screenings
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_screening_count();

-- =====================================================
-- GRANTS AND PERMISSIONS
-- =====================================================

-- Grant appropriate permissions to editorial assistant role
-- Note: These should be adjusted based on your actual database user setup

-- Example grants (adjust user/role names as needed):
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO editorial_assistant_role;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO editorial_assistant_role;
-- GRANT USAGE ON SCHEMA public TO editorial_assistant_role;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE editorial_assistant_profiles IS 'Stores profiles and preferences for editorial assistants';
COMMENT ON TABLE manuscript_screenings IS 'Records all manuscript screening activities performed by editorial assistants';
COMMENT ON TABLE screening_templates IS 'Configurable templates for different types of manuscript screening';
COMMENT ON TABLE associate_editor_assignments IS 'Tracks assignment of manuscripts to associate editors';
COMMENT ON TABLE workflow_time_limits IS 'Configurable time limits for different workflow stages';
COMMENT ON TABLE quality_metrics IS 'Stores quality assessment metrics for manuscripts throughout the workflow';

COMMENT ON FUNCTION calculate_screening_priority IS 'Calculates priority score for manuscript screening based on age, category, and author experience';
COMMENT ON FUNCTION is_editorial_assistant_overloaded IS 'Checks if an editorial assistant has reached their daily screening capacity';
COMMENT ON FUNCTION get_next_available_associate_editor IS 'Finds the next available associate editor based on workload and specialization';

-- =====================================================
-- END OF EDITORIAL ASSISTANT SCHEMA
-- =====================================================
