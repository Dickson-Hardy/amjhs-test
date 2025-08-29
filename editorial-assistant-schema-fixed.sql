-- =====================================================
-- AMHSJ Editorial Assistant Database Schema (Fixed)
-- Essential tables without problematic functions
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
    
    -- Required Checks
    required_checks JSONB DEFAULT '[]'::jsonb,
    quality_thresholds JSONB DEFAULT '{}'::jsonb,
    decision_rules JSONB DEFAULT '{}'::jsonb,
    
    -- Automation
    auto_decision_enabled BOOLEAN DEFAULT false,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Associate Editor Assignments Table
CREATE TABLE IF NOT EXISTS associate_editor_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manuscript_id UUID NOT NULL,
    associate_editor_id UUID NOT NULL,
    
    -- Assignment Details
    assignment_type TEXT NOT NULL DEFAULT 'primary' CHECK (assignment_type IN ('primary', 'secondary', 'backup')),
    assignment_reason TEXT,
    
    -- Status and Progress
    status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'declined', 'in_progress', 'completed')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    deadline TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Workload Management
    priority_level TEXT DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),
    estimated_completion_days INTEGER,
    
    -- Notes and Communication
    assignment_notes TEXT,
    editor_notes TEXT,
    internal_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_assignment_manuscript FOREIGN KEY (manuscript_id) REFERENCES submissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_assignment_editor FOREIGN KEY (associate_editor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Associate Editor Availability Table
CREATE TABLE IF NOT EXISTS associate_editor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    editor_id UUID NOT NULL,
    
    -- Availability Settings
    is_accepting_assignments BOOLEAN DEFAULT true,
    max_workload INTEGER DEFAULT 5, -- maximum concurrent assignments
    current_workload INTEGER DEFAULT 0,
    
    -- Specializations
    primary_specializations JSONB DEFAULT '[]'::jsonb,
    secondary_specializations JSONB DEFAULT '[]'::jsonb,
    preferred_manuscript_types JSONB DEFAULT '["research", "review", "case_study"]'::jsonb,
    
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

-- =====================================================
-- COMMUNICATION AND NOTIFICATIONS
-- =====================================================

-- Communication Templates Table
CREATE TABLE IF NOT EXISTS communication_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name TEXT NOT NULL UNIQUE,
    template_type TEXT NOT NULL CHECK (template_type IN ('email', 'sms', 'notification')),
    subject TEXT,
    body TEXT NOT NULL,
    
    -- Template Configuration
    variables JSONB DEFAULT '[]'::jsonb, -- Array of variable names that can be substituted
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    -- Applicability
    applicable_roles JSONB DEFAULT '[]'::jsonb, -- Array of user roles this template applies to
    applicable_workflow_stages JSONB DEFAULT '[]'::jsonb, -- Array of workflow stages this template applies to
    
    -- Localization
    language TEXT DEFAULT 'en',
    locale TEXT DEFAULT 'en-US',
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Editorial Assistant Notifications Table
CREATE TABLE IF NOT EXISTS editorial_assistant_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('new_submission', 'screening_reminder', 'workflow_update', 'system_alert')),
    
    -- Notification Content
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Action and Status
    action_url TEXT, -- URL to navigate to when notification is clicked
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Related Entities
    related_manuscript_id UUID REFERENCES submissions(id),
    related_workflow_stage TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration date
    
    CONSTRAINT fk_notification_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
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
        'Dear {author_name},\n\nYour manuscript "{manuscript_title}" requires revisions before it can proceed to the next stage.\n\nManuscript ID: {manuscript_id}\nRequired Revisions: {revision_list}\nDeadline: {revision_deadline}\n\nPlease address the identified issues and resubmit.\n\nBest regards,\nEditorial Assistant Team',
        '["author"]',
        '["editorial_assistant_review"]'
    )
ON CONFLICT (template_name) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify tables were created
SELECT 'editorial_assistant_profiles' as table_name, COUNT(*) as record_count FROM editorial_assistant_profiles
UNION ALL
SELECT 'manuscript_screenings', COUNT(*) FROM manuscript_screenings
UNION ALL
SELECT 'screening_templates', COUNT(*) FROM screening_templates
UNION ALL
SELECT 'associate_editor_assignments', COUNT(*) FROM associate_editor_assignments
UNION ALL
SELECT 'associate_editor_availability', COUNT(*) FROM associate_editor_availability
UNION ALL
SELECT 'workflow_time_limits', COUNT(*) FROM workflow_time_limits
UNION ALL
SELECT 'workflow_history', COUNT(*) FROM workflow_history
UNION ALL
SELECT 'quality_metrics', COUNT(*) FROM quality_metrics
UNION ALL
SELECT 'communication_templates', COUNT(*) FROM communication_templates
UNION ALL
SELECT 'editorial_assistant_notifications', COUNT(*) FROM editorial_assistant_notifications;
