import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  Clock,
  CalendarCheck,
  Search
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import { dataService } from '../../services/dataService';
import { ClassEntity, Teacher } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { useToast } from '../../hooks/useToast';

export const ClassesPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('Class 3');
  const [assignedTeacherId, setAssignedTeacherId] = useState<string>('');
  const [schedule, setSchedule] = useState('Mon - Fri (09:00 AM - 01:00 PM)');

  // Delete Modal state
  const [classToDelete, setClassToDelete] = useState<ClassEntity | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      const [cList, tList] = await Promise.all([
        dataService.getClasses(),
        dataService.getTeachers()
      ]);
      setClasses(cList);
      setTeachers(tList);
    } catch (err: any) {
      toast.error(err?.message || 'Error loading classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredClasses = useMemo(() => {
    if (!searchQuery.trim()) return classes;
    const q = searchQuery.toLowerCase();
    return classes.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.grade.toLowerCase().includes(q) ||
        (c.assignedTeacherName && c.assignedTeacherName.toLowerCase().includes(q))
    );
  }, [classes, searchQuery]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentId(null);
    setName('');
    setGrade('Class 3');
    setAssignedTeacherId(teachers.length > 0 ? teachers[0].id : '');
    setSchedule('Mon - Fri (09:00 AM - 01:00 PM)');
    setModalOpen(true);
  };

  const handleOpenEdit = (cls: ClassEntity) => {
    setIsEditing(true);
    setCurrentId(cls.id);
    setName(cls.name);
    setGrade(cls.grade);
    setAssignedTeacherId(cls.assignedTeacherId || '');
    setSchedule(cls.schedule || 'Mon - Fri (09:00 AM - 01:00 PM)');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !grade.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && currentId) {
        await dataService.updateClass(currentId, {
          name: name.trim(),
          grade: grade.trim(),
          learningCenter: '',
          assignedTeacherId: assignedTeacherId || null,
          schedule: schedule.trim()
        });
        toast.success(t('classes.updatedSuccess'));
      } else {
        await dataService.createClass({
          name: name.trim(),
          grade: grade.trim(),
          learningCenter: '',
          assignedTeacherId: assignedTeacherId || null,
          assignedTeacherName: teachers.find(t => t.id === assignedTeacherId)?.name || null,
          schedule: schedule.trim()
        });
        toast.success(t('classes.createdSuccess'));
      }
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!classToDelete) return;
    setDeleting(true);
    try {
      await dataService.deleteClass(classToDelete.id);
      toast.success(t('classes.deletedSuccess'));
      setClassToDelete(null);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete class');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading classes..." />;

  return (
    <div className="space-y-4">
      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {t('classes.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Classroom roster management, teacher allocations, and operational schedules
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-3.5 py-2 rounded-md bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('classes.addClass')}</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search classes by name, grade, teacher..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredClasses.length} of {classes.length} Classes
        </div>
      </div>

      {/* Classes Data Table */}
      {filteredClasses.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-lg border border-slate-200">
          <p className="text-xs font-semibold text-slate-500">
            {t('classes.noClasses')}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-4 w-28">Class</th>
                  <th className="py-2.5 px-4 w-28">Grade</th>
                  <th className="py-2.5 px-4">Assigned Teacher</th>
                  <th className="py-2.5 px-4">Schedule</th>
                  <th className="py-2.5 px-4 text-right w-28">Enrolled</th>
                  <th className="py-2.5 px-4 text-right w-44">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredClasses.map(cls => (
                  <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Class Name */}
                    <td className="py-2.5 px-4">
                      <span className="font-bold text-slate-900 text-sm">
                        {cls.name}
                      </span>
                    </td>

                    {/* Grade */}
                    <td className="py-2.5 px-4">
                      <span className="text-xs px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {cls.grade}
                      </span>
                    </td>

                    {/* Assigned Teacher */}
                    <td className="py-2.5 px-4 font-medium text-slate-800">
                      {cls.assignedTeacherName ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                          <span>{cls.assignedTeacherName}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Schedule */}
                    <td className="py-2.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{cls.schedule || 'Regular schedule'}</span>
                      </div>
                    </td>

                    {/* Enrolled Students */}
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                      {cls.studentCount}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/attendance?classId=${cls.id}`)}
                          className="px-2 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-medium flex items-center gap-1 transition-colors"
                          title="Record or review attendance"
                        >
                          <CalendarCheck className="w-3 h-3" />
                          <span>Attendance</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cls)}
                          className="p-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
                          title={t('common.edit')}
                        >
                          <Edit className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setClassToDelete(cls)}
                          className="p-1 rounded border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Class Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={isEditing ? t('classes.editClass') : t('classes.addClass')}
          maxWidth="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('classes.name')} *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="e.g. 3-A"
                className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-teal-700 focus:border-teal-700 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('classes.grade')} *
                </label>
                <input
                  type="text"
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  required
                  placeholder="e.g. Class 3"
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-teal-700 focus:border-teal-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('classes.assignedTeacher')}
                </label>
                <select
                  value={assignedTeacherId}
                  onChange={e => setAssignedTeacherId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-teal-700 focus:border-teal-700 focus:outline-none"
                >
                  <option value="">{t('common.unassigned')}</option>
                  {teachers.map(tch => (
                    <option key={tch.id} value={tch.id}>
                      {tch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('classes.schedule')}
              </label>
              <input
                type="text"
                value={schedule}
                onChange={e => setSchedule(e.target.value)}
                placeholder="e.g. Mon - Fri (09:00 AM - 01:00 PM)"
                className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-teal-700 focus:border-teal-700 focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-teal-700 hover:bg-teal-800 text-white shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Saving...' : t('common.save')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {classToDelete && (
        <ConfirmModal
          isOpen={!!classToDelete}
          onClose={() => setClassToDelete(null)}
          onConfirm={handleConfirmDelete}
          title={t('classes.deleteConfirmTitle')}
          message={t('classes.deleteConfirmDesc', {
            name: classToDelete.name,
            count: classToDelete.studentCount
          })}
          isDestructive={true}
          isLoading={deleting}
        />
      )}
    </div>
  );
};
