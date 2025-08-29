
-- Create Editorial Assistant user
INSERT INTO users (id, email, name, password, role, affiliation, expertise, specializations, is_active, is_verified, profile_completeness, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'editorial.assistant@amhsj.org',
  'Editorial Assistant',
  'password123',
  'editorial-assistant',
  'AMHSJ Editorial Office',
  '["manuscript-screening","editorial-support","quality-control"]',
  '["general-medicine","clinical-research","biomedical-sciences"]',
  true,
  true,
  100,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Insert workflow time limits
INSERT INTO workflow_time_limits (id, stage, time_limit_days, reminder_days, escalation_days, is_active, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'editorial-assistant-review', 7, '[7, 3, 1]', '[7, 14, 21]', true, NOW(), NOW()),
  (gen_random_uuid(), 'associate-editor-review', 14, '[7, 3, 1]', '[7, 14, 21]', true, NOW(), NOW()),
  (gen_random_uuid(), 'reviewer-review', 21, '[7, 3, 1]', '[7, 14, 21]', true, NOW(), NOW())
ON CONFLICT (stage) DO UPDATE SET
  time_limit_days = EXCLUDED.time_limit_days,
  reminder_days = EXCLUDED.reminder_days,
  escalation_days = EXCLUDED.escalation_days,
  updated_at = NOW();
