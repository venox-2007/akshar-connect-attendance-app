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
import { Badge } from '../../components/common/Badge';
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
    <div className="space-y-4">
      {/* Title & CSV Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {t('reports.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Attendance analytics, aggregate metrics, class compliance, and CSV audit exports
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportAll}
          className="px-3.5 py-2 rounded-md bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export All Records (CSV)</span>
        </button>
      </div>

      {/* Aggregate KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Overall Percentage */}
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {t('reports.overallRate')}
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {overallPercentage}%
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Cumulative attendance</p>
          </div>
          <div className="w-9 h-9 rounded-md bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        {/* Total Attendance Entries */}
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {t('reports.totalRecords')}
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {totalLogs}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Recorded student entries</p>
          </div>
          <div className="w-9 h-9 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
            <BarChart3 className="w-4 h-4" />
          </div>
        </div>

        {/* Total Present Logs */}
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">
              {t('attendance.present')}
            </p>
            <p className="text-2xl font-bold text-emerald-800 mt-1">
              {totalPresent}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Present check-ins</p>
          </div>
          <div className="w-9 h-9 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Total Absent Logs */}
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-rose-700 uppercase tracking-wide">
              {t('attendance.absent')}
            </p>
            <p className="text-2xl font-bold text-rose-800 mt-1">
              {totalAbsent}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Absences recorded</p>
          </div>
          <div className="w-9 h-9 rounded-md bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-700">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Class Attendance Breakdown Table */}
      <div className="space-y-2 pt-2">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
          <School className="w-4 h-4 text-teal-700" />
          <span>Class Compliance & Performance</span>
        </h2>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-2.5 px-4">{t('classes.name')}</th>
                  <th className="py-2.5 px-4">{t('classes.assignedTeacher')}</th>
                  <th className="py-2.5 px-4 text-center">{t('attendance.present')}</th>
                  <th className="py-2.5 px-4 text-center">{t('attendance.absent')}</th>
                  <th className="py-2.5 px-4 text-center">{t('reports.totalRecords')}</th>
                  <th className="py-2.5 px-4 text-right">{t('reports.avgRate')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {classBreakdown.map(cls => (
                  <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      Class {cls.name} <span className="font-normal text-slate-500 text-[11px]">({cls.grade})</span>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">
                      {cls.assignedTeacherName || <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="py-2.5 px-4 text-center font-semibold text-emerald-800">
                      {cls.present}
                    </td>
                    <td className="py-2.5 px-4 text-center font-semibold text-rose-800">
                      {cls.absent}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono text-slate-700">
                      {cls.total}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {cls.total > 0 ? (
                        <span className="font-bold font-mono text-teal-800">
                          {cls.percentage}%
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium italic">
                          No logs recorded
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Date Trends */}
      <div className="space-y-2 pt-2">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
          <Calendar className="w-4 h-4 text-teal-700" />
          <span>Session History & Trends</span>
        </h2>

        {dateBreakdown.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 italic">
              {t('reports.noLogsYet')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {dateBreakdown.slice(0, 5).map(item => (
              <div
                key={item.date}
                className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <span className="text-[11px] font-mono font-medium text-slate-500 block mb-1">
                    {formatDateDisplay(item.date)}
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold text-slate-900">
                      {item.rate}%
                    </span>
                    <span className="text-xs font-semibold text-emerald-800">
                      {item.present}/{item.total}
                    </span>
                  </div>
                </div>

                {/* Mini institutional rate bar */}
                <div className="mt-2.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-teal-700"
                    style={{ width: `${item.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
