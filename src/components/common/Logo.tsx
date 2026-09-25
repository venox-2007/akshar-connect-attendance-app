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
    sm: 'w-7 h-7 p-0.5',
    md: 'w-9 h-9 p-0.5',
    lg: 'w-14 h-14 p-1',
    xl: 'w-20 h-20 p-1.5'
  };

  const titleSizes = {
    sm: 'text-sm font-bold tracking-tight',
    md: 'text-base font-bold tracking-tight',
    lg: 'text-xl font-bold tracking-tight',
    xl: 'text-2xl font-bold tracking-tight'
  };

  const subtitleSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-xs',
    xl: 'text-sm'
  };

  const orgSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs',
    xl: 'text-xs'
  };

  if (stacked) {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        {/* Official Akshar Paaul Logo Image */}
        <div className={`${imgContainerSizes[size]} bg-white rounded-md border border-slate-200 flex items-center justify-center shrink-0 mb-2.5`}>
          <img
            src="/logo.png"
            alt="Akshar Paaul Logo"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Product & Org Hierarchy */}
        <div>
          <h1 className={`${titleSizes[size]} text-slate-900 leading-tight`}>
            {t('brand.name')}
          </h1>
          {showSubtitle && (
            <p className={`${subtitleSizes[size]} font-medium text-teal-700 mt-0.5`}>
              {t('brand.subtitle')}
            </p>
          )}
          <p className={`${orgSizes[size]} text-slate-500 mt-0.5`}>
            {t('brand.ngo')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Official Akshar Paaul Logo Image */}
      <div className={`${imgContainerSizes[size]} bg-white rounded-md border border-slate-200 flex items-center justify-center shrink-0`}>
        <img
          src="/logo.png"
          alt="Akshar Paaul Logo"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Brand Text Hierarchy */}
      <div className="flex flex-col">
        <span className={`${titleSizes[size]} text-slate-900 leading-tight`}>
          {t('brand.name')}
        </span>
        {showSubtitle && (
          <span className={`${subtitleSizes[size]} font-medium text-teal-700 leading-tight`}>
            {t('brand.subtitle')}
          </span>
        )}
        <span className={`${orgSizes[size]} text-slate-500 leading-tight`}>
          {t('brand.ngo')}
        </span>
      </div>
    </div>
  );
};
