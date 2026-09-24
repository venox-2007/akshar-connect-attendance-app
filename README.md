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

**Akshar Connect** is an attendance and student records management web application tailored for educational NGOs and community learning centers.

Operating across community hubs in Maharashtra (such as Dharavi, Govandi, Wadala, and Kurla), **Akshar Paaul Educational NGO** supports underprivileged children with fundamental literacy, numeracy, and holistic educational programs.

This first complete working demo provides a frictionless, mobile-optimized experience for daily field use by volunteer teachers, along with comprehensive administrative oversight, class assignment tracking, historical search, and CSV analytics export.

---

## 🚀 Key Features

### 1. Dual Role Architecture
- **Administrator Role**:
  - Full management of educators, learning centers, and classes.
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
- Full **Light Mode** and **Dark Mode** support.
- Custom brand palette featuring deep teal, emerald green, and dark neutrals.
- Theme preference persists across browser refreshes.

### 7. LocalStorage Persistence & Safe Factory Reset
- All CRUD modifications (teachers, classes, students, attendance logs) persist in `localStorage`.
- Includes a custom React confirmation modal to **Reset Demo Data** back to the initial 120-student benchmark at any time without native browser popups.

---

## 🔐 Demo Credentials

Use the quick 1-click login buttons on the login screen or sign in with:

| Role | Email | Password | Assigned Standard / Center |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@aksharconnect.demo` | `admin123` | All Centers & Classes |
| **Teacher (Riya Patil)** | `riya@aksharconnect.demo` | `teacher123` | Navchetna Std 3 (Dharavi) |
| **Teacher (Vikram Kulkarni)** | `vikram@aksharconnect.demo` | `teacher123` | Prerana Std 4 (Govandi) |
| **Teacher (Anita Sharma)** | `anita@aksharconnect.demo` | `teacher123` | Udaan Std 5 (Wadala) |
| **Teacher (Suresh Pawar)** | `suresh@aksharconnect.demo` | `teacher123` | Sankalp Std 6 (Kurla) |

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

## 🔄 Future Backend Migration Plan

The application was designed with clean architectural boundaries. React components **never** access the mock database directly.

All UI components interact solely through `src/services/dataService.ts`:
- `getTeachers()`, `createTeacher()`, `updateTeacher()`, `deleteTeacher()`
- `getClasses()`, `createClass()`, `updateClass()`, `deleteClass()`
- `getStudents()`, `createStudent()`, `updateStudent()`, `deleteStudent()`
- `getAttendance()`, `saveAttendance()`, `getDashboardStats()`

When migrating to **Firebase Firestore** or **Supabase PostgreSQL** next week:
1. Replace the internal method implementations inside `src/services/dataService.ts` and `src/services/authService.ts`.
2. The UI components and pages require **zero** structural refactoring.

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
