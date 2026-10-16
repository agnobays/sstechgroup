import React from 'react';

interface SectionHeadingProps {
  badge?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  badge,
  title,
  subtitle,
  center = true,
}) => {
  return (
    <div className={`max-w-3xl ${center ? 'mx-auto text-center' : ''} mb-12`}>
      {badge && (
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-pill text-xs font-semibold tracking-wider uppercase text-brand-champagne mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-amber animate-pulse" />
          <span>{badge}</span>
        </div>
      )}
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base sm:text-lg text-brand-warm-grey leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};
