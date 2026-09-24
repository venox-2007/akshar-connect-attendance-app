import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  School,
  CalendarCheck,
  BarChart3,
  Clock,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { role, user } = useAuth();
  const { t } = useTranslation();

  const adminNavItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/admin/teachers', icon: GraduationCap, label: t('nav.teachers') },
    { to: '/admin/classes', icon: School, label: t('nav.classes') },
    { to: '/admin/students', icon: Users, label: t('nav.students') },
    { to: '/admin/attendance', icon: CalendarCheck, label: t('nav.attendance') },
    { to: '/admin/history', icon: Clock, label: t('nav.history') },
    { to: '/admin/reports', icon: BarChart3, label: t('nav.reports') },
  ];

  const teacherNavItems = [
    { to: '/teacher/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/teacher/classes', icon: School, label: t('nav.myClasses') },
    { to: '/teacher/attendance', icon: CalendarCheck, label: t('nav.takeAttendance') },
    { to: '/teacher/history', icon: Clock, label: t('nav.history') },
  ];

  const navItems = role === 'ADMIN' ? adminNavItems : teacherNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 pt-16 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-4 py-6 overflow-y-auto flex-1 space-y-6">
          {/* User badge */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/20 border border-teal-100 dark:border-teal-900/50">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('dashboard.welcome')}
            </p>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate mt-0.5">
              {user?.name}
            </h4>
            <div className="mt-2 flex items-center justify-between">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-600 text-white shadow-xs">
                {role === 'ADMIN' ? t('roles.ADMIN') : t('roles.TEACHER')}
              </span>
              <span className="text-[10px] text-teal-700 dark:text-teal-300 font-medium">
                Akshar Paaul
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20 font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-teal-500 shrink-0" />
            <span className="text-[11px] leading-tight">
              {t('brand.motto')}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
