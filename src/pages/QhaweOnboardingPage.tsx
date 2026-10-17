import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Palette,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Send,
  Sliders,
  Printer,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Lock,
  Globe,
  FileCheck,
  Upload,
  Image as ImageIcon,
  Trash2,
  Edit3,
  Check,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { SEO } from '../components/SEO';

const LOCAL_STORAGE_KEY = 'sstech_qhawe_onboarding_draft';
const LOCAL_STORAGE_REF_KEY = 'sstech_qhawe_submission_ref';

export const QhaweOnboardingPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Auto-save active');
  const [submitSuccess, setSubmitSuccess] = useState<{
    referenceNumber: string;
    message: string;
    receivedAt: string;
    revision?: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form State with sensible defaults extracted from qhawecreditsolutions.co.za
  const [form, setForm] = useState({
    // Step 1: Contact & Entity
    organization: 'Qhawe Credit Solutions',
    website: 'https://qhawecreditsolutions.co.za',
    contact_name: '',
    contact_role: 'Director / Operations Manager',
    email: 'info@qhawecreditsolutions.co.za',
    phone: '079 910 9392',
    office_address: 'Suite 4, 120 Florida Road, Morningside, Durban, 4001',
    ncr_status: 'Application in progress (to replace placeholder NCRCP00000)',
    cipc_number: '2026/000000/07',

    // Step 2: Brand & Design Identity
    logo_status: 'Vector SVG available, can supply high-res transparent PNG',
    logo_download_link: '',
    logo_file: null as { name: string; size: number; type: string; dataUrl: string } | null,
    app_icon_symbol: 'Use "Q" Shield / Crest motif',
    primary_color: '#0A2540', // Navy
    accent_color: '#D97706',  // Gold
    neutral_bg: '#F8FAFC',
    heading_font: 'DM Serif Display',
    body_font: 'Plus Jakarta Sans',
    photography_style: 'Curated professional South African lifestyle & Durban imagery',
    tone_of_voice: 'Warm, community-first, transparent & encouraging ("Credit that helps you move forward")',
    languages: 'English (with optional isiZulu language toggle)',

    // Step 3: Loan Products & Tier Caps
    short_term_min: '1000',
    short_term_max: '8000',
    short_term_first_time_cap: '2500',
    short_term_terms: '1 to 6 months',

    personal_min: '5000',
    personal_max: '150000',
    personal_first_time_cap: '15000',
    personal_terms: '12 to 60 months',

    debt_consolidation_min: '10000',
    debt_consolidation_max: '150000',
    business_loan_max: '250000',

    // Step 4: Fees & NCA Caps
    interest_rate_structure: 'Standard National Credit Act cap (5% per month on first loan, 3% on repeat)',
    initiation_fee_structure: 'Standard NCA statutory formula (R165 + 10% on amount above R1,000, capped at R1,050 + VAT)',
    monthly_service_fee: 'R69.00 (R60 + VAT)',
    credit_life_insurance: 'Optional / Integrated via registered insurance partner',
    insurance_partner_name: '',

    // Step 5: Underwriting & Pre-Screening Rules
    min_age: '18',
    citizenship_requirement: 'Valid South African 13-digit green book or smart ID card',
    min_net_salary: '4500',
    min_employment_months: '3',
    accepted_employment: [
      'Permanently employed (salary payslip)',
      'Fixed-term contract workers',
      'Self-employed / registered business owners'
    ],
    auto_decline_debt_review: true,
    auto_decline_admin_order: true,
    auto_decline_sequestration: true,
    auto_decline_judgments: true,

    // Step 6: Customer UX & Operational Configuration
    desired_subdomain: 'apply.qhawecreditsolutions.co.za',
    sms_sender_id: 'QhaweCredit',
    whatsapp_bot_enabled: true,
    whatsapp_number: '079 910 9392',
    operating_model: 'Hybrid (100% automated instant approval for loans <= R8,000; 1-click underwriter signoff for loans > R8,000)',
    admin_team_emails: 'info@qhawecreditsolutions.co.za',
    notification_alerts: 'Email alerts + WhatsApp instant summary to operations',

    // Step 7: Additional notes
    legal_docs_ready: 'Standard pre-agreement statement (Form 20.1) & terms and conditions available',
    special_requirements: ''
  });

  // Restore draft or previous submission on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref') || localStorage.getItem(LOCAL_STORAGE_REF_KEY);

    if (refParam) {
      setSubmittedRef(refParam);
      // Fetch latest recorded submission from server if available
      fetch(`/api/onboarding/${refParam}`)
        .then((res) => res.json())
        .then((result) => {
          if (result.success && result.submission?.data) {
            setForm((prev) => ({ ...prev, ...result.submission.data }));
            setLastSavedTime('Synced with server');
          }
        })
        .catch(() => {
          // If offline, fallback to local storage draft
          try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) setForm((prev) => ({ ...prev, ...JSON.parse(saved) }));
          } catch (e) {}
        });
    } else {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          setForm((prev) => ({ ...prev, ...JSON.parse(saved) }));
          setLastSavedTime('Draft restored from browser storage');
        }
      } catch (e) {}
    }
  }, []);

  // Save to local storage on change with quota safeguard
  const updateField = (key: string, value: any) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        setLastSavedTime('Saved to browser');
      } catch (e) {
        // If localStorage quota is exceeded (e.g. large file upload), save draft without the heavy dataUrl
        try {
          const draftSafe = {
            ...updated,
            logo_file: updated.logo_file ? { ...updated.logo_file, dataUrl: '' } : null,
          };
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draftSafe));
          setLastSavedTime('Saved to browser');
        } catch (inner) {}
      }
      return updated;
    });
  };

  const handleEmploymentToggle = (type: string) => {
    const list = [...form.accepted_employment];
    const index = list.indexOf(type);
    if (index > -1) {
      list.splice(index, 1);
    } else {
      list.push(type);
    }
    updateField('accepted_employment', list);
  };

  // Direct Logo File Upload handler with canvas optimization
  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('Logo file size is too large (max 15MB). Please choose a smaller file or paste a cloud link.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl = reader.result as string;

      // If it's a bitmap image (JPEG/PNG/WEBP), optimize via canvas for snappy storage & upload
      if (file.type.startsWith('image/') && !file.type.includes('svg')) {
        const img = new Image();
        img.onload = () => {
          try {
            const maxDim = 1200;
            let width = img.width;
            let height = img.height;

            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
              const optimizedDataUrl = canvas.toDataURL(outputMime, 0.88);
              updateField('logo_file', {
                name: file.name,
                size: Math.round(optimizedDataUrl.length * 0.75),
                type: outputMime,
                dataUrl: optimizedDataUrl,
              });
              updateField('logo_status', `Uploaded file: ${file.name}`);
              return;
            }
          } catch (canvasErr) {
            console.warn('Canvas optimization fallback to raw:', canvasErr);
          }

          updateField('logo_file', {
            name: file.name,
            size: file.size,
            type: file.type,
            dataUrl: rawDataUrl,
          });
          updateField('logo_status', `Uploaded file: ${file.name}`);
        };
        img.onerror = () => {
          updateField('logo_file', {
            name: file.name,
            size: file.size,
            type: file.type,
            dataUrl: rawDataUrl,
          });
          updateField('logo_status', `Uploaded file: ${file.name}`);
        };
        img.src = rawDataUrl;
      } else {
        // SVG or other documents stored as raw
        updateField('logo_file', {
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: rawDataUrl,
        });
        updateField('logo_status', `Uploaded file: ${file.name}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    updateField('logo_file', null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const isUpdating = isEditing && submittedRef;
      const endpoint = isUpdating ? `/api/onboarding/${submittedRef}` : '/api/onboarding';
      const method = isUpdating ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_slug: 'qhawe',
          organization: form.organization.trim(),
          contact_name: (form.contact_name || 'Qhawe Representative').trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          data: form,
        }),
      });

      // Safely parse JSON or handle plain text/HTML error pages without throwing SyntaxError
      let data: any = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        if (res.status === 413) {
          throw new Error('The uploaded logo file is too large for the server. Please try a smaller file or provide a cloud link.');
        }
        throw new Error(text || `Server returned error (${res.status})`);
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit onboarding form. Please verify the fields.');
      }

      const activeRef = data.referenceNumber || submittedRef;
      if (activeRef) {
        setSubmittedRef(activeRef);
        localStorage.setItem(LOCAL_STORAGE_REF_KEY, activeRef);
      }

      setSubmitSuccess({
        referenceNumber: activeRef || 'SPEC-QHAWE',
        message: data.message || 'Specifications recorded successfully.',
        receivedAt: data.updatedAt || data.receivedAt || new Date().toISOString(),
        revision: data.revision || 1,
      });

      setIsEditing(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error occurred. Please try submitting again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, title: 'Company & Contact', icon: Building2 },
    { id: 2, title: 'Brand Identity', icon: Palette },
    { id: 3, title: 'Loan Products', icon: CreditCard },
    { id: 4, title: 'Fees & NCA Caps', icon: Sliders },
    { id: 5, title: 'Underwriting Rules', icon: ShieldCheck },
    { id: 6, title: 'UX & Operations', icon: Globe },
    { id: 7, title: 'Review & Submit', icon: Send },
  ];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <SEO
        title="Qhawe Credit Solutions — Platform Onboarding | S&S Tech Group"
        description="Official technical onboarding questionnaire and specifications intake for Qhawe Credit Solutions digital lending platform."
      />

      {/* Header Banner */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Project Kickoff & Technical Specifications
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Qhawe Credit Solutions <span className="text-brand-gold font-normal">×</span> S&S Tech Group
        </h1>
        <p className="mt-3 text-base text-gray-400 max-w-2xl mx-auto">
          Please confirm your brand identity, loan product limits, and underwriting rules so we can configure your
          automated 15-minute digital lending web application.
        </p>
      </div>

      {submitSuccess ? (
        <div className="bg-brand-gray/40 border border-brand-gold/40 rounded-2xl p-8 sm:p-12 text-center shadow-2xl backdrop-blur-sm">
          <div className="w-16 h-16 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
            <Check className="w-3.5 h-3.5" />
            {submitSuccess.revision && submitSuccess.revision > 1
              ? `Updated Revision (v${submitSuccess.revision}) Live on Admin Dashboard`
              : 'Specifications Cataloged (v1)'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Specifications Successfully Recorded</h2>
          <p className="text-gray-300 max-w-lg mx-auto mb-6">
            Thank you, team Qhawe! Your lending platform requirements, branding parameters, and underwriting rules have been
            securely cataloged in our portal.
          </p>

          <div className="bg-brand-black/60 border border-gray-700/60 rounded-xl p-6 max-w-md mx-auto mb-8 text-left">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Official Reference Number</div>
            <div className="text-xl font-mono font-bold text-brand-gold select-all">{submitSuccess.referenceNumber}</div>
            <div className="mt-3 text-xs text-gray-400">
              Recorded at: <span className="text-gray-200">{new Date(submitSuccess.receivedAt).toLocaleString()}</span>
            </div>
            {submitSuccess.revision && submitSuccess.revision > 1 && (
              <div className="mt-1 text-xs text-emerald-400">
                Revision count: <span className="font-semibold">v{submitSuccess.revision}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 justify-center items-center">
            <button
              onClick={() => {
                setIsEditing(true);
                setSubmitSuccess(null);
                setActiveStep(1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-6 py-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-semibold flex items-center gap-2 border border-blue-500/40 transition shadow-md"
            >
              <Edit3 className="w-4 h-4 text-blue-400" /> Make Changes / Edit Specifications
            </button>
            <button
              onClick={() => window.print()}
              className="px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium flex items-center gap-2 border border-gray-600 transition"
            >
              <Printer className="w-4 h-4" /> Print / Save Summary
            </button>
            <a
              href={`https://wa.me/27698847200?text=Hi%20S%26S%20Tech%20Group,%20we%20just%20submitted%20the%20Qhawe%20lending%20platform%20specifications%20(Ref:%20${submitSuccess.referenceNumber})`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg bg-brand-gold hover:bg-brand-gold-light text-brand-black font-semibold flex items-center gap-2 transition"
            >
              <Phone className="w-4 h-4" /> WhatsApp Us
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Editing / Previous Submission Banner */}
          {submittedRef && isEditing && (
            <div className="p-4 rounded-xl bg-blue-950/70 border border-blue-500/40 text-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white">
                    Editing Specifications — Reference: <span className="font-mono text-brand-gold">{submittedRef}</span>
                  </p>
                  <p className="text-[11px] text-blue-300">
                    Any changes you submit will immediately reflect on the S&S Tech Group Admin Dashboard with an updated revision timestamp.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setSubmitSuccess({
                    referenceNumber: submittedRef,
                    message: 'Viewing previously recorded specifications.',
                    receivedAt: new Date().toISOString(),
                  });
                }}
                className="text-xs text-blue-300 hover:text-white underline font-medium self-end sm:self-center"
              >
                Return to Summary
              </button>
            </div>
          )}

          {submittedRef && !isEditing && (
            <div className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-500/30 text-amber-200 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-brand-gold shrink-0" />
                <span>You have a submitted specification on file (<strong className="font-mono text-brand-gold">{submittedRef}</strong>).</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="font-semibold text-brand-gold hover:underline"
              >
                Edit &amp; Update Changes &rarr;
              </button>
            </div>
          )}

          <div className="bg-brand-gray/30 border border-gray-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
            {/* Step Pill Navigation & Autosave status */}
            <div className="border-b border-gray-800 bg-brand-black/50 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="overflow-x-auto pb-1 sm:pb-0">
                <div className="flex items-center min-w-[620px] gap-2">
                  {steps.map((s) => {
                    const Icon = s.icon;
                    const isActive = activeStep === s.id;
                    const isPassed = activeStep > s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setActiveStep(s.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                          isActive
                            ? 'bg-brand-gold text-brand-black shadow-md'
                            : isPassed
                            ? 'bg-brand-gold/10 text-brand-gold border border-brand-gold/20'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800/40'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{s.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 shrink-0 self-end sm:self-auto font-mono">
                <RefreshCw className="w-3 h-3 text-brand-gold animate-spin-slow" />
                <span>{lastSavedTime}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8">
              {errorMsg && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{errorMsg}</span>
                </div>
              )}

            {/* STEP 1: Company & Contact */}
            {activeStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-gray-800 pb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-brand-gold" />
                    Company & Authorized Contact
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Your contact information will be used for sandbox staging notifications and developer updates.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Company / Entity Name</label>
                    <input
                      type="text"
                      value={form.organization}
                      onChange={(e) => updateField('organization', e.target.value)}
                      className="w-full bg-brand-black border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Current Website</label>
                    <input
                      type="text"
                      value={form.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      className="w-full bg-brand-black border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Authorized Contact Person *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sindiwe / Mthokozisi"
                      value={form.contact_name}
                      onChange={(e) => updateField('contact_name', e.target.value)}
                      className="w-full bg-brand-black border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Role / Designation</label>
                    <input
                      type="text"
                      value={form.contact_role}
                      onChange={(e) => updateField('contact_role', e.target.value)}
                      className="w-full bg-brand-black border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Official Email Address *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="w-full bg-brand-black border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Direct Mobile / WhatsApp Phone *</label>
                    <input
                      type="text"
                      required
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className="w-full bg-brand-black border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand-gold focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Physical Office Address</label>
                    <input
                      type="text"
                      value={form.office_address}
                      onChange={(e) => updateField('office_address', e.target.value)}
                      className="w-full bg-brand-black border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand-gold focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-300 mb-1">NCR Registration Status / Notes</label>
                    <input
                      type="text"
                      value={form.ncr_status}
                      onChange={(e) => updateField('ncr_status', e.target.value)}
                      placeholder="e.g. Registered NCRCP12345 or Application in progress with NCR"
                      className="w-full bg-brand-black border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand-gold focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Brand Identity & Design */}
            {activeStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-gray-800 pb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Palette className="w-5 h-5 text-brand-gold" />
                    Brand Identity & Visual System
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Configure your visual identity so the new app matches Qhawe's brand standards.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Direct Logo Upload Component */}
                  <div className="sm:col-span-2 p-4 rounded-xl bg-brand-black/60 border border-gray-700/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-white flex items-center gap-2">
                        <Upload className="w-4 h-4 text-brand-gold" />
                        Upload Brand Logo (Direct File Upload)
                      </label>
                      <span className="text-[10px] text-gray-400">SVG, PNG, JPG, WebP, PDF (Max 10MB)</span>
                    </div>

                    {form.logo_file ? (
                      <div className="p-3.5 rounded-lg bg-gray-900 border border-brand-gold/40 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 overflow-hidden">
                          {form.logo_file.type?.startsWith('image/') || form.logo_file.dataUrl?.startsWith('data:image/') ? (
                            <img
                              src={form.logo_file.dataUrl}
                              alt="Uploaded logo"
                              className="w-14 h-14 object-contain rounded bg-white/10 p-1 border border-gray-700 shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded bg-white/10 flex items-center justify-center shrink-0 border border-gray-700">
                              <ImageIcon className="w-6 h-6 text-brand-gold" />
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-white truncate">{form.logo_file.name}</p>
                            <p className="text-[11px] text-brand-gold font-mono">
                              {(form.logo_file.size / 1024).toFixed(1)} KB &bull; Uploaded &amp; attached to specification
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded text-xs font-semibold bg-gray-800 text-gray-200 hover:text-white border border-gray-700"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="p-1.5 rounded text-xs text-red-400 hover:bg-red-500/20"
                            title="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-700 hover:border-brand-gold rounded-xl p-6 text-center cursor-pointer transition bg-gray-900/40 hover:bg-gray-900/70"
                      >
                        <Upload className="w-8 h-8 text-brand-gold mx-auto mb-2 opacity-80" />
                        <p className="text-xs font-bold text-white mb-0.5">
                          Click to browse or drop your logo here
                        </p>
                        <p className="text-[11px] text-gray-400">
                          Vector SVG or transparent high-res PNG recommended for crisp rendering
                        </p>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".svg,.png,.jpg,.jpeg,.webp,.pdf"
                      onChange={handleLogoFileSelect}
                      className="hidden"
                    />

                    <div className="pt-2 border-t border-gray-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <span className="text-gray-400">Prefer sharing a cloud folder instead?</span>
                      <input
                        type="text"
                        placeholder="Or paste Google Drive / Dropbox link here..."
                        value={form.logo_download_link}
                        onChange={(e) => updateField('logo_download_link', e.target.value)}
                        className="bg-brand-black border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-brand-gold focus:outline-none flex-1 max-w-sm"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Logo Format Availability Status</label>
                    <select
                      value={form.logo_status}
                      onChange={(e) => updateField('logo_status', e.target.value)}
                      className="w-full bg-brand-black border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand-gold focus:outline-none"
                    >
                      <option>Vector SVG available, can supply high-res transparent PNG</option>
                      <option>High-res PNG only (transparent background)</option>
                      <option>Please pull and optimize the logo from our live website</option>
                      <option>We need brand/logo touch-ups or refresh</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Primary Color (Navy)</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={form.primary_color}
                        onChange={(e) => updateField('primary_color', e.target.value)}
                        className="h-10 w-12 bg-transparent cursor-pointer rounded border border-gray-700 p-0.5"
                      />
                      <input
                        type="text"
                        value={form.primary_color}
                        onChange={(e) => updateField('primary_color', e.target.value)}
                        className="w-full bg-brand-black border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-gold font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Accent / Action Color (Gold)</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={form.accent_color}
                        onChange={(e) => updateField('accent_color', e.target.value)}
                        className="h-10 w-12 bg-transparent cursor-pointer rounded border border-gray-700 p-0.5"
                      />
                      <input
                        type="text"
                        value={form.accent_color}
                        onChange={(e) => updateField('accent_color', e.target.value)}
                        className="w-full bg-brand-black border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-gold font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Heading Font Preference</label>
                    <input
                      type="text"
                      value={form.heading_font}
                      onChange={(e) => updateField('heading_font', e.target.value)}
                      className="w-full bg-brand-black border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Body Text Font Preference</label>
                    <input
                      type="text"
                      value={form.body_font}
                      onChange={(e) => updateField('body_font', e.target.value)}
                      className="w-full bg-brand-black border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand-gold focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Copywriting Tone of Voice</label>
                    <input
                      type="text"
                      value={form.tone_of_voice}
                      onChange={(e) => updateField('tone_of_voice', e.target.value)}
                      className="w-full bg-brand-black border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand-gold focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Language Options</label>
                    <input
                      type="text"
                      value={form.languages}
                      onChange={(e) => updateField('languages', e.target.value)}
                      className="w-full bg-brand-black border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand-gold focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Loan Products & Tiers */}
            {activeStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-gray-800 pb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-brand-gold" />
                    Loan Products & Slider Ranges
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Define the limits for borrower sliders and maximum exposure caps for first-time applicants.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Short Term */}
                  <div className="bg-brand-black/60 p-4 rounded-xl border border-gray-800">
                    <div className="font-semibold text-brand-gold text-sm mb-3">1. Short-Term / Payday Loan (Instant Automated Flow)</div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Min Amount (R)</label>
                        <input
                          type="number"
                          value={form.short_term_min}
                          onChange={(e) => updateField('short_term_min', e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 rounded px-2.5 py-1.5 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Max Amount (R)</label>
                        <input
                          type="number"
                          value={form.short_term_max}
                          onChange={(e) => updateField('short_term_max', e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 rounded px-2.5 py-1.5 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">First-Time Cap (R)</label>
                        <input
                          type="number"
                          value={form.short_term_first_time_cap}
                          onChange={(e) => updateField('short_term_first_time_cap', e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 rounded px-2.5 py-1.5 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Terms Allowed</label>
                        <input
                          type="text"
                          value={form.short_term_terms}
                          onChange={(e) => updateField('short_term_terms', e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 rounded px-2.5 py-1.5 text-sm text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Personal Loan */}
                  <div className="bg-brand-black/60 p-4 rounded-xl border border-gray-800">
                    <div className="font-semibold text-brand-gold text-sm mb-3">2. Personal Loans (Medium/Long-Term)</div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Min Amount (R)</label>
                        <input
                          type="number"
                          value={form.personal_min}
                          onChange={(e) => updateField('personal_min', e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 rounded px-2.5 py-1.5 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Max Amount (R)</label>
                        <input
                          type="number"
                          value={form.personal_max}
                          onChange={(e) => updateField('personal_max', e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 rounded px-2.5 py-1.5 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">First-Time Cap (R)</label>
                        <input
                          type="number"
                          value={form.personal_first_time_cap}
                          onChange={(e) => updateField('personal_first_time_cap', e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 rounded px-2.5 py-1.5 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Terms Allowed</label>
                        <input
                          type="text"
                          value={form.personal_terms}
                          onChange={(e) => updateField('personal_terms', e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 rounded px-2.5 py-1.5 text-sm text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* High Value */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Debt Consolidation Max (R)</label>
                      <input
                        type="number"
                        value={form.debt_consolidation_max}
                        onChange={(e) => updateField('debt_consolidation_max', e.target.value)}
                        className="w-full bg-brand-black border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Business Loan Max (R)</label>
                      <input
                        type="number"
                        value={form.business_loan_max}
                        onChange={(e) => updateField('business_loan_max', e.target.value)}
                        className="w-full bg-brand-black border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Fees & NCA Caps */}
            {activeStep === 4 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-gray-800 pb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-brand-gold" />
                    Interest Rates & National Credit Act (NCA) Fees
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Confirm your fee parameters so the loan amortization calculator outputs legally compliant quotations.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Interest Rate Structure</label>
                    <input
                      type="text"
                      value={form.interest_rate_structure}
                      onChange={(e) => updateField('interest_rate_structure', e.target.value)}
                      className="w-full bg-brand-black border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Initiation Fee Formula</label>
                    <input
                      type="text"
                      value={form.initiation_fee_structure}
                      onChange={(e) => updateField('initiation_fee_structure', e.target.value)}
                      className="w-full bg-brand-black border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Monthly Service Fee</label>
                    <input
                      type="text"
                      value={form.monthly_service_fee}
                      onChange={(e) => updateField('monthly_service_fee', e.target.value)}
                      className="w-full bg-brand-black border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Credit Life Insurance</label>
                    <input
                      type="text"
                      value={form.credit_life_insurance}
                      onChange={(e) => updateField('credit_life_insurance', e.target.value)}
                      placeholder="e.g. Optional, or required for loans > R10,000"
                      className="w-full bg-brand-black border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Underwriting Rules */}
            {activeStep === 5 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-gray-800 pb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-brand-gold" />
                    Automated Underwriting & Rejection Rules
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Free rule filters applied before calling paid credit bureau APIs to keep cost per application low.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Minimum Borrower Age</label>
                    <select
                      value={form.min_age}
                      onChange={(e) => updateField('min_age', e.target.value)}
                      className="w-full bg-brand-black border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white"
                    >
                      <option value="18">18 years old</option>
                      <option value="21">21 years old</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Minimum Net Monthly Banked Salary (R)</label>
                    <input
                      type="number"
                      value={form.min_net_salary}
                      onChange={(e) => updateField('min_net_salary', e.target.value)}
                      className="w-full bg-brand-black border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-300 mb-2">Accepted Employment Types (Select all that apply)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      {[
                        'Permanently employed (salary payslip)',
                        'Fixed-term contract workers',
                        'Self-employed / registered business owners',
                        'Commission earners',
                        'Pension / SASSA grant recipients'
                      ].map((item) => (
                        <label key={item} className="flex items-center gap-2 bg-brand-black/40 border border-gray-800 p-2.5 rounded-lg cursor-pointer hover:border-gray-700">
                          <input
                            type="checkbox"
                            checked={form.accepted_employment.includes(item)}
                            onChange={() => handleEmploymentToggle(item)}
                            className="rounded border-gray-700 text-brand-gold focus:ring-brand-gold"
                          />
                          <span className="text-gray-300 text-xs">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="sm:col-span-2 mt-2">
                    <label className="block text-xs font-semibold text-gray-300 mb-2">Automatic Disqualifiers (Credit Bureau Hard Declines)</label>
                    <div className="space-y-2">
                      {[
                        { key: 'auto_decline_debt_review', label: 'Decline if customer is currently under Debt Review / Debt Counselling' },
                        { key: 'auto_decline_admin_order', label: 'Decline if customer is under Administration' },
                        { key: 'auto_decline_sequestration', label: 'Decline if customer has active Sequestration' },
                        { key: 'auto_decline_judgments', label: 'Decline if customer has unpaid default judgments' }
                      ].map((d) => (
                        <label key={d.key} className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(form as any)[d.key]}
                            onChange={(e) => updateField(d.key, e.target.checked)}
                            className="rounded border-gray-700 text-brand-gold focus:ring-brand-gold"
                          />
                          <span>{d.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: UX & Operations */}
            {activeStep === 6 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-gray-800 pb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-brand-gold" />
                    Customer UX & Operational Setup
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Set up your web address, SMS sender name, and underwriter administrative workflow.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Target Application Subdomain</label>
                    <input
                      type="text"
                      value={form.desired_subdomain}
                      onChange={(e) => updateField('desired_subdomain', e.target.value)}
                      className="w-full bg-brand-black border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">SMS Sender ID (Max 11 Characters)</label>
                    <input
                      type="text"
                      maxLength={11}
                      value={form.sms_sender_id}
                      onChange={(e) => updateField('sms_sender_id', e.target.value)}
                      className="w-full bg-brand-black border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Operating Model</label>
                    <select
                      value={form.operating_model}
                      onChange={(e) => updateField('operating_model', e.target.value)}
                      className="w-full bg-brand-black border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white"
                    >
                      <option>Hybrid (100% automated instant approval for loans up to R8,000; 1-click underwriter signoff for loans over R8,000)</option>
                      <option>100% Fully Automated 24/7 (Instant approval & payout if all bureau & statement rules pass)</option>
                      <option>Manual Underwriting (System gathers docs, staff reviews every application before disbursal)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Staff / Underwriter Email Addresses for Admin Access</label>
                    <input
                      type="text"
                      value={form.admin_team_emails}
                      onChange={(e) => updateField('admin_team_emails', e.target.value)}
                      placeholder="e.g. loans@qhawecreditsolutions.co.za, manager@..."
                      className="w-full bg-brand-black border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: Review & Submit */}
            {activeStep === 7 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-gray-800 pb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-brand-gold" />
                    Review & Submit Specifications
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Review your parameters before submitting to the S&S Tech Group engineering team.
                  </p>
                </div>

                <div className="bg-brand-black/60 rounded-xl p-5 border border-gray-800 text-xs space-y-3">
                  <div className="flex justify-between border-b border-gray-800 pb-2">
                    <span className="text-gray-400">Organization:</span>
                    <span className="text-white font-semibold">{form.organization}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-800 pb-2">
                    <span className="text-gray-400">Contact Person:</span>
                    <span className="text-white font-semibold">{form.contact_name} ({form.phone})</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-800 pb-2">
                    <span className="text-gray-400">Short-Term Loan Range:</span>
                    <span className="text-brand-gold font-mono">R{form.short_term_min} – R{form.short_term_max} (Cap: R{form.short_term_first_time_cap})</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-800 pb-2">
                    <span className="text-gray-400">Personal Loan Range:</span>
                    <span className="text-brand-gold font-mono">R{form.personal_min} – R{form.personal_max}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-800 pb-2">
                    <span className="text-gray-400">Minimum Net Salary:</span>
                    <span className="text-white font-mono">R{form.min_net_salary} / month</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-800 pb-2">
                    <span className="text-gray-400">Target Subdomain:</span>
                    <span className="text-white font-mono">{form.desired_subdomain}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-800 pb-2">
                    <span className="text-gray-400">Brand Logo:</span>
                    <span className="text-white font-medium flex items-center gap-1.5">
                      {form.logo_file ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">{form.logo_file.name} ({(form.logo_file.size / 1024).toFixed(1)} KB)</span>
                        </>
                      ) : form.logo_download_link ? (
                        <span className="text-brand-gold truncate max-w-xs">{form.logo_download_link}</span>
                      ) : (
                        <span className="text-gray-400">{form.logo_status}</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">SMS Sender ID:</span>
                    <span className="text-white font-mono">{form.sms_sender_id}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Any Special Notes or Requirements for Engineering</label>
                  <textarea
                    rows={3}
                    value={form.special_requirements}
                    onChange={(e) => updateField('special_requirements', e.target.value)}
                    placeholder="e.g. Please ensure WhatsApp notifications are delivered in both English and isiZulu..."
                    className="w-full bg-brand-black border border-gray-700 rounded-lg p-3 text-xs text-white"
                  ></textarea>
                </div>
              </div>
            )}

            {/* Step Controls */}
            <div className="mt-8 pt-6 border-t border-gray-800 flex items-center justify-between">
              {activeStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setActiveStep((prev) => prev - 1)}
                  className="px-4 py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
              ) : (
                <div></div>
              )}

              {activeStep < 7 ? (
                <button
                  type="button"
                  onClick={() => setActiveStep((prev) => prev + 1)}
                  className="px-5 py-2.5 rounded-lg bg-brand-gold hover:bg-brand-gold-light text-brand-black text-xs font-bold flex items-center gap-1.5 transition"
                >
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-3 rounded-lg text-white text-xs font-bold flex items-center gap-2 shadow-lg transition disabled:opacity-50 ${
                    isEditing && submittedRef
                      ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                      : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20'
                  }`}
                >
                  {isSubmitting ? (
                    'Recording Specifications...'
                  ) : isEditing && submittedRef ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Save &amp; Update Changes (Sync to Admin)
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Submit Specifications to S&S Tech Group
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      )}
    </div>
  );
};
