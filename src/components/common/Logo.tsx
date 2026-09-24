import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = ''
}) => {
  const { t } = useTranslation();

  const iconSizes = {
    sm: 'w-7 h-7 p-1.5',
    md: 'w-10 h-10 p-2',
    lg: 'w-14 h-14 p-3'
  };

  const titleSizes = {
    sm: 'text-base font-bold',
    md: 'text-xl font-bold tracking-tight',
    lg: 'text-3xl font-extrabold tracking-tight'
  };

  const subtitleSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative shrink-0">
        <div className={`${iconSizes[size]} rounded-2xl bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20 ring-2 ring-teal-400/20`}>
          <BookOpen className="w-full h-full" />
        </div>
        <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-0.5 text-slate-900 shadow-sm">
          <Sparkles className="w-2.5 h-2.5" />
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`${titleSizes[size]} bg-gradient-to-r from-teal-700 to-emerald-600 dark:from-teal-300 dark:to-emerald-400 bg-clip-text text-transparent`}>
            {t('brand.name')}
          </span>
        </div>
        {showSubtitle && (
          <span className={`${subtitleSizes[size]} font-medium text-slate-500 dark:text-slate-400 -mt-0.5`}>
            {t('brand.ngo')}
          </span>
        )}
      </div>
    </div>
  );
};
