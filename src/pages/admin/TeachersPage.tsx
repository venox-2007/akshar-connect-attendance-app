import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Phone,
  Mail,
  School
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
    <div className="space-y-4">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {t('teachers.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Educator directory, credentials, contact details, and class assignments
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-3.5 py-2 rounded-md bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('teachers.addTeacher')}</span>
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
            placeholder="Search teachers by name, email, phone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredTeachers.length} of {teachers.length} Teachers
        </div>
      </div>

      {/* Teachers Data Table */}
      {filteredTeachers.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-lg border border-slate-200">
          <p className="text-xs font-semibold text-slate-500">
            {t('teachers.noTeachers')}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-4">Teacher Name</th>
                  <th className="py-2.5 px-4">Contact Information</th>
                  <th className="py-2.5 px-4">Assigned Classes</th>
                  <th className="py-2.5 px-4 text-center w-28">Status</th>
                  <th className="py-2.5 px-4 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTeachers.map(teacher => (
                  <tr key={teacher.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Teacher Name & Qualification */}
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {teacher.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {teacher.qualification || 'Educator'}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700 font-mono text-[11px]">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{teacher.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 mt-0.5 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{teacher.phone}</span>
                      </div>
                    </td>

                    {/* Assigned Classes */}
                    <td className="py-2.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {teacher.assignedClassIds && teacher.assignedClassIds.length > 0 ? (
                          teacher.assignedClassIds.map(clsId => {
                            const cls = classMap.get(clsId);
                            return (
                              <span
                                key={clsId}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-teal-50 text-teal-800 border border-teal-200"
                              >
                                <School className="w-3 h-3 text-teal-700" />
                                <span>{cls?.name || clsId}</span>
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-slate-400 italic">No classes assigned</span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-4 text-center">
                      <Badge variant={teacher.status === 'active' ? 'success' : 'neutral'}>
                        {teacher.status === 'active' ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(teacher)}
                          className="p-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
                          title={t('common.edit')}
                        >
                          <Edit className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setTeacherToDelete(teacher)}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('teachers.name')} *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="e.g. Suman Deshmukh"
                className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-teal-700 focus:border-teal-700 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('teachers.email')} *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="suman.deshmukh@aksharpaaul.org"
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-teal-700 focus:border-teal-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('teachers.phone')} *
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  placeholder="+91 98205 11223"
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-teal-700 focus:border-teal-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('teachers.qualification')}
                </label>
                <input
                  type="text"
                  value={qualification}
                  onChange={e => setQualification(e.target.value)}
                  placeholder="e.g. B.Ed, MA English"
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-teal-700 focus:border-teal-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('teachers.status')}
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-teal-700 focus:border-teal-700 focus:outline-none"
                >
                  <option value="active">{t('common.active')}</option>
                  <option value="inactive">{t('common.inactive')}</option>
                </select>
              </div>
            </div>

            {/* Assign Classes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('teachers.assignedClasses')}
              </label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 rounded-md border border-slate-300 bg-white">
                {classes.map(cls => (
                  <label
                    key={cls.id}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selectedClassIds.includes(cls.id)}
                      onChange={() => toggleClassSelection(cls.id)}
                      className="rounded text-teal-700 focus:ring-teal-700"
                    />
                    <span className="font-semibold text-slate-900">
                      Class {cls.name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      ({cls.grade})
                    </span>
                  </label>
                ))}
              </div>
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
