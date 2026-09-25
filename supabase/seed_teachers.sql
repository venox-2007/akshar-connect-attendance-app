-- ==============================================================================
-- AKSHAR CONNECT — SEED TEACHER AUTH ACCOUNTS & PROFILES
-- Creates confirmed Supabase Auth users with password 'teacher123'
-- and links them to the four official educators and classes.
-- ==============================================================================

-- 1. Confirm Riya Patil (tch-1 -> 3-A)
UPDATE auth.users
SET email_confirmed_at = NOW(), confirmed_at = NOW(), encrypted_password = crypt('teacher123', gen_salt('bf'))
WHERE email = 'riya.patil@aksharpaaul.org';

INSERT INTO public.profiles (id, email, name, role, teacher_id)
SELECT id, email, 'Riya Patil', 'TEACHER'::user_role, 'tch-1'
FROM auth.users
WHERE email = 'riya.patil@aksharpaaul.org'
ON CONFLICT (id) DO UPDATE SET role = 'TEACHER'::user_role, teacher_id = 'tch-1';

-- 2. Vikram Kulkarni (tch-2 -> 4-B)
DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'vikram.kulkarni@aksharpaaul.org') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, recovery_sent_at, last_sign_in_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            confirmation_token, email_change, email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            'vikram.kulkarni@aksharpaaul.org',
            crypt('teacher123', gen_salt('bf')),
            NOW(), NOW(), NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"name":"Vikram Kulkarni","role":"TEACHER","teacher_id":"tch-2"}',
            NOW(), NOW(), '', '', '', ''
        );

        INSERT INTO auth.identities (
            id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            format('{"sub":"%s","email":"%s"}', new_user_id, 'vikram.kulkarni@aksharpaaul.org')::jsonb,
            'email',
            NOW(), NOW(), NOW()
        );
    ELSE
        UPDATE auth.users
        SET email_confirmed_at = NOW(), confirmed_at = NOW(), encrypted_password = crypt('teacher123', gen_salt('bf'))
        WHERE email = 'vikram.kulkarni@aksharpaaul.org';
    END IF;
END $$;

INSERT INTO public.profiles (id, email, name, role, teacher_id)
SELECT id, email, 'Vikram Kulkarni', 'TEACHER'::user_role, 'tch-2'
FROM auth.users
WHERE email = 'vikram.kulkarni@aksharpaaul.org'
ON CONFLICT (id) DO UPDATE SET role = 'TEACHER'::user_role, teacher_id = 'tch-2';

-- 3. Anita Sharma (tch-3 -> 5-A)
DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'anita.sharma@aksharpaaul.org') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, recovery_sent_at, last_sign_in_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            confirmation_token, email_change, email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            'anita.sharma@aksharpaaul.org',
            crypt('teacher123', gen_salt('bf')),
            NOW(), NOW(), NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"name":"Anita Sharma","role":"TEACHER","teacher_id":"tch-3"}',
            NOW(), NOW(), '', '', '', ''
        );

        INSERT INTO auth.identities (
            id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            format('{"sub":"%s","email":"%s"}', new_user_id, 'anita.sharma@aksharpaaul.org')::jsonb,
            'email',
            NOW(), NOW(), NOW()
        );
    ELSE
        UPDATE auth.users
        SET email_confirmed_at = NOW(), confirmed_at = NOW(), encrypted_password = crypt('teacher123', gen_salt('bf'))
        WHERE email = 'anita.sharma@aksharpaaul.org';
    END IF;
END $$;

INSERT INTO public.profiles (id, email, name, role, teacher_id)
SELECT id, email, 'Anita Sharma', 'TEACHER'::user_role, 'tch-3'
FROM auth.users
WHERE email = 'anita.sharma@aksharpaaul.org'
ON CONFLICT (id) DO UPDATE SET role = 'TEACHER'::user_role, teacher_id = 'tch-3';

-- 4. Suresh Pawar (tch-4 -> 7-A)
DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'suresh.pawar@aksharpaaul.org') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, recovery_sent_at, last_sign_in_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            confirmation_token, email_change, email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            'suresh.pawar@aksharpaaul.org',
            crypt('teacher123', gen_salt('bf')),
            NOW(), NOW(), NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"name":"Suresh Pawar","role":"TEACHER","teacher_id":"tch-4"}',
            NOW(), NOW(), '', '', '', ''
        );

        INSERT INTO auth.identities (
            id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            format('{"sub":"%s","email":"%s"}', new_user_id, 'suresh.pawar@aksharpaaul.org')::jsonb,
            'email',
            NOW(), NOW(), NOW()
        );
    ELSE
        UPDATE auth.users
        SET email_confirmed_at = NOW(), confirmed_at = NOW(), encrypted_password = crypt('teacher123', gen_salt('bf'))
        WHERE email = 'suresh.pawar@aksharpaaul.org';
    END IF;
END $$;

INSERT INTO public.profiles (id, email, name, role, teacher_id)
SELECT id, email, 'Suresh Pawar', 'TEACHER'::user_role, 'tch-4'
FROM auth.users
WHERE email = 'suresh.pawar@aksharpaaul.org'
ON CONFLICT (id) DO UPDATE SET role = 'TEACHER'::user_role, teacher_id = 'tch-4';
