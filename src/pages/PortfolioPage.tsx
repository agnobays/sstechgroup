import React, { useState } from 'react';
import { PortfolioCard, ProjectItem } from '../components/PortfolioCard';
import { Info } from 'lucide-react';
import { SEO } from '../components/SEO';

const allProjects: ProjectItem[] = [
  {
    id: 'agno-and-friends',
    title: 'Agno and Friends — Entertainment & Media Platform',
    category: 'Entertainment',
    isConcept: false,
    url: 'https://agnoandfriends.com',
    domain: 'agnoandfriends.com',
    summary: 'A high-energy digital entertainment platform built for Agno and Friends, showcasing creative talent, media productions, interactive fan engagement, and digital event experiences.',
    deliverables: [
      'Interactive multimedia streaming and media showcases',
      'Dynamic event schedules and talent spotlights',
      'High-performance asset delivery and mobile responsiveness',
      'Integrated social engagement channels and fan touchpoints',
    ],
    techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'Cloud CDN'],
  },
  {
    id: 'ticketsta',
    title: 'Ticketsta — Digital Ticketing & Access Platform',
    category: 'Ticketing Platform',
    isConcept: false,
    url: 'https://ticketsta.com',
    domain: 'ticketsta.com',
    summary: 'A modern, high-concurrency event ticketing and reservation platform engineered for effortless ticket discovery, fast mobile checkout, and frictionless attendee access.',
    deliverables: [
      'Real-time seat and ticket inventory tracking',
      'High-speed secure payment processing checkout flow',
      'Digital ticket delivery with mobile barcode verification',
      'Event organizer reporting and admission analytics',
    ],
    techStack: ['React', 'Node.js', 'REST APIs', 'Payment Gateway', 'PostgreSQL'],
  },
  {
    id: 'newjack',
    title: 'Newjack — Corporate & Commercial Business Website',
    category: 'Business Website',
    isConcept: false,
    url: 'https://www.newjack.co.za',
    domain: 'newjack.co.za',
    summary: 'A sleek, precision-crafted corporate business website for Newjack, establishing authoritative brand presence, service portfolios, and qualified commercial lead intake.',
    deliverables: [
      'Bespoke corporate visual identity and typography',
      'Mobile-responsive layout optimized for high conversion',
      'Fast semantic markup and South African SEO optimization',
      'Direct client inquiry intake with automated validation',
    ],
    techStack: ['Modern Web', 'Responsive Design', 'SEO Strategy', 'Cloud Hosting'],
  },
  {
    id: 'ukzn-engineering',
    title: 'UKZN School of Engineering — Academic Portal',
    category: 'Higher Education',
    isConcept: false,
    url: 'https://engineering.ukzn.ac.za/',
    domain: 'engineering.ukzn.ac.za',
    summary: 'Official academic web portal for the University of KwaZulu-Natal (UKZN) School of Engineering, serving undergraduate, postgraduate, and engineering faculty academic communities.',
    deliverables: [
      'Multi-discipline academic curriculum and degree directories',
      'Engineering research centers and laboratory archives',
      'Prospective student admissions pathways and prospectuses',
      'Institutional accessibility, governance, and compliance standards',
    ],
    techStack: ['Enterprise CMS', 'Institutional Architecture', 'Responsive UI', 'Search'],
  },
  {
    id: 'ukzn-agriculture-science',
    title: 'UKZN College of Agriculture, Engineering & Science',
    category: 'Higher Education',
    isConcept: false,
    url: 'https://agriculture-science.ukzn.ac.za/',
    domain: 'agriculture-science.ukzn.ac.za',
    summary: 'Comprehensive higher education portal for the UKZN College of Agriculture, Engineering and Science, presenting faculty programs, scientific research units, and academic staff registries.',
    deliverables: [
      'Extensive academic school directories and departmental structure',
      'Scientific research initiative showcases and publications',
      'Postgraduate research opportunities and admissions guidance',
      'Mobile-optimized institutional document repository',
    ],
    techStack: ['Academic Web Architecture', 'Responsive Design', 'Content Taxonomy', 'SSL'],
  },
  {
    id: 'falakhe-funerals',
    title: 'Falakhe Funerals — Funeral Services & Parlour Website',
    category: 'Funeral Services',
    isConcept: false,
    url: 'https://falakhefunerals.co.za',
    domain: 'falakhefunerals.co.za',
    summary: 'A compassionate, dignified web platform for Falakhe Funeral Services, offering families clear funeral policy plan comparisons, parlour services, and 24/7 urgent support access.',
    deliverables: [
      'Dignified, user-friendly service presentation for bereaved families',
      'Itemised funeral policy package comparisons and premium details',
      'Instant 24/7 emergency dispatch and WhatsApp contact channels',
      'Accessible, mobile-first design for immediate assistance',
    ],
    techStack: ['Responsive Web', 'Direct WhatsApp API', 'Speed Optimisation', 'Secure Hosting'],
  },
  {
    id: 'isibaya-lifestyle',
    title: 'Isibaya Lifestyle KZN — Hospitality & Venue Experience',
    category: 'Hospitality & Lifestyle',
    isConcept: false,
    url: 'https://isibayalifestylekzn.co.za',
    domain: 'isibayalifestylekzn.co.za',
    summary: 'A dynamic hospitality and lifestyle website for Isibaya Lifestyle KZN, featuring venue ambiance, culinary menus, VIP table reservations, and premium weekend entertainment listings.',
    deliverables: [
      'Immersive visual showcase of venue atmosphere and events',
      'Interactive dining, beverage, and bottle service menus',
      'VIP lounge and private table reservation booking intake',
      'Social media integration and location directions',
    ],
    techStack: ['Modern UI/UX', 'Visual Media Grid', 'Booking Workflow', 'Mobile-First Design'],
  },
  {
    id: 'sstech-internal-erp',
    title: 'S&S Tech Group — AI Quotation Engine & Admin Business Portal',
    category: 'Web Application',
    isConcept: false,
    summary: 'The proprietary business operations portal built for S&S Tech Group (Pty) Ltd. Features atomic sequential document generation (QT-YYYY-XXXX, INV-YYYY-XXXX), vector PDF generation, AI quoting, and lead conversion.',
    deliverables: [
      'Secure server-side JWT authentication & role-based route guards',
      'Deterministic package pricing engine and interactive quote wizard',
      'Atomic SQLite WAL transactions for sequential document numbering',
      'Vector PDF engine streaming branded quotations and invoices',
      'Complete CRM lead lifecycle, abandonment capture, and audit logs',
    ],
    techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Express', 'SQLite WAL', 'PDFKit'],
  },
];

export const PortfolioPage: React.FC = () => {
  const [filter, setFilter] = useState<string>('All');

  const categories = [
    'All',
    'Higher Education',
    'Entertainment',
    'Ticketing Platform',
    'Business Website',
    'Funeral Services',
    'Hospitality & Lifestyle',
    'Web Application',
  ];

  const filteredProjects = allProjects.filter((p) => {
    if (filter === 'All') return true;
    return p.category === filter;
  });

  return (
    <div className="space-y-16 py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <SEO
        title="Verified Client Portfolio & Production Case Studies"
        description="Explore verified live client platforms engineered by S&S Tech Group: Ticketsta, Agno and Friends, Newjack, UKZN School of Engineering, and custom web applications."
        keywords="web design portfolio south africa, live client websites, verified web platforms, ticketsta, agno and friends, ukzn engineering, custom software case studies"
      />
      
      {/* Page Header */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-2 px-4 py-1 rounded-full glass-pill text-xs font-semibold tracking-wider uppercase text-brand-champagne">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-amber animate-pulse" />
          <span>Portfolio &amp; Solutions</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
          Our Work &amp; Solution Architecture
        </h1>
        <p className="text-base sm:text-lg text-brand-warm-grey leading-relaxed">
          Explore our verified production web platforms, corporate websites, institutional education portals, and bespoke web applications.
        </p>
      </section>

      {/* Transparency Banner */}
      <section className="glass-card rounded-2xl md:rounded-3xl p-5 flex items-start space-x-3.5 text-xs sm:text-sm text-brand-warm-grey border border-white/10">
        <Info className="w-5 h-5 text-brand-amber flex-shrink-0 mt-0.5" />
        <p>
          <strong className="text-white font-semibold">Integrity Notice: </strong>
          In accordance with our strict quality standards, all portfolio items listed below are <span className="text-emerald-400 font-medium">Verified Projects</span> deployed for active organisations, institutions, and businesses across South Africa.
        </p>
      </section>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        {categories.map((tab) => {
          const active = filter === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                active
                  ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.25)]'
                  : 'glass-pill text-brand-warm-grey hover:text-white hover:border-brand-amber/40'
              }`}
            >
              {tab === 'All' ? 'All Solutions' : tab}
            </button>
          );
        })}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((p) => (
          <PortfolioCard key={p.id} project={p} />
        ))}
      </div>

    </div>
  );
};
