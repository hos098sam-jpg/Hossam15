import React from 'react';
import { BookOpen } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  subtitle,
}) => {
  const sizeMap = {
    sm: { box: 'h-10 w-10 rounded-xl', icon: 'w-5 h-5', title: 'text-base sm:text-lg', sub: 'text-[11px]' },
    md: { box: 'h-11 w-11 rounded-xl', icon: 'w-5 h-5', title: 'text-lg', sub: 'text-[11px]' },
    lg: { box: 'h-14 w-14 rounded-2xl', icon: 'w-7 h-7', title: 'text-xl sm:text-2xl', sub: 'text-xs' },
    xl: { box: 'h-20 w-20 rounded-2xl', icon: 'w-10 h-10', title: 'text-2xl sm:text-3xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div
        className={`${currentSize.box} relative flex shrink-0 items-center justify-center overflow-hidden border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-[#16161A]`}
      >
        <img
          src="/logo.png"
          alt="شعار منصة المتفلسفة التعليمية"
          referrerPolicy="no-referrer"
          className="h-full w-full object-contain p-0.5"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 -z-10 flex items-center justify-center bg-[#E31B23]/10 text-[#E31B23]">
          <BookOpen className={currentSize.icon} />
        </div>
      </div>

      {showText && (
        <div className="min-w-0 text-right">
          <h1 className={`${currentSize.title} font-display truncate font-extrabold tracking-tight text-[#151515] dark:text-white leading-tight`}>
            منصة المتفلسفة
          </h1>
          {subtitle ? (
            <p className={`${currentSize.sub} mt-0.5 truncate font-semibold text-neutral-500 dark:text-neutral-400`}>
              {subtitle}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
};
