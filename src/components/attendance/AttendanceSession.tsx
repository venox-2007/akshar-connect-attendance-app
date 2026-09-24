import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Users,
  Search,
  CheckCheck,
  X,
  Save,
  Check,
  Info,
  Clock,
  UserCheck
} from 'lucide-react';
import { ClassEntity, Student, AttendanceStatus, AttendanceRecord } from '../../types';
import { dataService } from '../../services/dataService';
import { useTranslation } from '../../i18n';
import { useToast } from '../../hooks/useToast';
import { getTodayDateString, formatDateDisplay } from '../../utils/dateUtils';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface AttendanceSessionProps {
  initialClassId?: string;
  allowedClasses: ClassEntity[];
  markedByName: string;
  onAttendanceSaved?: () => void;
}

export const AttendanceSession: React.FC<AttendanceSessionProps> = ({
  initialClassId,
  allowedClasses,
  markedByName,
  onAttendanceSaved
}) => {
  const { t } = useTranslation();
  const toast = useToast();

  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClassId || (allowedClasses.length > 0 ? allowedClasses[0].id : '')
  );
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [students, setStudents] = useState<Student[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>({});
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingRecordsFound, setExistingRecordsFound] = useState(false);

  // Sync selected class if initial changes
  useEffect(() => {
    if (initialClassId && allowedClasses.some(c => c.id === initialClassId)) {
      setSelectedClassId(initialClassId);
    } else if (allowedClasses.length > 0 && !allowedClasses.some(c => c.id === selectedClassId)) {
      setSelectedClassId(allowedClasses[0].id);
    }
  }, [initialClassId, allowedClasses]);

  // Load students & existing attendance records whenever class or date changes
  useEffect(() => {
    if (!selectedClassId) return;

    let isMounted = true;
    const fetchClassData = async () => {
      setLoading(true);
      try {
        const [studentList, existingAttendance] = await Promise.all([
          dataService.getStudents({ classId: selectedClassId }),
          dataService.getAttendance({ classId: selectedClassId, date: selectedDate })
        ]);

        if (!isMounted) return;

        setStudents(studentList);

        const newStatusMap: Record<string, AttendanceStatus> = {};
        const newNotesMap: Record<string, string> = {};
        let hasExisting = false;

        const recordLookup = new Map<string, AttendanceRecord>();
        existingAttendance.forEach(rec => {
          recordLookup.set(rec.studentId, rec);
        });

        if (existingAttendance.length > 0) {
          hasExisting = true;
        }

        studentList.forEach(student => {
          const rec = recordLookup.get(student.id);
          if (rec) {
            newStatusMap[student.id] = rec.status;
            if (rec.notes) newNotesMap[student.id] = rec.notes;
          } else {
            // Default to 'present' for new sessions
            newStatusMap[student.id] = 'present';
          }
        });

        setStatusMap(newStatusMap);
        setNotesMap(newNotesMap);
        setExistingRecordsFound(hasExisting);
      } catch (e: any) {
        toast.error(e?.message || 'Error loading class students');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchClassData();
    return () => {
      isMounted = false;
    };
  }, [selectedClassId, selectedDate]);

  const currentClass = allowedClasses.find(c => c.id === selectedClassId);

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      s => s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  // Real-time metrics
  const totalCount = students.length;
  const presentCount = Object.values(statusMap).filter(st => st === 'present').length;
  const absentCount = Object.values(statusMap).filter(st => st === 'absent').length;
  const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const handleToggleStatus = (studentId: string, status: AttendanceStatus) => {
    setStatusMap(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach(s => {
      updated[s.id] = status;
    });
    setStatusMap(updated);
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassId) {
      toast.error(t('attendance.noClassSelected'));
      return;
    }

    if (students.length === 0) {
      toast.error(t('attendance.noStudentsInClass'));
      return;
    }

    setSaving(true);
    try {
      const payload = students.map(s => ({
        studentId: s.id,
        status: statusMap[s.id] || 'present',
        notes: notesMap[s.id]
      }));

      await dataService.saveAttendance(
        selectedClassId,
        selectedDate,
        payload,
        markedByName
      );

      setExistingRecordsFound(true);
      toast.success(t('attendance.savedSuccess'));
      if (onAttendanceSaved) {
        onAttendanceSaved();
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar: Class Selector, Date Selector, Quick Action Summary */}
      <div className="bg-white dark:bg-slate-850 p-4 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          {/* Class Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              {t('attendance.selectClass')}
            </label>
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {allowedClasses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.learningCenter}
                </option>
              ))}
            </select>
          </div>

          {/* Date Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              {t('attendance.selectDate')}
            </label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                max={getTodayDateString()}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Save Attendance Button */}
          <div className="sm:col-span-2 lg:col-span-1">
            <button
              type="button"
              onClick={handleSaveAttendance}
              disabled={saving || loading || students.length === 0}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>{t('attendance.saving')}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{t('attendance.saveAttendance')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Existing records banner note */}
        {existingRecordsFound && (
          <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 text-teal-800 dark:text-teal-200 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400" />
            <span>{t('attendance.alreadyMarkedNote')} ({formatDateDisplay(selectedDate)})</span>
          </div>
        )}
      </div>

      {/* Live Stats KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Students */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {t('attendance.totalStudents')}
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {totalCount}
            </p>
          </div>
        </div>

        {/* Present Count */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              {t('attendance.present')}
            </p>
            <p className="text-xl font-bold text-emerald-900 dark:text-emerald-200">
              {presentCount}
            </p>
          </div>
        </div>

        {/* Absent Count */}
        <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              {t('attendance.absent')}
            </p>
            <p className="text-xl font-bold text-rose-900 dark:text-rose-200">
              {absentCount}
            </p>
          </div>
        </div>

        {/* Percentage */}
        <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/50 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
              {t('dashboard.attendanceRate')}
            </p>
            <p className="text-xl font-bold text-teal-900 dark:text-teal-200">
              {percentage}%
            </p>
          </div>
        </div>
      </div>

      {/* Student List Action Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('attendance.searchStudents')}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Batch Mark All Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleMarkAll('present')}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors flex items-center justify-center gap-1.5"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>{t('attendance.markAllPresent')}</span>
          </button>
          <button
            type="button"
            onClick={() => handleMarkAll('absent')}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900 transition-colors flex items-center justify-center gap-1.5"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>{t('attendance.markAllAbsent')}</span>
          </button>
        </div>
      </div>

      {/* Student List Cards / Table */}
      {loading ? (
        <LoadingSpinner message="Loading students..." />
      ) : filteredStudents.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-500">
            {t('attendance.noStudentsInClass')}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredStudents.map((student, idx) => {
              const currentStatus = statusMap[student.id] || 'present';
              const isPresent = currentStatus === 'present';

              return (
                <div
                  key={student.id}
                  className={`p-3.5 sm:p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isPresent
                      ? 'hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10'
                      : 'bg-rose-50/30 dark:bg-rose-950/20 hover:bg-rose-50/50'
                  }`}
                >
                  {/* Left: Student Identity */}
                  <div className="flex items-center gap-3">
                    <span className="w-7 text-xs font-mono text-slate-400 font-bold shrink-0">
                      {idx + 1}.
                    </span>
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isPresent
                          ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200'
                          : 'bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200'
                      }`}
                    >
                      {student.rollNumber.split('-')[1] || student.rollNumber}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {student.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          {student.rollNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase">
                          &bull; {student.gender}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Big Present / Absent Toggle Buttons (Mobile friendly) */}
                  <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto">
                    {/* Present Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(student.id, 'present')}
                      className={`flex-1 sm:flex-none min-w-[100px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isPresent
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 ring-2 ring-emerald-500/50'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>{t('attendance.present')}</span>
                    </button>

                    {/* Absent Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(student.id, 'absent')}
                      className={`flex-1 sm:flex-none min-w-[100px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        !isPresent
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20 ring-2 ring-rose-500/50'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                      }`}
                    >
                      <X className="w-4 h-4" />
                      <span>{t('attendance.absent')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Save Bar on Mobile */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-20 flex items-center justify-between gap-3 shadow-lg">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-bold uppercase">
            {presentCount} Present / {totalCount} Total
          </span>
          <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
            {percentage}% Attendance
          </span>
        </div>
        <button
          type="button"
          onClick={handleSaveAttendance}
          disabled={saving || loading || students.length === 0}
          className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-md shadow-teal-600/30 flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? t('attendance.saving') : t('attendance.saveAttendance')}</span>
        </button>
      </div>
    </div>
  );
};
