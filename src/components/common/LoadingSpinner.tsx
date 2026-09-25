import React from 'react';
import { useTranslation } from '../../i18n';

export const LoadingSpinner: React.FC<{ message?: string; className?: string }> = ({
  message,
  className = ''
}) => {
  const { t } = useTranslation();
  return (
    <div className={`flex flex-col items-center justify-center p-8 gap-3 text-slate-500 ${className}`}>
      <div className="relative">
        <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-teal-700 animate-spin" />
      </div>
      <p className="text-xs font-medium text-slate-600">{message || t('common.loading')}</p>
    </div>
  );
};
