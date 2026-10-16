import React from 'react';
import { Link } from 'react-router-dom';
import {
  Globe,
  Server,
  Code2,
  Wrench,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Clock,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { ServiceCard } from '../components/ServiceCard';
import { PortfolioCard, ProjectItem } from '../components/PortfolioCard';
import { SEO } from '../components/SEO';

const featuredProjects: ProjectItem[] = [
  {
    id: 'ticketsta',
    title: 'Ticketsta — Digital Ticketing & Access Platform',
    category: 'Ticketing Platform',
    isConcept: false,
    url: 'https://ticketsta.com',
    domain: 'ticketsta.com',
    summary: 'A modern, high-concurrency event ticketing and reservation platform engineered for effortless ticket discovery, fast mobile checkout, and frictionless attendee access.',
    deliverables: ['Real-time seat and ticket inventory tracking', 'High-speed secure payment processing checkout flow', 'Digital ticket delivery with mobile barcode verification'],
    techStack: ['React', 'Node.js', 'REST APIs', 'Payment Gateway'],
  },
  {
    id: 'agno-and-friends',
    title: 'Agno and Friends — Entertainment Platform',
    category: 'Entertainment',
    isConcept: false,
    url: 'https://agnoandfriends.com',
    domain: 'agnoandfriends.com',
    summary: 'A high-energy digital entertainment platform built for Agno and Friends, showcasing creative talent, media productions, and digital event experiences.',
    deliverables: ['Interactive multimedia streaming', 'Dynamic event schedules & talent spotlights', 'High-performance mobile asset delivery'],
    techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Vite'],
  },
  {
    id: 'newjack',
    title: 'Newjack — Corporate & Commercial Website',
    category: 'Business Website',
    isConcept: false,
    url: 'https://www.newjack.co.za',
    domain: 'newjack.co.za',
    summary: 'A sleek, precision-crafted corporate business website for Newjack, establishing authoritative brand presence, service portfolios, and commercial lead intake.',
    deliverables: ['Bespoke corporate visual identity', 'Mobile-responsive layout optimized for high conversion', 'Fast semantic markup & SEO optimization'],
    techStack: ['Modern Web', 'Responsive Design', 'SEO Strategy'],
  },
];

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-28 pb-24 relative overflow-hidden">
      <SEO
        title="Future-Driven Digital Solutions & Web Engineering"
        description="We craft high-quality bespoke websites, web applications, email marketing automation, and intelligent systems for African enterprise growth."
        keywords="web development south africa, enterprise web applications, email marketing automation, custom web systems durban johannesburg cape town, S&S Tech Group"
      />
      
      {/* Radiant Amber Spotlight Beams */}
      <div className="bg-spotlight-beam" />
      <div className="bg-spotlight-beam-secondary" />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-16 md:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Hero Text & CTAs */}
            <div className="lg:col-span-7 space-y-7 text-left">
              
              {/* Reference Pill Badge */}
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full glass-pill text-xs font-medium text-brand-champagne shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-brand-amber animate-pulse" />
                <span>Empowering African Enterprise Growth</span>
              </div>

              {/* Exact High-Impact Headline with Accent Brackets */}
              <h1 className="text-4xl sm:text-6xl xl:text-7xl font-extrabold text-white tracking-tight leading-[1.08] uppercase">
                Future-Driven <br />
                Digital Solutions <br />
                <span className="text-brand-violet font-mono">{'{'}</span>{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-champagne via-brand-amber to-brand-gold">
                  Built For Growth
                </span>{' '}
                <span className="text-brand-violet font-mono">{'}'}</span>
              </h1>

              {/* Exact Supporting Text */}
              <p className="text-base sm:text-lg text-brand-warm-grey max-w-xl leading-relaxed">
                We craft high-quality digital solutions and intelligent systems that help businesses and organisations work smarter, connect with their audiences and grow.
              </p>

              {/* Reference Dual Pill CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/get-a-quote"
                  className="inline-flex items-center justify-center px-7 py-3.5 rounded-full text-sm font-bold bg-white text-black hover:bg-neutral-100 transition-all shadow-[0_0_25px_rgba(255,255,255,0.25)] hover:shadow-[0_0_35px_rgba(255,255,255,0.4)]"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>

                <Link
                  to="/portfolio"
                  className="inline-flex items-center justify-center px-7 py-3.5 rounded-full text-sm font-semibold glass-pill text-white hover:text-brand-champagne transition-all"
                >
                  <span>See Our Projects</span>
                </Link>
              </div>

              {/* Bottom Social Media Frosted Icons & Explore Hint */}
              <div className="pt-8 flex items-center justify-between border-t border-white/10 max-w-lg">
                <div className="flex items-center space-x-2.5">
                  <span className="text-[11px] font-medium text-brand-warm-grey/80 mr-1">Follow Us:</span>
                  <a
                    href="https://wa.me/27698847200"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg glass-pill flex items-center justify-center text-brand-warm-grey hover:text-brand-amber transition-colors text-xs font-semibold"
                    title="WhatsApp"
                  >
                    WA
                  </a>
                  <a
                    href="mailto:info@sstechgroup.co.za"
                    className="w-8 h-8 rounded-lg glass-pill flex items-center justify-center text-brand-warm-grey hover:text-brand-champagne transition-colors text-xs font-semibold"
                    title="Email"
                  >
                    @
                  </a>
                  <span className="w-8 h-8 rounded-lg glass-pill flex items-center justify-center text-brand-warm-grey text-xs font-semibold">
                    ZA
                  </span>
                </div>

                <div className="hidden sm:flex items-center space-x-1.5 text-xs text-brand-warm-grey/80">
                  <span>Scroll to explore</span>
                  <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[10px]">↓</span>
                </div>
              </div>

            </div>

            {/* Right Column: Reference Terminal & Visual Code Window */}
            <div className="lg:col-span-5 relative mt-6 lg:mt-0">
              
              {/* Ambient backlight */}
              <div className="absolute -inset-4 bg-gradient-to-r from-brand-amber/20 to-brand-gold/10 rounded-3xl blur-2xl pointer-events-none" />

              {/* Main IDE Window */}
              <div className="glass-card rounded-2xl md:rounded-3xl p-5 sm:p-6 border border-white/15 relative z-10 shadow-2xl">
                
                {/* Traffic Light Window Controls & Action Bar */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-[#EF4444] inline-block shadow-sm" />
                    <span className="w-3 h-3 rounded-full bg-[#F59E0B] inline-block shadow-sm" />
                    <span className="w-3 h-3 rounded-full bg-[#10B981] inline-block shadow-sm" />
                  </div>
                  <div className="flex items-center space-x-2 text-brand-warm-grey text-xs font-mono">
                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] border border-white/10">
                      sstechgroup.engine.ts
                    </span>
                  </div>
                </div>

                {/* Code Window Content */}
                <div className="font-mono text-xs sm:text-sm leading-relaxed space-y-1.5 text-brand-off-white/90 overflow-x-auto">
                  <p>
                    <span className="text-brand-amber font-semibold">const</span>{' '}
                    <span className="text-brand-champagne font-semibold">sstech</span> ={' '}
                    <span className="text-brand-violet">new</span>{' '}
                    <span className="text-white font-semibold">DigitalEngine</span>({'{'}
                  </p>
                  <p className="pl-4">
                    <span className="text-brand-warm-grey">enterprise:</span>{' '}
                    <span className="text-[#10B981]">"S&amp;S Tech Group (Pty) Ltd"</span>,
                  </p>
                  <p className="pl-4">
                    <span className="text-brand-warm-grey">regNumber:</span>{' '}
                    <span className="text-brand-champagne">"2026/802170/07"</span>,
                  </p>
                  <p className="pl-4">
                    <span className="text-brand-warm-grey">modules:</span> [
                  </p>
                  <p className="pl-8 text-brand-champagne">
                    <span className="text-[#10B981]">"AI Quotation System"</span>,
                  </p>
                  <p className="pl-8 text-brand-champagne">
                    <span className="text-[#10B981]">"Automated Invoicing"</span>,
                  </p>
                  <p className="pl-8 text-brand-champagne">
                    <span className="text-[#10B981]">"Verified Web Platforms"</span>
                  </p>
                  <p className="pl-4">],</p>
                  <p className="pl-4">
                    <span className="text-brand-warm-grey">status:</span>{' '}
                    <span className="text-brand-amber font-semibold">"PRODUCTION_READY"</span>
                  </p>
                  <p>{'});'}</p>
                  <p className="pt-2">
                    <span className="text-brand-champagne">await</span> sstech.
                    <span className="text-brand-amber font-semibold">deploy</span>();
                  </p>
                </div>

                {/* Terminal Footer Pills */}
                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-brand-warm-grey">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                    <span>Live Cloud Engine</span>
                  </div>
                  <span className="text-brand-champagne font-mono">v2.4.0 • 200 OK</span>
                </div>
              </div>

              {/* Overlapping Floating CSS Badge (Inspired by Reference Image 2) */}
              <div className="hidden sm:block absolute -bottom-8 -right-4 z-20 glass-card rounded-2xl p-4 border border-brand-amber/30 shadow-2xl max-w-xs backdrop-blur-2xl">
                <div className="font-mono text-[11px] space-y-1 text-brand-warm-grey">
                  <div className="flex items-center justify-between text-brand-amber font-bold pb-1 mb-1 border-b border-white/10">
                    <span>system.config</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand-amber/20 text-brand-champagne">active</span>
                  </div>
                  <p><span className="text-brand-champagne">fnb.account:</span> <span className="text-white">63169376134</span></p>
                  <p><span className="text-brand-champagne">direct.hotline:</span> <span className="text-white">069 884 7200</span></p>
                  <p><span className="text-brand-champagne">official.mail:</span> <span className="text-white text-[10px]">info@sstechgroup.co.za</span></p>
                </div>
              </div>

              {/* Connected Amber Security Glowing Node */}
              <div className="hidden lg:flex items-center absolute -bottom-10 left-8 z-20 space-x-3">
                <div className="w-10 h-10 rounded-2xl glass-card border border-brand-amber/50 flex items-center justify-center text-brand-amber shadow-[0_0_20px_rgba(246,115,0,0.5)]">
                  <ShieldCheck className="w-5 h-5 text-brand-amber" />
                </div>
                <div className="glass-pill px-3 py-1 rounded-full text-[10px] text-brand-champagne font-mono">
                  SSL Encrypted • POPIA Compliant
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* Floating Bottom Quick Notice Capsule (Inspired by Reference Image 2 Cookie/Notice Pill) */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="glass-pill rounded-full p-2.5 sm:px-6 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl border border-white/10">
          <div className="flex items-center space-x-3 text-center sm:text-left">
            <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-brand-champagne text-xs shrink-0">
              ⚡
            </span>
            <span className="text-xs text-brand-warm-grey leading-tight">
              Enterprise digital systems &amp; instant AI-assisted quote generation for South African businesses.
            </span>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <Link
              to="/about"
              className="px-3.5 py-1.5 rounded-full text-xs font-medium text-brand-warm-grey hover:text-white glass-pill"
            >
              Learn More
            </Link>
            <Link
              to="/get-a-quote"
              className="px-4 py-1.5 rounded-full text-xs font-semibold bg-white text-black hover:bg-neutral-200 transition-colors"
            >
              Instant Quote
            </Link>
          </div>
        </div>
      </div>

      {/* Core Services Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="What We Do"
          title="Digital Services Engineered for Impact"
          subtitle="From bespoke corporate websites and email marketing pipelines to custom workflow applications and reliable cloud hosting, we deliver dependable systems tailored to your goals."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          <ServiceCard
            icon={Globe}
            title="Website Design & Development"
            description="Professional, high-performance websites engineered for businesses, schools, and educational institutions with responsive layouts and accessible user journeys."
            items={[
              'Professional business & corporate websites',
              'School & educational institution platforms',
              'University & departmental websites',
              'Enquiry and digital application workflows',
              'Mobile-first responsive architecture',
            ]}
            enquiryServiceKey="Website design and development"
          />

          <ServiceCard
            icon={Server}
            title="Web Hosting & Domain Services"
            description="Dependable domain registration assistance, secure cloud hosting configuration, DNS setup, and SSL encryption to ensure your digital presence is always fast and available."
            items={[
              'Domain registration assistance & DNS configuration',
              'SSL certificate provisioning & security hardening',
              'Website deployment & platform migration',
              'Ongoing hosting support & server monitoring',
            ]}
            enquiryServiceKey="Web hosting and domain services"
          />

          <ServiceCard
            icon={Code2}
            title="Web Application Development"
            description="Custom web applications and internal tools designed to automate repetitive business processes, integrate systems, and give your team actionable operational visibility."
            items={[
              'Custom business tools & admin dashboards',
              'Workflow automation & document processing',
              'Form-driven administrative portals',
              'API integrations & database-backed systems',
            ]}
            enquiryServiceKey="Web application development"
          />

          <ServiceCard
            icon={Mail}
            title="Email Marketing & Automation"
            description="High-deliverability email marketing infrastructure, responsive newsletter templates, and automated onboarding sequences to keep your audience engaged and converting."
            items={[
              'Custom-branded HTML email & newsletter design',
              'Automated customer onboarding & nurture flows',
              'Domain authentication (SPF, DKIM, DMARC & BIMI)',
              'Audience segmentation & POPIA compliance',
            ]}
            enquiryServiceKey="Email marketing and automated campaigns"
          />

          <ServiceCard
            icon={Wrench}
            title="Website Maintenance & Support"
            description="Proactive technical care, security patches, regular backups, and content updates so your digital platform remains secure, compatible, and performing at its peak."
            items={[
              'Content updates & routine adjustments',
              'Website bug fixes & performance optimisation',
              'Security monitoring & dependency updates',
              'System backups & maintenance scheduling',
            ]}
            enquiryServiceKey="Website maintenance and support"
          />
        </div>
      </section>

      {/* Featured Projects / Concepts */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-pill text-xs font-semibold text-brand-champagne mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-amber" />
              <span>Verified Production Work</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Featured Client Platforms
            </h2>
          </div>
          <Link
            to="/portfolio"
            className="mt-4 md:mt-0 inline-flex items-center text-sm font-semibold text-brand-champagne hover:text-white transition-colors"
          >
            View Complete Portfolio &amp; Details
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredProjects.map((p) => (
            <PortfolioCard key={p.id} project={p} />
          ))}
        </div>
      </section>

      {/* Client Enquiry Call To Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl glass-card border border-brand-amber/30 p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-brand-amber/15 blur-3xl pointer-events-none" />
          <div className="relative max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Ready to Discuss Your Project?
            </h2>
            <p className="text-brand-warm-grey text-base sm:text-lg">
              Tell us about your digital requirements. We will review your goals and provide an honest, structured proposal tailored to your needs.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/get-a-quote"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full text-base font-bold bg-white text-black hover:bg-neutral-100 transition-all shadow-[0_0_25px_rgba(255,255,255,0.25)]"
              >
                Start an Instant Quote
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                to="/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full text-base font-semibold glass-pill text-white hover:text-brand-champagne transition-all"
              >
                Contact Our Team
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
