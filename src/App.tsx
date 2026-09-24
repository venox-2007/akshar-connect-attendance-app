import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { I18nProvider } from './i18n';
import { ToastProvider } from './hooks/useToast';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { TeachersPage } from './pages/admin/TeachersPage';
import { ClassesPage } from './pages/admin/ClassesPage';
import { StudentsPage } from './pages/admin/StudentsPage';
import { AdminAttendancePage } from './pages/admin/AdminAttendancePage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { TakeAttendancePage } from './pages/teacher/TakeAttendancePage';
import { MyClassesPage } from './pages/teacher/MyClassesPage';
import { AttendanceHistoryPage } from './pages/attendance/AttendanceHistoryPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Root index redirector
const RootRedirect: React.FC = () => {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/teacher/dashboard" replace />;
};

// Login route wrapper (redirect if already logged in)
const PublicLoginRoute: React.FC = () => {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) {
    if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/teacher/dashboard" replace />;
  }
  return <LoginPage />;
};

export function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Public / Auth */}
                <Route path="/login" element={<PublicLoginRoute />} />
                <Route path="/" element={<RootRedirect />} />

                {/* Administrator Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="teachers" element={<TeachersPage />} />
                  <Route path="classes" element={<ClassesPage />} />
                  <Route path="students" element={<StudentsPage />} />
                  <Route path="attendance" element={<AdminAttendancePage />} />
                  <Route path="history" element={<AttendanceHistoryPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                </Route>

                {/* Teacher Routes */}
                <Route
                  path="/teacher"
                  element={
                    <ProtectedRoute allowedRoles={['TEACHER']}>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/teacher/dashboard" replace />} />
                  <Route path="dashboard" element={<TeacherDashboard />} />
                  <Route path="classes" element={<MyClassesPage />} />
                  <Route path="attendance" element={<TakeAttendancePage />} />
                  <Route path="history" element={<AttendanceHistoryPage />} />
                </Route>

                {/* 404 Catch All */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;
