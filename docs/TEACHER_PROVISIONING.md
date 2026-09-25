# Akshar Connect — Teacher Authentication Provisioning Guide

This guide describes how to provision the four official educator accounts for Akshar Connect using Supabase Auth.

---

## 1. Educator Matrix & Class Assignments

| Teacher Name | Official Email | Default Password | Teacher ID | Assigned Class | Schedule |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Riya Patil** | `riya.patil@aksharpaaul.org` | `teacher123` | `tch-1` | `3-A` (`cls-1`) | Mon - Fri (09:00 AM - 01:00 PM) |
| **Vikram Kulkarni** | `vikram.kulkarni@aksharpaaul.org` | `teacher123` | `tch-2` | `4-B` (`cls-2`) | Mon - Fri (09:30 AM - 01:30 PM) |
| **Anita Sharma** | `anita.sharma@aksharpaaul.org` | `teacher123` | `tch-3` | `5-A` (`cls-3`) | Mon - Fri (10:00 AM - 02:00 PM) |
| **Suresh Pawar** | `suresh.pawar@aksharpaaul.org` | `teacher123` | `tch-4` | `7-A` (`cls-4`) | Mon - Fri (09:00 AM - 01:00 PM) |

---

## 2. Supported Provisioning Procedure (Recommended)

To avoid internal schema conflicts with Supabase's `auth.identities` or `auth.users` tables and prevent SMTP mailer rate limits, create teacher accounts using the official Supabase Dashboard.

### Step 1: Create Educator Accounts in Supabase Dashboard
1. Open your **[Supabase Dashboard](https://supabase.com/dashboard/project/locfrbpmhcdpgomjsmgp)**.
2. In the left navigation, click **Authentication &rarr; Users**.
3. Click the **"Add user"** button in the top right &rarr; select **"Create user"**.
4. For each teacher:
   - **Email**: Enter their email (e.g., `riya.patil@aksharpaaul.org`)
   - **Password**: Enter the password (e.g., `teacher123`)
   - **Auto Confirm User?**: **Toggle ON** (this confirms the user immediately with no verification email sent).
   - Click **"Create user"**.
5. Repeat for:
   - `vikram.kulkarni@aksharpaaul.org`
   - `anita.sharma@aksharpaaul.org`
   - `suresh.pawar@aksharpaaul.org`

---

### Step 2: Apply the Application Data & Profile Linking Script
1. Go to **Supabase Dashboard &rarr; SQL Editor**.
2. Open or paste the contents of [`supabase/seed_teachers.sql`](../supabase/seed_teachers.sql).
3. Click **Run**.

**What this does:**
- Verifies that `public.teachers` and `public.classes` are seeded.
- Establishes official assignments in `public.teacher_classes`.
- Automatically links the `auth.users` IDs to `public.profiles` with `role = 'TEACHER'` and their designated `teacher_id`.
- Ensures `email_confirmed_at` is active.

---

## 3. Verification Checklist

Log in as each teacher to confirm:
- [x] Educator logs into Akshar Connect.
- [x] Educator is directed to `/teacher/dashboard`.
- [x] Only their assigned class is visible in the class dropdown and reports.
- [x] Student roster displays strictly students belonging to their assigned class.
- [x] Attendance can be recorded and updated for their class.
- [x] Access to other classes is blocked with `AuthorizationError` (and PostgreSQL RLS policy rejection).
- [x] Master teacher/class modification is prevented.
