import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { School, Users, CalendarCheck, Clock, MapPin } from 'lucide-react';
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t('nav.myClasses')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          View all educational batches assigned to you by Akshar Paaul.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {classes.map(cls => (
          <div
            key={cls.id}
            className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 mb-2">
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
                {cls.schedule && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{cls.schedule}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    <strong>{cls.studentCount}</strong> students enrolled
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleOpenRoster(cls)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                View Roster ({cls.studentCount})
              </button>
              <button
                type="button"
                onClick={() => navigate(`/teacher/attendance?classId=${cls.id}`)}
                className="flex-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>{t('dashboard.takeAttendanceBtn')}</span>
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
          title={`Class Roster - ${selectedClassForRoster.name}`}
          subtitle={`${selectedClassForRoster.grade} • ${rosterStudents.length} Students`}
          maxWidth="2xl"
        >
          {rosterLoading ? (
            <LoadingSpinner message="Loading roster..." />
          ) : (
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {rosterStudents.map((st, idx) => (
                <div key={st.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-slate-400 font-mono">{idx + 1}.</span>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{st.name}</p>
                      <p className="text-[11px] text-slate-400">Roll: {st.rollNumber} &bull; {st.guardianName}</p>
                    </div>
                  </div>
                  <span className="font-mono text-slate-500">{st.guardianPhone}</span>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
