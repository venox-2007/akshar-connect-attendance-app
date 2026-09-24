import React, { useState } from 'react';
import { Menu, LogOut, RotateCcw, User as UserIcon, Shield, GraduationCap } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n';
import { Logo } from '../common/Logo';
import { ThemeToggle } from '../common/ThemeToggle';
import { LanguageSelector } from '../common/LanguageSelector';
import { ConfirmModal } from '../common/ConfirmModal';
import { dataService } from '../../services/dataService';
import { useToast } from '../../hooks/useToast';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  onDataReset?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu, onDataReset }) => {
  const { user, role, logout } = useAuth();
  const { t } = useTranslation();
  const toast = useToast();
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      dataService.resetData();
      toast.success(t('common.resetSuccess'));
      setShowResetModal(false);
      if (onDataReset) {
        onDataReset();
      } else {
        window.location.reload();
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to reset demo data');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 sm:px-6">
        {/* Left: Mobile burger + Brand logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Logo size="sm" showSubtitle={false} className="sm:hidden" />
          <Logo size="md" showSubtitle={true} className="hidden sm:flex" />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Reset Demo Data Button */}
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            title={t('common.resetDemo')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t('common.resetDemo')}</span>
          </button>

          {/* Language Selector */}
          <LanguageSelector />

          {/* Theme Toggle */}
          <ThemeToggle />

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

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleResetData}
        title={t('common.resetConfirmTitle')}
        message={t('common.resetConfirmDesc')}
        confirmText={t('common.resetDemo')}
        isDestructive={false}
        isLoading={isResetting}
      />
    </>
  );
};
