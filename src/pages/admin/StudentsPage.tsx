import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Phone,
  School,
  X
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import { dataService } from '../../services/dataService';
import { Student, ClassEntity, Gender, UserStatus } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../hooks/useToast';

export const StudentsPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);

  // Filter & Search
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [classId, setClassId] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [dob, setDob] = useState('2015-05-15');
  const [status, setStatus] = useState<UserStatus>('active');

  // Delete Modal state
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      const [sList, cList] = await Promise.all([
        dataService.getStudents(),
        dataService.getClasses()
      ]);
      setStudents(sList);
      setClasses(cList);
      if (cList.length > 0 && !classId) {
        setClassId(cList[0].id);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error loading students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const classMap = useMemo(() => new Map(classes.map(c => [c.id, c])), [classes]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (selectedClassFilter !== 'all' && s.classId !== selectedClassFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesRoll = s.rollNumber.toLowerCase().includes(q);
        const matchesGuardian = s.guardianName ? s.guardianName.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesRoll && !matchesGuardian) {
          return false;
        }
      }
      return true;
    });
  }, [students, selectedClassFilter, searchQuery]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentId(null);
    setName('');
    const defaultCls = classes[0];
    const prefix = defaultCls?.name ? defaultCls.name.replace(/[^a-zA-Z0-9]/g, '') : '3A';
    setRollNumber(`${prefix}-${String(students.length + 1).padStart(2, '0')}`);
    setClassId(defaultCls ? defaultCls.id : '');
    setGender('male');
    setGuardianName('');
    setGuardianPhone('+91 98');
    setDob('2015-05-15');
    setStatus('active');
    setModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setIsEditing(true);
    setCurrentId(student.id);
    setName(student.name);
    setRollNumber(student.rollNumber);
    setClassId(student.classId);
    setGender(student.gender);
    setGuardianName(student.guardianName || '');
    setGuardianPhone(student.guardianPhone || '');
    setDob(student.dob || '');
    setStatus(student.status);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !rollNumber.trim() || !classId) {
      toast.error('Please enter name, roll number, and class');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && currentId) {
        await dataService.updateStudent(currentId, {
          name: name.trim(),
          rollNumber: rollNumber.trim(),
          classId,
          gender,
          guardianName: guardianName.trim(),
          guardianPhone: guardianPhone.trim(),
          dob,
          status
        });
        toast.success(t('students.updatedSuccess'));
      } else {
        await dataService.createStudent({
          name: name.trim(),
          rollNumber: rollNumber.trim(),
          classId,
          gender,
          guardianName: guardianName.trim(),
          guardianPhone: guardianPhone.trim(),
          dob,
          status
        });
        toast.success(t('students.createdSuccess'));
      }
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    setDeleting(true);
    try {
      await dataService.deleteStudent(studentToDelete.id);
      toast.success(t('students.deletedSuccess'));
      setStudentToDelete(null);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete student');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading student directory..." />;

  return (
    <div className="space-y-6">
      {/* Title & Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('students.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('students.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('students.addStudent')}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-850 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Class Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedClassFilter}
            onChange={e => setSelectedClassFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
          >
            <option value="all">{t('students.allClasses')}</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.grade})
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('students.searchPlaceholder')}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs font-semibold text-slate-500 text-right">
          {filteredStudents.length} of {students.length} Enrolled
        </div>
      </div>

      {/* Students Table */}
      {filteredStudents.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-500">
            {t('students.noStudents')}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">{t('students.rollNo')}</th>
                  <th className="py-3 px-4">{t('students.name')}</th>
                  <th className="py-3 px-4">{t('students.class')}</th>
                  <th className="py-3 px-4 hidden md:table-cell">{t('students.gender')}</th>
                  <th className="py-3 px-4 hidden lg:table-cell">{t('students.guardianName')}</th>
                  <th className="py-3 px-4 hidden sm:table-cell">{t('students.guardianPhone')}</th>
                  <th className="py-3 px-4">{t('students.status')}</th>
                  <th className="py-3 px-4 text-right">{t('teachers.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map(student => {
                  const cls = classMap.get(student.classId);
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {student.rollNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {student.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {cls?.name || student.classId}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {cls?.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell capitalize text-slate-600 dark:text-slate-400">
                        {student.gender}
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell text-slate-600 dark:text-slate-400">
                        {student.guardianName || '-'}
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell font-mono text-[11px] text-slate-500">
                        {student.guardianPhone || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={student.status === 'active' ? 'success' : 'neutral'} size="sm">
                          {student.status === 'active' ? t('common.active') : t('common.inactive')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(student)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors"
                            title={t('common.edit')}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setStudentToDelete(student)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title={t('common.delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={isEditing ? t('students.editStudent') : t('students.addStudent')}
          maxWidth="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('students.name')} *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="e.g. Aarav Patil"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('students.rollNo')} *
                </label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={e => setRollNumber(e.target.value)}
                  required
                  placeholder="e.g. 3A-31"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('students.class')} *
                </label>
                <select
                  value={classId}
                  onChange={e => setClassId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.grade})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('students.gender')}
                </label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value as Gender)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="male">{t('common.male')}</option>
                  <option value="female">{t('common.female')}</option>
                  <option value="other">{t('common.other')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('students.status')}
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as UserStatus)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="active">{t('common.active')}</option>
                  <option value="inactive">{t('common.inactive')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('students.guardianName')}
                </label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={e => setGuardianName(e.target.value)}
                  placeholder="e.g. Sunita Patil (Mother)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('students.guardianPhone')}
                </label>
                <input
                  type="text"
                  value={guardianPhone}
                  onChange={e => setGuardianPhone(e.target.value)}
                  placeholder="+91 97654 11223"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : t('common.save')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
        <ConfirmModal
          isOpen={!!studentToDelete}
          onClose={() => setStudentToDelete(null)}
          onConfirm={handleConfirmDelete}
          title={t('students.deleteConfirmTitle')}
          message={t('students.deleteConfirmDesc', {
            name: studentToDelete.name,
            roll: studentToDelete.rollNumber
          })}
          isDestructive={true}
          isLoading={deleting}
        />
      )}
    </div>
  );
};
