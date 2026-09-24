import React from 'react';
import { Menu, LogOut, Shield, GraduationCap } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n';
import { Logo } from '../common/Logo';
import { LanguageSelector } from '../common/LanguageSelector';

interface NavbarProps {
  onToggleMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
  const { user, role, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-6">
      {/* Left: Mobile burger + Brand logo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-none"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Logo size="sm" showSubtitle={false} className="sm:hidden" />
        <Logo size="md" showSubtitle={true} className="hidden sm:flex" />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language Selector */}
        <LanguageSelector />

        {/* User profile tag */}
        {user && (
          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xs ring-1 ring-teal-200 dark:ring-teal-800">
              {role === 'ADMIN' ? <Shield className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                {user.name}
              </span>
              <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400">
                {role === 'ADMIN' ? t('roles.ADMIN') : t('roles.TEACHER')}
              </span>
            </div>

            {/* Sign out */}
            <button
              type="button"
              onClick={logout}
              title={t('nav.logout')}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
