import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { School, Users, CalendarCheck, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n';
import { dataService } from '../../services/dataService';
import { ClassEntity, Student } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';

export const MyClassesPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [selectedClassForRoster, setSelectedClassForRoster] = useState<ClassEntity | null>(null);
  const [rosterStudents, setRosterStudents] = useState<Student[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchClasses = async () => {
      if (!user?.teacherId) return;
      try {
        const data = await dataService.getTeacherDashboardData(user.teacherId);
        if (!isMounted) return;
        setClasses(data.classes);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchClasses();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleOpenRoster = async (cls: ClassEntity) => {
    setSelectedClassForRoster(cls);
    setRosterLoading(true);
    try {
      const students = await dataService.getStudents({ classId: cls.id });
      setRosterStudents(students);
    } catch (err) {
      console.error(err);
    } finally {
      setRosterLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading your classes..." />;

  return (
    <div className="space-y-4">
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          {t('nav.myClasses')}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Classrooms and student batches assigned to your educator account
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classes.map(cls => (
          <div
            key={cls.id}
            className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Class {cls.name}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {cls.grade}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {cls.studentCount} Students Enrolled
                  </p>
                </div>
                <div className="w-8 h-8 rounded-md bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
                  <School className="w-4 h-4" />
                </div>
              </div>

              <div className="my-3 space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">
                {cls.schedule && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{cls.schedule}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    Official enrollment roster active
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenRoster(cls)}
                className="flex-1 py-1.5 px-3 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
              >
                View Roster ({cls.studentCount})
              </button>
              <button
                type="button"
                onClick={() => navigate(`/teacher/attendance?classId=${cls.id}`)}
                className="flex-1 py-1.5 px-3 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>Take Attendance</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Roster Modal */}
      {selectedClassForRoster && (
        <Modal
          isOpen={!!selectedClassForRoster}
          onClose={() => setSelectedClassForRoster(null)}
          title={`Class Roster — Class ${selectedClassForRoster.name}`}
          subtitle={`${selectedClassForRoster.grade} • ${rosterStudents.length} Students Enrolled`}
          maxWidth="2xl"
        >
          {rosterLoading ? (
            <LoadingSpinner message="Loading roster..." />
          ) : rosterStudents.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">
              No students enrolled in this class roster.
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-md">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-2 px-3 w-10 text-center">#</th>
                    <th className="py-2 px-3 w-24">Roll No</th>
                    <th className="py-2 px-3">Student Name</th>
                    <th className="py-2 px-3 w-16">Gender</th>
                    <th className="py-2 px-3">Guardian</th>
                    <th className="py-2 px-3 w-32">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rosterStudents.map((st, idx) => (
                    <tr key={st.id} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 font-mono font-medium text-slate-700">
                        {st.rollNumber}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900">
                        {st.name}
                      </td>
                      <td className="py-2 px-3 capitalize text-slate-600">
                        {st.gender}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {st.guardianName || '—'}
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                        {st.guardianPhone || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
