import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n';
import { dataService } from '../../services/dataService';
import { ClassEntity } from '../../types';
import { AttendanceSession } from '../../components/attendance/AttendanceSession';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ShieldAlert, ArrowLeft, AlertCircle } from 'lucide-react';

export const TakeAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedClassId = searchParams.get('classId');

  const [loading, setLoading] = useState(true);
  const [teacherClasses, setTeacherClasses] = useState<ClassEntity[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchClasses = async () => {
      if (!user?.teacherId) return;
      try {
        const dashboardData = await dataService.getTeacherDashboardData(user.teacherId);
        if (!isMounted) return;
        setTeacherClasses(dashboardData.classes);
      } catch (e) {
        console.error('Error fetching teacher classes', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchClasses();
    return () => {
      isMounted = false;
    };
  }, [user]);

  if (loading) {
    return <LoadingSpinner message="Loading attendance module..." />;
  }

  if (teacherClasses.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-white">
          No Assigned Classes
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          You currently have no classes assigned to your account. Please contact the administrator.
        </p>
      </div>
    );
  }

  // Security Check: If a specific classId was requested via URL, verify teacher assignment
  const isUnauthorizedAttempt =
    requestedClassId !== null &&
    !teacherClasses.some(c => c.id === requestedClassId);

  if (isUnauthorizedAttempt) {
    return (
      <div className="p-8 sm:p-12 text-center bg-white dark:bg-slate-850 rounded-3xl border border-rose-200 dark:border-rose-900/50 shadow-sm max-w-xl mx-auto my-6">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 ring-4 ring-rose-50 dark:ring-rose-900/30">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Access Denied
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
          You do not have authorization to view, record, or modify attendance for class ID{' '}
          <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-rose-600 dark:text-rose-400">
            {requestedClassId}
          </code>
          . Teachers may only access educational batches officially assigned to them.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/teacher/dashboard')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(`/teacher/attendance?classId=${teacherClasses[0].id}`)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20"
          >
            Open Assigned Class ({teacherClasses[0].name})
          </button>
        </div>
      </div>
    );
  }

  const activeClassId = requestedClassId || teacherClasses[0].id;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('attendance.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Mark daily attendance for your assigned learning center students.
          </p>
        </div>
      </div>

      <AttendanceSession
        initialClassId={activeClassId}
        allowedClasses={teacherClasses}
        markedByName={user?.name || 'Teacher'}
      />
    </div>
  );
};
