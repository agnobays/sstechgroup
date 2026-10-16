import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon, ArrowRight, CheckCircle2 } from 'lucide-react';

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  items: string[];
  enquiryServiceKey: string;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  icon: Icon,
  title,
  description,
  items,
  enquiryServiceKey,
}) => {
  return (
    <div className="flex flex-col justify-between glass-card rounded-2xl md:rounded-3xl p-7 sm:p-9 hover:border-brand-amber/40 transition-all duration-300 group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-amber/5 rounded-full blur-2xl group-hover:bg-brand-amber/10 transition-colors pointer-events-none" />
      <div>
        {/* Icon & Title */}
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-brand-amber/30 flex items-center justify-center text-brand-champagne group-hover:scale-105 group-hover:border-brand-amber transition-all mb-6 shadow-[0_0_20px_rgba(246,115,0,0.2)]">
          <Icon className="w-6 h-6 text-brand-amber" />
        </div>

        <h3 className="text-xl font-bold text-white group-hover:text-brand-champagne transition-colors">
          {title}
        </h3>

        <p className="mt-3 text-sm text-brand-warm-grey leading-relaxed">
          {description}
        </p>

        {/* Feature Points */}
        <ul className="mt-6 space-y-2.5">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start text-xs sm:text-sm text-brand-warm-grey">
              <CheckCircle2 className="w-4 h-4 text-brand-amber mr-2.5 mt-0.5 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Button */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <Link
          to={`/contact?service=${encodeURIComponent(enquiryServiceKey)}`}
          className="inline-flex items-center text-xs sm:text-sm font-semibold text-brand-champagne hover:text-white group/link transition-colors"
        >
          <span>Enquire About This Service</span>
          <ArrowRight className="w-4 h-4 ml-2 transform group-hover/link:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
