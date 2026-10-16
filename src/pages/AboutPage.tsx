import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Target, Compass, Award, Users, CheckCircle2, Shield, ArrowRight } from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { SEO } from '../components/SEO';
import { apiRequest } from '../api/client';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  image_url: string;
  bio: string;
  sort_order: number;
}

export const AboutPage: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>([
    { id: 1, name: '', role: '', image_url: '/images/team/team-1.jpg', bio: '', sort_order: 1 },
    { id: 2, name: '', role: '', image_url: '/images/team/team-2.jpg', bio: '', sort_order: 2 },
    { id: 3, name: '', role: '', image_url: '/images/team/team-3.jpg', bio: '', sort_order: 3 },
    { id: 4, name: '', role: '', image_url: '/images/team/team-4.jpg', bio: '', sort_order: 4 },
    { id: 5, name: '', role: '', image_url: '/images/team/team-5.jpg', bio: '', sort_order: 5 },
    { id: 6, name: '', role: '', image_url: '/images/team/team-6.jpg', bio: '', sort_order: 6 },
  ]);

  useEffect(() => {
    apiRequest<{ team: TeamMember[] }>('/team')
      .then((res) => {
        if (res.team && res.team.length > 0) {
          setTeam(res.team);
        }
      })
      .catch(() => {
        // Fallback to default initial list
      });
  }, []);

  return (
    <div className="space-y-20 py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <SEO
        title="About Our Digital Technology & Engineering Firm"
        description="Learn about S&S Tech Group (Pty) Ltd: an independent South African digital technology firm building reliable, accessible web solutions, applications, and hosting."
        keywords="about sstech group, south african software company, digital agency durban, corporate web development team, popia compliant web developers"
      />
      <div className="bg-spotlight-beam opacity-70" />

      {/* Intro Header */}
      <section className="text-center max-w-3xl mx-auto space-y-4 relative z-10">
        <div className="inline-flex items-center space-x-2 px-4 py-1 rounded-full glass-pill text-xs font-semibold tracking-wider uppercase text-brand-champagne">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-amber animate-pulse" />
          <span>About S&amp;S Tech Group</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
          Purpose-Driven Digital Engineering
        </h1>
        <p className="text-base sm:text-lg text-brand-warm-grey leading-relaxed">
          S&amp;S Tech Group (Pty) Ltd is an independent South African digital technology company dedicated to creating clean, reliable and accessible digital systems for businesses, educational institutions and organisations.
        </p>
      </section>

      {/* Company Introduction & Background */}
      <section className="glass-card rounded-2xl md:rounded-3xl p-8 sm:p-12 relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Who We Are
            </h2>
            <p className="text-sm sm:text-base text-brand-warm-grey leading-relaxed">
              We specialise in modern web architecture, digital platforms, cloud hosting configuration and workflow software. We focus on practical, maintainable solutions that solve real business problems rather than vanity metrics or speculative complexity.
            </p>
            <p className="text-sm sm:text-base text-brand-warm-grey leading-relaxed">
              Whether building an authoritative web presence for an enterprise, structuring departmental workflows for an academic body, or providing dependable hosting and technical support, our work is defined by precision, clarity, and accountability.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl glass-pill text-center border border-white/10">
              <span className="text-brand-champagne font-black text-2xl font-mono block">100%</span>
              <span className="text-[11px] text-brand-warm-grey uppercase tracking-wider mt-1 block">Production Standards</span>
            </div>
            <div className="p-5 rounded-2xl glass-pill text-center border border-white/10">
              <span className="text-brand-champagne font-black text-2xl font-mono block">Modern</span>
              <span className="text-[11px] text-brand-warm-grey uppercase tracking-wider mt-1 block">Full-Stack Stack</span>
            </div>
            <div className="p-5 rounded-2xl glass-pill text-center border border-white/10">
              <span className="text-brand-champagne font-black text-2xl font-mono block">South Africa</span>
              <span className="text-[11px] text-brand-warm-grey uppercase tracking-wider mt-1 block">Registered &amp; Based</span>
            </div>
            <div className="p-5 rounded-2xl glass-pill text-center border border-white/10">
              <span className="text-brand-champagne font-black text-2xl font-mono block">Verified</span>
              <span className="text-[11px] text-brand-warm-grey uppercase tracking-wider mt-1 block">Honest Reporting</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-2xl md:rounded-3xl glass-card space-y-4 hover:border-brand-amber/40 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-brand-amber/30 text-brand-champagne flex items-center justify-center shadow-[0_0_15px_rgba(246,115,0,0.2)]">
            <Target className="w-6 h-6 text-brand-amber" />
          </div>
          <h2 className="text-2xl font-bold text-white">Our Mission</h2>
          <p className="text-sm text-brand-warm-grey leading-relaxed">
            To equip businesses and institutions with reliable, high-performing digital systems that elevate their operations, establish lasting market credibility, and connect seamlessly with their audiences.
          </p>
        </div>

        <div className="p-8 rounded-2xl md:rounded-3xl glass-card space-y-4 hover:border-brand-amber/40 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-brand-amber/30 text-brand-champagne flex items-center justify-center shadow-[0_0_15px_rgba(246,115,0,0.2)]">
            <Compass className="w-6 h-6 text-brand-amber" />
          </div>
          <h2 className="text-2xl font-bold text-white">Our Vision</h2>
          <p className="text-sm text-brand-warm-grey leading-relaxed">
            To be a trusted South African technology partner recognized for craftsmanship, ethical engineering, uncompromising data security, and long-term client empowerment.
          </p>
        </div>
      </section>

      {/* Values */}
      <section>
        <SectionHeading
          badge="Guiding Principles"
          title="The Values That Guide Our Work"
          subtitle="Every project we undertake is governed by commitments that safeguard quality, security, and partnership trust."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Engineering Excellence',
              desc: 'We use proven, modern technologies, semantic standards, and thorough automated testing to build durable systems.',
            },
            {
              title: 'Absolute Transparency',
              desc: 'No vague jargon, no hidden fees, and no fabricated claims. We communicate clearly at every milestone.',
            },
            {
              title: 'Client Empowerment',
              desc: 'We provide structured documentation, training, and clean handovers so clients own and understand their digital assets.',
            },
            {
              title: 'Security & Privacy',
              desc: 'Rigorous data protection, strict server-side access controls, and zero exposure of confidential credentials.',
            },
          ].map((val, idx) => (
            <div key={idx} className="p-6 rounded-2xl glass-card space-y-3 hover:border-brand-amber/30 transition-all">
              <span className="w-2 h-2 rounded-full bg-brand-amber block" />
              <h3 className="text-base font-bold text-white">{val.title}</h3>
              <p className="text-xs text-brand-warm-grey leading-relaxed">{val.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Leadership & Engineering Team */}
      <section className="space-y-10">
        <SectionHeading
          badge="Leadership & Engineering"
          title="The Team Driving Your Digital Solutions"
          subtitle="A multidisciplinary collective of systems engineers, UI/UX designers, and digital architects committed to delivering robust, production-grade software."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {team.map((member) => (
            <div
              key={member.id}
              className="glass-card rounded-2xl border border-white/10 overflow-hidden group hover:border-brand-amber/40 transition-all duration-300 flex flex-col justify-between max-w-sm mx-auto w-full shadow-lg"
            >
              <div>
                {/* Compact Portrait Frame */}
                <div className="relative aspect-[4/5] max-h-72 sm:max-h-80 bg-neutral-900 overflow-hidden">
                  <img
                    src={member.image_url}
                    alt={member.name || `Team Member`}
                    className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/team/team-1.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080705] via-transparent to-transparent opacity-90 group-hover:opacity-75 transition-opacity" />

                  {/* Text Overlay */}
                  <div className="absolute bottom-4 left-5 right-5 space-y-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-brand-champagne block font-semibold drop-shadow">
                      {member.role || 'Engineering & Digital Solutions'}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight drop-shadow-md">
                      {member.name || 'Team Specialist'}
                    </h3>
                  </div>
                </div>

                {/* Optional Bio */}
                {member.bio && (
                  <div className="p-5">
                    <p className="text-xs text-brand-warm-grey leading-relaxed">
                      {member.bio}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Approach to Client Relationships */}
      <section className="glass-card rounded-2xl md:rounded-3xl p-8 sm:p-12 space-y-6">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-0.5 rounded-full glass-pill text-xs font-semibold uppercase tracking-wider text-brand-champagne mb-2">
            <span>Partnership Philosophy</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Our Approach to Client Relationships
          </h2>
          <p className="mt-4 text-sm sm:text-base text-brand-warm-grey leading-relaxed">
            We operate as an extension of your technical team. We believe the most successful digital solutions arise from open collaboration, realistic scopes, and continuous feedback.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center">
              <CheckCircle2 className="w-4 h-4 text-brand-amber mr-2" />
              Agreed Deliverables First
            </h4>
            <p className="text-xs text-brand-warm-grey leading-relaxed">
              Every initiative starts with an itemised scope, transparent line-item estimates, and confirmed deliverables.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center">
              <CheckCircle2 className="w-4 h-4 text-brand-amber mr-2" />
              Direct Communication
            </h4>
            <p className="text-xs text-brand-warm-grey leading-relaxed">
              You speak directly with the engineers and designers architecting your software, eliminating costly misunderstandings.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center">
              <CheckCircle2 className="w-4 h-4 text-brand-amber mr-2" />
              Accountability Beyond Launch
            </h4>
            <p className="text-xs text-brand-warm-grey leading-relaxed">
              We stand by our work through post-launch check-ins, security updates, and dependable maintenance agreements.
            </p>
          </div>
        </div>
      </section>

      {/* Technology & Quality Standards */}
      <section className="space-y-6">
        <SectionHeading
          badge="Engineering Standards"
          title="Technology Stack & Quality Standards"
          subtitle="We adhere to modern industry standards to guarantee responsive behaviour, high accessibility, and rock-solid uptime."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-7 rounded-2xl md:rounded-3xl glass-card">
            <h3 className="text-sm font-bold text-brand-champagne uppercase tracking-wider mb-2">Frontend</h3>
            <p className="text-xs text-brand-warm-grey mb-3">React 18+, TypeScript, Tailwind CSS, Vite for lightning-fast asset compilation and modular component systems.</p>
            <div className="flex flex-wrap gap-1.5 text-[11px] font-mono text-brand-warm-grey">
              <span className="glass-pill px-2.5 py-0.5 rounded-full">TypeScript</span>
              <span className="glass-pill px-2.5 py-0.5 rounded-full">React</span>
              <span className="glass-pill px-2.5 py-0.5 rounded-full">Tailwind</span>
            </div>
          </div>

          <div className="p-7 rounded-2xl md:rounded-3xl glass-card">
            <h3 className="text-sm font-bold text-brand-champagne uppercase tracking-wider mb-2">Backend &amp; APIs</h3>
            <p className="text-xs text-brand-warm-grey mb-3">Node.js, Express, strict schema validation (Zod), and SQLite / PostgreSQL with ACID transactions and WAL mode.</p>
            <div className="flex flex-wrap gap-1.5 text-[11px] font-mono text-brand-warm-grey">
              <span className="glass-pill px-2.5 py-0.5 rounded-full">Express</span>
              <span className="glass-pill px-2.5 py-0.5 rounded-full">SQLite / PG</span>
              <span className="glass-pill px-2.5 py-0.5 rounded-full">Zod</span>
            </div>
          </div>

          <div className="p-7 rounded-2xl md:rounded-3xl glass-card">
            <h3 className="text-sm font-bold text-brand-champagne uppercase tracking-wider mb-2">Hosting &amp; Security</h3>
            <p className="text-xs text-brand-warm-grey mb-3">Automated SSL, DNSSEC configuration, rate limiting, bcrypt password hashing, and zero credential exposure.</p>
            <div className="flex flex-wrap gap-1.5 text-[11px] font-mono text-brand-warm-grey">
              <span className="glass-pill px-2.5 py-0.5 rounded-full">SSL / TLS</span>
              <span className="glass-pill px-2.5 py-0.5 rounded-full">Bcrypt</span>
              <span className="glass-pill px-2.5 py-0.5 rounded-full">JWT</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center pt-8">
        <Link
          to="/contact"
          className="inline-flex items-center px-8 py-3.5 rounded-full text-base font-bold bg-white text-black hover:bg-neutral-100 transition-all shadow-[0_0_25px_rgba(255,255,255,0.25)]"
        >
          Discuss Your Technical Needs With Us
          <ArrowRight className="w-5 h-5 ml-2" />
        </Link>
      </section>

    </div>
  );
};
