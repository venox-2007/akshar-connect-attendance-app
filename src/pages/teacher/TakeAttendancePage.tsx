import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n';
import { dataService } from '../../services/dataService';
import { ClassEntity } from '../../types';
import { AttendanceSession } from '../../components/attendance/AttendanceSession';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { AlertCircle } from 'lucide-react';

export const TakeAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
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
          You currently have no classes assigned to your account. Please ask the administrator to assign you to a learning center class.
        </p>
      </div>
    );
  }

  // Validate if requested class is in teacher's assigned classes
  const validInitialClassId =
    requestedClassId && teacherClasses.some(c => c.id === requestedClassId)
      ? requestedClassId
      : teacherClasses[0].id;

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
        initialClassId={validInitialClassId}
        allowedClasses={teacherClasses}
        markedByName={user?.name || 'Teacher'}
      />
    </div>
  );
};
