# Akshar Connect - Smart Attendance Management
> Built for **Akshar Paaul Educational NGO**

![Akshar Connect](https://img.shields.io/badge/Akshar-Connect-teal.svg)
![React](https://img.shields.io/badge/React-19-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-teal.svg)
![Vite](https://img.shields.io/badge/Vite-8-purple.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

---

## 🌟 Overview & Purpose

**Akshar Connect** is an attendance and student records management web application tailored for educational NGOs and schools.

**Akshar Paaul Educational NGO** supports underprivileged children with fundamental literacy, numeracy, and holistic educational programs.

This first complete working demo provides a frictionless, mobile-optimized experience for daily field use by volunteer teachers, along with comprehensive administrative oversight, class assignment tracking, historical search, and CSV analytics export.

---

## 🚀 Key Features

### 1. Dual Role Architecture
- **Administrator Role**:
  - Full management of educators and classes.
  - Complete student directory with 120+ pre-seeded student records.
  - Multi-class attendance recording and past record corrections.
  - Comprehensive reports, class performance breakdown, date trends, and CSV exports.
- **Teacher Role**:
  - Personalized educator dashboard showing assigned batches.
  - Strict security isolation: teachers can **only** access and record attendance for classes assigned to them.
  - Roster view with guardian contact information.

### 2. High-Performance Attendance Taker
- Fast, tactile **Present** / **Absent** buttons designed for phone screens.
- **Default to Present** on fresh daily sessions.
- **Mark All Present** and **Mark All Absent** batch shortcuts.
- Real-time counters: Live Present Count, Absent Count, and Attendance Percentage.
- Student search filter by name or roll number.
- Calendar date picker for recording or revising historical days.
- Automatic prevention of duplicate entries for `student + class + date`.

### 3. Attendance History & Audit Trail
- Multi-dimensional filters by class, date, student, and status.
- Inline modal editing for authorized adjustments.
- Tracks `markedBy` and `updatedAt` timestamps.

### 4. Reports & CSV Export
- Accurate statistics calculated dynamically from real attendance logs.
- Class-level performance metrics and attendance percentages.
- Multi-day trend breakdowns.
- One-click CSV export with UTF-8 BOM encoding for seamless display of Indian names in Microsoft Excel.

### 5. Multi-Language Support (i18n)
- **English**
- **Hindi (हिन्दी)**
- **Marathi (मराठी)**
- Centralized JSON dictionaries (`src/i18n/`) with persistent language selection stored in `localStorage`.

### 6. Theme System
- Enforced clean **Light Mode** matching brand identity.
- Custom brand palette featuring deep teal, emerald green, and crisp neutrals.

### 7. LocalStorage Persistence
- All master data and modifications (teachers, classes, students, attendance logs) persist in `localStorage`.

---

## 🔐 System Accounts

Sign in with the standard credentials below:

| Role | Email | Password | Assigned Class |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@aksharpaaul.org` | `admin123` | Full Access (All Classes) |
| **Teacher (Riya Patil)** | `riya.patil@aksharpaaul.org` | `teacher123` | 3-A |
| **Teacher (Vikram Kulkarni)** | `vikram.kulkarni@aksharpaaul.org` | `teacher123` | 4-B |
| **Teacher (Anita Sharma)** | `anita.sharma@aksharpaaul.org` | `teacher123` | 5-A |
| **Teacher (Suresh Pawar)** | `suresh.pawar@aksharpaaul.org` | `teacher123` | 7-A |

*(Note: Legacy aliases like `admin@aksharconnect.demo` / `admin123` and `riya@aksharconnect.demo` / `teacher123` also work seamlessly).*

---

## 🏗️ Project Architecture

```
src/
├── components/
│   ├── attendance/         # AttendanceSession taker & stats
│   ├── auth/               # ProtectedRoute & role guards
│   ├── common/             # Logo, Modal, ConfirmModal, Badge, ThemeToggle, LanguageSelector
│   └── layout/             # AppLayout, Navbar, Sidebar
├── data/
│   └── mockDatabase.ts     # Initial seed database (1 admin, 4 teachers, 4 classes, 120 students, logs)
├── hooks/
│   ├── useAuth.tsx         # User session & permissions
│   ├── useTheme.tsx        # Dark/light mode switcher
│   ├── useToast.tsx        # React toast notification system
│   └── useTranslation.tsx  # i18n hook
├── i18n/
│   ├── en.json             # English strings
│   ├── hi.json             # Hindi strings
│   ├── mr.json             # Marathi strings
│   └── index.tsx           # I18n provider
├── pages/
│   ├── admin/              # AdminDashboard, TeachersPage, ClassesPage, StudentsPage, ReportsPage
│   ├── auth/               # LoginPage with one-click demo credentials
│   ├── teacher/            # TeacherDashboard, TakeAttendancePage, MyClassesPage
│   ├── attendance/         # AttendanceHistoryPage
│   └── NotFoundPage.tsx    # 404 handler
├── services/
│   ├── dataService.ts      # Abstraction layer between UI and storage
│   └── authService.ts      # Session & authentication service
├── types/
│   └── index.ts            # Strict TypeScript types
└── utils/
    ├── dateUtils.ts        # Date formatting helpers
    └── exportCsv.ts        # UTF-8 CSV exporter
```

---

## 🛡️ Authorization & Role-Based Access Control (RBAC)

The application enforces strict **Role-Based Access Control** at multiple architectural layers:

1. **Route Level (`ProtectedRoute.tsx`)**:
   - Unauthenticated visitors attempting to access `/admin/*` or `/teacher/*` are redirected to `/login`.
   - Teachers attempting to access administrative routes (`/admin/*`) are blocked and automatically redirected to `/teacher/dashboard`.
   - Administrators attempting to access teacher-specific routes are routed to `/admin/dashboard`.
2. **UI & View Level**:
   - Navigation links, action buttons (create/edit/delete student, manage teachers, edit classes) are strictly rendered according to permissions.
   - `TakeAttendancePage` validates the `?classId` query parameter against the educator's assigned classes. Any unassigned class ID renders an **Access Denied** security barrier, preventing session initiation.
3. **Service / Business Layer (`dataService.ts`)**:
   - Permissions are not just cosmetically hidden; they are hard-enforced in every data service method via `requireAdmin()` and `requireClassAccess(classId)`.
   - `AuthorizationError` is thrown whenever an unauthorized action or out-of-scope query is attempted.
   - `getStudents()`, `getClasses()`, `getAttendance()` are automatically filtered to the logged-in teacher's assigned classes. Direct requests for other classes throw `AuthorizationError`.
   - `saveAttendance()` strictly validates class assignment and asserts student roster membership before modifying records.
   - Master data modifications (`createStudent`, `updateStudent`, `deleteStudent`, `createTeacher`, etc.) reject non-administrators with `AuthorizationError`.

### Automated Security Test Matrix (14 Tests - 100% Pass Rate)

| # | Security Test Case | Target / Role | Expected Result | Status |
| :-: | :--- | :--- | :--- | :-: |
| **1** | Access assigned class (`cls-1`) | Teacher (Riya Patil) | Allowed | ✅ **PASS** |
| **2** | Access unassigned class (`cls-2`) | Teacher (Riya Patil) | `AuthorizationError` thrown | ✅ **PASS** |
| **3** | View students of unassigned class (`cls-2`) | Teacher (Riya Patil) | `AuthorizationError` thrown | ✅ **PASS** |
| **4** | Record attendance for unassigned class | Teacher (Riya Patil) | `AuthorizationError` thrown | ✅ **PASS** |
| **5** | Modify existing attendance of unassigned class | Teacher (Riya Patil) | `AuthorizationError` thrown | ✅ **PASS** |
| **6** | Navigate to administrative route (`/admin/dashboard`) | Teacher (Riya Patil) | Redirected & Service Denied | ✅ **PASS** |
| **7** | Teacher management CRUD operations | Teacher (Riya Patil) | `AuthorizationError` thrown | ✅ **PASS** |
| **8** | Create, edit, or delete student records | Teacher (Riya Patil) | `AuthorizationError` thrown | ✅ **PASS** |
| **9** | URL query parameter or state tampering (`?classId=cls-2`) | Teacher (Riya Patil) | Access Denied Barrier & Service Denied | ✅ **PASS** |
| **10** | Administrator universal class access | Administrator | Allowed (All classes accessible) | ✅ **PASS** |
| **11** | Administrator universal student access | Administrator | Allowed (All students accessible) | ✅ **PASS** |
| **12** | Administrator attendance modification | Administrator | Allowed (Any class) | ✅ **PASS** |
| **13** | Unauthenticated access to `/admin/dashboard` | Guest / Anonymous | Redirected to `/login` | ✅ **PASS** |
| **14** | Unauthenticated access to `/teacher/dashboard` | Guest / Anonymous | Redirected to `/login` | ✅ **PASS** |

Run the automated security suite anytime with:
```bash
npm run test:security
```

---

## 🔒 Client-Side Demo Storage Limitations & Production Backend Requirements

### Current Demo Boundary
In this first working demo, data is stored in the browser's `localStorage` and authorization rules are enforced in the client-side business layer (`dataService.ts`). While this provides complete end-to-end UX fidelity and robust in-browser data isolation during user sessions, client-side storage has fundamental security limitations:
- Any user with browser developer tools can inspect or directly edit local storage keys.
- Authorization checks execute in the client JavaScript runtime.

### Future Production Backend Requirements
When transitioning to production with **Supabase PostgreSQL** or **Firebase Firestore**, the following server-side security controls must be implemented:
1. **Server-Side Authentication**:
   - Secure HTTP-only session cookies or verified JWT Bearer tokens issued by Supabase Auth / Firebase Auth.
2. **Database Row-Level Security (RLS)**:
   - **Teachers**: PostgreSQL RLS policies (`auth.uid() = assigned_teacher_id`) ensuring the database engine itself rejects SQL queries for classes or students not assigned to the calling teacher.
   - **Administrators**: RLS policy granting full `ALL` permissions to users with the `ADMIN` role claim in their JWT.
3. **API Middleware & Cloud Functions**:
   - Attendance submission endpoints (`/api/attendance`) must verify teacher assignment server-side before executing database transactions.
4. **Audit Logging**:
   - Immutable audit logs recording actor ID, IP address, timestamp, and changes made to attendance and student records.

---

## 🔄 Backend Migration Plan (Supabase Auth + PostgreSQL + RLS)

The application was designed with clean architectural boundaries. React components **never** access storage or the database directly, interacting solely through typed service contracts in `src/services/dataService.ts` and `src/services/authService.ts`.

Comprehensive backend architecture and implementation specifications are prepared in:
- **Migration Plan & Database Design**: [`docs/BACKEND_MIGRATION_PLAN.md`](./docs/BACKEND_MIGRATION_PLAN.md)
- **Supabase PostgreSQL Schema & RLS Policies**: [`supabase/migrations/20260925000001_initial_schema.sql`](./supabase/migrations/20260925000001_initial_schema.sql)
- **Baseline Seed Data**: [`supabase/seed.sql`](./supabase/seed.sql)
- **Environment Template**: [`.env.example`](./.env.example)

When cutover is initiated:
1. Provision Supabase project and apply the PostgreSQL migration (`20260925000001_initial_schema.sql`).
2. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel environment variables.
3. Replace the internal method implementations inside `src/services/dataService.ts` with Supabase client queries.
4. The React UI components, routing, and pages require **zero** structural modifications.

---

## 🛠️ Local Development Setup

### Prerequisites
- Node.js (v18+)
- npm

### 1. Install dependencies
```bash
npm install
```

### 2. Start development server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 3. Build for production
```bash
npm run build
```

---

## 🌐 Vercel Deployment

The project is fully prepared for static deployment to Vercel:
1. Run `npm run build` to verify the build artifact (`dist/`).
2. The included `vercel.json` ensures all React Router routes rewrite cleanly to `/index.html`.
3. Connect your GitHub repository to Vercel and deploy directly with Vite defaults:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
