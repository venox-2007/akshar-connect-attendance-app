import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  School,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  CalendarCheck,
  AlertCircle,
  Calendar,
  FileText
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n';
import { dataService } from '../../services/dataService';
import { ClassAttendanceSummary, ClassEntity, AttendanceRecord, Student } from '../../types';
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
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const [studentsMap, setStudentsMap] = useState<Record<string, Student>>({});

  useEffect(() => {
    let isMounted = true;
    const loadDashboard = async () => {
      if (!user?.teacherId) return;
      try {
        const [dashResult, attendances, students] = await Promise.all([
          dataService.getTeacherDashboardData(user.teacherId),
          dataService.getAttendance(),
          dataService.getStudents()
        ]);

        if (!isMounted) return;
        setClasses(dashResult.classes);
        setStats(dashResult.stats);
        setClassSummaries(dashResult.classSummaries);
        setRecentRecords(attendances.slice(0, 8));

        const sMap: Record<string, Student> = {};
        students.forEach(s => {
          sMap[s.id] = s;
        });
        setStudentsMap(sMap);
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

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="space-y-6">
      {/* Institutional Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Teacher Dashboard
            </h1>
            <span className="text-xs px-2 py-0.5 rounded font-medium bg-teal-50 text-teal-800 border border-teal-200">
              {user?.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Akshar Paaul Educational Portal &bull; Daily Attendance Operations
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-md font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Session: {todayFormatted}</span>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Assigned Classes */}
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {t('dashboard.assignedClasses')}
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {stats.assignedClassesCount}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Assigned to you</p>
          </div>
          <div className="w-9 h-9 rounded-md bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
            <School className="w-4 h-4" />
          </div>
        </div>

        {/* Total Students */}
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {t('dashboard.totalStudents')}
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {stats.totalStudentsCount}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Across assigned classes</p>
          </div>
          <div className="w-9 h-9 rounded-md bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
            <Users className="w-4 h-4" />
          </div>
        </div>

        {/* Classes Marked Today */}
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Today's Submission
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {stats.todayMarkedClassesCount} / {stats.assignedClassesCount}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {stats.todayMarkedClassesCount === stats.assignedClassesCount && stats.assignedClassesCount > 0
                ? 'All completed'
                : 'Pending completion'}
            </p>
          </div>
          <div className="w-9 h-9 rounded-md bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {t('dashboard.attendanceRate')}
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {stats.todayAttendanceRate}%
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Today's present ratio</p>
          </div>
          <div className="w-9 h-9 rounded-md bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
            <CalendarCheck className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Assigned Classes - Practical Attendance Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <School className="w-4 h-4 text-teal-700" />
            <span>Assigned Classes & Attendance Action</span>
          </h2>
          <Link
            to="/teacher/classes"
            className="text-xs font-medium text-teal-700 hover:text-teal-800 hover:underline flex items-center gap-1"
          >
            <span>View Class Rosters</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {classes.length === 0 ? (
          <div className="p-8 text-center rounded-lg bg-white border border-slate-200">
            <AlertCircle className="w-7 h-7 text-amber-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">
              No classes currently assigned.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Please contact the administrator to assign you to active class rosters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classSummaries.map(item => {
              const matchedClass = classes.find(c => c.id === item.classId);
              return (
                <div
                  key={item.classId}
                  className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">
                            Class {item.className}
                          </h3>
                          {matchedClass?.grade && (
                            <span className="text-xs px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              Grade {matchedClass.grade}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.totalStudents} Students Enrolled
                        </p>
                      </div>

                      {item.isMarkedToday ? (
                        <Badge variant="success">
                          <CheckCircle2 className="w-3 h-3" />
                          Marked Today
                        </Badge>
                      ) : (
                        <Badge variant="warning">
                          <Clock className="w-3 h-3" />
                          Attendance Pending
                        </Badge>
                      )}
                    </div>

                    {/* Class Stats Summary */}
                    {item.isMarkedToday ? (
                      <div className="my-3 p-3 rounded-md bg-slate-50 border border-slate-200 grid grid-cols-4 gap-2 text-center text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] font-medium uppercase">
                            Enrolled
                          </span>
                          <span className="font-semibold text-slate-700">
                            {item.totalStudents}
                          </span>
                        </div>
                        <div>
                          <span className="text-emerald-700 block text-[10px] font-medium uppercase">
                            Present
                          </span>
                          <span className="font-semibold text-emerald-800">
                            {item.presentCount}
                          </span>
                        </div>
                        <div>
                          <span className="text-rose-700 block text-[10px] font-medium uppercase">
                            Absent
                          </span>
                          <span className="font-semibold text-rose-800">
                            {item.absentCount}
                          </span>
                        </div>
                        <div>
                          <span className="text-teal-700 block text-[10px] font-medium uppercase">
                            Rate
                          </span>
                          <span className="font-semibold text-teal-800">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="my-3 p-3 rounded-md bg-amber-50/60 border border-amber-200 text-xs flex items-center justify-between text-amber-800">
                        <span>Attendance has not been recorded yet today.</span>
                        <span className="font-semibold text-slate-700">
                          {item.totalStudents} awaiting
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => navigate(`/teacher/attendance?classId=${item.classId}`)}
                      className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                        item.isMarkedToday
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                          : 'bg-teal-700 hover:bg-teal-800 text-white shadow-sm'
                      }`}
                    >
                      <span>
                        {item.isMarkedToday ? 'Edit Today Attendance' : 'Take Attendance Now'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      to="/teacher/classes"
                      className="py-2 px-3 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                    >
                      Roster
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Attendance Records Table */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-700" />
            <span>Recent Class Attendance Log</span>
          </h2>
          <Link
            to="/teacher/history"
            className="text-xs font-medium text-teal-700 hover:text-teal-800 hover:underline flex items-center gap-1"
          >
            <span>View Full History</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
          {recentRecords.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No recent attendance records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Class</th>
                    <th className="py-2.5 px-4">Roll No</th>
                    <th className="py-2.5 px-4">Student Name</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {recentRecords.map(record => {
                    const student = studentsMap[record.studentId];
                    const matchedClass = classes.find(c => c.id === record.classId);
                    return (
                      <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-4 font-mono text-slate-700">{record.date}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          {matchedClass ? matchedClass.name : record.classId}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-600">
                          {student?.rollNumber || '—'}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-900">
                          {student?.name || 'Unknown Student'}
                        </td>
                        <td className="py-2.5 px-4">
                          {record.status === 'present' ? (
                            <Badge variant="success">Present</Badge>
                          ) : (
                            <Badge variant="danger">Absent</Badge>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 italic">
                          {record.notes || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
