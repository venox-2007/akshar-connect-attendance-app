import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Edit2,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n';
import { dataService } from '../../services/dataService';
import { AttendanceRecord, ClassEntity, Student, AttendanceStatus } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../hooks/useToast';
import { formatDateDisplay, formatDateTimeDisplay } from '../../utils/dateUtils';
import { exportAttendanceToCsv } from '../../utils/exportCsv';

export const AttendanceHistoryPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { t } = useTranslation();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Filters
  const [filterClassId, setFilterClassId] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchStudent, setSearchStudent] = useState<string>('');

  // Edit record state
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editingStatus, setEditingStatus] = useState<AttendanceStatus>('present');
  const [editingNotes, setEditingNotes] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadHistoryData = async () => {
      setLoading(true);
      try {
        const [allClasses, allStudents, allAttendance] = await Promise.all([
          dataService.getClasses(),
          dataService.getStudents(),
          dataService.getAttendance()
        ]);

        if (!isMounted) return;

        // If teacher, restrict to their classes
        let visibleClasses = allClasses;
        if (!isAdmin && user?.teacherId) {
          visibleClasses = allClasses.filter(c => c.assignedTeacherId === user.teacherId);
        }

        setClasses(visibleClasses);
        setStudents(allStudents);
        setRecords(allAttendance);
      } catch (err: any) {
        toast.error(err?.message || 'Error loading attendance history');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadHistoryData();
    return () => {
      isMounted = false;
    };
  }, [user, isAdmin]);

  // Lookup maps
  const classMap = useMemo(() => new Map(classes.map(c => [c.id, c])), [classes]);
  const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  const visibleClassIds = useMemo(() => new Set(classes.map(c => c.id)), [classes]);

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      // Must be in visible classes (for teachers)
      if (!visibleClassIds.has(rec.classId)) return false;

      // Filter class
      if (filterClassId !== 'all' && rec.classId !== filterClassId) return false;

      // Filter date
      if (filterDate && rec.date !== filterDate) return false;

      // Filter status
      if (filterStatus !== 'all' && rec.status !== filterStatus) return false;

      // Filter student
      if (searchStudent.trim()) {
        const student = studentMap.get(rec.studentId);
        if (!student) return false;
        const q = searchStudent.toLowerCase();
        const matchesName = student.name.toLowerCase().includes(q);
        const matchesRoll = student.rollNumber.toLowerCase().includes(q);
        if (!matchesName && !matchesRoll) return false;
      }

      return true;
    });
  }, [records, visibleClassIds, filterClassId, filterDate, filterStatus, searchStudent, studentMap]);

  const handleOpenEdit = (rec: AttendanceRecord) => {
    setEditingRecord(rec);
    setEditingStatus(rec.status);
    setEditingNotes(rec.notes || '');
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    setSavingEdit(true);
    try {
      await dataService.saveAttendance(
        editingRecord.classId,
        editingRecord.date,
        [
          {
            studentId: editingRecord.studentId,
            status: editingStatus,
            notes: editingNotes
          }
        ],
        `${user?.name || 'Authorized User'} (Edited)`
      );

      // Refresh records
      const updated = await dataService.getAttendance();
      setRecords(updated);
      setEditingRecord(null);
      toast.success(t('attendance.savedSuccess'));
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update record');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleExportCsv = () => {
    const rows = filteredRecords.map(rec => {
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

    exportAttendanceToCsv(`Akshar_Attendance_History_${new Date().toISOString().split('T')[0]}`, rows);
    toast.success('Attendance history exported to CSV');
  };

  if (loading) return <LoadingSpinner message="Loading attendance history..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('history.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('history.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={filteredRecords.length === 0}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-colors flex items-center justify-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{t('reports.exportCsv')}</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-850 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Class filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {t('classes.name')}
            </label>
            <select
              value={filterClassId}
              onChange={e => setFilterClassId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="all">{t('history.filterClass')}</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {t('attendance.date')}
            </label>
            <div className="relative">
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              {filterDate && (
                <button
                  type="button"
                  onClick={() => setFilterDate('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {t('history.status')}
            </label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="all">{t('history.filterStatus')}</option>
              <option value="present">{t('attendance.present')}</option>
              <option value="absent">{t('attendance.absent')}</option>
            </select>
          </div>

          {/* Student name search */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {t('history.student')}
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchStudent}
                onChange={e => setSearchStudent(e.target.value)}
                placeholder={t('students.searchPlaceholder')}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Filter results info */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span>
            Showing <strong>{filteredRecords.length}</strong> matching records
          </span>
          {(filterClassId !== 'all' || filterDate || filterStatus !== 'all' || searchStudent) && (
            <button
              type="button"
              onClick={() => {
                setFilterClassId('all');
                setFilterDate('');
                setFilterStatus('all');
                setSearchStudent('');
              }}
              className="text-teal-600 dark:text-teal-400 font-semibold hover:underline"
            >
              {t('common.clear')} filters
            </button>
          )}
        </div>
      </div>

      {/* History Table */}
      {filteredRecords.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-500">
            {t('history.noRecords')}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">{t('attendance.date')}</th>
                  <th className="py-3 px-4">{t('history.student')}</th>
                  <th className="py-3 px-4">{t('classes.name')}</th>
                  <th className="py-3 px-4">{t('history.status')}</th>
                  <th className="py-3 px-4 hidden md:table-cell">{t('history.markedBy')}</th>
                  <th className="py-3 px-4 hidden lg:table-cell">{t('history.lastUpdated')}</th>
                  <th className="py-3 px-4 text-right">{t('teachers.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.map(rec => {
                  const student = studentMap.get(rec.studentId);
                  const cls = classMap.get(rec.classId);
                  const isPresent = rec.status === 'present';

                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                        {rec.date}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {student?.name || 'Unknown Student'}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {student?.rollNumber || rec.studentId}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {cls?.name || rec.classId}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {cls?.learningCenter}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isPresent
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {isPresent ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          <span>
                            {isPresent ? t('attendance.present') : t('attendance.absent')}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell text-slate-600 dark:text-slate-400">
                        {rec.markedBy}
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell text-slate-400 font-mono text-[11px]">
                        {formatDateTimeDisplay(rec.updatedAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(rec)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors"
                          title={t('history.editRecord')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Attendance Record Modal */}
      {editingRecord && (
        <Modal
          isOpen={!!editingRecord}
          onClose={() => setEditingRecord(null)}
          title={t('history.editRecord')}
          subtitle={`${studentMap.get(editingRecord.studentId)?.name} • ${editingRecord.date}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t('history.status')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEditingStatus('present')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    editingStatus === 'present'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('attendance.present')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStatus('absent')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    editingStatus === 'absent'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>{t('attendance.absent')}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Notes / Reason
              </label>
              <textarea
                value={editingNotes}
                onChange={e => setEditingNotes(e.target.value)}
                placeholder="Optional leave note or explanation..."
                rows={2}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                disabled={savingEdit}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {savingEdit ? 'Updating...' : t('common.save')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
