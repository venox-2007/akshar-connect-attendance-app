import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  School,
  CalendarCheck,
  BarChart3,
  Clock
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n';
import { Logo } from '../common/Logo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavGroup {
  label: string;
  items: {
    to: string;
    icon: React.ElementType;
    label: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { role, user } = useAuth();
  const { t } = useTranslation();

  const adminGroups: NavGroup[] = [
    {
      label: 'OVERVIEW',
      items: [
        { to: '/admin/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
      ]
    },
    {
      label: 'ATTENDANCE',
      items: [
        { to: '/admin/attendance', icon: CalendarCheck, label: t('nav.attendance') },
        { to: '/admin/history', icon: Clock, label: t('nav.history') },
      ]
    },
    {
      label: 'MANAGEMENT',
      items: [
        { to: '/admin/students', icon: Users, label: t('nav.students') },
        { to: '/admin/classes', icon: School, label: t('nav.classes') },
        { to: '/admin/teachers', icon: GraduationCap, label: t('nav.teachers') },
      ]
    },
    {
      label: 'REPORTS',
      items: [
        { to: '/admin/reports', icon: BarChart3, label: t('nav.reports') },
      ]
    }
  ];

  const teacherGroups: NavGroup[] = [
    {
      label: 'OVERVIEW',
      items: [
        { to: '/teacher/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
      ]
    },
    {
      label: 'ATTENDANCE',
      items: [
        { to: '/teacher/attendance', icon: CalendarCheck, label: t('nav.takeAttendance') },
        { to: '/teacher/history', icon: Clock, label: t('nav.history') },
      ]
    },
    {
      label: 'MANAGEMENT',
      items: [
        { to: '/teacher/classes', icon: School, label: t('nav.myClasses') },
      ]
    }
  ];

  const groups = role === 'ADMIN' ? adminGroups : teacherGroups;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-60 border-r border-slate-200 bg-white pt-14 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="py-4 overflow-y-auto flex-1 space-y-6">
          {/* Mobile-only logo view at top of drawer */}
          <div className="md:hidden px-4 pb-3 border-b border-slate-200">
            <Logo size="sm" showSubtitle={true} />
          </div>

          {/* Current User Info */}
          <div className="px-4 pb-2 border-b border-slate-100">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Signed in as
            </p>
            <p className="text-xs font-semibold text-slate-800 truncate mt-0.5">
              {user?.name}
            </p>
            <span className="inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              {role === 'ADMIN' ? 'Administrator' : 'Teacher'}
            </span>
          </div>

          {/* Navigation Groups */}
          <div className="space-y-5 px-2">
            {groups.map(group => (
              <div key={group.label}>
                <div className="px-3 mb-1 text-[10px] font-semibold text-slate-400 tracking-wider">
                  {group.label}
                </div>
                <nav className="space-y-0.5">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => onClose()}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3 py-2 text-xs transition-colors rounded-md border-l-2 ${
                            isActive
                              ? 'bg-teal-50 text-teal-800 font-semibold border-teal-700'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent font-medium'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 shrink-0 text-slate-500" />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info in sidebar */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50">
          <div className="text-[11px] font-medium text-slate-600">
            Akshar Paaul NGO
          </div>
          <div className="text-[10px] text-slate-400">
            Attendance Register System
          </div>
        </div>
      </aside>
    </>
  );
};
