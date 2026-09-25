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
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      {/* Left: Mobile burger + Brand logo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden p-1.5 rounded-md text-slate-600 hover:bg-slate-100 focus:outline-none"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Logo size="sm" showSubtitle={false} className="sm:hidden" />
        <Logo size="md" showSubtitle={true} className="hidden sm:flex" />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Language Selector */}
        <LanguageSelector />

        {/* User profile tag */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                {user.name}
              </span>
              <span className="text-[10px] text-slate-500">
                {role === 'ADMIN' ? t('roles.ADMIN') : t('roles.TEACHER')}
              </span>
            </div>
            <div className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
              {role === 'ADMIN' ? <Shield className="w-3.5 h-3.5 text-slate-700" /> : <GraduationCap className="w-3.5 h-3.5 text-slate-700" />}
            </div>

            {/* Sign out */}
            <button
              type="button"
              onClick={logout}
              title={t('nav.logout')}
              className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors"
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
