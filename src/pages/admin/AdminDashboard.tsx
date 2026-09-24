import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  School,
  Users,
  CheckCircle2,
  CalendarCheck,
  PlusCircle,
  FileSpreadsheet,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n';
import { dataService } from '../../services/dataService';
import { DashboardStats } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const data = await dataService.getDashboardStats();
        if (!isMounted) return;
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchStats();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || !stats) {
    return <LoadingSpinner message="Loading admin dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-700 p-6 sm:p-8 text-white shadow-xl shadow-teal-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md text-teal-100 mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Akshar Paaul Educational NGO &bull; {t('roles.ADMIN')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t('dashboard.welcome')}, {user?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-teal-100 mt-2 leading-relaxed max-w-xl">
            Monitor real-time student attendance across all 4 learning centers, manage teachers, and review NGO progress.
          </p>
        </div>
        <div className="relative z-10 hidden sm:flex shrink-0">
          <div className="w-20 h-20 bg-white rounded-2xl p-1.5 shadow-lg border border-white/20 flex items-center justify-center">
            <img src="/logo.png" alt="Akshar Paaul Logo" className="w-full h-full object-contain" />
          </div>
        </div>
        <div className="absolute -right-8 -bottom-8 w-56 h-56 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Teachers */}
        <div
          onClick={() => navigate('/admin/teachers')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-teal-500/50 cursor-pointer transition-all flex items-center gap-4 group"
        >
          <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('dashboard.totalTeachers')}
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats.totalTeachers}
            </p>
          </div>
        </div>

        {/* Total Classes */}
        <div
          onClick={() => navigate('/admin/classes')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-teal-500/50 cursor-pointer transition-all flex items-center gap-4 group"
        >
          <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 group-hover:scale-105 transition-transform">
            <School className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('dashboard.totalClasses')}
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats.totalClasses}
            </p>
          </div>
        </div>

        {/* Total Students */}
        <div
          onClick={() => navigate('/admin/students')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-teal-500/50 cursor-pointer transition-all flex items-center gap-4 group"
        >
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('dashboard.totalStudents')}
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats.totalStudents}
            </p>
          </div>
        </div>

        {/* Today's Attendance Rate */}
        <div
          onClick={() => navigate('/admin/reports')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-teal-500/50 cursor-pointer transition-all flex items-center gap-4 group"
        >
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('dashboard.todayAttendance')}
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.todayAttendance.total > 0 ? `${stats.todayAttendance.percentage}%` : '0%'}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {stats.todayAttendance.total > 0
                  ? `${stats.todayAttendance.present} / ${stats.todayAttendance.total}`
                  : t('dashboard.noAttendanceToday')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/admin/attendance')}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all flex items-center gap-2"
        >
          <CalendarCheck className="w-4 h-4" />
          <span>{t('dashboard.takeAttendanceBtn')}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/admin/teachers')}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold shadow-xs transition-colors flex items-center gap-2"
        >
          <GraduationCap className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>{t('teachers.addTeacher')}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/admin/classes')}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold shadow-xs transition-colors flex items-center gap-2"
        >
          <School className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>{t('classes.addClass')}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/admin/students')}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold shadow-xs transition-colors flex items-center gap-2"
        >
          <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{t('students.addStudent')}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/admin/reports')}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 ml-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{t('nav.reports')}</span>
        </button>
      </div>

      {/* Class-wise Today Attendance Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <School className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>{t('dashboard.classBreakdown')}</span>
          </h2>
          <button
            type="button"
            onClick={() => navigate('/admin/history')}
            className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
          >
            <span>{t('dashboard.viewHistoryBtn')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.classBreakdown.map(cls => (
            <div
              key={cls.classId}
              className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {cls.className}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {cls.learningCenter}
                    </p>
                  </div>
                  {cls.isMarkedToday ? (
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

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      Attendance Progress
                    </span>
                    <span className="text-teal-600 dark:text-teal-400 font-bold">
                      {cls.percentage}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${cls.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Stat pills */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900">
                    <span className="text-[10px] text-slate-400 font-bold block">
                      {t('attendance.totalStudents')}
                    </span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">
                      {cls.totalStudents}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                      {t('attendance.present')}
                    </span>
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-300">
                      {cls.presentCount}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-rose-50/50 dark:bg-rose-950/30">
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block">
                      {t('attendance.absent')}
                    </span>
                    <span className="font-extrabold text-rose-700 dark:text-rose-300">
                      {cls.absentCount}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3">
                <button
                  type="button"
                  onClick={() => navigate(`/admin/attendance?classId=${cls.classId}`)}
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>{t('dashboard.takeAttendanceBtn')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
