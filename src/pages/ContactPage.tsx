import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle, Clock, Shield } from 'lucide-react';
import { apiRequest } from '../api/client';
import { SEO } from '../components/SEO';

export const ContactPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedService = searchParams.get('service') || '';

  const [formData, setFormData] = useState({
    full_name: '',
    organization: '',
    email: '',
    phone: '',
    service_required: preselectedService || 'Website design and development',
    estimated_budget: '',
    project_description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    referenceNumber: string;
    message: string;
  } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  // Load public company details
  const [companyDetails, setCompanyDetails] = useState<{
    company_name: string;
    registration_number?: string;
    email?: string;
    phone?: string;
    physical_address?: string;
  }>({
    company_name: 'S&S Tech Group (Pty) Ltd',
    registration_number: '2026/802170/07',
    email: 'info@sstechgroup.co.za',
    phone: '069 884 7200',
    physical_address: 'South Africa',
  });

  useEffect(() => {
    if (preselectedService) {
      setFormData((prev) => ({ ...prev, service_required: preselectedService }));
    }

    apiRequest<{ company: any }>('/settings/public')
      .then((res) => {
        if (res.company) {
          setCompanyDetails(res.company);
        }
      })
      .catch(() => {
        // Fallback default
      });
  }, [preselectedService]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim() || formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Full name is required (minimum 2 characters)';
    }

    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'A valid email address is required';
    }

    if (!formData.service_required) {
      newErrors.service_required = 'Please select a service';
    }

    if (!formData.project_description.trim() || formData.project_description.trim().length < 10) {
      newErrors.project_description = 'Please describe your project requirements (minimum 10 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest<{
        success: boolean;
        message: string;
        referenceNumber: string;
      }>('/enquiries', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (response.success) {
        setSubmissionSuccess({
          referenceNumber: response.referenceNumber,
          message: response.message,
        });
        setFormData({
          full_name: '',
          organization: '',
          email: '',
          phone: '',
          service_required: 'Website design and development',
          estimated_budget: '',
          project_description: '',
        });
      } else {
        setServerError('Submission could not be completed.');
      }
    } catch (err: any) {
      setServerError(
        err.message || 'Unable to submit enquiry at this time. Please verify connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-16 py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <SEO
        title="Contact Our Team & Project Enquiries"
        description="Speak to our digital solutions team or submit your project requirements. Phone/WhatsApp: 069 884 7200, Email: info@sstechgroup.co.za."
        keywords="contact web developers south africa, hire web design agency durban johannesburg, project enquiry, sstech group contact"
      />
      <div className="bg-spotlight-beam opacity-60" />

      {/* Page Header */}
      <section className="text-center max-w-3xl mx-auto space-y-4 relative z-10">
        <div className="inline-flex items-center space-x-2 px-4 py-1 rounded-full glass-pill text-xs font-semibold tracking-wider uppercase text-brand-champagne">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-amber animate-pulse" />
          <span>Project Intake</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
          Start a Project With Us
        </h1>
        <p className="text-base sm:text-lg text-brand-warm-grey leading-relaxed">
          Tell us about your organization and digital requirements. Our team will review your scope and provide a structured technical proposal.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-2 glass-card rounded-2xl md:rounded-3xl p-6 sm:p-10 border border-white/10 relative overflow-hidden">
          
          {submissionSuccess ? (
            <div className="py-12 px-6 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-brand-amber/40 flex items-center justify-center text-brand-champagne mx-auto shadow-[0_0_25px_rgba(246,115,0,0.3)]">
                <CheckCircle2 className="w-10 h-10 text-brand-amber" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Enquiry Recorded Successfully
              </h2>
              <div className="inline-block px-4 py-2 rounded-full glass-pill font-mono text-xs text-brand-champagne border border-brand-amber/30">
                Reference Code: {submissionSuccess.referenceNumber}
              </div>
              <p className="text-sm text-brand-warm-grey max-w-md mx-auto leading-relaxed">
                {submissionSuccess.message}
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setSubmissionSuccess(null)}
                  className="px-7 py-3 rounded-full text-xs sm:text-sm font-semibold bg-white text-black hover:bg-neutral-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)]"
                >
                  Submit Another Enquiry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              
              {serverError && (
                <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/50 flex items-start space-x-3 text-red-300 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{serverError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label htmlFor="full_name" className="block text-xs font-semibold uppercase tracking-wider text-white mb-2">
                    Full Name <span className="text-brand-amber">*</span>
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="e.g. Sipho Ndlovu"
                    className={`w-full px-4 py-3 rounded-xl bg-white/[0.04] border text-white text-sm placeholder-brand-warm-grey/50 focus:outline-none focus:border-brand-amber transition-colors ${
                      errors.full_name ? 'border-red-500' : 'border-white/10'
                    }`}
                  />
                  {errors.full_name && (
                    <p className="text-xs text-red-400 mt-1">{errors.full_name}</p>
                  )}
                </div>

                {/* Business / Organisation */}
                <div>
                  <label htmlFor="organization" className="block text-xs font-semibold uppercase tracking-wider text-white mb-2">
                    Business / Organisation <span className="text-brand-warm-grey text-[10px] lowercase">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="organization"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="e.g. Apex Legal Services (Pty) Ltd"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder-brand-warm-grey/50 focus:outline-none focus:border-brand-amber transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Email Address */}
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-white mb-2">
                    Email Address <span className="text-brand-amber">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@company.co.za"
                    className={`w-full px-4 py-3 rounded-xl bg-white/[0.04] border text-white text-sm placeholder-brand-warm-grey/50 focus:outline-none focus:border-brand-amber transition-colors ${
                      errors.email ? 'border-red-500' : 'border-white/10'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-400 mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-white mb-2">
                    Phone Number <span className="text-brand-warm-grey text-[10px] lowercase">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +27 82 123 4567"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder-brand-warm-grey/50 focus:outline-none focus:border-brand-amber transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Service Required */}
                <div>
                  <label htmlFor="service_required" className="block text-xs font-semibold uppercase tracking-wider text-white mb-2">
                    Service Required <span className="text-brand-amber">*</span>
                  </label>
                  <select
                    id="service_required"
                    value={formData.service_required}
                    onChange={(e) => setFormData({ ...formData, service_required: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#120F0B] border border-white/10 text-white text-sm focus:outline-none focus:border-brand-amber transition-colors"
                  >
                    <option value="Website design and development">Website design and development</option>
                    <option value="Web hosting and domain services">Web hosting and domain services</option>
                    <option value="Web application development">Web application development</option>
                    <option value="Email marketing and automated campaigns">Email marketing and automated campaigns</option>
                    <option value="Website maintenance and support">Website maintenance and support</option>
                    <option value="Workflow automation & internal tools">Workflow automation &amp; internal tools</option>
                    <option value="Other bespoke digital solution">Other bespoke digital solution</option>
                  </select>
                </div>

                {/* Estimated Budget */}
                <div>
                  <label htmlFor="estimated_budget" className="block text-xs font-semibold uppercase tracking-wider text-white mb-2">
                    Estimated Budget <span className="text-brand-warm-grey text-[10px] lowercase">(optional)</span>
                  </label>
                  <select
                    id="estimated_budget"
                    value={formData.estimated_budget}
                    onChange={(e) => setFormData({ ...formData, estimated_budget: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#120F0B] border border-white/10 text-white text-sm focus:outline-none focus:border-brand-amber transition-colors"
                  >
                    <option value="">Select an approximate range (ZAR)</option>
                    <option value="Under R 15,000">Under R 15,000</option>
                    <option value="R 15,000 - R 30,000">R 15,000 - R 30,000</option>
                    <option value="R 30,000 - R 60,000">R 30,000 - R 60,000</option>
                    <option value="R 60,000 - R 120,000">R 60,000 - R 120,000</option>
                    <option value="R 120,000+">R 120,000+</option>
                    <option value="To be determined during scoping">To be determined during scoping</option>
                  </select>
                </div>
              </div>

              {/* Project Description */}
              <div>
                <label htmlFor="project_description" className="block text-xs font-semibold uppercase tracking-wider text-white mb-2">
                  Project Description &amp; Objectives <span className="text-brand-amber">*</span>
                </label>
                <textarea
                  id="project_description"
                  rows={5}
                  value={formData.project_description}
                  onChange={(e) => setFormData({ ...formData, project_description: e.target.value })}
                  placeholder="Please outline the purpose of your project, target audience, key functional needs, and any existing systems..."
                  className={`w-full px-4 py-3 rounded-xl bg-white/[0.04] border text-white text-sm placeholder-brand-warm-grey/50 focus:outline-none focus:border-brand-amber transition-colors ${
                    errors.project_description ? 'border-red-500' : 'border-white/10'
                  }`}
                />
                {errors.project_description && (
                  <p className="text-xs text-red-400 mt-1">{errors.project_description}</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full text-base font-bold bg-white text-black hover:bg-neutral-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    'Recording Enquiry...'
                  ) : (
                    <>
                      Submit Project Enquiry
                      <Send className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-brand-warm-grey/80">
                🔒 Your contact details are stored securely on our verified internal database and used solely for addressing your enquiry. No third-party marketing or spam.
              </p>
            </form>
          )}

        </div>

        {/* Right Column: Contact Details & Integrity Notice */}
        <div className="space-y-6">
          
          <div className="glass-card rounded-2xl md:rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold text-white">
              Company Details
            </h3>

            <div className="space-y-4 text-sm text-brand-warm-grey">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-white block mb-0.5">
                  Entity Name:
                </span>
                <span className="text-brand-champagne font-semibold">{companyDetails.company_name}</span>
              </div>

              {companyDetails.registration_number ? (
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-white block mb-0.5">
                    Registration No:
                  </span>
                  <span>{companyDetails.registration_number}</span>
                </div>
              ) : null}

              {companyDetails.email ? (
                <div className="flex items-start space-x-3">
                  <Mail className="w-4 h-4 text-brand-amber mt-1 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-white block">Email</span>
                    <a href={`mailto:${companyDetails.email}`} className="text-brand-champagne hover:underline">
                      {companyDetails.email}
                    </a>
                  </div>
                </div>
              ) : null}

              {companyDetails.phone ? (
                <div className="flex items-start space-x-3">
                  <Phone className="w-4 h-4 text-brand-amber mt-1 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-white block">Phone &amp; WhatsApp</span>
                    <a href={`tel:${companyDetails.phone.replace(/\s+/g, '')}`} className="text-white hover:text-brand-champagne">
                      {companyDetails.phone}
                    </a>
                    <div className="mt-1">
                      <a
                        href="https://wa.me/27698847200?text=Hi%20S%26S%20Tech%20Group,%20I'd%20like%20to%20enquire%20about%20a%20project"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                      >
                        <span>Chat on WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              ) : null}

              {companyDetails.physical_address ? (
                <div className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 text-brand-amber mt-1 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-white block">Address</span>
                    <span>{companyDetails.physical_address}</span>
                  </div>
                </div>
              ) : null}

              {/* If details are pending client approval */}
              {!companyDetails.email && !companyDetails.phone && !companyDetails.physical_address && (
                <div className="p-3.5 rounded-2xl glass-pill text-xs text-brand-warm-grey space-y-1">
                  <span className="text-brand-champagne font-semibold block">Configurable Contact Channel</span>
                  <p>Direct intake via this secured web form is monitored daily by S&amp;S Tech Group leadership.</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 text-xs text-brand-warm-grey space-y-2">
              <div className="flex items-center space-x-2 text-white font-medium">
                <Clock className="w-3.5 h-3.5 text-brand-amber" />
                <span>Response Turnaround</span>
              </div>
              <p>
                We review inbound project briefs within 1–2 business days to schedule an initial scoping session.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl md:rounded-3xl glass-card border border-white/10 space-y-3">
            <div className="flex items-center space-x-2 text-white font-semibold text-xs uppercase tracking-wider">
              <Shield className="w-4 h-4 text-brand-amber" />
              <span>Commercial Terms</span>
            </div>
            <p className="text-xs text-brand-warm-grey leading-relaxed">
              Timelines, deliverables, payment milestones, and technical specifications are formally confirmed in an official S&amp;S Tech Group quotation prior to project commencement.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
