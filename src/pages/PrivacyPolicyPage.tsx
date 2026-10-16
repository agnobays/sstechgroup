import React from 'react';
import { Shield, Lock, FileText, CheckCircle2, UserCheck, AlertTriangle } from 'lucide-react';
import { SEO } from '../components/SEO';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative">
      <SEO
        title="POPIA Privacy Policy & Data Protection"
        description="Review our ethical data stewardship framework, Protection of Personal Information Act (POPIA) compliance, and zero external AI model training guarantee."
        keywords="popia compliance south africa, privacy policy web development, data protection south africa, zero ai training data policy"
        canonical="/privacy-policy"
      />
      <div className="bg-spotlight-beam opacity-60" />
      
      {/* Header */}
      <div className="space-y-4 text-center relative z-10">
        <div className="inline-flex items-center space-x-2 px-4 py-1 rounded-full glass-pill text-xs font-semibold tracking-wider uppercase text-brand-champagne">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-amber animate-pulse" />
          <span>POPIA &amp; Data Governance</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Privacy Policy &amp; Data Protection Notice
        </h1>
        <p className="text-sm text-brand-warm-grey">
          S&amp;S Tech Group (Pty) Ltd is committed to ethical data stewardship, transparent information handling, and strict compliance with the Protection of Personal Information Act (POPIA).
        </p>
      </div>

      <div className="glass-card rounded-2xl md:rounded-3xl border border-white/10 p-8 sm:p-12 space-y-8 text-xs sm:text-sm text-brand-warm-grey leading-relaxed">
        
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-brand-off-white flex items-center">
            <Shield className="w-5 h-5 text-brand-gold mr-2" />
            1. Purpose and Information We Collect
          </h2>
          <p>
            When you interact with S&amp;S Tech Group (Pty) Ltd through our official website, interactive quotation assistant, or contact forms, we collect only personal and business information strictly necessary to scope, estimate, and execute digital technology solutions:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li><strong>Identifying Information:</strong> Full name, professional title, business or organisation name.</li>
            <li><strong>Contact Details:</strong> Official business email address and telephone numbers.</li>
            <li><strong>Project Criteria:</strong> Digital requirements, existing domain/URLs, architectural preferences, and estimated budget ranges.</li>
            <li><strong>Technical Session Metadata:</strong> Session tokens, timestamps, and acceptance confirmation IP addresses to provide verifiable quotation records and prevent fraud.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-brand-off-white flex items-center">
            <Lock className="w-5 h-5 text-brand-gold mr-2" />
            2. Strict AI Model &amp; Third-Party Protection
          </h2>
          <div className="p-4 rounded-xl bg-brand-black border border-brand-gold/30 space-y-2">
            <strong className="text-brand-gold block font-semibold">Zero External Model Training Guarantee:</strong>
            <p className="text-xs">
              We never use customer project data, business logic, confidential documents, or personal contact details to train public or external AI models. All quotation evaluation logic operates using deterministic rule-based pricing engines within private, self-contained server environments.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-brand-off-white flex items-center">
            <FileText className="w-5 h-5 text-brand-gold mr-2" />
            3. Legal Basis &amp; Consent for Processing
          </h2>
          <p>
            We process your information under the following lawful grounds defined by POPIA and international data protection standards:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li><strong>Pre-Contractual &amp; Contractual Necessity:</strong> Generating quotations, issuing tax invoices, and fulfilling development milestones.</li>
            <li><strong>Consent:</strong> When you voluntarily submit the quotation questionnaire or request project follow-ups.</li>
            <li><strong>Statutory Compliance:</strong> Maintaining accurate financial and accounting records as mandated by the South African Revenue Service (SARS) and the Companies Act.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-brand-off-white flex items-center">
            <UserCheck className="w-5 h-5 text-brand-gold mr-2" />
            4. Your Data Subject Rights
          </h2>
          <p>
            Under South African data privacy legislation, you have the right to:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Request confirmation of whether we hold your personal records.</li>
            <li>Request correction or deletion of inaccurate, irrelevant, or excessive personal information.</li>
            <li>Object to the processing of personal information for marketing purposes at any time.</li>
            <li>Lodge a complaint with the South African Information Regulator if you believe your rights have been infringed.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-brand-off-white flex items-center">
            <AlertTriangle className="w-5 h-5 text-brand-gold mr-2" />
            5. Retention and Data Disposal Policy
          </h2>
          <p>
            Quotation drafts and abandoned questionnaire leads that do not convert into active commercial projects are automatically retired in accordance with our data retention schedule. Financial records, accepted quotes, and tax invoices are retained for the statutory period required by South African commercial law.
          </p>
        </section>

        {/* Section 6 */}
        <section className="pt-4 border-t border-brand-border/60 text-xs text-brand-warm-grey">
          <p>
            For privacy inquiries, data subject access requests, or consent updates, please reach out to our Information Officer via our official contact email at <a href="mailto:info@sstechgroup.co.za" className="text-brand-gold hover:underline">info@sstechgroup.co.za</a> or telephone / WhatsApp at <a href="tel:0698847200" className="text-brand-gold hover:underline">069 884 7200</a>.
          </p>
          <p className="mt-2 text-[11px] text-brand-warm-grey/60">
            Last updated: October 2026 • S&amp;S Tech Group (Pty) Ltd.
          </p>
        </section>

      </div>

    </div>
  );
};
