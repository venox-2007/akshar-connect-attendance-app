import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ConfirmModal } from '../common/ConfirmModal';
import { useTranslation } from '../../i18n';
import { dataService } from '../../services/dataService';
import { useToast } from '../../hooks/useToast';

export const AppLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();

  const handleDataReset = () => {
    setResetKey(k => k + 1);
  };

  const executeReset = async () => {
    setIsResetting(true);
    try {
      dataService.resetData();
      toast.success(t('common.resetSuccess'));
      setResetModalOpen(false);
      setResetKey(k => k + 1);
      navigate(0); // reload current route cleanly
    } catch (e: any) {
      toast.error(e?.message || 'Failed to reset demo data');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
        onDataReset={handleDataReset}
      />

      <div className="flex flex-1">
        {/* Role-based Sidebar */}
        <Sidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          onResetDataRequest={() => setResetModalOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 md:pl-64 flex flex-col min-w-0 transition-all duration-300">
          <div className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl mx-auto w-full">
            <Outlet key={resetKey} />
          </div>
        </main>
      </div>

      <ConfirmModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={executeReset}
        title={t('common.resetConfirmTitle')}
        message={t('common.resetConfirmDesc')}
        confirmText={t('common.resetDemo')}
        isDestructive={false}
        isLoading={isResetting}
      />
    </div>
  );
};
