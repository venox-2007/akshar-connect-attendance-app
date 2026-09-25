-- ==============================================================================
-- AKSHAR CONNECT — TEACHER DIRECTORY & PROFILE LINKING SEED
-- ==============================================================================
-- Safe for all Supabase versions:
-- 1. Does NOT manually manipulate internal auth.users or auth.identities tables.
-- 2. Seeds standard application teachers and class assignments.
-- 3. Confirms any existing auth users matching teacher emails.
-- 4. Dynamically links public.profiles with role = 'TEACHER' and the correct teacher_id.
-- ==============================================================================

-- 1. BASELINE CLASSES (Standard school class identifiers)
INSERT INTO public.classes (id, name, grade, schedule) VALUES
    ('cls-1', '3-A', 'Class 3', 'Mon - Fri (09:00 AM - 01:00 PM)'),
    ('cls-2', '4-B', 'Class 4', 'Mon - Fri (09:30 AM - 01:30 PM)'),
    ('cls-3', '5-A', 'Class 5', 'Mon - Fri (10:00 AM - 02:00 PM)'),
    ('cls-4', '7-A', 'Class 7', 'Mon - Fri (09:00 AM - 01:00 PM)')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    grade = EXCLUDED.grade,
    schedule = EXCLUDED.schedule;

-- 2. BASELINE TEACHER DIRECTORY
INSERT INTO public.teachers (id, name, email, phone, status, qualification, joined_date) VALUES
    ('tch-1', 'Riya Patil', 'riya.patil@aksharpaaul.org', '+91 98201 12345', 'active', 'B.Ed, MA English', '2023-06-15'),
    ('tch-2', 'Vikram Kulkarni', 'vikram.kulkarni@aksharpaaul.org', '+91 98202 23456', 'active', 'D.Ed, B.Sc Mathematics', '2023-08-01'),
    ('tch-3', 'Anita Sharma', 'anita.sharma@aksharpaaul.org', '+91 98203 34567', 'active', 'B.El.Ed, Hindi Specialist', '2024-01-10'),
    ('tch-4', 'Suresh Pawar', 'suresh.pawar@aksharpaaul.org', '+91 98204 45678', 'active', 'MSW, Certified Educator', '2024-03-20')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    qualification = EXCLUDED.qualification;

-- 3. TEACHER-CLASS ASSIGNMENTS
-- Riya Patil -> 3-A
-- Vikram Kulkarni -> 4-B
-- Anita Sharma -> 5-A
-- Suresh Pawar -> 7-A
INSERT INTO public.teacher_classes (teacher_id, class_id) VALUES
    ('tch-1', 'cls-1'),
    ('tch-2', 'cls-2'),
    ('tch-3', 'cls-3'),
    ('tch-4', 'cls-4')
ON CONFLICT (teacher_id, class_id) DO NOTHING;

-- 4. CONFIRM EXISTING TEACHER AUTH USERS (IF CREATED VIA SUPABASE DASHBOARD / API)
-- Safe: only updates email_confirmed_at if currently null; does not touch generated columns
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email IN (
    'riya.patil@aksharpaaul.org',
    'vikram.kulkarni@aksharpaaul.org',
    'anita.sharma@aksharpaaul.org',
    'suresh.pawar@aksharpaaul.org'
)
AND email_confirmed_at IS NULL;

-- 5. LINK AUTH USERS TO PUBLIC.PROFILES AS TEACHER
-- Automatically syncs every existing teacher auth user to their official profile record
INSERT INTO public.profiles (id, email, name, role, teacher_id)
SELECT
    u.id,
    t.email,
    t.name,
    'TEACHER'::user_role,
    t.id
FROM auth.users u
JOIN public.teachers t ON lower(u.email) = lower(t.email)
WHERE lower(t.email) IN (
    'riya.patil@aksharpaaul.org',
    'vikram.kulkarni@aksharpaaul.org',
    'anita.sharma@aksharpaaul.org',
    'suresh.pawar@aksharpaaul.org'
)
ON CONFLICT (id) DO UPDATE SET
    role = 'TEACHER'::user_role,
    teacher_id = EXCLUDED.teacher_id,
    name = EXCLUDED.name,
    email = EXCLUDED.email;
