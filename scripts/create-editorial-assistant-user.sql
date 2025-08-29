-- =====================================================
-- Create Editorial Assistant User and Profile
-- AMHSJ Editorial Assistant Setup
-- =====================================================

-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Editorial Assistant User
INSERT INTO users (
    id, 
    email, 
    name, 
    password, 
    role, 
    affiliation, 
    bio, 
    expertise, 
    specializations, 
    research_interests,
    is_verified, 
    is_active, 
    application_status, 
    profile_completeness, 
    created_at, 
    updated_at
) VALUES (
    gen_random_uuid(),
    'editorial.assistant@amhsj.org',
    'Editorial Assistant',
    -- Note: In production, this should be a properly hashed password
    -- For development, you can use bcrypt to hash 'password123'
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/vHhHqGm', -- password123
    'editorial-assistant',
    'AMHSJ Editorial Office',
    'Professional editorial assistant with expertise in manuscript screening, quality assessment, and workflow management. Specialized in medical and health sciences research manuscripts.',
    '["manuscript-screening", "editorial-support", "quality-control", "workflow-management"]',
    '["general-medicine", "clinical-research", "biomedical-sciences", "public-health", "epidemiology"]',
    '["manuscript-quality-assessment", "editorial-workflow-optimization", "academic-publishing-standards"]',
    true,
    true,
    'approved',
    100,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Create Editorial Assistant Profile
INSERT INTO editorial_assistant_profiles (
    id,
    user_id,
    specialization_areas,
    screening_capacity,
    current_daily_screened,
    average_screening_time_minutes,
    total_manuscripts_screened,
    accuracy_rate,
    preferred_manuscript_types,
    working_hours,
    auto_assignment_enabled,
    is_available,
    availability_status,
    last_activity,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    u.id,
    '["clinical_research", "biomedical_sciences", "public_health", "epidemiology", "case_studies"]',
    25, -- manuscripts per day
    0,  -- current daily count
    12, -- average minutes per screening
    0,  -- total count starts at 0
    95.00, -- accuracy rate
    '["research", "review", "case_study", "editorial", "letter"]',
    '{"start": "08:00", "end": "17:00", "timezone": "UTC"}',
    true,
    true,
    'available',
    NOW(),
    NOW(),
    NOW()
FROM users u 
WHERE u.email = 'editorial.assistant@amhsj.org'
ON CONFLICT (user_id) DO UPDATE SET
    specialization_areas = EXCLUDED.specialization_areas,
    screening_capacity = EXCLUDED.screening_capacity,
    updated_at = NOW();

-- Insert default screening template for editorial assistant
INSERT INTO screening_templates (
    id,
    template_name,
    template_description,
    is_default,
    applicable_categories,
    applicable_manuscript_types,
    required_checks,
    quality_thresholds,
    decision_rules,
    auto_decision_enabled,
    created_by,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    'Editorial Assistant Standard Screening',
    'Default screening template for editorial assistants to ensure consistent quality assessment',
    true,
    '["clinical_research", "biomedical_sciences", "public_health", "epidemiology", "case_studies"]',
    '["research", "review", "case_study", "editorial", "letter"]',
    '["file_completeness", "plagiarism_check", "format_compliance", "ethical_compliance", "language_quality"]',
    '{"minimum_quality_score": 6, "minimum_completeness_score": 7, "maximum_plagiarism_score": 15}',
    '{"auto_reject": {"plagiarism_score": 25, "quality_score": 3}, "auto_accept": {"quality_score": 9, "completeness_score": 9}}',
    false,
    u.id,
    NOW(),
    NOW()
FROM users u 
WHERE u.email = 'editorial.assistant@amhsj.org'
ON CONFLICT (template_name) DO UPDATE SET
    template_description = EXCLUDED.template_description,
    updated_at = NOW();

-- Insert workflow time limits for editorial assistant workflow
INSERT INTO workflow_time_limits (
    id,
    workflow_stage,
    stage_description,
    time_limit_days,
    reminder_days,
    escalation_days,
    auto_escalate,
    escalation_recipients,
    escalation_actions,
    reminder_enabled,
    escalation_notifications_enabled,
    is_active,
    created_at,
    updated_at
) VALUES 
    (
        gen_random_uuid(),
        'editorial_assistant_review',
        'Initial screening by editorial assistant',
        7,
        '[7, 3, 1]',
        '[7, 14, 21]',
        true,
        '["managing-editor", "editor-in-chief"]',
        '["send_reminder", "escalate_to_supervisor", "reassign_if_needed"]',
        true,
        true,
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'associate_editor_assignment',
        'Associate editor assignment after screening',
        3,
        '[3, 1]',
        '[3, 7, 14]',
        true,
        '["managing-editor"]',
        '["send_reminder", "auto_assign_alternative_editor"]',
        true,
        true,
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'associate_editor_review',
        'Associate editor content review',
        14,
        '[14, 7, 3, 1]',
        '[14, 21, 28]',
        true,
        '["managing-editor", "editor-in-chief"]',
        '["send_reminder", "escalate_to_supervisor"]',
        true,
        true,
        true,
        NOW(),
        NOW()
    )
ON CONFLICT (workflow_stage) DO UPDATE SET
    time_limit_days = EXCLUDED.time_limit_days,
    reminder_days = EXCLUDED.reminder_days,
    escalation_days = EXCLUDED.escalation_days,
    updated_at = NOW();

-- Insert communication templates for editorial assistant
INSERT INTO communication_templates (
    id,
    template_name,
    template_type,
    subject,
    body,
    variables,
    is_active,
    is_default,
    applicable_roles,
    applicable_workflow_stages,
    language,
    locale,
    created_by,
    created_at,
    updated_at
) VALUES 
    (
        gen_random_uuid(),
        'New Submission Notification - Editorial Assistant',
        'email',
        'New Manuscript Submission - {manuscript_title}',
        'Dear Editorial Assistant,

A new manuscript has been submitted and requires your initial screening.

📋 **Manuscript Details:**
- **Title**: {manuscript_title}
- **Manuscript ID**: {manuscript_id}
- **Category**: {category}
- **Article Type**: {article_type}
- **Author**: {author_name}
- **Submitted**: {submission_date}
- **Priority**: {priority_level}

🚀 **Quick Actions:**
• [Login to Editorial Assistant Dashboard]({login_url})
• [View Manuscript Details]({manuscript_url})
• [Start Screening Process]({screening_url})

⏰ **Response Time**: Please complete initial screening within 7 days

📧 **Need Help?** Contact managing@amhsj.org

Best regards,
AMHSJ Editorial Office

---
*This is an automated notification. Please do not reply to this email.*',
        '["manuscript_title", "manuscript_id", "category", "article_type", "author_name", "submission_date", "priority_level", "login_url", "manuscript_url", "screening_url"]',
        true,
        true,
        '["editorial-assistant"]',
        '["submitted", "editorial_assistant_review"]',
        'en',
        'en-US',
        (SELECT id FROM users WHERE email = 'editorial.assistant@amhsj.org'),
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Screening Completion Notification',
        'email',
        'Manuscript Screening Completed - {manuscript_title}',
        'Dear {associate_editor_name},

A manuscript titled "{manuscript_title}" has completed initial screening and is ready for your review.

📋 **Manuscript Details:**
- **Title**: {manuscript_title}
- **Manuscript ID**: {manuscript_id}
- **Category**: {category}
- **Article Type**: {article_type}
- **Priority Level**: {priority}
- **Screening Score**: {screening_score}/10
- **Screening Notes**: {screening_notes}

🚀 **Quick Actions:**
• [Login to Associate Editor Dashboard]({login_url})
• [Review Manuscript]({manuscript_url})
• [Make Editorial Decision]({decision_url})

⏰ **Response Time**: Please complete review within 14 days

Best regards,
Editorial Assistant Team
AMHSJ Editorial Office

---
*This is an automated notification. Please do not reply to this email.*',
        '["associate_editor_name", "manuscript_title", "manuscript_id", "category", "article_type", "priority", "screening_score", "screening_notes", "login_url", "manuscript_url", "decision_url"]',
        true,
        true,
        '["associate_editor", "editor"]',
        '["associate_editor_assignment"]',
        'en',
        'en-US',
        (SELECT id FROM users WHERE email = 'editorial.assistant@amhsj.org'),
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Daily Screening Summary - Editorial Assistant',
        'email',
        'Daily Screening Summary - {date}',
        'Dear Editorial Assistant,

Here is your daily screening summary for {date}:

📊 **Today''s Statistics:**
- **Manuscripts Screened**: {manuscripts_screened}
- **Pending Screening**: {pending_count}
- **Average Screening Time**: {avg_screening_time} minutes
- **Accuracy Rate**: {accuracy_rate}%

📋 **Pending Manuscripts:**
{manuscript_list}

🚀 **Quick Actions:**
• [Login to Dashboard]({login_url})
• [View Pending Queue]({queue_url})
• [Performance Analytics]({analytics_url})

⏰ **Reminder**: Maintain screening quality and response times

Best regards,
AMHSJ Editorial Office

---
*This is an automated daily summary. Please do not reply to this email.*',
        '["date", "manuscripts_screened", "pending_count", "avg_screening_time", "accuracy_rate", "manuscript_list", "login_url", "queue_url", "analytics_url"]',
        true,
        false,
        '["editorial-assistant"]',
        '["daily_summary"]',
        'en',
        'en-US',
        (SELECT id FROM users WHERE email = 'editorial.assistant@amhsj.org'),
        NOW(),
        NOW()
    )
ON CONFLICT (template_name) DO NOTHING;

-- Insert quality metrics baseline for editorial assistant
INSERT INTO quality_metrics (
    id,
    manuscript_id,
    metric_type,
    metric_name,
    metric_value,
    metric_unit,
    target_value,
    threshold_min,
    threshold_max,
    assessed_by,
    assessment_date,
    assessment_notes,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    NULL, -- No specific manuscript for baseline metrics
    'screening',
    'baseline_accuracy',
    95.00,
    'percentage',
    95.00,
    90.00,
    100.00,
    u.id,
    NOW(),
    'Baseline accuracy rate for editorial assistant screening',
    NOW(),
    NOW()
FROM users u 
WHERE u.email = 'editorial.assistant@amhsj.org';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_editorial_assistant_profiles_user_id ON editorial_assistant_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_editorial_assistant_profiles_availability ON editorial_assistant_profiles(is_available, availability_status);
CREATE INDEX IF NOT EXISTS idx_manuscript_screenings_assistant_id ON manuscript_screenings(editorial_assistant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_time_limits_stage ON workflow_time_limits(workflow_stage);

-- Verify the setup
SELECT 
    'Editorial Assistant User Created' as status,
    u.email,
    u.role,
    u.is_active,
    u.profile_completeness
FROM users u 
WHERE u.email = 'editorial.assistant@amhsj.org'

UNION ALL

SELECT 
    'Editorial Assistant Profile Created' as status,
    'Profile ID: ' || ea.id as email,
    'Capacity: ' || ea.screening_capacity || ' manuscripts/day' as role,
    ea.is_available as is_active,
    ea.total_manuscripts_screened as profile_completeness
FROM editorial_assistant_profiles ea
JOIN users u ON ea.user_id = u.id
WHERE u.email = 'editorial.assistant@amhsj.org'

UNION ALL

SELECT 
    'Screening Template Created' as status,
    'Template: ' || st.template_name as email,
    'Default: ' || st.is_default as role,
    st.is_active as is_active,
    0 as profile_completeness
FROM screening_templates st
JOIN users u ON st.created_by = u.id
WHERE u.email = 'editorial.assistant@amhsj.org'

UNION ALL

SELECT 
    'Workflow Time Limits Created' as status,
    'Stages: ' || COUNT(wtl.workflow_stage) as email,
    'Active: ' || COUNT(CASE WHEN wtl.is_active THEN 1 END) as role,
    true as is_active,
    COUNT(*) as profile_completeness
FROM workflow_time_limits wtl;

-- =====================================================
-- Editorial Assistant Login Credentials
-- =====================================================
/*
Email: editorial.assistant@amhsj.org
Password: password123
Role: editorial-assistant
Dashboard: /editorial-assistant

Note: In production, change the password and use proper password hashing.
The current hash is for development purposes only.
*/
