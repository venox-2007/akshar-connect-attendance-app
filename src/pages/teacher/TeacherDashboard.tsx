import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  School,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  CalendarCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n';
import { dataService } from '../../services/dataService';
import { ClassAttendanceSummary, ClassEntity } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [stats, setStats] = useState<{
    assignedClassesCount: number;
    totalStudentsCount: number;
    todayMarkedClassesCount: number;
    todayAttendanceRate: number;
  }>({
    assignedClassesCount: 0,
    totalStudentsCount: 0,
    todayMarkedClassesCount: 0,
    todayAttendanceRate: 0
  });
  const [classSummaries, setClassSummaries] = useState<ClassAttendanceSummary[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadDashboard = async () => {
      if (!user?.teacherId) return;
      try {
        const result = await dataService.getTeacherDashboardData(user.teacherId);
        if (!isMounted) return;
        setClasses(result.classes);
        setStats(result.stats);
        setClassSummaries(result.classSummaries);
      } catch (err) {
        console.error('Failed to load teacher dashboard', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, [user]);

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 p-6 sm:p-8 text-white shadow-lg shadow-teal-700/20 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-teal-50 mb-3">
            Akshar Paaul Educational NGO &bull; {t('roles.TEACHER')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t('dashboard.welcome')}, {user?.name}!
          </h1>
          <p className="text-sm sm:text-base text-teal-100 mt-2 leading-relaxed">
            Record attendance quickly and monitor your learning center children today.
          </p>
        </div>
        <div className="relative z-10 hidden sm:flex shrink-0">
          <div className="w-20 h-20 bg-white rounded-2xl p-1.5 shadow-lg border border-white/20 flex items-center justify-center">
            <img src="/logo.png" alt="Akshar Paaul Logo" className="w-full h-full object-contain" />
          </div>
        </div>
        {/* Decorative circle */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Assigned Classes */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
            <School className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('dashboard.assignedClasses')}
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats.assignedClassesCount}
            </p>
          </div>
        </div>

        {/* Total Students */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('dashboard.totalStudents')}
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats.totalStudentsCount}
            </p>
          </div>
        </div>

        {/* Classes Marked Today */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('dashboard.statusMarked')}
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats.todayMarkedClassesCount} / {stats.assignedClassesCount}
            </p>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('dashboard.attendanceRate')}
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats.todayAttendanceRate}%
            </p>
          </div>
        </div>
      </div>

      {/* Assigned Classes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <School className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>{t('dashboard.assignedClasses')}</span>
          </h2>
        </div>

        {classes.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              No classes currently assigned. Please contact the administrator.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classSummaries.map(item => (
              <div
                key={item.classId}
                className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:border-teal-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {item.className}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.learningCenter}
                      </p>
                    </div>
                    {item.isMarkedToday ? (
                      <Badge variant="success">
                        <CheckCircle2 className="w-3 h-3" />
                        {t('dashboard.statusMarked')}
                      </Badge>
                    ) : (
                      <Badge variant="warning">
                        <Clock className="w-3 h-3" />
                        {t('dashboard.statusPending')}
                      </Badge>
                    )}
                  </div>

                  {/* Attendance Stats bar */}
                  {item.isMarkedToday ? (
                    <div className="my-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                          {t('attendance.totalStudents')}
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {item.totalStudents}
                        </span>
                      </div>
                      <div>
                        <span className="text-emerald-600 dark:text-emerald-400 block text-[10px] font-semibold uppercase">
                          {t('attendance.present')}
                        </span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300">
                          {item.presentCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-rose-600 dark:text-rose-400 block text-[10px] font-semibold uppercase">
                          {t('attendance.absent')}
                        </span>
                        <span className="font-bold text-rose-700 dark:text-rose-300">
                          {item.absentCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-teal-600 dark:text-teal-400 block text-[10px] font-semibold uppercase">
                          {t('dashboard.attendanceRate')}
                        </span>
                        <span className="font-bold text-teal-700 dark:text-teal-300">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="my-4 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-xs">
                      <span className="text-amber-800 dark:text-amber-300 font-medium">
                        {t('dashboard.noAttendanceToday')}
                      </span>
                      <span className="font-bold text-slate-600 dark:text-slate-400">
                        {item.totalStudents} {t('classes.studentsCount').toLowerCase()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/teacher/attendance?classId=${item.classId}`)}
                    className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <span>{t('dashboard.takeAttendanceBtn')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
