-- ==============================================================================
-- AKSHAR CONNECT — PRODUCTION DATABASE SCHEMA & ROW LEVEL SECURITY
-- Platform: Supabase Auth + PostgreSQL 15+ + RLS
-- Target: Akshar Paaul Attendance Management System
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'TEACHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('present', 'absent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE student_gender AS ENUM ('male', 'female', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Linked directly to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'TEACHER',
    teacher_id TEXT, -- Populated if role is 'TEACHER', links to teachers.id
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on email and role
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_teacher_id ON public.profiles(teacher_id);

-- 4. TEACHERS DIRECTORY TABLE
CREATE TABLE IF NOT EXISTS public.teachers (
    id TEXT PRIMARY KEY DEFAULT ('tch-' || substr(md5(random()::text), 1, 8)),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    status user_status NOT NULL DEFAULT 'active',
    qualification TEXT,
    joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teachers_status ON public.teachers(status);
CREATE INDEX IF NOT EXISTS idx_teachers_email ON public.teachers(email);

-- 5. CLASSES TABLE (Strict school naming: 3-A, 4-B, 5-A, 7-A; no invented locations)
CREATE TABLE IF NOT EXISTS public.classes (
    id TEXT PRIMARY KEY DEFAULT ('cls-' || substr(md5(random()::text), 1, 8)),
    name TEXT NOT NULL UNIQUE,
    grade TEXT NOT NULL,
    schedule TEXT NOT NULL DEFAULT 'Mon - Fri (09:00 AM - 01:00 PM)',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classes_name ON public.classes(name);

-- 6. TEACHER_CLASSES JUNCTION TABLE (Many-to-Many assignments)
CREATE TABLE IF NOT EXISTS public.teacher_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id TEXT NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    class_id TEXT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(teacher_id, class_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_classes_teacher ON public.teacher_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_classes_class ON public.teacher_classes(class_id);

-- 7. STUDENTS ROSTER TABLE
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY DEFAULT ('std-' || substr(md5(random()::text), 1, 8)),
    roll_number TEXT NOT NULL,
    name TEXT NOT NULL,
    class_id TEXT NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    gender student_gender NOT NULL DEFAULT 'male',
    status user_status NOT NULL DEFAULT 'active',
    guardian_name TEXT,
    guardian_phone TEXT,
    dob DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(class_id, roll_number)
);

CREATE INDEX IF NOT EXISTS idx_students_class ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_roll_number ON public.students(roll_number);

-- 8. ATTENDANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id TEXT PRIMARY KEY DEFAULT ('att-' || substr(md5(random()::text), 1, 12)),
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id TEXT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status attendance_status NOT NULL DEFAULT 'present',
    marked_by TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON public.attendance_records(class_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance_records(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records(date);

-- ==============================================================================
-- 9. SECURITY HELPER FUNCTIONS (FOR USE IN RLS POLICIES)
-- ==============================================================================

-- Check if authenticated user has ADMIN role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'ADMIN'
    );
$$;

-- Get the teacher_id associated with current authenticated user
CREATE OR REPLACE FUNCTION public.get_current_teacher_id()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT teacher_id FROM public.profiles
    WHERE id = auth.uid() AND role = 'TEACHER';
$$;

-- Check if current teacher is officially assigned to a given class
CREATE OR REPLACE FUNCTION public.is_teacher_assigned_to_class(check_class_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.teacher_classes tc
        JOIN public.profiles p ON p.teacher_id = tc.teacher_id
        WHERE p.id = auth.uid()
          AND p.role = 'TEACHER'
          AND tc.class_id = check_class_id
    );
$$;

-- Check if current teacher is officially assigned to a given student
CREATE OR REPLACE FUNCTION public.is_teacher_assigned_to_student(check_student_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.students s
        WHERE s.id = check_student_id
          AND public.is_teacher_assigned_to_class(s.class_id)
    );
$$;

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- A. PROFILES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "profiles_select_admin" ON public.profiles
    FOR SELECT TO authenticated
    USING (public.is_admin());

CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid());

CREATE POLICY "profiles_update_admin" ON public.profiles
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- ------------------------------------------------------------------------------
-- B. TEACHERS POLICIES
-- ------------------------------------------------------------------------------
-- Administrators: Full CRUD
CREATE POLICY "teachers_all_admin" ON public.teachers
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Teachers: View only their own teacher profile
CREATE POLICY "teachers_select_own" ON public.teachers
    FOR SELECT TO authenticated
    USING (id = public.get_current_teacher_id());

-- ------------------------------------------------------------------------------
-- C. CLASSES POLICIES
-- ------------------------------------------------------------------------------
-- Administrators: Full CRUD
CREATE POLICY "classes_all_admin" ON public.classes
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Teachers: Can SELECT only classes assigned to them
CREATE POLICY "classes_select_teacher" ON public.classes
    FOR SELECT TO authenticated
    USING (public.is_teacher_assigned_to_class(id));

-- ------------------------------------------------------------------------------
-- D. TEACHER_CLASSES POLICIES
-- ------------------------------------------------------------------------------
-- Administrators: Full CRUD
CREATE POLICY "teacher_classes_all_admin" ON public.teacher_classes
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Teachers: Can view their own assignments
CREATE POLICY "teacher_classes_select_teacher" ON public.teacher_classes
    FOR SELECT TO authenticated
    USING (teacher_id = public.get_current_teacher_id());

-- ------------------------------------------------------------------------------
-- E. STUDENTS POLICIES
-- ------------------------------------------------------------------------------
-- Administrators: Full CRUD
CREATE POLICY "students_all_admin" ON public.students
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Teachers: Can view only students in their assigned classes
CREATE POLICY "students_select_teacher" ON public.students
    FOR SELECT TO authenticated
    USING (public.is_teacher_assigned_to_class(class_id));

-- ------------------------------------------------------------------------------
-- F. ATTENDANCE_RECORDS POLICIES
-- ------------------------------------------------------------------------------
-- Administrators: Full CRUD
CREATE POLICY "attendance_all_admin" ON public.attendance_records
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Teachers: View attendance for students in their assigned classes
CREATE POLICY "attendance_select_teacher" ON public.attendance_records
    FOR SELECT TO authenticated
    USING (public.is_teacher_assigned_to_class(class_id));

-- Teachers: Record attendance only for students in their assigned classes
CREATE POLICY "attendance_insert_teacher" ON public.attendance_records
    FOR INSERT TO authenticated
    WITH CHECK (public.is_teacher_assigned_to_class(class_id));

-- Teachers: Modify attendance only for their assigned classes
CREATE POLICY "attendance_update_teacher" ON public.attendance_records
    FOR UPDATE TO authenticated
    USING (public.is_teacher_assigned_to_class(class_id))
    WITH CHECK (public.is_teacher_assigned_to_class(class_id));

-- Note: Teachers CANNOT DELETE attendance records (only Admin can delete).

-- ==============================================================================
-- 11. AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role, teacher_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'TEACHER'),
        NEW.raw_user_meta_data->>'teacher_id'
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 12. AUTOMATIC UPDATED_AT TIMESTAMP TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN (
        'profiles', 'teachers', 'classes', 'students', 'attendance_records'
    ) LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS set_updated_at ON %I;
            CREATE TRIGGER set_updated_at
                BEFORE UPDATE ON %I
                FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();', tbl, tbl);
    END LOOP;
END $$;
