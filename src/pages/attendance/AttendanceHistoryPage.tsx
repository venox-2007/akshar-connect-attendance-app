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
import { Badge } from '../../components/common/Badge';
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
    <div className="space-y-4">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {t('history.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit logs and historical verification of student attendance sessions
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={filteredRecords.length === 0}
          className="px-3.5 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-teal-700" />
          <span>{t('reports.exportCsv')}</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Class filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
              {t('classes.name')}
            </label>
            <select
              value={filterClassId}
              onChange={e => setFilterClassId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-slate-900 text-xs font-medium focus:ring-1 focus:ring-teal-700 focus:border-teal-700 focus:outline-none"
            >
              <option value="all">{t('history.filterClass')}</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  Class {c.name} {c.grade ? `(${c.grade})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Date filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
              {t('attendance.date')}
            </label>
            <div className="relative">
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-slate-900 text-xs font-medium focus:ring-1 focus:ring-teal-700 focus:border-teal-700 focus:outline-none"
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
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
              {t('history.status')}
            </label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-slate-900 text-xs font-medium focus:ring-1 focus:ring-teal-700 focus:border-teal-700 focus:outline-none"
            >
              <option value="all">{t('history.filterStatus')}</option>
              <option value="present">{t('attendance.present')}</option>
              <option value="absent">{t('attendance.absent')}</option>
            </select>
          </div>

          {/* Student name search */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
              {t('history.student')}
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchStudent}
                onChange={e => setSearchStudent(e.target.value)}
                placeholder={t('students.searchPlaceholder')}
                className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-300 bg-white text-slate-900 text-xs placeholder:text-slate-400 focus:ring-1 focus:ring-teal-700 focus:border-teal-700 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Filter results info */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-900">{filteredRecords.length}</strong> matching records
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
              className="text-teal-700 font-medium hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* History Table */}
      {filteredRecords.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-lg border border-slate-200">
          <p className="text-xs font-semibold text-slate-500">
            {t('history.noRecords')}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-2.5 px-4 w-28">{t('attendance.date')}</th>
                  <th className="py-2.5 px-4">{t('history.student')}</th>
                  <th className="py-2.5 px-4 w-28">{t('classes.name')}</th>
                  <th className="py-2.5 px-4 text-center w-28">{t('history.status')}</th>
                  <th className="py-2.5 px-4 hidden md:table-cell">{t('history.markedBy')}</th>
                  <th className="py-2.5 px-4 hidden lg:table-cell w-36">{t('history.lastUpdated')}</th>
                  <th className="py-2.5 px-4 text-right w-16">{t('teachers.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRecords.map(rec => {
                  const student = studentMap.get(rec.studentId);
                  const cls = classMap.get(rec.classId);
                  const isPresent = rec.status === 'present';

                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-700">
                        {rec.date}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {student?.name || 'Unknown Student'}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {student?.rollNumber || rec.studentId}
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-slate-800">
                          {cls?.name || rec.classId}
                        </div>
                        {cls?.grade && (
                          <div className="text-[10px] text-slate-400">
                            {cls.grade}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <Badge variant={isPresent ? 'success' : 'danger'}>
                          {isPresent ? t('attendance.present') : t('attendance.absent')}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 hidden md:table-cell text-slate-600">
                        {rec.markedBy}
                      </td>
                      <td className="py-2.5 px-4 hidden lg:table-cell text-slate-500 font-mono text-[11px]">
                        {formatDateTimeDisplay(rec.updatedAt)}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(rec)}
                          className="p-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
                          title={t('history.editRecord')}
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-600" />
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('history.status')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEditingStatus('present')}
                  className={`py-1.5 px-3 rounded-md text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 ${
                    editingStatus === 'present'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t('attendance.present')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStatus('absent')}
                  className={`py-1.5 px-3 rounded-md text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 ${
                    editingStatus === 'absent'
                      ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{t('attendance.absent')}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notes / Reason
              </label>
              <textarea
                value={editingNotes}
                onChange={e => setEditingNotes(e.target.value)}
                placeholder="Optional leave note or explanation..."
                rows={2}
                className="w-full p-2.5 rounded-md border border-slate-300 bg-white text-xs text-slate-900 focus:ring-1 focus:ring-teal-700 focus:border-teal-700 focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                disabled={savingEdit}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-teal-700 hover:bg-teal-800 text-white shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition-colors"
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
