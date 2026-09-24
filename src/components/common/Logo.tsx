import React from 'react';
import { useTranslation } from '../../i18n';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  stacked?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = true,
  stacked = false,
  className = ''
}) => {
  const { t } = useTranslation();

  const imgContainerSizes = {
    sm: 'w-8 h-8 p-0.5',
    md: 'w-11 h-11 p-1',
    lg: 'w-16 h-16 p-1.5',
    xl: 'w-24 h-24 p-2'
  };

  const titleSizes = {
    sm: 'text-sm font-bold tracking-tight',
    md: 'text-lg font-bold tracking-tight',
    lg: 'text-2xl font-black tracking-tight',
    xl: 'text-3xl font-black tracking-tight'
  };

  const subtitleSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base'
  };

  const orgSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-sm'
  };

  if (stacked) {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        {/* Official Akshar Paaul Logo Image */}
        <div className={`${imgContainerSizes[size]} bg-white rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center shrink-0 mb-3`}>
          <img
            src="/logo.png"
            alt="Akshar Paaul Logo"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Product & Org Hierarchy */}
        <div>
          <h1 className={`${titleSizes[size]} text-slate-900 dark:text-white leading-tight font-extrabold`}>
            {t('brand.name')}
          </h1>
          {showSubtitle && (
            <p className={`${subtitleSizes[size]} font-semibold text-teal-600 dark:text-teal-400 mt-0.5`}>
              {t('brand.subtitle')}
            </p>
          )}
          <p className={`${orgSizes[size]} text-slate-500 dark:text-slate-400 font-medium mt-0.5`}>
            {t('brand.ngo')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Official Akshar Paaul Logo Image */}
      <div className={`${imgContainerSizes[size]} bg-white rounded-xl shadow-xs border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center shrink-0`}>
        <img
          src="/logo.png"
          alt="Akshar Paaul Logo"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Brand Text Hierarchy */}
      <div className="flex flex-col">
        <span className={`${titleSizes[size]} text-slate-900 dark:text-white leading-tight font-extrabold`}>
          {t('brand.name')}
        </span>
        {showSubtitle && (
          <span className={`${subtitleSizes[size]} font-semibold text-teal-600 dark:text-teal-400 leading-tight`}>
            {t('brand.subtitle')}
          </span>
        )}
        <span className={`${orgSizes[size]} text-slate-500 dark:text-slate-400 font-medium leading-tight`}>
          {t('brand.ngo')}
        </span>
      </div>
    </div>
  );
};
