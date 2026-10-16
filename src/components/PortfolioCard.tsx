import React from 'react';
import { ExternalLink } from 'lucide-react';

export interface ProjectItem {
  id: string;
  title: string;
  category: string;
  isConcept: boolean; // true = Demonstration Concept, false = Verified Production
  summary: string;
  deliverables: string[];
  techStack: string[];
  url?: string;
  domain?: string;
}

export const PortfolioCard: React.FC<{ project: ProjectItem }> = ({ project }) => {
  return (
    <div className="glass-card rounded-2xl md:rounded-3xl p-6 sm:p-7 flex flex-col justify-between hover:border-brand-amber/40 transition-all duration-300 group relative overflow-hidden">
      <div>
        {/* Badges & Live Link indicator */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="text-xs font-semibold px-3 py-1 rounded-full glass-pill text-white/90">
            {project.category}
          </span>
          <span
            className={`text-xs font-medium px-3 py-0.5 rounded-full border ${
              project.isConcept
                ? 'bg-amber-950/40 text-brand-champagne border-brand-amber/30'
                : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
            }`}
          >
            {project.isConcept ? 'Demonstration Concept' : 'Verified Project'}
          </span>
        </div>

        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand-champagne transition-colors">
          {project.title}
        </h3>

        {/* Live Website Domain if available */}
        {project.domain && project.url && (
          <div className="mb-3">
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs font-mono text-brand-amber hover:text-brand-champagne transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
              {project.domain}
            </a>
          </div>
        )}

        <p className="text-sm text-brand-warm-grey leading-relaxed mb-5">
          {project.summary}
        </p>

        {/* Deliverables */}
        <div className="space-y-1.5 mb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-champagne/80 block">
            Scope &amp; Architecture:
          </span>
          <ul className="text-xs text-brand-warm-grey space-y-1.5">
            {project.deliverables.map((item, idx) => (
              <li key={idx} className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-amber mr-2 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        {/* Tech Stack */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap gap-1.5 mb-4">
          {project.techStack.map((tech, idx) => (
            <span
              key={idx}
              className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/5 text-brand-warm-grey border border-white/10"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Live CTA button if URL exists */}
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-full text-xs font-semibold glass-pill text-white hover:bg-white hover:text-black transition-all"
          >
            <span>Visit Live Platform</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
          </a>
        )}
      </div>
    </div>
  );
};
