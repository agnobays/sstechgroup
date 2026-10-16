import React from 'react';
import { Link } from 'react-router-dom';
import { Search, FileText, Layout, Code, Rocket, LifeBuoy, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { SEO } from '../components/SEO';

const steps = [
  {
    number: '01',
    title: 'Discovery & Requirements',
    icon: Search,
    summary: 'Understanding your business landscape, target audience, technical constraints, and desired outcomes.',
    details: [
      'Structured technical discussion to identify core problems and priorities',
      'Evaluation of existing digital assets, domains, and branding materials',
      'Determination of accessibility, compliance, and user journey criteria',
      'Identification of any third-party software or payment API dependencies',
    ],
  },
  {
    number: '02',
    title: 'Proposal & Scope Confirmation',
    icon: FileText,
    summary: 'Documenting clear deliverables, milestones, itemised costings, and realistic timelines.',
    details: [
      'Comprehensive proposal outlining exact features and functional limits',
      'Transparent itemised line items with no concealed expenses',
      'Clear project milestones and phase delivery schedule',
      'Mutual agreement on payment terms and project responsibilities',
    ],
  },
  {
    number: '03',
    title: 'Design & Approval',
    icon: Layout,
    summary: 'Crafting responsive layouts, intuitive visual hierarchies, and accessible interactions.',
    details: [
      'Wireframe drafting focused on clean navigation and user journeys',
      'Application of verified brand guidelines, typography, and color tokens',
      'Mobile, tablet, and desktop layout mockups',
      'Iterative client review and formal sign-off before code execution',
    ],
  },
  {
    number: '04',
    title: 'Development & Testing',
    icon: Code,
    summary: 'Engineering semantic frontend interfaces and robust backend logic with rigorous testing.',
    details: [
      'Semantic HTML5, TypeScript, and modern responsive CSS',
      'Server-side validation, database transactions, and secure API endpoints',
      'Automated testing for calculations, permissions, and edge cases',
      'Cross-device testing, responsive audits, and console error checks',
    ],
  },
  {
    number: '05',
    title: 'Launch & Handover',
    icon: Rocket,
    summary: 'Deploying the system to production, configuring DNS and SSL, and handing over full control.',
    details: [
      'Controlled deployment to staging and production environments',
      'Domain nameserver DNS cutover and SSL certificate verification',
      'XML sitemap submission and search engine index preparation',
      'Client administrative handover and documentation walk-through',
    ],
  },
  {
    number: '06',
    title: 'Ongoing Support',
    icon: LifeBuoy,
    summary: 'Continuous monitoring, software maintenance, security updates, and dependable technical care.',
    details: [
      'Routine software framework updates and dependency security patches',
      'Periodic off-site backups and restoration verification',
      'Content adjustments, minor feature tweaks, and technical guidance',
      'Dedicated support channel for prompt bug resolution',
    ],
  },
];

export const ProcessPage: React.FC = () => {
  return (
    <div className="space-y-16 py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <SEO
        title="Our Engineering Process & Methodology"
        description="Explore our proven 6-stage engineering delivery framework: from Discovery, Architecture, and UI/UX Design to full-stack Web Development, rigorous QA testing, and secure cloud deployment."
        keywords="web development process, digital engineering methodology, agile website design south africa, web app development stages"
        canonical="/process"
      />
      <div className="bg-spotlight-beam opacity-60" />

      {/* Page Header */}
      <section className="text-center max-w-3xl mx-auto space-y-4 relative z-10">
        <div className="inline-flex items-center space-x-2 px-4 py-1 rounded-full glass-pill text-xs font-semibold tracking-wider uppercase text-brand-champagne">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-amber animate-pulse" />
          <span>Delivery Framework</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
          How We Work
        </h1>
        <p className="text-base sm:text-lg text-brand-warm-grey leading-relaxed">
          A disciplined, predictable six-step methodology ensuring quality, adherence to scope, and complete accountability at every milestone.
        </p>
      </section>

      {/* Advisory on Timelines */}
      <section className="glass-card rounded-2xl md:rounded-3xl border border-white/10 p-6 max-w-4xl mx-auto text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-champagne block">
          Custom Milestones &amp; Timelines
        </span>
        <p className="text-xs sm:text-sm text-brand-warm-grey leading-relaxed">
          We do not apply arbitrary cookie-cutter turnaround promises. Specific project delivery dates, sprint intervals, and phase releases are carefully estimated and formally agreed upon following the Discovery phase.
        </p>
      </section>

      {/* 6 Steps Detailed */}
      <section className="space-y-8">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.number}
              className="glass-card rounded-2xl md:rounded-3xl border border-white/10 p-8 sm:p-10 transition-all hover:border-brand-amber/40 relative overflow-hidden"
            >
              <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
                
                {/* Step Monogram */}
                <div className="flex items-center space-x-4 flex-shrink-0">
                  <span className="text-4xl sm:text-5xl font-black font-mono text-brand-champagne/40">
                    {step.number}
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-brand-amber/30 flex items-center justify-center text-brand-champagne shadow-[0_0_15px_rgba(246,115,0,0.2)]">
                    <Icon className="w-6 h-6 text-brand-amber" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {step.title}
                    </h2>
                    <p className="text-sm sm:text-base text-brand-warm-grey mt-1">
                      {step.summary}
                    </p>
                  </div>

                  <div className="pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-champagne mb-2.5">
                      Key Milestone Activities:
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {step.details.map((detail, dIdx) => (
                        <div key={dIdx} className="flex items-start text-xs sm:text-sm text-brand-warm-grey">
                          <Check className="w-4 h-4 text-brand-amber mr-2 mt-0.5 flex-shrink-0" />
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </section>

      {/* CTA Box */}
      <section className="rounded-3xl glass-card border border-brand-amber/30 p-8 sm:p-14 text-center max-w-3xl mx-auto space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-brand-amber/15 blur-3xl pointer-events-none" />
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Let's Plan Your Next Digital Step
        </h2>
        <p className="text-sm sm:text-base text-brand-warm-grey">
          Begin with Step 01. Share your project goals with us and we'll arrange a discovery consultation.
        </p>
        <div>
          <Link
            to="/contact"
            className="inline-flex items-center px-8 py-3.5 rounded-full text-base font-bold bg-white text-black hover:bg-neutral-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)]"
          >
            Start a Project Enquiry
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>

    </div>
  );
};
