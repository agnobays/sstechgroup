import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Server, Shield, Sparkles, HelpCircle } from 'lucide-react';
import { apiRequest } from '../api/client';
import { Package, OptionalService } from '../types';
import { SEO } from '../components/SEO';

export const PackagesPage: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [optionalServices, setOptionalServices] = useState<OptionalService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ packages: Package[]; optionalServices: OptionalService[] }>('/packages')
      .then((data) => {
        setPackages(data.packages);
        setOptionalServices(data.optionalServices);
      })
      .catch(() => {
        // Fallback default catalogue
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-20 py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <SEO
        title="Website Packages & Pricing Rates South Africa"
        description="Transparent website design packages and custom application pricing in South Africa. Starter websites from R 7,500, Business platforms from R 12,500."
        keywords="website design pricing south africa, affordable website packages, web development rates durban johannesburg, enterprise web costs, email marketing pricing"
      />
      <div className="bg-spotlight-beam opacity-60" />

      {/* Header */}
      <section className="text-center max-w-3xl mx-auto space-y-4 relative z-10">
        <div className="inline-flex items-center space-x-2 px-4 py-1 rounded-full glass-pill text-xs font-semibold tracking-wider uppercase text-brand-champagne">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-amber animate-pulse" />
          <span>Transparent Pricing Catalogue</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
          Website &amp; Solution Packages
        </h1>
        <p className="text-base sm:text-lg text-brand-warm-grey leading-relaxed">
          Approved baseline packages, transparent inclusions, and configurable digital services engineered for South African businesses and organisations.
        </p>
      </section>

      {/* Package Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {packages.map((pkg) => {
          const isPro = pkg.key === 'business';
          return (
            <div
              key={pkg.id}
              className={`rounded-2xl md:rounded-3xl border flex flex-col justify-between p-6 sm:p-7 relative transition-all duration-300 ${
                isPro
                  ? 'glass-card border-brand-amber/50 shadow-[0_0_35px_rgba(246,115,0,0.2)]'
                  : 'glass-card border-white/10 hover:border-brand-amber/30'
              }`}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-brand-amber to-brand-gold text-black text-[10px] font-bold uppercase tracking-wider shadow-md">
                  Most Popular
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-white mb-2">{pkg.name}</h3>
                <p className="text-xs text-brand-warm-grey mb-4 min-h-[36px]">{pkg.description}</p>

                <div className="py-4 border-y border-white/10 mb-5">
                  <span className="text-[10px] text-brand-champagne/80 uppercase tracking-wider block font-medium">
                    {pkg.key === 'custom_app' ? 'Starting From' : 'Package Total'}
                  </span>
                  <div className="flex items-baseline space-x-1 mt-1">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-brand-champagne">
                      R {pkg.starting_price.toLocaleString()}
                    </span>
                    <span className="text-xs text-brand-warm-grey">once-off</span>
                  </div>
                  {pkg.key === 'custom_app' && (
                    <span className="text-[10px] text-brand-warm-grey/70 mt-1 block">
                      Subject to technical scope assessment
                    </span>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white block">
                    Inclusions:
                  </span>
                  <ul className="space-y-2">
                    {(pkg.features || []).map((feat, idx) => (
                      <li key={idx} className="flex items-start text-xs text-brand-warm-grey">
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-amber mr-2 mt-0.5 flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <div className="pt-4 border-t border-white/10 mb-4">
                  <span className="text-[10px] uppercase tracking-wider text-brand-warm-grey/70 block">
                    Ideal for:
                  </span>
                  <span className="text-xs text-white font-medium block mt-0.5">
                    {pkg.ideal_for}
                  </span>
                </div>

                <Link
                  to={`/get-a-quote?package=${pkg.key}`}
                  className={`w-full flex items-center justify-center py-2.5 px-4 rounded-full text-xs font-bold transition-all ${
                    isPro
                      ? 'bg-white text-black hover:bg-neutral-100 shadow-[0_0_20px_rgba(255,255,255,0.25)]'
                      : 'glass-pill text-white hover:bg-white hover:text-black'
                  }`}
                >
                  <span>Get a Quote for This</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </section>

      {/* Optional Infrastructure & Maintenance Add-ons */}
      <section className="glass-card rounded-2xl md:rounded-3xl p-8 sm:p-12 space-y-8">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-0.5 rounded-full glass-pill text-xs font-semibold uppercase tracking-wider text-brand-champagne mb-2">
            <span>Add-on Infrastructure</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Optional Managed Services &amp; Support
          </h2>
          <p className="mt-2 text-sm text-brand-warm-grey max-w-2xl leading-relaxed">
            Enhance your web platform with enterprise-grade cloud hosting, proactive maintenance, domain registration, and business email setup.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {optionalServices.map((opt) => (
            <div key={opt.id} className="p-6 rounded-2xl glass-card space-y-3 flex flex-col justify-between hover:border-brand-amber/30 transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">{opt.name}</h3>
                  <Server className="w-4 h-4 text-brand-amber" />
                </div>
                <div className="mt-2 text-lg font-black font-mono text-brand-champagne">
                  R {opt.price.toLocaleString()}
                  <span className="text-xs text-brand-warm-grey font-sans font-normal ml-1">
                    /{opt.billing_cycle === 'once_off' ? 'once-off' : opt.billing_cycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-brand-warm-grey leading-relaxed">
                  {opt.description}
                </p>
              </div>

              <div className="pt-3 border-t border-white/10">
                <span className="text-[10px] text-brand-champagne/80 uppercase tracking-wider block">
                  Addable during quotation
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Advisory on Custom Scopes */}
      <section className="rounded-3xl glass-card border border-brand-amber/30 p-8 sm:p-10 text-center max-w-3xl mx-auto space-y-4 shadow-2xl relative overflow-hidden">
        <div className="w-12 h-12 rounded-2xl bg-white/5 text-brand-champagne flex items-center justify-center mx-auto border border-brand-amber/30 shadow-[0_0_15px_rgba(246,115,0,0.2)]">
          <HelpCircle className="w-6 h-6 text-brand-amber" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white">
          Require Specific Integrations or Enterprise Architecture?
        </h3>
        <p className="text-xs sm:text-sm text-brand-warm-grey leading-relaxed max-w-xl mx-auto">
          Use our interactive AI Quotation Assistant to specify your exact feature matrix, compliance needs, and database requirements for a customized estimate.
        </p>
        <div className="pt-2">
          <Link
            to="/get-a-quote"
            className="inline-flex items-center px-7 py-3 rounded-full text-sm font-bold bg-white text-black hover:bg-neutral-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)]"
          >
            Launch Interactive Quotation Assistant
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </section>

    </div>
  );
};
