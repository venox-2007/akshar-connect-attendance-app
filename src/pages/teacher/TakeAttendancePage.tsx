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
      <div className="p-8 text-center bg-white rounded-lg border border-slate-200">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-slate-800">
          No Assigned Classes
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
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
      <div className="p-6 sm:p-8 text-center bg-white rounded-lg border border-rose-200 shadow-sm max-w-lg mx-auto my-6">
        <div className="w-12 h-12 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center mx-auto mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          Access Denied
        </h2>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          You do not have authorization to view, record, or modify attendance for class ID{' '}
          <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-rose-700 border border-slate-200">
            {requestedClassId}
          </code>
          . Teachers may only access educational classes officially assigned to them.
        </p>
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/teacher/dashboard')}
            className="w-full sm:w-auto px-3.5 py-2 rounded-md border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(`/teacher/attendance?classId=${teacherClasses[0].id}`)}
            className="w-full sm:w-auto px-3.5 py-2 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            Open Assigned Class ({teacherClasses[0].name})
          </button>
        </div>
      </div>
    );
  }

  const activeClassId = requestedClassId || teacherClasses[0].id;

  return (
    <div className="space-y-4">
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          {t('attendance.title')}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Record and submit daily student attendance for your assigned classroom roster
        </p>
      </div>

      <AttendanceSession
        initialClassId={activeClassId}
        allowedClasses={teacherClasses}
        markedByName={user?.name || 'Teacher'}
      />
    </div>
  );
};
