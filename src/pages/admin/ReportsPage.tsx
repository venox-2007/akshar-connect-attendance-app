import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  XCircle,
  Users,
  School,
  TrendingUp,
  Download
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import { dataService } from '../../services/dataService';
import { AttendanceRecord, ClassEntity, Student } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { exportAttendanceToCsv } from '../../utils/exportCsv';
import { useToast } from '../../hooks/useToast';
import { formatDateDisplay } from '../../utils/dateUtils';

export const ReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const [cList, sList, aList] = await Promise.all([
          dataService.getClasses(),
          dataService.getStudents(),
          dataService.getAttendance()
        ]);
        if (!isMounted) return;
        setClasses(cList);
        setStudents(sList);
        setAttendance(aList);
      } catch (err: any) {
        toast.error(err?.message || 'Error loading report metrics');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchReportData();
    return () => {
      isMounted = false;
    };
  }, []);

  const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  const classMap = useMemo(() => new Map(classes.map(c => [c.id, c])), [classes]);

  // Overall calculations directly from attendance records
  const totalLogs = attendance.length;
  const totalPresent = attendance.filter(r => r.status === 'present').length;
  const totalAbsent = attendance.filter(r => r.status === 'absent').length;
  const overallPercentage = totalLogs > 0 ? Math.round((totalPresent / totalLogs) * 100) : 0;

  // Breakdown by Class
  const classBreakdown = useMemo(() => {
    return classes.map(cls => {
      const clsRecords = attendance.filter(r => r.classId === cls.id);
      const present = clsRecords.filter(r => r.status === 'present').length;
      const absent = clsRecords.filter(r => r.status === 'absent').length;
      const total = present + absent;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      return {
        ...cls,
        present,
        absent,
        total,
        percentage
      };
    });
  }, [classes, attendance]);

  // Breakdown by Date (last 7 active dates in dataset)
  const dateBreakdown = useMemo(() => {
    const datesMap: Record<string, { present: number; absent: number; total: number }> = {};
    attendance.forEach(rec => {
      if (!datesMap[rec.date]) {
        datesMap[rec.date] = { present: 0, absent: 0, total: 0 };
      }
      datesMap[rec.date].total++;
      if (rec.status === 'present') datesMap[rec.date].present++;
      else datesMap[rec.date].absent++;
    });

    const sortedDates = Object.keys(datesMap).sort((a, b) => b.localeCompare(a));
    return sortedDates.map(date => {
      const item = datesMap[date];
      const rate = item.total > 0 ? Math.round((item.present / item.total) * 100) : 0;
      return {
        date,
        ...item,
        rate
      };
    });
  }, [attendance]);

  const handleExportAll = () => {
    const rows = attendance.map(rec => {
      const cls = classMap.get(rec.classId);
      const std = studentMap.get(rec.studentId);
      return {
        date: rec.date,
        className: cls?.name || rec.classId,
        learningCenter: cls?.learningCenter || '',
        studentName: std?.name || 'Unknown',
        rollNumber: std?.rollNumber || '',
        gender: std?.gender || '',
        status: rec.status,
        markedBy: rec.markedBy,
        lastUpdated: rec.updatedAt,
        notes: rec.notes
      };
    });

    exportAttendanceToCsv(
      `Akshar_Paaul_Complete_Attendance_${new Date().toISOString().split('T')[0]}`,
      rows
    );
    toast.success('Complete attendance CSV report generated and downloaded!');
  };

  if (loading) return <LoadingSpinner message="Generating analytics..." />;

  return (
    <div className="space-y-6">
      {/* Title & CSV Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('reports.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('reports.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportAll}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>{t('reports.exportCsv')}</span>
        </button>
      </div>

      {/* Aggregate KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Percentage */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('reports.overallRate')}
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {overallPercentage}%
            </p>
          </div>
        </div>

        {/* Total Attendance Entries */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('reports.totalRecords')}
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {totalLogs}
            </p>
          </div>
        </div>

        {/* Total Present Logs */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('attendance.present')}
            </p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {totalPresent}
            </p>
          </div>
        </div>

        {/* Total Absent Logs */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('attendance.absent')}
            </p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
              {totalAbsent}
            </p>
          </div>
        </div>
      </div>

      {/* Class Attendance Breakdown Table */}
      <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <School className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <span>{t('reports.classPerformance')}</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">{t('classes.name')}</th>
                <th className="py-3 px-4">{t('reports.center')}</th>
                <th className="py-3 px-4">{t('classes.assignedTeacher')}</th>
                <th className="py-3 px-4 text-center">{t('attendance.present')}</th>
                <th className="py-3 px-4 text-center">{t('attendance.absent')}</th>
                <th className="py-3 px-4 text-center">{t('reports.totalRecords')}</th>
                <th className="py-3 px-4 text-right">{t('reports.avgRate')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {classBreakdown.map(cls => (
                <tr key={cls.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {cls.name} ({cls.grade})
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    {cls.learningCenter}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                    {cls.assignedTeacherName || '-'}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                    {cls.present}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-rose-600 dark:text-rose-400">
                    {cls.absent}
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium text-slate-600 dark:text-slate-400">
                    {cls.total}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                      {cls.percentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Date Trends Visual Cards */}
      <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <span>{t('reports.trendOverTime')}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {dateBreakdown.slice(0, 5).map(item => (
            <div
              key={item.date}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between"
            >
              <div>
                <span className="text-[11px] font-mono text-slate-400 block mb-1">
                  {formatDateDisplay(item.date)}
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    {item.rate}%
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {item.present}/{item.total}
                  </span>
                </div>
              </div>

              {/* Mini bar */}
              <div className="mt-3 h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full"
                  style={{ width: `${item.rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
