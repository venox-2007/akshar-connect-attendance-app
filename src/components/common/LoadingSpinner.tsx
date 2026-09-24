import React from 'react';
import { useTranslation } from '../../i18n';

export const LoadingSpinner: React.FC<{ message?: string; className?: string }> = ({
  message,
  className = ''
}) => {
  const { t } = useTranslation();
  return (
    <div className={`flex flex-col items-center justify-center p-8 gap-3 text-slate-500 dark:text-slate-400 ${className}`}>
      <div className="relative">
        <div className="w-10 h-10 rounded-full border-2 border-teal-200 dark:border-teal-900 border-t-teal-600 dark:border-t-teal-400 animate-spin" />
      </div>
      <p className="text-xs font-medium">{message || t('common.loading')}</p>
    </div>
  );
};
