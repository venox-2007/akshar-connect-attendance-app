-- ==============================================================================
-- AKSHAR CONNECT — BASELINE SEED DATA
-- Platform: Supabase PostgreSQL
-- ==============================================================================

-- 1. BASELINE CLASSES (Standard school class names; no invented locations)
INSERT INTO public.classes (id, name, grade, schedule) VALUES
    ('cls-1', '3-A', 'Class 3', 'Mon - Fri (09:00 AM - 01:00 PM)'),
    ('cls-2', '4-B', 'Class 4', 'Mon - Fri (09:30 AM - 01:30 PM)'),
    ('cls-3', '5-A', 'Class 5', 'Mon - Fri (10:00 AM - 02:00 PM)'),
    ('cls-4', '7-A', 'Class 7', 'Mon - Fri (09:00 AM - 01:00 PM)')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    grade = EXCLUDED.grade,
    schedule = EXCLUDED.schedule;

-- 2. BASELINE TEACHERS
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
INSERT INTO public.teacher_classes (teacher_id, class_id) VALUES
    ('tch-1', 'cls-1'), -- Riya Patil -> 3-A
    ('tch-2', 'cls-2'), -- Vikram Kulkarni -> 4-B
    ('tch-3', 'cls-3'), -- Anita Sharma -> 5-A
    ('tch-4', 'cls-4')  -- Suresh Pawar -> 7-A
ON CONFLICT (teacher_id, class_id) DO NOTHING;
