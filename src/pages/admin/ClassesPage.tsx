import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  School,
  Plus,
  Edit,
  Trash2,
  Users,
  MapPin,
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
  const [grade, setGrade] = useState('Standard 3');
  const [learningCenter, setLearningCenter] = useState('Dharavi Community Center');
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
        c.learningCenter.toLowerCase().includes(q) ||
        c.grade.toLowerCase().includes(q) ||
        (c.assignedTeacherName && c.assignedTeacherName.toLowerCase().includes(q))
    );
  }, [classes, searchQuery]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentId(null);
    setName('');
    setGrade('Standard 3');
    setLearningCenter('Dharavi Community Center');
    setAssignedTeacherId(teachers.length > 0 ? teachers[0].id : '');
    setSchedule('Mon - Fri (09:00 AM - 01:00 PM)');
    setModalOpen(true);
  };

  const handleOpenEdit = (cls: ClassEntity) => {
    setIsEditing(true);
    setCurrentId(cls.id);
    setName(cls.name);
    setGrade(cls.grade);
    setLearningCenter(cls.learningCenter);
    setAssignedTeacherId(cls.assignedTeacherId || '');
    setSchedule(cls.schedule || 'Mon - Fri (09:00 AM - 01:00 PM)');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !grade.trim() || !learningCenter.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && currentId) {
        await dataService.updateClass(currentId, {
          name: name.trim(),
          grade: grade.trim(),
          learningCenter: learningCenter.trim(),
          assignedTeacherId: assignedTeacherId || null,
          schedule: schedule.trim()
        });
        toast.success(t('classes.updatedSuccess'));
      } else {
        await dataService.createClass({
          name: name.trim(),
          grade: grade.trim(),
          learningCenter: learningCenter.trim(),
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
    <div className="space-y-6">
      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('classes.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('classes.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('classes.addClass')}</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white dark:bg-slate-850 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search classes by name, center, grade..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold">
          {filteredClasses.length} Classes
        </div>
      </div>

      {/* Classes Cards Grid */}
      {filteredClasses.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-500">
            {t('classes.noClasses')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClasses.map(cls => (
            <div
              key={cls.id}
              className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:border-teal-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 mb-2">
                      {cls.grade}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {cls.name}
                    </h3>
                  </div>
                  <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
                    <School className="w-6 h-6" />
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{cls.learningCenter}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{cls.schedule || 'Regular schedule'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      Teacher:{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {cls.assignedTeacherName || t('common.unassigned')}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Enrolled Students Counter Badge */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {t('classes.studentsCount')}:
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                    {cls.studentCount} Students
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/admin/attendance?classId=${cls.id}`)}
                  className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>{t('attendance.title')}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(cls)}
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title={t('common.edit')}
                  >
                    <Edit className="w-4 h-4 text-teal-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassToDelete(cls)}
                    className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title={t('common.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('classes.name')} *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="e.g. Vikas Standard 3"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('classes.grade')} *
                </label>
                <input
                  type="text"
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  required
                  placeholder="e.g. Standard 3"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('classes.assignedTeacher')}
                </label>
                <select
                  value={assignedTeacherId}
                  onChange={e => setAssignedTeacherId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('classes.center')} *
              </label>
              <input
                type="text"
                value={learningCenter}
                onChange={e => setLearningCenter(e.target.value)}
                required
                placeholder="e.g. Dharavi Community Center"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('classes.schedule')}
              </label>
              <input
                type="text"
                value={schedule}
                onChange={e => setSchedule(e.target.value)}
                placeholder="e.g. Mon - Fri (09:00 AM - 01:00 PM)"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
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
