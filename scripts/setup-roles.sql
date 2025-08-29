-- =========================================================================
-- AMHSJ Academic Journal - Complete Role Setup SQL Script
-- =========================================================================
-- This script creates all necessary roles, users, and associated data
-- for the complete academic journal workflow system
-- =========================================================================

-- Start transaction to ensure data consistency
BEGIN;

-- =========================================================================
-- 1. ADMIN ROLE SETUP
-- =========================================================================

-- System Administrator
INSERT INTO users (
    id, email, name, password, role, affiliation, bio, 
    expertise, is_verified, is_active, application_status,
    profile_completeness, specializations, research_interests,
    created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'admin@amhsj.org',
    'System Administrator',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password123
    'admin',
    'AMHSJ Editorial Office',
    'System administrator responsible for technical infrastructure and user management.',
    '["system_administration", "database_management", "security"]'::jsonb,
    true,
    true,
    'approved',
    100,
    '["system_admin", "technical_support"]'::jsonb,
    '["journal_management", "editorial_systems"]'::jsonb,
    NOW(),
    NOW()
);

-- =========================================================================
-- 2. EDITOR-IN-CHIEF ROLE SETUP
-- =========================================================================

-- Editor-in-Chief
INSERT INTO users (
    id, email, name, password, role, affiliation, bio,
    expertise, is_verified, is_active, application_status,
    profile_completeness, specializations, research_interests,
    orcid, orcid_verified,
    created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'eic@amhsj.org',
    'Dr. Sarah Johnson',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'editor-in-chief',
    'Harvard Medical School',
    'Editor-in-Chief with 20+ years of experience in medical research and publishing. Specializes in cardiovascular medicine and editorial leadership.',
    '["cardiovascular_medicine", "editorial_leadership", "research_methodology"]'::jsonb,
    true,
    true,
    'approved',
    100,
    '["cardiology", "editorial_management", "research_oversight"]'::jsonb,
    '["cardiovascular_research", "editorial_innovation", "academic_publishing"]'::jsonb,
    '0000-0002-1825-0097',
    true,
    NOW(),
    NOW()
);

-- Editor-in-Chief Profile
INSERT INTO editor_profiles (
    user_id, editor_type, assigned_sections, current_workload, max_workload,
    is_accepting_submissions, editorial_experience, start_date, is_active
) SELECT 
    id, 'chief', 
    '["all_sections", "general", "cardiovascular", "internal_medicine"]'::jsonb,
    5, 15, true,
    'Former Associate Editor at NEJM, 15 years editorial experience, 200+ publications',
    NOW(), true
FROM users WHERE email = 'eic@amhsj.org';

-- =========================================================================
-- 3. MANAGING EDITOR ROLE SETUP
-- =========================================================================

-- Managing Editor
INSERT INTO users (
    id, email, name, password, role, affiliation, bio,
    expertise, is_verified, is_active, application_status,
    profile_completeness, specializations, research_interests,
    orcid, orcid_verified,
    created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'managing@amhsj.org',
    'Dr. Michael Chen',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'managing-editor',
    'Johns Hopkins University',
    'Managing Editor responsible for editorial workflow optimization and operations management. Expert in editorial processes and manuscript handling.',
    '["editorial_management", "workflow_optimization", "peer_review_systems"]'::jsonb,
    true,
    true,
    'approved',
    100,
    '["editorial_operations", "manuscript_management", "reviewer_coordination"]'::jsonb,
    '["editorial_efficiency", "peer_review_innovation", "publishing_technology"]'::jsonb,
    '0000-0003-1234-5678',
    true,
    NOW(),
    NOW()
);

-- Managing Editor Profile
INSERT INTO editor_profiles (
    user_id, editor_type, assigned_sections, current_workload, max_workload,
    is_accepting_submissions, editorial_experience, start_date, is_active
) SELECT 
    id, 'managing', 
    '["operations", "workflow", "reviewer_management"]'::jsonb,
    8, 20, true,
    'Managing Editor at 3 major journals, workflow optimization specialist',
    NOW(), true
FROM users WHERE email = 'managing@amhsj.org';

-- =========================================================================
-- 4. SECTION EDITORS ROLE SETUP
-- =========================================================================

-- Section Editor - Cardiology
INSERT INTO users (
    id, email, name, password, role, affiliation, bio,
    expertise, is_verified, is_active, application_status,
    profile_completeness, specializations, research_interests,
    orcid, orcid_verified,
    created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'cardiology.editor@amhsj.org',
    'Dr. Elizabeth Williams',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'section-editor',
    'Mayo Clinic',
    'Section Editor for Cardiology with expertise in interventional cardiology and heart failure research.',
    '["interventional_cardiology", "heart_failure", "cardiac_imaging"]'::jsonb,
    true,
    true,
    'approved',
    100,
    '["cardiology", "interventional_procedures", "cardiac_research"]'::jsonb,
    '["interventional_cardiology", "heart_failure_management", "cardiac_imaging_innovation"]'::jsonb,
    '0000-0004-2345-6789',
    true,
    NOW(),
    NOW()
);

-- Section Editor - Neurology
INSERT INTO users (
    id, email, name, password, role, affiliation, bio,
    expertise, is_verified, is_active, application_status,
    profile_completeness, specializations, research_interests,
    orcid, orcid_verified,
    created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'neurology.editor@amhsj.org',
    'Dr. Robert Davis',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'section-editor',
    'Stanford University Medical Center',
    'Section Editor for Neurology specializing in neurodegenerative diseases and neuroimaging.',
    '["neurodegenerative_diseases", "neuroimaging", "cognitive_neuroscience"]'::jsonb,
    true,
    true,
    'approved',
    100,
    '["neurology", "neurodegeneration", "brain_imaging"]'::jsonb,
    '["alzheimer_research", "parkinson_disease", "neuroimaging_techniques"]'::jsonb,
    '0000-0005-3456-7890',
    true,
    NOW(),
    NOW()
);

-- Section Editor - Oncology
INSERT INTO users (
    id, email, name, password, role, affiliation, bio,
    expertise, is_verified, is_active, application_status,
    profile_completeness, specializations, research_interests,
    orcid, orcid_verified,
    created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'oncology.editor@amhsj.org',
    'Dr. Maria Rodriguez',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'section-editor',
    'MD Anderson Cancer Center',
    'Section Editor for Oncology with focus on precision medicine and immunotherapy research.',
    '["precision_oncology", "immunotherapy", "cancer_genomics"]'::jsonb,
    true,
    true,
    'approved',
    100,
    '["oncology", "precision_medicine", "immunotherapy"]'::jsonb,
    '["cancer_genomics", "targeted_therapy", "immune_checkpoint_inhibitors"]'::jsonb,
    '0000-0006-4567-8901',
    true,
    NOW(),
    NOW()
);

-- Section Editor Profiles
INSERT INTO editor_profiles (
    user_id, editor_type, assigned_sections, current_workload, max_workload,
    is_accepting_submissions, editorial_experience, start_date, is_active
) 
SELECT 
    u.id, 'section',
    CASE 
        WHEN u.email = 'cardiology.editor@amhsj.org' THEN '["cardiology", "cardiovascular_medicine"]'::jsonb
        WHEN u.email = 'neurology.editor@amhsj.org' THEN '["neurology", "neuroscience"]'::jsonb
        WHEN u.email = 'oncology.editor@amhsj.org' THEN '["oncology", "cancer_research"]'::jsonb
    END,
    3, 12, true,
    'Section Editor experience at leading medical journals',
    NOW(), true
FROM users u 
WHERE u.email IN ('cardiology.editor@amhsj.org', 'neurology.editor@amhsj.org', 'oncology.editor@amhsj.org');

-- =========================================================================
-- 5. PRODUCTION EDITOR ROLE SETUP
-- =========================================================================

-- Production Editor
INSERT INTO users (
    id, email, name, password, role, affiliation, bio,
    expertise, is_verified, is_active, application_status,
    profile_completeness, specializations, research_interests,
    orcid, orcid_verified,
    created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'production@amhsj.org',
    'Dr. Lisa Thompson',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'production-editor',
    'AMHSJ Editorial Office',
    'Production Editor responsible for copyediting, typesetting, and publication workflow management.',
    '["copyediting", "typesetting", "publication_workflow", "doi_management"]'::jsonb,
    true,
    true,
    'approved',
    100,
    '["production_editing", "manuscript_formatting", "publication_systems"]'::jsonb,
    '["editorial_technology", "publication_standards", "digital_publishing"]'::jsonb,
    '0000-0007-5678-9012',
    true,
    NOW(),
    NOW()
);

-- Production Editor Profile
INSERT INTO editor_profiles (
    user_id, editor_type, assigned_sections, current_workload, max_workload,
    is_accepting_submissions, editorial_experience, start_date, is_active
) SELECT 
    id, 'production', 
    '["production", "copyediting", "typesetting", "publication"]'::jsonb,
    12, 25, true,
    'Production Editor at multiple medical journals, XML/JATS specialist',
    NOW(), true
FROM users WHERE email = 'production@amhsj.org';

-- =========================================================================
-- 6. GUEST EDITOR ROLE SETUP
-- =========================================================================

-- Guest Editor - AI in Medicine Special Issue
INSERT INTO users (
    id, email, name, password, role, affiliation, bio,
    expertise, is_verified, is_active, application_status,
    profile_completeness, specializations, research_interests,
    orcid, orcid_verified,
    created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'guest.ai@amhsj.org',
    'Dr. Ahmed Hassan',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'guest-editor',
    'MIT Computer Science and Artificial Intelligence Laboratory',
    'Guest Editor for AI in Medicine special issue. Expert in machine learning applications in healthcare.',
    '["artificial_intelligence", "machine_learning", "medical_ai", "computer_vision"]'::jsonb,
    true,
    true,
    'approved',
    100,
    '["medical_ai", "machine_learning", "computer_vision", "healthcare_informatics"]'::jsonb,
    '["ai_diagnostics", "machine_learning_healthcare", "medical_image_analysis"]'::jsonb,
    '0000-0008-6789-0123',
    true,
    NOW(),
    NOW()
);

-- Guest Editor Profile
INSERT INTO editor_profiles (
    user_id, editor_type, assigned_sections, current_workload, max_workload,
    is_accepting_submissions, editorial_experience, start_date, is_active
) SELECT 
    id, 'guest', 
    '["artificial_intelligence", "medical_ai", "machine_learning"]'::jsonb,
    2, 8, true,
    'Guest Editor for AI in Medicine special issues at Nature Medicine and NEJM AI',
    NOW(), true
FROM users WHERE email = 'guest.ai@amhsj.org';

-- =========================================================================
-- 7. ASSOCIATE EDITORS ROLE SETUP
-- =========================================================================

-- Associate Editor 1
INSERT INTO users (
    id, email, name, password, role, affiliation, bio,
    expertise, is_verified, is_active, application_status,
    profile_completeness, specializations, research_interests,
    orcid, orcid_verified,
    created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'associate1@amhsj.org',
    'Dr. James Wilson',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'editor',
    'University of California, San Francisco',
    'Associate Editor specializing in internal medicine and clinical research methodology.',
    '["internal_medicine", "clinical_research", "evidence_based_medicine"]'::jsonb,
    true,
    true,
    'approved',
    100,
    '["internal_medicine", "clinical_research", "systematic_reviews"]'::jsonb,
    '["clinical_trials", "evidence_synthesis", "medical_education"]'::jsonb,
    '0000-0009-7890-1234',
    true,
    NOW(),
    NOW()
);

-- Associate Editor 2
INSERT INTO users (
    id, email, name, password, role, affiliation, bio,
    expertise, is_verified, is_active, application_status,
    profile_completeness, specializations, research_interests,
    orcid, orcid_verified,
    created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'associate2@amhsj.org',
    'Dr. Jennifer Brown',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'editor',
    'University of Pennsylvania',
    'Associate Editor with expertise in pediatric medicine and global health.',
    '["pediatric_medicine", "global_health", "infectious_diseases"]'::jsonb,
    true,
    true,
    'approved',
    100,
    '["pediatrics", "global_health", "infectious_diseases", "tropical_medicine"]'::jsonb,
    '["child_health", "disease_prevention", "health_systems"]'::jsonb,
    '0000-0010-8901-2345',
    true,
    NOW(),
    NOW()
);

-- Associate Editor Profiles
INSERT INTO editor_profiles (
    user_id, editor_type, assigned_sections, current_workload, max_workload,
    is_accepting_submissions, editorial_experience, start_date, is_active
) 
SELECT 
    u.id, 'associate',
    CASE 
        WHEN u.email = 'associate1@amhsj.org' THEN '["internal_medicine", "clinical_research"]'::jsonb
        WHEN u.email = 'associate2@amhsj.org' THEN '["pediatrics", "global_health"]'::jsonb
    END,
    4, 10, true,
    'Associate Editor at peer-reviewed medical journals',
    NOW(), true
FROM users u 
WHERE u.email IN ('associate1@amhsj.org', 'associate2@amhsj.org');

-- =========================================================================
-- 8. REVIEWERS ROLE SETUP
-- =========================================================================

-- Senior Reviewer 1
INSERT INTO users (
    id, email, name, password, role, affiliation, bio,
    expertise, is_verified, is_active, application_status,
    profile_completeness, specializations, research_interests,
    orcid, orcid_verified,
    created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'reviewer1@amhsj.org',
    'Dr. David Kim',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'reviewer',
    'Cleveland Clinic',
    'Senior reviewer specializing in cardiovascular surgery and interventional cardiology.',
    '["cardiovascular_surgery", "interventional_cardiology", "cardiac_devices"]'::jsonb,
    true,
    true,
    'approved',
    100,
    '["cardiac_surgery", "interventional_cardiology", "medical_devices"]'::jsonb,
    '["minimally_invasive_surgery", "cardiac_interventions", "device_innovation"]'::jsonb,
    '0000-0011-9012-3456',
    true,
    NOW(),
    NOW()
);

-- Senior Reviewer 2
INSERT INTO users (
    id, email, name, password, role, affiliation, bio,
    expertise, is_verified, is_active, application_status,
    profile_completeness, specializations, research_interests,
    orcid, orcid_verified,
    created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'reviewer2@amhsj.org',
    'Dr. Susan Lee',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'reviewer',
    'Memorial Sloan Kettering Cancer Center',
    'Senior reviewer with expertise in oncology and cancer biology research.',
    '["oncology", "cancer_biology", "tumor_immunology"]'::jsonb,
    true,
    true,
    'approved',
    100,
    '["oncology", "cancer_research", "immunotherapy", "clinical_oncology"]'::jsonb,
    '["cancer_immunotherapy", "tumor_biology", "precision_oncology"]'::jsonb,
    '0000-0012-0123-4567',
    true,
    NOW(),
    NOW()
);

-- Mid-level Reviewer 1
INSERT INTO users (
    id, email, name, password, role, affiliation, bio,
    expertise, is_verified, is_active, application_status,
    profile_completeness, specializations, research_interests,
    orcid, orcid_verified,
    created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'reviewer3@amhsj.org',
    'Dr. Maria Gonzalez',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'reviewer',
    'University of Michigan',
    'Reviewer specializing in neurology and neurological disorders research.',
    '["neurology", "neurological_disorders", "neuroplasticity"]'::jsonb,
    true,
    true,
    'approved',
    100,
    '["neurology", "brain_research", "neurological_diseases"]'::jsonb,
    '["stroke_research", "neurodegeneration", "brain_plasticity"]'::jsonb,
    '0000-0013-1234-5678',
    true,
    NOW(),
    NOW()
);

-- Junior Reviewer 1
INSERT INTO users (
    id, email, name, password, role, affiliation, bio,
    expertise, is_verified, is_active, application_status,
    profile_completeness, specializations, research_interests,
    orcid, orcid_verified,
    created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'reviewer4@amhsj.org',
    'Dr. Thomas Anderson',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'reviewer',
    'Yale School of Medicine',
    'Junior reviewer with growing expertise in infectious diseases and epidemiology.',
    '["infectious_diseases", "epidemiology", "public_health"]'::jsonb,
    true,
    true,
    'approved',
    90,
    '["infectious_diseases", "epidemiology", "outbreak_investigation"]'::jsonb,
    '["disease_surveillance", "outbreak_response", "vaccine_research"]'::jsonb,
    '0000-0014-2345-6789',
    true,
    NOW(),
    NOW()
);

-- Reviewer Profiles
INSERT INTO reviewer_profiles (
    user_id, availability_status, max_reviews_per_month, current_review_load,
    average_review_time, completed_reviews, late_reviews, quality_score,
    last_review_date, is_active
)
SELECT 
    u.id,
    'available',
    CASE 
        WHEN u.email IN ('reviewer1@amhsj.org', 'reviewer2@amhsj.org') THEN 4  -- Senior reviewers
        WHEN u.email = 'reviewer3@amhsj.org' THEN 3  -- Mid-level reviewer
        WHEN u.email = 'reviewer4@amhsj.org' THEN 2  -- Junior reviewer
    END,
    1,  -- Current load
    CASE 
        WHEN u.email IN ('reviewer1@amhsj.org', 'reviewer2@amhsj.org') THEN 14  -- Senior reviewers faster
        WHEN u.email = 'reviewer3@amhsj.org' THEN 18  -- Mid-level reviewer
        WHEN u.email = 'reviewer4@amhsj.org' THEN 21  -- Junior reviewer needs more time
    END,
    CASE 
        WHEN u.email IN ('reviewer1@amhsj.org', 'reviewer2@amhsj.org') THEN 45  -- Senior reviewers more experienced
        WHEN u.email = 'reviewer3@amhsj.org' THEN 23  -- Mid-level reviewer
        WHEN u.email = 'reviewer4@amhsj.org' THEN 8   -- Junior reviewer less experienced
    END,
    0,  -- No late reviews initially
    CASE 
        WHEN u.email IN ('reviewer1@amhsj.org', 'reviewer2@amhsj.org') THEN 92  -- Senior reviewers high quality
        WHEN u.email = 'reviewer3@amhsj.org' THEN 87  -- Mid-level reviewer
        WHEN u.email = 'reviewer4@amhsj.org' THEN 78  -- Junior reviewer developing
    END,
    NOW() - INTERVAL '15 days',  -- Recent review activity
    true
FROM users u 
WHERE u.email IN ('reviewer1@amhsj.org', 'reviewer2@amhsj.org', 'reviewer3@amhsj.org', 'reviewer4@amhsj.org');

-- =========================================================================
-- 9. AUTHORS ROLE SETUP
-- =========================================================================

-- Author 1 - Active Researcher
INSERT INTO users (
    id, email, name, password, role, affiliation, bio,
    expertise, is_verified, is_active, application_status,
    profile_completeness, specializations, research_interests,
    orcid, orcid_verified,
    created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'author1@example.org',
    'Dr. Rachel Martinez',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'author',
    'Emory University School of Medicine',
    'Clinical researcher focusing on infectious disease prevention and vaccine development.',
    '["infectious_diseases", "vaccine_development", "clinical_trials"]'::jsonb,
    true,
    true,
    'approved',
    95,
    '["infectious_diseases", "vaccines", "clinical_research"]'::jsonb,
    '["vaccine_efficacy", "disease_prevention", "clinical_trials"]'::jsonb,
    '0000-0015-3456-7890',
    true,
    NOW(),
    NOW()
);

-- Author 2 - Early Career Researcher
INSERT INTO users (
    id, email, name, password, role, affiliation, bio,
    expertise, is_verified, is_active, application_status,
    profile_completeness, specializations, research_interests,
    orcid, orcid_verified,
    created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'author2@example.org',
    'Dr. Kevin Chang',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'author',
    'University of Washington',
    'Early career researcher in computational biology and bioinformatics.',
    '["computational_biology", "bioinformatics", "genomics"]'::jsonb,
    true,
    true,
    'approved',
    85,
    '["bioinformatics", "computational_biology", "data_analysis"]'::jsonb,
    '["genomic_analysis", "machine_learning_biology", "precision_medicine"]'::jsonb,
    '0000-0016-4567-8901',
    true,
    NOW(),
    NOW()
);

-- Author 3 - Graduate Student
INSERT INTO users (
    id, email, name, password, role, affiliation, bio,
    expertise, is_verified, is_active, application_status,
    profile_completeness, specializations, research_interests,
    orcid, orcid_verified,
    created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'grad.student@example.org',
    'Emily Thompson',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'author',
    'University of California, Berkeley',
    'Graduate student researching cancer metabolism and therapeutic targets.',
    '["cancer_metabolism", "biochemistry", "drug_discovery"]'::jsonb,
    true,
    true,
    'approved',
    75,
    '["cancer_research", "metabolism", "biochemistry"]'::jsonb,
    '["cancer_metabolism", "therapeutic_targets", "drug_development"]'::jsonb,
    '0000-0017-5678-9012',
    true,
    NOW(),
    NOW()
);

-- =========================================================================
-- 10. SAMPLE PUBLICATIONS FOR AUTHORS AND EDITORS
-- =========================================================================

-- Publications for senior editors and reviewers
INSERT INTO user_publications (
    user_id, title, journal, year, doi, author_role, citation_count, is_verified
)
SELECT 
    u.id,
    CASE 
        WHEN u.email = 'eic@amhsj.org' THEN 'Advances in Cardiovascular Intervention Techniques'
        WHEN u.email = 'cardiology.editor@amhsj.org' THEN 'Novel Approaches to Heart Failure Management'
        WHEN u.email = 'reviewer1@amhsj.org' THEN 'Minimally Invasive Cardiac Surgery: A Systematic Review'
        WHEN u.email = 'author1@example.org' THEN 'COVID-19 Vaccine Efficacy in Immunocompromised Populations'
    END,
    CASE 
        WHEN u.email = 'eic@amhsj.org' THEN 'New England Journal of Medicine'
        WHEN u.email = 'cardiology.editor@amhsj.org' THEN 'Circulation'
        WHEN u.email = 'reviewer1@amhsj.org' THEN 'Journal of Thoracic and Cardiovascular Surgery'
        WHEN u.email = 'author1@example.org' THEN 'The Lancet'
    END,
    CASE 
        WHEN u.email = 'eic@amhsj.org' THEN 2023
        WHEN u.email = 'cardiology.editor@amhsj.org' THEN 2024
        WHEN u.email = 'reviewer1@amhsj.org' THEN 2023
        WHEN u.email = 'author1@example.org' THEN 2024
    END,
    CASE 
        WHEN u.email = 'eic@amhsj.org' THEN '10.1056/NEJMra2301234'
        WHEN u.email = 'cardiology.editor@amhsj.org' THEN '10.1161/CIRCULATIONAHA.123.456789'
        WHEN u.email = 'reviewer1@amhsj.org' THEN '10.1016/j.jtcvs.2023.01.001'
        WHEN u.email = 'author1@example.org' THEN '10.1016/S0140-6736(24)00123-4'
    END,
    'corresponding_author',
    CASE 
        WHEN u.email = 'eic@amhsj.org' THEN 127
        WHEN u.email = 'cardiology.editor@amhsj.org' THEN 89
        WHEN u.email = 'reviewer1@amhsj.org' THEN 156
        WHEN u.email = 'author1@example.org' THEN 34
    END,
    true
FROM users u 
WHERE u.email IN ('eic@amhsj.org', 'cardiology.editor@amhsj.org', 'reviewer1@amhsj.org', 'author1@example.org');

-- =========================================================================
-- 11. SAMPLE QUALIFICATIONS
-- =========================================================================

-- Qualifications for key personnel
INSERT INTO user_qualifications (
    user_id, type, title, institution, start_date, end_date, description, is_verified
)
SELECT 
    u.id,
    'degree',
    CASE 
        WHEN u.email = 'eic@amhsj.org' THEN 'MD, PhD'
        WHEN u.email = 'managing@amhsj.org' THEN 'MD, MS in Clinical Research'
        WHEN u.email = 'cardiology.editor@amhsj.org' THEN 'MD, Fellowship in Interventional Cardiology'
        WHEN u.email = 'production@amhsj.org' THEN 'PhD in Scientific Communication'
    END,
    CASE 
        WHEN u.email = 'eic@amhsj.org' THEN 'Harvard Medical School'
        WHEN u.email = 'managing@amhsj.org' THEN 'Johns Hopkins University'
        WHEN u.email = 'cardiology.editor@amhsj.org' THEN 'Mayo Clinic'
        WHEN u.email = 'production@amhsj.org' THEN 'University of Oxford'
    END,
    NOW() - INTERVAL '15 years',
    NOW() - INTERVAL '12 years',
    'Advanced medical degree with specialized training',
    true
FROM users u 
WHERE u.email IN ('eic@amhsj.org', 'managing@amhsj.org', 'cardiology.editor@amhsj.org', 'production@amhsj.org');

-- =========================================================================
-- 12. SAMPLE VOLUMES AND ISSUES
-- =========================================================================

-- Create current volume
INSERT INTO volumes (
    id, number, year, title, description, status
) VALUES (
    gen_random_uuid(),
    '15',
    2025,
    'Volume 15 - Advances in African Medical Research',
    'Featuring cutting-edge research from African medical institutions and international collaborations.',
    'published'
);

-- Create current issue
INSERT INTO issues (
    volume_id, number, title, description, status, published_date
) 
SELECT 
    v.id,
    '1',
    'Issue 1 - Cardiovascular Medicine in Africa',
    'Special focus on cardiovascular health research and interventions in African populations.',
    'published',
    NOW() - INTERVAL '30 days'
FROM volumes v WHERE v.number = '15';

-- Create upcoming special issue
INSERT INTO issues (
    volume_id, number, title, description, status, special_issue, guest_editors
) 
SELECT 
    v.id,
    '3',
    'Special Issue - AI Applications in African Healthcare',
    'Exploring artificial intelligence and machine learning applications in healthcare delivery across Africa.',
    'draft',
    true,
    ARRAY[(SELECT id::text FROM users WHERE email = 'guest.ai@amhsj.org')]
FROM volumes v WHERE v.number = '15';

-- =========================================================================
-- 13. SAMPLE NOTIFICATIONS FOR WORKFLOW TESTING
-- =========================================================================

-- Welcome notifications for new roles
INSERT INTO notifications (
    user_id, title, message, type, is_read, related_id
)
SELECT 
    u.id,
    'Welcome to AMHSJ Editorial Team',
    CASE 
        WHEN u.role = 'editor-in-chief' THEN 'Welcome as Editor-in-Chief. You now have access to final editorial decisions and journal strategy management.'
        WHEN u.role = 'managing-editor' THEN 'Welcome as Managing Editor. You can now manage editorial workflows and coordinate editorial operations.'
        WHEN u.role = 'section-editor' THEN 'Welcome as Section Editor. You can now manage submissions in your specialized field and assign reviewers.'
        WHEN u.role = 'production-editor' THEN 'Welcome as Production Editor. You can now manage the publication pipeline and production workflow.'
        WHEN u.role = 'guest-editor' THEN 'Welcome as Guest Editor. You can now manage special issues and coordinate themed publications.'
        WHEN u.role = 'editor' THEN 'Welcome as Associate Editor. You can now review submissions and support editorial decisions.'
        WHEN u.role = 'reviewer' THEN 'Welcome as Peer Reviewer. You can now review manuscripts and provide expert feedback.'
        ELSE 'Welcome to AMHSJ. Thank you for joining our academic community.'
    END,
    'system',
    false,
    u.id
FROM users u 
WHERE u.role IN ('editor-in-chief', 'managing-editor', 'section-editor', 'production-editor', 'guest-editor', 'editor', 'reviewer');

-- =========================================================================
-- 14. VERIFY ROLE HIERARCHY INTEGRITY
-- =========================================================================

-- Ensure all required roles are present
DO $$
DECLARE
    missing_roles TEXT[];
    required_roles TEXT[] := ARRAY['admin', 'editor-in-chief', 'managing-editor', 'section-editor', 'production-editor', 'guest-editor', 'editor', 'reviewer', 'author'];
    role_name TEXT;
BEGIN
    FOREACH role_name IN ARRAY required_roles
    LOOP
        IF NOT EXISTS (SELECT 1 FROM users WHERE role = role_name) THEN
            missing_roles := array_append(missing_roles, role_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_roles, 1) > 0 THEN
        RAISE EXCEPTION 'Missing required roles: %', array_to_string(missing_roles, ', ');
    ELSE
        RAISE NOTICE 'All required roles successfully created!';
    END IF;
END $$;

-- =========================================================================
-- 15. SUMMARY REPORT
-- =========================================================================

-- Generate role summary
SELECT 
    role,
    COUNT(*) as user_count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_count,
    COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_count
FROM users 
GROUP BY role 
ORDER BY 
    CASE role
        WHEN 'admin' THEN 1
        WHEN 'editor-in-chief' THEN 2
        WHEN 'managing-editor' THEN 3
        WHEN 'section-editor' THEN 4
        WHEN 'production-editor' THEN 5
        WHEN 'guest-editor' THEN 6
        WHEN 'editor' THEN 7
        WHEN 'reviewer' THEN 8
        WHEN 'author' THEN 9
        ELSE 10
    END;

-- Generate profile summary
SELECT 
    'Editor Profiles' as profile_type,
    COUNT(*) as total_profiles
FROM editor_profiles
WHERE is_active = true

UNION ALL

SELECT 
    'Reviewer Profiles' as profile_type,
    COUNT(*) as total_profiles
FROM reviewer_profiles
WHERE is_active = true;

-- Commit the transaction
COMMIT;

-- =========================================================================
-- SCRIPT COMPLETION MESSAGE
-- =========================================================================

SELECT 
    'AMHSJ Role Setup Complete!' as status,
    'All academic journal roles have been successfully created with sample data.' as message,
    NOW() as completed_at;
