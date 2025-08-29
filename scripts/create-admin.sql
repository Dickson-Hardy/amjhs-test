-- Create Admin User for AMHSJ Journal
-- This script creates the initial admin user for the journal system
-- Run this script after setting up the database schema

-- Admin user credentials:
-- Email: admin@amhsj.org
-- Password: admin123!
-- Note: Change password after first login

-- Insert admin user
INSERT INTO users (
    id,
    name,
    email,
    password,
    role,
    affiliation,
    is_verified,
    expertise,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'AMHSJ Administrator',
    'admin@amhsj.org',
    '$2a$12$9.vF8Ql6OWYJbAkpU7qJlO7mY3FJbLKTn4G5PVn1Kc1Wx0lzjvKF.',  -- bcrypt hash of 'admin123!'
    'admin',
    'AMHSJ Editorial Office',
    true,
    '["Journal Management", "Editorial Operations", "IoT Research"]'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    affiliation = EXCLUDED.affiliation,
    is_verified = EXCLUDED.is_verified,
    expertise = EXCLUDED.expertise,
    updated_at = NOW();

-- Verify the admin user was created
SELECT 
    id,
    name,
    email,
    role,
    affiliation,
    is_verified,
    expertise,
    created_at
FROM users 
WHERE email = 'admin@amhsj.org';

-- Create audit log entry for admin creation
INSERT INTO audit_logs (
    id,
    user_id,
    action,
    details,
    ip_address,
    created_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM users WHERE email = 'admin@amhsj.org'),
    'admin_user_created',
    '{"method": "sql_script", "role": "admin", "affiliation": "AMHSJ Editorial Office"}',
    '127.0.0.1',
    NOW()
);

-- Display success message
SELECT 
    '✅ Admin user created successfully!' as status,
    'admin@amhsj.org' as email,
    'admin123!' as password,
    'Please change password after first login' as warning;
