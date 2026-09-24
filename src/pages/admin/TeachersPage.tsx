import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  Search,
  Phone,
  Mail,
  School,
  CheckCircle,
  XCircle,
  X
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import { dataService } from '../../services/dataService';
import { Teacher, ClassEntity } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../hooks/useToast';

export const TeachersPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [qualification, setQualification] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  // Delete Modal state
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      const [tList, cList] = await Promise.all([
        dataService.getTeachers(),
        dataService.getClasses()
      ]);
      setTeachers(tList);
      setClasses(cList);
    } catch (err: any) {
      toast.error(err?.message || 'Error loading teachers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const classMap = useMemo(() => new Map(classes.map(c => [c.id, c])), [classes]);

  const filteredTeachers = useMemo(() => {
    if (!searchQuery.trim()) return teachers;
    const q = searchQuery.toLowerCase();
    return teachers.filter(
      t =>
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.phone.includes(q) ||
        (t.qualification && t.qualification.toLowerCase().includes(q))
    );
  }, [teachers, searchQuery]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentId(null);
    setName('');
    setEmail('');
    setPhone('');
    setQualification('');
    setStatus('active');
    setSelectedClassIds([]);
    setModalOpen(true);
  };

  const handleOpenEdit = (teacher: Teacher) => {
    setIsEditing(true);
    setCurrentId(teacher.id);
    setName(teacher.name);
    setEmail(teacher.email);
    setPhone(teacher.phone);
    setQualification(teacher.qualification || '');
    setStatus(teacher.status);
    setSelectedClassIds(teacher.assignedClassIds || []);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error('Please complete all required fields');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && currentId) {
        await dataService.updateTeacher(currentId, {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          qualification: qualification.trim(),
          status,
          assignedClassIds: selectedClassIds
        });
        toast.success(t('teachers.updatedSuccess'));
      } else {
        await dataService.createTeacher({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          qualification: qualification.trim(),
          status,
          assignedClassIds: selectedClassIds,
          joinedDate: new Date().toISOString().split('T')[0]
        });
        toast.success(t('teachers.createdSuccess'));
      }
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save teacher');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!teacherToDelete) return;
    setDeleting(true);
    try {
      await dataService.deleteTeacher(teacherToDelete.id);
      toast.success(t('teachers.deletedSuccess'));
      setTeacherToDelete(null);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete teacher');
    } finally {
      setDeleting(false);
    }
  };

  const toggleClassSelection = (clsId: string) => {
    setSelectedClassIds(prev =>
      prev.includes(clsId) ? prev.filter(id => id !== clsId) : [...prev, clsId]
    );
  };

  if (loading) return <LoadingSpinner message="Loading teachers..." />;

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('teachers.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('teachers.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('teachers.addTeacher')}</span>
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
            placeholder="Search teachers by name, email, phone..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold">
          {filteredTeachers.length} Teachers
        </div>
      </div>

      {/* Teachers Cards Grid */}
      {filteredTeachers.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-500">
            {t('teachers.noTeachers')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTeachers.map(teacher => (
            <div
              key={teacher.id}
              className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:border-teal-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-sm shrink-0">
                      {teacher.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {teacher.name}
                      </h3>
                      <p className="text-xs text-slate-400">{teacher.qualification || 'Educator'}</p>
                    </div>
                  </div>
                  <Badge variant={teacher.status === 'active' ? 'success' : 'neutral'}>
                    {teacher.status === 'active' ? t('common.active') : t('common.inactive')}
                  </Badge>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-[11px]">{teacher.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{teacher.phone}</span>
                  </div>
                </div>

                {/* Assigned Classes tags */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    {t('teachers.assignedClasses')}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {teacher.assignedClassIds && teacher.assignedClassIds.length > 0 ? (
                      teacher.assignedClassIds.map(clsId => {
                        const cls = classMap.get(clsId);
                        return (
                          <span
                            key={clsId}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                          >
                            <School className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                            <span>{cls?.name || clsId}</span>
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        {t('common.unassigned')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(teacher)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5 text-teal-600" />
                  <span>{t('common.edit')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTeacherToDelete(teacher)}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('common.delete')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Teacher Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={isEditing ? t('teachers.editTeacher') : t('teachers.addTeacher')}
          maxWidth="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('teachers.name')} *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="e.g. Suman Deshmukh"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('teachers.email')} *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="suman.deshmukh@aksharpaaul.org"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('teachers.phone')} *
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  placeholder="+91 98205 11223"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('teachers.qualification')}
                </label>
                <input
                  type="text"
                  value={qualification}
                  onChange={e => setQualification(e.target.value)}
                  placeholder="e.g. B.Ed, MA English"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('teachers.status')}
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="active">{t('common.active')}</option>
                  <option value="inactive">{t('common.inactive')}</option>
                </select>
              </div>
            </div>

            {/* Assign Classes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('teachers.assignedClasses')}
              </label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                {classes.map(cls => (
                  <label
                    key={cls.id}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selectedClassIds.includes(cls.id)}
                      onChange={() => toggleClassSelection(cls.id)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {cls.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({cls.learningCenter})
                    </span>
                  </label>
                ))}
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
      {teacherToDelete && (
        <ConfirmModal
          isOpen={!!teacherToDelete}
          onClose={() => setTeacherToDelete(null)}
          onConfirm={handleConfirmDelete}
          title={t('teachers.deleteConfirmTitle')}
          message={t('teachers.deleteConfirmDesc', { name: teacherToDelete.name })}
          isDestructive={true}
          isLoading={deleting}
        />
      )}
    </div>
  );
};
