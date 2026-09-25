import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  PlusCircle,
  FileSpreadsheet,
  ArrowRight,
  Clock,
  CheckCircle2,
  Users,
  GraduationCap,
  School
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n';
import { dataService } from '../../services/dataService';
import { DashboardStats, ClassEntity } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import { formatDateDisplay, getTodayDateString } from '../../utils/dateUtils';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [classes, setClasses] = useState<ClassEntity[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboard = async () => {
      try {
        const [statsData, classesData] = await Promise.all([
          dataService.getDashboardStats(),
          dataService.getClasses()
        ]);
        if (!isMounted) return;
        setStats(statsData);
        setClasses(classesData);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || !stats) {
    return <LoadingSpinner message="Loading admin dashboard..." />;
  }

  const classMap = new Map<string, ClassEntity>();
  classes.forEach(c => classMap.set(c.id, c));

  const todayStr = getTodayDateString();
  const classesRecordedCount = stats.classBreakdown.filter(c => c.isMarkedToday).length;

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Administrator Dashboard
            </h1>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              Akshar Paaul NGO
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Institutional overview and daily attendance recording status.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="text-xs text-slate-500 font-medium px-2.5 py-1.5 rounded-md border border-slate-200 bg-white">
            Today: <span className="font-semibold text-slate-800">{formatDateDisplay(todayStr)}</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/attendance')}
            className="px-3.5 py-1.5 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>{t('dashboard.takeAttendanceBtn')}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/reports')}
            className="px-3.5 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('nav.reports')}</span>
          </button>
        </div>
      </div>

      {/* Structured Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-lg bg-white border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            {t('dashboard.todayAttendance')}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900">
              {stats.todayAttendance.total > 0 ? `${stats.todayAttendance.percentage}%` : '0%'}
            </span>
            <span className="text-xs text-slate-500">
              {stats.todayAttendance.total > 0
                ? `(${stats.todayAttendance.present} Present / ${stats.todayAttendance.absent} Absent)`
                : 'Not Recorded'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            {t('dashboard.totalStudents')}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900">
              {stats.totalStudents}
            </span>
            <span className="text-xs text-slate-500">
              Enrolled students
            </span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Classes Recorded Today
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900">
              {classesRecordedCount} / {stats.totalClasses}
            </span>
            <span className="text-xs text-slate-500">
              {classesRecordedCount === stats.totalClasses ? 'Complete' : 'Pending'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            {t('dashboard.totalTeachers')}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900">
              {stats.totalTeachers}
            </span>
            <span className="text-xs text-slate-500">
              Active educators
            </span>
          </div>
        </div>
      </div>

      {/* Primary Section: Today's Attendance by Class Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Today's Attendance Status
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time daily attendance register breakdown by class batch
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/history')}
            className="text-xs font-medium text-teal-700 hover:text-teal-800 hover:underline flex items-center gap-1"
          >
            <span>{t('dashboard.viewHistoryBtn')}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-4">{t('classes.name')}</th>
                <th className="py-2.5 px-4">{t('classes.grade')}</th>
                <th className="py-2.5 px-4">{t('classes.assignedTeacher')}</th>
                <th className="py-2.5 px-4 text-center">{t('attendance.totalStudents')}</th>
                <th className="py-2.5 px-4 text-center">{t('attendance.present')}</th>
                <th className="py-2.5 px-4 text-center">{t('attendance.absent')}</th>
                <th className="py-2.5 px-4 text-center">{t('dashboard.attendanceRate')}</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.classBreakdown.map(cls => {
                const classEntity = classMap.get(cls.classId);
                const teacherName = classEntity?.assignedTeacherName || t('common.unassigned');

                return (
                  <tr key={cls.classId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {cls.className}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {classEntity?.grade || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {teacherName}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-700">
                      {cls.totalStudents}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-emerald-700">
                      {cls.isMarkedToday ? cls.presentCount : '—'}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-rose-700">
                      {cls.isMarkedToday ? cls.absentCount : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {cls.isMarkedToday ? (
                        <span className="font-semibold text-slate-800">
                          {cls.percentage}%
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {cls.isMarkedToday ? (
                        <Badge variant="success">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{t('dashboard.statusMarked')}</span>
                        </Badge>
                      ) : (
                        <Badge variant="warning">
                          <Clock className="w-3 h-3" />
                          <span>{t('dashboard.statusPending')}</span>
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/attendance?classId=${cls.classId}`)}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                          cls.isMarkedToday
                            ? 'border border-slate-300 text-slate-700 bg-white hover:bg-slate-50'
                            : 'bg-teal-700 text-white hover:bg-teal-800'
                        }`}
                      >
                        {cls.isMarkedToday ? 'Review / Edit' : 'Take Attendance'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Secondary Administrative Shortcuts Panel */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider block mb-3">
          Administrative Shortcuts
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/attendance')}
            className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Record Attendance</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/students')}
            className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>Manage Students</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/classes')}
            className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <School className="w-3.5 h-3.5 text-slate-500" />
            <span>Manage Classes</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/teachers')}
            className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
            <span>Manage Teachers</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/reports')}
            className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5 ml-auto"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
};
