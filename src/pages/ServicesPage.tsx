import React from 'react';
import { Globe, Server, Code2, Wrench, Mail, CheckCircle, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SectionHeading } from '../components/SectionHeading';
import { SEO } from '../components/SEO';

interface ServiceDetail {
  id: string;
  key: string;
  title: string;
  badge: string;
  icon: any;
  lead: string;
  description: string;
  offerings: string[];
  benefits: string[];
}

const servicesList: ServiceDetail[] = [
  {
    id: 'web-design-dev',
    key: 'Website design and development',
    title: 'Website Design & Development',
    badge: 'Core Practice',
    icon: Globe,
    lead: 'Professional, highly responsive websites engineered to establish authority and convert visitors.',
    description: 'We craft modern websites designed around your organisational objectives and user expectations. Every layout is built using semantic HTML, accessible UI standards, responsive grid systems, and search-engine-optimised markup.',
    offerings: [
      'Professional business & corporate websites',
      'School & educational institution websites',
      'University, departmental & faculty portals',
      'Blogs and editorial content-based websites',
      'Enquiry, booking and application form workflows',
      'High-performance mobile-first responsive architecture',
    ],
    benefits: [
      'Fast loading speeds with modern bundlers and optimised assets',
      'Clean accessibility conforming to WCAG baseline guidelines',
      'Full cross-browser compatibility across desktop, tablet and mobile',
      'Search engine friendly structure with canonical tags and Open Graph metadata',
    ],
  },
  {
    id: 'web-hosting-domains',
    key: 'Web hosting and domain services',
    title: 'Web Hosting & Domain Services',
    badge: 'Infrastructure',
    icon: Server,
    lead: 'Dependable cloud hosting configuration, domain assistance, and SSL encryption.',
    description: 'Reliable infrastructure is essential for digital success. We assist organisations with domain registration, nameserver DNS routing, automated SSL certificate issuance, and zero-downtime migrations.',
    offerings: [
      'Website hosting environment setup & hardening',
      'Domain registration assistance & nameserver routing',
      'Comprehensive DNS configuration (A, CNAME, MX, SPF, DKIM)',
      'Automated SSL / TLS encryption certificate setup',
      'Website deployment, database setup & migration assistance',
      'Ongoing hosting monitoring and technical support',
    ],
    benefits: [
      'Secure, verified server configurations minimising vulnerability vectors',
      'Zero confusion over DNS settings and email routing records',
      'Managed migrations preserving existing data and SEO equity',
      'Direct technical assistance when DNS or host questions arise',
    ],
  },
  {
    id: 'web-app-dev',
    key: 'Web application development',
    title: 'Web Application Development',
    badge: 'Custom Engineering',
    icon: Code2,
    lead: 'Tailored web applications, internal operational tools, and system integrations.',
    description: 'When standard off-the-shelf software doesn’t fit your business model, we engineer custom full-stack web applications. We build secure administrative dashboards, automated quoting and billing tools, and database-backed pipelines.',
    offerings: [
      'Custom web applications tailored to business logic',
      'Internal operational tools & administrative dashboards',
      'Workflow automation eliminating manual spreadsheet repetition',
      'Form-driven administrative and application portals',
      'Third-party API integrations & data synchronisation',
      'Database-backed transactional systems with ACID guarantees',
    ],
    benefits: [
      'Elimination of manual repetitive data entry and human error',
      'Role-based access control protecting sensitive company records',
      'Accurate double-entry financial logic and audit logs',
      'Complete ownership of custom intellectual property without recurring per-seat fees',
    ],
  },
  {
    id: 'maintenance-support',
    key: 'Website maintenance and support',
    title: 'Website Maintenance & Support',
    badge: 'Continuous Care',
    icon: Wrench,
    lead: 'Proactive upkeep, security patches, regular backups, and content updates.',
    description: 'Digital systems require ongoing care to remain secure and compatible with evolving web standards. Our maintenance packages provide proactive dependency updates, periodic database backups, bug fixes, and swift content adjustments.',
    offerings: [
      'Routine content updates & structural modifications',
      'Website bug triage, troubleshooting & error resolution',
      'Performance profiling & page speed improvements',
      'Security patching & framework dependency upgrades',
      'Scheduled off-site backups & disaster recovery planning',
    ],
    benefits: [
      'Peace of mind knowing your platform is actively monitored',
      'Prevention of security breaches caused by outdated libraries',
      'Preservation of peak search engine rankings through quick bug fixes',
      'Predictable maintenance budgeting without surprise technical debt',
    ],
  },
  {
    id: 'email-marketing',
    key: 'Email marketing and automated campaigns',
    title: 'Email Marketing & Campaign Automation',
    badge: 'Audience Growth',
    icon: Mail,
    lead: 'Targeted email campaigns, automated newsletters, customer onboarding journeys, and high-deliverability inbox infrastructure.',
    description: 'Engage prospects and retain existing clients through bespoke, responsive email templates and reliable automated sequences. We configure verified domain DNS records (SPF, DKIM, DMARC) so your emails land directly in the inbox, not the spam folder.',
    offerings: [
      'Custom-branded HTML email and newsletter template design',
      'Automated customer onboarding & transactional email workflows',
      'Audience segmentation and contact list management',
      'Domain authentication (SPF, DKIM, DMARC & BIMI) setup',
      'Campaign performance reporting (open rates, CTR & conversion)',
      'POPIA-compliant opt-in and unsubscribe mechanics',
    ],
    benefits: [
      'Consistently high inbox delivery rates with verified domain keys',
      'Automated nurture sequences converting leads into paying clients',
      'Bespoke design aligned with your official corporate identity',
      'Full compliance with South African POPIA data regulations',
    ],
  },
];

export const ServicesPage: React.FC = () => {
  return (
    <div className="space-y-20 py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <SEO
        title="Digital Services, Web Applications & Email Marketing"
        description="Explore our specialized digital services: custom website engineering, web applications, email marketing automation, managed hosting, and SLA maintenance."
        keywords="web design services south africa, custom web app development, email marketing automation durban, cloud hosting, school websites, business website maintenance"
      />
      <div className="bg-spotlight-beam opacity-60" />

      {/* Page Header */}
      <section className="text-center max-w-3xl mx-auto space-y-4 relative z-10">
        <div className="inline-flex items-center space-x-2 px-4 py-1 rounded-full glass-pill text-xs font-semibold tracking-wider uppercase text-brand-champagne">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-amber animate-pulse" />
          <span>Digital Services</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
          Comprehensive Digital Services
        </h1>
        <p className="text-base sm:text-lg text-brand-warm-grey leading-relaxed">
          From full corporate web platforms to custom operational dashboards and reliable cloud hosting, we deliver engineered digital systems crafted around your business goals.
        </p>
      </section>

      {/* Services Breakdown */}
      <section className="space-y-12">
        {servicesList.map((svc) => {
          const Icon = svc.icon;

          return (
            <div
              key={svc.id}
              id={svc.id}
              className="glass-card rounded-2xl md:rounded-3xl p-8 sm:p-12 transition-all hover:border-brand-amber/40 relative overflow-hidden"
            >
              <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
                
                {/* Left Overview */}
                <div className="lg:w-1/2 space-y-5">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-brand-amber/30 flex items-center justify-center text-brand-champagne shadow-[0_0_15px_rgba(246,115,0,0.2)]">
                      <Icon className="w-6 h-6 text-brand-amber" />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold tracking-wider uppercase text-brand-champagne block">
                        {svc.badge}
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                        {svc.title}
                      </h2>
                    </div>
                  </div>

                  <p className="text-base text-white font-medium">
                    {svc.lead}
                  </p>

                  <p className="text-sm text-brand-warm-grey leading-relaxed">
                    {svc.description}
                  </p>

                  {/* Enquire CTA Button */}
                  <div className="pt-3">
                    <Link
                      to={`/contact?service=${encodeURIComponent(svc.key)}`}
                      className="inline-flex items-center px-7 py-3 rounded-full text-xs sm:text-sm font-bold bg-white text-black hover:bg-neutral-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)]"
                    >
                      Enquire About This Service
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                </div>

                {/* Right Offerings & Benefits */}
                <div className="lg:w-1/2 space-y-6 lg:border-l lg:border-white/10 lg:pl-10">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                      Included Capabilities &amp; Scope:
                    </h3>
                    <ul className="space-y-2">
                      {svc.offerings.map((item, idx) => (
                        <li key={idx} className="flex items-start text-xs sm:text-sm text-brand-warm-grey">
                          <CheckCircle className="w-4 h-4 text-brand-amber mr-2.5 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-champagne mb-3">
                      Key Client Benefits:
                    </h3>
                    <ul className="space-y-2">
                      {svc.benefits.map((b, idx) => (
                        <li key={idx} className="flex items-start text-xs sm:text-sm text-brand-warm-grey">
                          <Zap className="w-4 h-4 text-brand-champagne mr-2.5 mt-0.5 flex-shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </section>

      {/* Honest Advisory Note */}
      <section className="rounded-2xl glass-card border border-white/10 p-8 text-center max-w-4xl mx-auto space-y-3">
        <h3 className="text-base font-bold text-white">
          Tailored Proposals &amp; Project Scoping
        </h3>
        <p className="text-xs sm:text-sm text-brand-warm-grey leading-relaxed">
          Every organisation is unique. We do not offer rigid cookie-cutter packages. Instead, we scope every project according to your technical demands, data privacy needs, and business requirements.
        </p>
      </section>

    </div>
  );
};
