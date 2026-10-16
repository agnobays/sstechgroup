import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Download,
  AlertCircle,
  Mail,
  Send,
  Check,
  X,
  Search,
  Copy,
  CheckCheck,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { Package } from '../types';
import { SEO } from '../components/SEO';

export const GetAQuotePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialPackageParam = searchParams.get('package');

  // Step 1 to 5
  const [currentStep, setCurrentStep] = useState(1);
  const [sessionToken, setSessionToken] = useState<string>(() => {
    return localStorage.getItem('sstg_lead_session') || '';
  });

  // Questionnaire Data State
  const [formData, setFormData] = useState({
    // Step 1: Contact & Entity
    fullName: '',
    email: '',
    phone: '',
    organization: '',
    businessType: 'Corporate / SME',
    consentMarketing: false,
    consentFollowup: true,

    // Step 2: Service & Goals
    serviceRequired: initialPackageParam === 'landing_page' ? 'landing_page' : initialPackageParam === 'custom_app' ? 'custom_app' : 'business_website',
    projectGoals: '',
    targetAudience: '',
    existingWebsite: '',
    hasDomain: true,
    pageCount: initialPackageParam === 'landing_page' ? '1' : initialPackageParam === 'starter' ? '1-3' : initialPackageParam === 'professional' ? '8-15' : '4-7',

    // Step 3: Features & Integrations (Adaptive)
    features: [] as string[],

    // Step 4: Infrastructure Add-ons
    needsHosting: true,
    needsMaintenance: true,
    needsDomain: false,
    needsM365: false,

    // Step 5: Timeline & Budget
    desiredLaunchDate: '',
    budgetRange: 'undisclosed',
    additionalNotes: '',
  });

  // Live evaluation preview from pricing engine
  const [liveEvaluation, setLiveEvaluation] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Generated Official Quote State
  const [generatedQuote, setGeneratedQuote] = useState<{
    access_token: string;
    quote_number: string;
    status: string;
    evaluation: any;
  } | null>(null);

  // Customer acceptance & revision state
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [acceptingQuote, setAcceptingQuote] = useState(false);
  const [acceptanceResult, setAcceptanceResult] = useState<{
    invoice_number: string;
    invoice_id: number;
  } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [revisionSubmitting, setRevisionSubmitting] = useState(false);
  const [revisionSuccess, setRevisionSuccess] = useState(false);

  // Email Quote to Client Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState<string | null>(null);
  const [emailSendError, setEmailSendError] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleEmailQuoteCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatedQuote) return;
    const targetEmail = emailInput.trim() || formData.email.trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setEmailSendError('Please enter a valid email address.');
      return;
    }

    setEmailSending(true);
    setEmailSendError(null);
    setEmailSentSuccess(null);

    try {
      const res = await apiRequest<{ message: string }>(`/public-quotes/${generatedQuote.access_token}/email`, {
        method: 'POST',
        body: JSON.stringify({ recipient_email: targetEmail }),
      });
      setEmailSentSuccess(res.message);
      setTimeout(() => {
        setIsEmailModalOpen(false);
        setEmailSentSuccess(null);
      }, 2500);
    } catch (err: any) {
      setEmailSendError(err.message || 'Failed to email quotation copy.');
    } finally {
      setEmailSending(false);
    }
  };

  // Quote Reference & URL Sharing State
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Quote Retrieval Modal & State
  const [isLookupModalOpen, setIsLookupModalOpen] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupResults, setLookupResults] = useState<any[]>([]);

  // Function to load quote by its access token
  const loadQuoteByToken = async (token: string) => {
    setIsEvaluating(true);
    setErrorMessage(null);
    try {
      const res = await apiRequest<{
        quote: any;
        items: any[];
        invoice: any;
      }>(`/public-quotes/${token}`);

      const q = res.quote;
      setGeneratedQuote({
        access_token: q.access_token,
        quote_number: q.quote_number,
        status: q.status,
        evaluation: {
          recommendedPackage: { id: q.package_id, name: q.package_name || 'Custom Solution' },
          reasoning: q.scope_of_work || q.ai_recommendation_notes || 'Official customised scope of work.',
          assumptions: (q.notes ? q.notes.split('\n') : ['Official quote valid for 30 days.']),
          lineItems: (res.items || []).map((it) => ({
            description: it.description,
            quantity: it.quantity,
            billing_cycle: 'once_off',
            line_total: it.line_total,
          })),
          onceOffSubtotal: q.subtotal,
          onceOffTotal: q.total_amount,
          recurringMonthly: q.recurring_monthly || 0,
          recurringAnnual: q.recurring_annual || 0,
          status: q.status,
        },
      });

      setLiveEvaluation({
        recommendedPackage: { id: q.package_id, name: q.package_name || 'Custom Solution' },
        reasoning: q.scope_of_work || q.ai_recommendation_notes || 'Official customised scope of work.',
        assumptions: (q.notes ? q.notes.split('\n') : ['Official quote valid for 30 days.']),
        lineItems: (res.items || []).map((it) => ({
          description: it.description,
          quantity: it.quantity,
          billing_cycle: 'once_off',
          line_total: it.line_total,
        })),
        onceOffSubtotal: q.subtotal,
        onceOffTotal: q.total_amount,
        recurringMonthly: q.recurring_monthly || 0,
        recurringAnnual: q.recurring_annual || 0,
      });

      setFormData((prev) => ({
        ...prev,
        fullName: q.client_name || prev.fullName,
        email: q.client_email || prev.email,
        phone: q.client_phone || prev.phone,
        organization: q.client_company || prev.organization,
      }));

      if (res.invoice) {
        setAcceptanceResult({
          invoice_number: res.invoice.invoice_number,
          invoice_id: res.invoice.id,
        });
      }

      setIsLookupModalOpen(false);
      setLookupResults([]);
      setLookupQuery('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to load the specified quotation.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Perform Quote Lookup by Reference Number or Email
  const handlePerformLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = lookupQuery.trim();
    if (!q || q.length < 3) {
      setLookupError('Please enter a valid Reference Number (e.g. QT-2026-0001) or email address.');
      return;
    }

    setLookupLoading(true);
    setLookupError(null);
    setLookupResults([]);

    try {
      const res = await apiRequest<{ success: boolean; count: number; quotes: any[] }>('/public-quotes/lookup', {
        method: 'POST',
        body: JSON.stringify({ query: q }),
      });

      if (res.quotes.length === 1) {
        // If exact single match, immediately load it
        await loadQuoteByToken(res.quotes[0].access_token);
      } else {
        // Multiple quotes found under the same email address
        setLookupResults(res.quotes);
      }
    } catch (err: any) {
      setLookupError(err.message || 'No quotation found matching your search. Please check your reference.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCopyReference = (refNumber: string) => {
    navigator.clipboard.writeText(refNumber);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  const handleCopyShareLink = (token: string) => {
    const url = `${window.location.origin}/get-a-quote?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // 1. Initialize or resume lead session or check URL for token/ref
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const refParam = searchParams.get('ref');

    if (tokenParam) {
      loadQuoteByToken(tokenParam);
      return;
    }

    if (refParam) {
      apiRequest<{ success: boolean; count: number; quotes: any[] }>('/public-quotes/lookup', {
        method: 'POST',
        body: JSON.stringify({ query: refParam }),
      })
        .then((res) => {
          if (res.quotes && res.quotes.length > 0) {
            loadQuoteByToken(res.quotes[0].access_token);
          }
        })
        .catch(() => {});
      return;
    }

    apiRequest<{ session_token: string; lead: any }>('/leads/init', {
      method: 'POST',
      body: JSON.stringify({ session_token: sessionToken || undefined }),
    })
      .then((res) => {
        setSessionToken(res.session_token);
        localStorage.setItem('sstg_lead_session', res.session_token);
        if (res.lead?.questionnaire_data && Object.keys(res.lead.questionnaire_data).length > 0) {
          setFormData((prev) => ({ ...prev, ...res.lead.questionnaire_data }));
          if (res.lead.step_progress) {
            setCurrentStep(Math.min(res.lead.step_progress, 5));
          }
        }
      })
      .catch(() => {});
  }, [searchParams]);

  // 2. Incremental step saving to lead record
  const saveStepProgress = async (stepNum: number, updatedData: any) => {
    if (!sessionToken) return;
    setIsEvaluating(true);
    try {
      const res = await apiRequest<{ evaluation: any }>(`/leads/${sessionToken}/step`, {
        method: 'PATCH',
        body: JSON.stringify({ step: stepNum, data: updatedData }),
      });
      if (res.evaluation) {
        setLiveEvaluation(res.evaluation);
      }
    } catch {
      // Ignore background sync errors
    } finally {
      setIsEvaluating(false);
    }
  };

  // Trigger evaluation when stepping
  const handleNextStep = () => {
    setErrorMessage(null);

    // Validation
    if (currentStep === 1) {
      if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
        setErrorMessage('Please provide your name (minimum 2 characters).');
        return;
      }
      if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
        setErrorMessage('Please provide a valid email address.');
        return;
      }
    }

    const next = currentStep + 1;
    setCurrentStep(next);
    saveStepProgress(next, formData);
  };

  const handlePrevStep = () => {
    setErrorMessage(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  // Feature toggle helper
  const toggleFeature = (feat: string) => {
    const updatedFeatures = formData.features.includes(feat)
      ? formData.features.filter((f) => f !== feat)
      : [...formData.features, feat];

    const updated = { ...formData, features: updatedFeatures };
    setFormData(updated);
    saveStepProgress(currentStep, updated);
  };

  // Generate Final Official Quotation
  const handleGenerateQuote = async () => {
    setErrorMessage(null);
    setIsEvaluating(true);

    try {
      const res = await apiRequest<{
        success: boolean;
        access_token: string;
        quote_number: string;
        status: string;
        evaluation: any;
      }>('/public-quotes/generate', {
        method: 'POST',
        body: JSON.stringify({
          session_token: sessionToken,
          data: formData,
        }),
      });

      setGeneratedQuote(res);
      setLiveEvaluation(res.evaluation);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to generate quote. Please review your answers.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Customer acceptance submission
  const handleAcceptQuote = async () => {
    if (!termsAgreed) {
      setModalError('Please check the confirmation box below to agree to the commercial payment terms.');
      return;
    }
    if (!generatedQuote) return;
    setAcceptingQuote(true);
    setModalError(null);

    try {
      const res = await apiRequest<{
        success: boolean;
        message: string;
        invoice_number: string;
        invoice_id: number;
      }>(`/public-quotes/${generatedQuote.access_token}/accept`, {
        method: 'POST',
      });

      setAcceptanceResult({
        invoice_number: res.invoice_number,
        invoice_id: res.invoice_id,
      });
      setIsAcceptModalOpen(false);
    } catch (err: any) {
      setModalError(err.message || 'Failed to complete acceptance. Please try again.');
    } finally {
      setAcceptingQuote(false);
    }
  };

  // Customer revision request submission
  const handleRequestRevision = async () => {
    if (!generatedQuote || !revisionNotes.trim()) return;
    setRevisionSubmitting(true);

    try {
      await apiRequest(`/public-quotes/${generatedQuote.access_token}/revise`, {
        method: 'POST',
        body: JSON.stringify({ notes: revisionNotes }),
      });
      setRevisionSuccess(true);
      setTimeout(() => {
        setIsRevisionModalOpen(false);
        setRevisionSuccess(false);
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit revision request.');
    } finally {
      setRevisionSubmitting(false);
    }
  };

  // Adaptive features list based on service
  const getAdaptiveFeatures = () => {
    switch (formData.serviceRequired) {
      case 'education_website':
        return [
          { key: 'admissions_portal', label: 'Student Admissions / Application Intake' },
          { key: 'department_directory', label: 'Faculty & Department Directories' },
          { key: 'document_downloads', label: 'Prospectus, Policy & Calendar Downloads' },
          { key: 'term_calendar', label: 'Academic Term Calendar & Event Notices' },
          { key: 'multi_language', label: 'Multi-Language Accessibility' },
        ];
      case 'custom_app':
      case 'api_automation':
        return [
          { key: 'user_auth', label: 'Secure Multi-User Login & Role Permissions' },
          { key: 'database_integration', label: 'ACID Database Modeling & Storage' },
          { key: 'payments', label: 'Payment Gateway (PayFast, Ozow, Stripe, EFT)' },
          { key: 'api_sync', label: 'Third-Party API Integration & Data Sync' },
          { key: 'pdf_generation', label: 'Automated PDF Generation (Invoices/Reports)' },
          { key: 'audit_logs', label: 'Immutable Audit Trail & Activity Logging' },
        ];
      case 'redesign':
        return [
          { key: 'seo_preservation', label: 'Existing URL & SEO Equity Preservation' },
          { key: 'performance_boost', label: 'Core Web Vitals & Speed Optimization' },
          { key: 'brand_refresh', label: 'Complete Brand & UI Alignment Refresh' },
          { key: 'mobile_overhaul', label: 'Mobile-First Responsive Re-architecture' },
        ];
      default: // business_website
        return [
          { key: 'contact_form', label: 'Custom Enquiry & Quotation Funnel' },
          { key: 'portfolio_showcase', label: 'Project Portfolio & Case Study Showcase' },
          { key: 'email_marketing', label: 'Email Marketing & Automated Newsletter Campaigns' },
          { key: 'whatsapp_integration', label: 'Direct WhatsApp Chat & Social Links' },
          { key: 'google_maps_seo', label: 'Google Business & Maps Geo-Integration' },
          { key: 'cms', label: 'Content Management (Self-service editable)' },
        ];
    }
  };

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative">
      <SEO
        title="Instant AI Web Development Quotation Calculator"
        description="Calculate transparent, instant estimates for website design, custom web applications, e-commerce stores, and email marketing. Download verified PDF quotes instantly."
        keywords="website cost calculator south africa, web design quote online, web development cost estimate, instant web design pricing"
        canonical="/get-a-quote"
      />
      <div className="bg-spotlight-beam opacity-60" />
      
      {/* Header */}
      <section className="text-center max-w-3xl mx-auto space-y-4 relative z-10">
        <div className="inline-flex items-center space-x-2 px-4 py-1 rounded-full glass-pill text-xs font-semibold tracking-wider uppercase text-brand-champagne">
          <Sparkles className="w-3.5 h-3.5 text-brand-amber animate-pulse" />
          <span>Interactive Quotation Assistant</span>
        </div>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
          Get a Tailored Digital Quote
        </h1>
        <p className="text-sm sm:text-base text-brand-warm-grey leading-relaxed">
          Answer a few quick questions about your project requirements. Our deterministic pricing engine will recommend the optimal package and calculate a transparent quote.
        </p>

        {/* Retrieve Quote Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              setLookupError(null);
              setLookupResults([]);
              setIsLookupModalOpen(true);
            }}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full glass-pill border border-brand-amber/30 text-brand-champagne hover:text-white hover:border-brand-amber transition-all text-xs font-semibold shadow-sm"
          >
            <Search className="w-3.5 h-3.5 text-brand-amber" />
            <span>Already have a quote? Retrieve with Ref # or Email</span>
          </button>
        </div>
      </section>

      {/* Generated Quote Screen (If Generated) */}
      {generatedQuote ? (
        <div className="bg-brand-charcoal rounded-2xl border border-brand-gold/40 p-6 sm:p-10 max-w-4xl mx-auto space-y-8 shadow-2xl">
          
          {/* Top Banner with Reference Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-brand-border">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
                Official Quotation Prepared
              </span>
              <div className="flex items-center space-x-2.5 mt-1">
                <h2 className="text-2xl sm:text-3xl font-black text-brand-off-white font-mono">
                  {generatedQuote.quote_number}
                </h2>
                <button
                  type="button"
                  onClick={() => handleCopyReference(generatedQuote.quote_number)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-brand-black border border-brand-border text-brand-warm-grey hover:text-brand-gold hover:border-brand-gold flex items-center space-x-1 transition-all"
                  title="Copy Reference Number"
                >
                  {copiedRef ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Ref</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyShareLink(generatedQuote.access_token)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-brand-black border border-brand-border text-brand-warm-grey hover:text-brand-gold hover:border-brand-gold flex items-center space-x-1 transition-all"
                  title="Copy Direct Link to this Quote"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3 h-3" />
                      <span>Share Link</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-brand-warm-grey mt-1">
                Prepared for <strong className="text-brand-off-white">{formData.fullName}</strong> {formData.organization ? `(${formData.organization})` : ''} • Reference: <span className="font-mono text-brand-champagne font-bold">{generatedQuote.quote_number}</span>
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setGeneratedQuote(null);
                  setCurrentStep(1);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-black text-brand-warm-grey hover:text-white border border-brand-border flex items-center space-x-1"
                title="Create a new quote"
              >
                <RefreshCw className="w-3 h-3" />
                <span>New Quote</span>
              </button>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                generatedQuote.status === 'Accepted'
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                  : 'bg-brand-black text-brand-gold border-brand-gold/40'
              }`}>
                {acceptanceResult ? 'Accepted & Invoiced' : generatedQuote.status}
              </span>
            </div>
          </div>

          {/* Acceptance Outcome Notification */}
          {acceptanceResult && (
            <div className="p-6 rounded-xl bg-emerald-950/40 border border-emerald-700/60 space-y-3">
              <div className="flex items-center space-x-3 text-emerald-400 font-bold text-base">
                <CheckCircle2 className="w-6 h-6" />
                <span>Quotation Accepted &amp; Tax Invoice #{acceptanceResult.invoice_number} Generated!</span>
              </div>
              <p className="text-xs sm:text-sm text-brand-off-white leading-relaxed">
                Thank you for confirming your project with S&amp;S Tech Group (Pty) Ltd. Our engineering team has been notified and will reach out with the onboarding schedule. You can download your official Tax Invoice below.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <a
                  href={`/api/public-quotes/${generatedQuote.access_token}/invoice-pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center px-4 py-2.5 rounded-lg text-xs font-bold bg-brand-gold text-brand-black hover:bg-brand-gold-light transition-all shadow-md"
                >
                  <Download className="w-4 h-4 mr-1.5" /> Download Tax Invoice PDF
                </a>
                <a
                  href={`/api/public-quotes/${generatedQuote.access_token}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center px-4 py-2.5 rounded-lg text-xs font-semibold bg-brand-black text-brand-off-white border border-brand-border hover:border-brand-gold transition-colors"
                >
                  <Download className="w-4 h-4 mr-1.5" /> Download Quotation PDF
                </a>
              </div>
            </div>
          )}

          {/* Scope Explanation */}
          <div className="p-5 rounded-xl bg-brand-black border border-brand-border space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
              Recommended Solution Scope:
            </span>
            <p className="text-sm text-brand-off-white leading-relaxed">
              {liveEvaluation?.reasoning}
            </p>
          </div>

          {/* Line Items Table */}
          <div className="border border-brand-border rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-black text-brand-warm-grey uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 w-20 text-center">Qty</th>
                  <th className="py-3 px-4 w-28 text-right">Cycle</th>
                  <th className="py-3 px-4 w-32 text-right">Amount (ZAR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60">
                {(liveEvaluation?.lineItems || []).map((item: any, idx: number) => (
                  <tr key={idx} className="bg-brand-charcoal">
                    <td className="py-3 px-4 font-medium text-brand-off-white">{item.description}</td>
                    <td className="py-3 px-4 text-center text-brand-warm-grey">{item.quantity}</td>
                    <td className="py-3 px-4 text-right text-brand-warm-grey capitalize">{item.billing_cycle}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-brand-off-white">
                      R {item.line_total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2 text-xs text-brand-warm-grey">
              <span className="font-bold text-brand-off-white block uppercase tracking-wider">
                Assumptions &amp; Delivery Terms:
              </span>
              <ul className="space-y-1 list-disc pl-4 text-[11px]">
                {(liveEvaluation?.assumptions || []).map((asmp: string, idx: number) => (
                  <li key={idx}>{asmp}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 p-5 rounded-xl bg-brand-black border border-brand-border text-xs">
              <div className="flex justify-between text-brand-warm-grey">
                <span>Once-off Implementation:</span>
                <span className="font-mono text-brand-off-white font-bold">
                  R {(liveEvaluation?.onceOffTotal || 0).toFixed(2)}
                </span>
              </div>

              {liveEvaluation?.recurringMonthly > 0 && (
                <div className="flex justify-between text-brand-gold">
                  <span>Recurring Hosting/Care:</span>
                  <span className="font-mono font-bold">
                    R {liveEvaluation.recurringMonthly.toFixed(2)} / month
                  </span>
                </div>
              )}

              {liveEvaluation?.recurringAnnual > 0 && (
                <div className="flex justify-between text-brand-warm-grey">
                  <span>Domain Registration Renewal:</span>
                  <span className="font-mono">
                    R {liveEvaluation.recurringAnnual.toFixed(2)} / year
                  </span>
                </div>
              )}

              <div className="flex justify-between pt-3 border-t border-brand-border font-bold text-base text-brand-gold">
                <span>Total Due on Commencement:</span>
                <span className="font-mono">
                  R {(liveEvaluation?.onceOffTotal || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          {!acceptanceResult && (
            <div className="pt-6 border-t border-brand-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <a
                  href={`/api/public-quotes/${generatedQuote.access_token}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-brand-black text-brand-warm-grey hover:text-brand-off-white border border-brand-border flex items-center"
                >
                  <Download className="w-4 h-4 mr-1.5" /> Download Quote PDF
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setEmailInput(formData.email);
                    setIsEmailModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-brand-black text-brand-warm-grey hover:text-brand-gold border border-brand-border flex items-center"
                >
                  <Mail className="w-4 h-4 mr-1.5" /> Email Quote to Me
                </button>
                <button
                  type="button"
                  onClick={() => setIsRevisionModalOpen(true)}
                  className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-brand-black text-brand-warm-grey hover:text-brand-gold border border-brand-border flex items-center"
                >
                  Request Changes
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsAcceptModalOpen(true)}
                className="w-full sm:w-auto px-8 py-3 rounded-lg text-sm font-bold bg-brand-gold hover:bg-brand-gold-light text-brand-black transition-all shadow-lg hover:shadow-[0_0_20px_rgba(217,173,50,0.3)]"
              >
                Accept Quotation &amp; Proceed
              </button>
            </div>
          )}

        </div>
      ) : (
        /* Questionnaire Steps Flow */
        <div className="glass-card rounded-2xl md:rounded-3xl border border-white/10 p-6 sm:p-10 max-w-3xl mx-auto space-y-8 shadow-2xl relative overflow-hidden">
          
          {/* Step Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-brand-warm-grey">
              <span>Step {currentStep} of 5</span>
              <span className="text-brand-champagne">
                {currentStep === 1 && 'Contact & Organisation'}
                {currentStep === 2 && 'Service Scope & Goals'}
                {currentStep === 3 && 'Features & Architecture'}
                {currentStep === 4 && 'Hosting & Add-ons'}
                {currentStep === 5 && 'Timeline & Review'}
              </span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/10">
              <div
                className="bg-gradient-to-r from-brand-amber to-brand-gold h-full transition-all duration-300"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/60 flex items-start space-x-3 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Contact & Organisation */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-brand-off-white">Contact &amp; Organisation Details</h2>
                <p className="text-xs text-brand-warm-grey mt-0.5">
                  We use these details to prepare your formal quotation record and address your team.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                    Your Full Name <span className="text-brand-gold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Sipho Ndlovu"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                    Email Address <span className="text-brand-gold">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="sipho@company.co.za"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                    Telephone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+27 82 000 0000"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                    Company / Entity Name
                  </label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="e.g. Apex Holdings (Pty) Ltd"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                    Organisation Type
                  </label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                  >
                    <option value="Startup / Small Business">Startup / Small Business</option>
                    <option value="Corporate / SME">Corporate / SME</option>
                    <option value="School / College / University">School / College / University</option>
                    <option value="Non-Profit / NGO">Non-Profit / Community Organisation</option>
                    <option value="Enterprise / Government">Enterprise / Public Institution</option>
                  </select>
                </div>
              </div>

              {/* Privacy & Consent */}
              <div className="p-3.5 rounded-xl bg-brand-black border border-brand-border text-[11px] space-y-2 text-brand-warm-grey">
                <label className="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.consentFollowup}
                    onChange={(e) => setFormData({ ...formData, consentFollowup: e.target.checked })}
                    className="rounded bg-brand-charcoal border-brand-border text-brand-gold focus:ring-brand-gold mt-0.5"
                  />
                  <span>I agree to receive quotation details and follow-up communication regarding this project.</span>
                </label>
                <p className="text-[10px] text-brand-warm-grey/70 pl-5">
                  Protected under S&amp;S Tech Group POPIA privacy safeguards. Your data is never sold or used for training external models.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Service & Goals */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-brand-off-white">Service Selection &amp; Scale</h2>
                <p className="text-xs text-brand-warm-grey mt-0.5">
                  Select your primary project objective to adapt the questions accordingly.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-brand-off-white">
                  Primary Service Required
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'landing_page', label: 'Landing Page / Single-Page (From R 2,500)' },
                    { key: 'business_website', label: 'Business / Corporate Website' },
                    { key: 'education_website', label: 'School / College / University Portal' },
                    { key: 'custom_app', label: 'Custom Web Application / Dashboard' },
                    { key: 'redesign', label: 'Website Redesign & Modernisation' },
                    { key: 'api_automation', label: 'Workflow Automation & API Sync' },
                    { key: 'hosting_maintenance', label: 'Managed Hosting & Technical Care' },
                  ].map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => {
                        const updated = {
                          ...formData,
                          serviceRequired: s.key,
                          pageCount: s.key === 'landing_page' ? '1' : formData.pageCount === '1' ? '4-7' : formData.pageCount,
                        };
                        setFormData(updated);
                        saveStepProgress(currentStep, updated);
                      }}
                      className={`p-3.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                        formData.serviceRequired === s.key
                          ? 'bg-brand-black border-brand-gold text-brand-gold shadow-sm'
                          : 'bg-brand-black/50 border-brand-border text-brand-off-white hover:border-brand-gold/40'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                    Estimated Page Count
                  </label>
                  <select
                    value={formData.pageCount}
                    onChange={(e) => setFormData({ ...formData, pageCount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                  >
                    <option value="1">1 Page (Landing Page / Launchpad — From R 2,500)</option>
                    <option value="1-3">1 - 3 Pages (Starter tier)</option>
                    <option value="4-7">4 - 7 Pages (Business tier)</option>
                    <option value="8-15">8 - 15 Pages (Professional tier)</option>
                    <option value="15+">15+ Pages / Custom Application Scope</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                    Existing Website URL (if any)
                  </label>
                  <input
                    type="text"
                    value={formData.existingWebsite}
                    onChange={(e) => setFormData({ ...formData, existingWebsite: e.target.value })}
                    placeholder="https://example.co.za"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Adaptive Features */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-brand-off-white">Required Functionality &amp; Integrations</h2>
                <p className="text-xs text-brand-warm-grey mt-0.5">
                  Select the key features and operational modules your system requires.
                </p>
              </div>

              <div className="space-y-2">
                {getAdaptiveFeatures().map((f) => {
                  const selected = formData.features.includes(f.key);
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => toggleFeature(f.key)}
                      className={`w-full p-3.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                        selected
                          ? 'bg-brand-black border-brand-gold text-brand-gold shadow-sm'
                          : 'bg-brand-black/50 border-brand-border text-brand-off-white hover:border-brand-gold/40'
                      }`}
                    >
                      <span>{f.label}</span>
                      <CheckCircle2 className={`w-4 h-4 ${selected ? 'text-brand-gold' : 'text-brand-warm-grey/30'}`} />
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                  Project Objectives &amp; Target Audience Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.projectGoals}
                  onChange={(e) => setFormData({ ...formData, projectGoals: e.target.value })}
                  placeholder="Outline key user workflows, design preferences, or specific compliance needs..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Infrastructure & Add-ons */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-brand-off-white">Hosting, Maintenance &amp; Domain</h2>
                <p className="text-xs text-brand-warm-grey mt-0.5">
                  Select optional recurring infrastructure and ongoing care to be included in your quotation.
                </p>
              </div>

              <div className="space-y-3">
                <label className="p-4 rounded-xl bg-brand-black border border-brand-border flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.needsHosting}
                    onChange={(e) => setFormData({ ...formData, needsHosting: e.target.checked })}
                    className="rounded bg-brand-charcoal border-brand-border text-brand-gold focus:ring-brand-gold mt-1"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-brand-off-white block">Managed Cloud Hosting (R350 / month)</span>
                    <span className="text-brand-warm-grey text-[11px]">
                      High-performance SSD cloud hosting, automated SSL encryption, and server monitoring.
                    </span>
                  </div>
                </label>

                <label className="p-4 rounded-xl bg-brand-black border border-brand-border flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.needsMaintenance}
                    onChange={(e) => setFormData({ ...formData, needsMaintenance: e.target.checked })}
                    className="rounded bg-brand-charcoal border-brand-border text-brand-gold focus:ring-brand-gold mt-1"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-brand-off-white block">Ongoing Website Maintenance &amp; Security (R750 / month)</span>
                    <span className="text-brand-warm-grey text-[11px]">
                      Proactive framework patching, routine content updates, automated backups, and bug resolution.
                    </span>
                  </div>
                </label>

                <label className="p-4 rounded-xl bg-brand-black border border-brand-border flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.needsDomain}
                    onChange={(e) => setFormData({ ...formData, needsDomain: e.target.checked })}
                    className="rounded bg-brand-charcoal border-brand-border text-brand-gold focus:ring-brand-gold mt-1"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-brand-off-white block">New Domain Registration (.co.za / international) (R180 / year)</span>
                    <span className="text-brand-warm-grey text-[11px]">
                      Domain registration assistance, nameserver routing, and DNS configuration.
                    </span>
                  </div>
                </label>

                <label className="p-4 rounded-xl bg-brand-black border border-brand-border flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.needsM365}
                    onChange={(e) => setFormData({ ...formData, needsM365: e.target.checked })}
                    className="rounded bg-brand-charcoal border-brand-border text-brand-gold focus:ring-brand-gold mt-1"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-brand-off-white block">Microsoft 365 Business Email Setup (R750 once-off)</span>
                    <span className="text-brand-warm-grey text-[11px]">
                      Custom domain mailbox configuration, MX/SPF/DKIM routing (licences charged separately).
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* STEP 5: Timeline & Review */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-brand-off-white">Timeline &amp; Final Review</h2>
                <p className="text-xs text-brand-warm-grey mt-0.5">
                  Confirm your timeline and generate your official quotation record.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                    Desired Launch Date
                  </label>
                  <input
                    type="date"
                    value={formData.desiredLaunchDate}
                    onChange={(e) => setFormData({ ...formData, desiredLaunchDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                    Target Budget Range (ZAR)
                  </label>
                  <select
                    value={formData.budgetRange}
                    onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                  >
                    <option value="undisclosed">Comfortable with standard package rates</option>
                    <option value="under_5k">Under R 5,000 (Launchpad / Landing Page Tier)</option>
                    <option value="under_10k">R 5,000 - R 10,000 (Starter Website Tier)</option>
                    <option value="10k_20k">R 10,000 - R 20,000</option>
                    <option value="20k_40k">R 20,000 - R 40,000</option>
                    <option value="40k_plus">R 40,000+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                  Additional Scope Notes / Specific Constraints
                </label>
                <textarea
                  rows={2}
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                  placeholder="Any extra details, third-party software to connect, or special requests..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                />
              </div>

              {/* Review card */}
              <div className="p-4 rounded-xl bg-brand-black border border-brand-border/80 text-xs space-y-2">
                <span className="font-bold text-brand-gold uppercase tracking-wider block">Summary of Selection:</span>
                <p className="text-brand-off-white">
                  Client: <strong>{formData.fullName}</strong> ({formData.email})
                </p>
                <p className="text-brand-warm-grey">
                  Selected Service: <span className="text-brand-off-white capitalize">{formData.serviceRequired.replace(/_/g, ' ')}</span> • Page scope: {formData.pageCount}
                </p>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-brand-border flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-brand-black text-brand-warm-grey hover:text-brand-off-white border border-brand-border flex items-center"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Previous Step
              </button>
            ) : <div />}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 rounded-lg text-xs font-bold bg-brand-gold hover:bg-brand-gold-light text-brand-black transition-all shadow-md flex items-center"
              >
                Next Step <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerateQuote}
                disabled={isEvaluating}
                className="px-8 py-3 rounded-lg text-xs font-bold bg-brand-gold hover:bg-brand-gold-light text-brand-black transition-all shadow-lg hover:shadow-[0_0_20px_rgba(217,173,50,0.3)] flex items-center disabled:opacity-50"
              >
                {isEvaluating ? 'Evaluating Requirements...' : 'Generate Official Quotation'}
                <Sparkles className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>

        </div>
      )}

      {/* Acceptance Modal */}
      {isAcceptModalOpen && generatedQuote && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-brand-charcoal border border-brand-border rounded-2xl w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl">
            <h2 className="text-xl font-bold text-brand-off-white">
              Confirm &amp; Accept Quotation {generatedQuote.quote_number}
            </h2>

            <div className="p-4 rounded-xl bg-brand-black border border-brand-border text-xs space-y-2 text-brand-warm-grey">
              <p>
                By accepting this quotation, you authorize S&amp;S Tech Group (Pty) Ltd to initiate technical provisioning according to the documented scope of work.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>Total project fee: <strong>R {liveEvaluation?.onceOffTotal.toFixed(2)}</strong></li>
                <li>Commercial terms: 50% deposit payable upon invoice issue; 50% upon delivery</li>
                <li>An official Tax Invoice with sequential document numbering will be generated immediately</li>
              </ul>
            </div>

            {/* Interactive Terms Agreement Box */}
            <div
              onClick={() => {
                setTermsAgreed(!termsAgreed);
                if (!termsAgreed) setModalError(null);
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                termsAgreed
                  ? 'bg-brand-gold/10 border-brand-gold/70 text-brand-off-white shadow-[0_0_15px_rgba(217,173,50,0.15)]'
                  : 'bg-brand-black/70 border-white/15 text-brand-warm-grey hover:border-white/30'
              }`}
            >
              <input
                type="checkbox"
                checked={termsAgreed}
                onChange={(e) => {
                  setTermsAgreed(e.target.checked);
                  if (e.target.checked) setModalError(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="rounded bg-brand-black border-brand-border text-brand-gold focus:ring-brand-gold mt-0.5 cursor-pointer w-4 h-4"
              />
              <span className="text-xs leading-relaxed select-none">
                I confirm that I am authorized to accept this quotation on behalf of my organisation and agree to the commercial payment terms.
              </span>
            </div>

            {modalError && (
              <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 flex items-start space-x-2.5 text-red-300 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                <span className="leading-relaxed">{modalError}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsAcceptModalOpen(false);
                  setModalError(null);
                }}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-brand-black text-brand-warm-grey hover:text-brand-off-white border border-brand-border cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={acceptingQuote}
                onClick={handleAcceptQuote}
                className="px-6 py-2.5 rounded-lg text-xs font-bold bg-brand-gold text-brand-black hover:bg-brand-gold-light transition-all disabled:opacity-50 cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(217,173,50,0.3)]"
              >
                {acceptingQuote ? 'Generating Invoice...' : 'Confirm Acceptance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revision Request Modal */}
      {isRevisionModalOpen && generatedQuote && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-brand-charcoal border border-brand-border rounded-2xl w-full max-w-lg p-6 sm:p-8 space-y-5 shadow-2xl">
            <h2 className="text-lg font-bold text-brand-off-white">
              Request Scope or Pricing Revision
            </h2>

            {revisionSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-400 text-xs">
                Your revision request has been logged. Our consultants will update your quote shortly.
              </div>
            ) : (
              <>
                <p className="text-xs text-brand-warm-grey">
                  Please let us know what deliverables, timelines, or pricing items you would like adjusted:
                </p>

                <textarea
                  rows={4}
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="e.g. Please remove Microsoft 365 setup, or split into two milestone phases..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                />

                <div className="flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsRevisionModalOpen(false)}
                    className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-brand-black text-brand-warm-grey hover:text-brand-off-white border border-brand-border"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={revisionSubmitting || !revisionNotes.trim()}
                    onClick={handleRequestRevision}
                    className="px-6 py-2.5 rounded-lg text-xs font-bold bg-brand-gold text-brand-black hover:bg-brand-gold-light disabled:opacity-50"
                  >
                    {revisionSubmitting ? 'Submitting...' : 'Submit Revision Request'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Email Quote to Client Modal */}
      {isEmailModalOpen && generatedQuote && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-brand-charcoal border border-brand-border rounded-2xl w-full max-w-md p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-black border border-brand-gold/40 flex items-center justify-center text-brand-gold">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-brand-off-white">Email Quote Copy</h2>
                  <p className="text-[11px] text-brand-warm-grey">Quote #{generatedQuote.quote_number}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="text-brand-warm-grey hover:text-brand-off-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {emailSentSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center space-x-2 text-emerald-300 text-xs">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>{emailSentSuccess}</span>
              </div>
            )}

            {emailSendError && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center space-x-2 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{emailSendError}</span>
              </div>
            )}

            <form onSubmit={handleEmailQuoteCopy} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                  Confirm Your Email Address
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@company.co.za"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                />
                <p className="text-[10px] text-brand-warm-grey mt-1">
                  We'll immediately attach the complete itemised quotation PDF to your inbox.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-brand-black text-brand-warm-grey hover:text-brand-off-white border border-brand-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={emailSending || !emailInput.trim()}
                  className="px-6 py-2.5 rounded-lg text-xs font-bold bg-brand-gold hover:bg-brand-gold-light text-brand-black transition-all shadow-md flex items-center disabled:opacity-50"
                >
                  {emailSending ? (
                    'Sending...'
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 mr-1.5" /> Send PDF to My Inbox
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quote Retrieval Modal */}
      {isLookupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-charcoal border border-brand-border rounded-2xl w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div className="flex items-center space-x-2 text-brand-gold">
                <Search className="w-5 h-5" />
                <h2 className="text-lg font-bold text-brand-off-white">
                  Retrieve Your Quotation
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsLookupModalOpen(false);
                  setLookupResults([]);
                  setLookupError(null);
                }}
                className="text-brand-warm-grey hover:text-brand-off-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-brand-warm-grey leading-relaxed">
              Enter your official Quotation Reference Number (e.g. <strong className="text-brand-gold font-mono">QT-2026-0001</strong>) or the email address used when requesting your quote.
            </p>

            {lookupError && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 flex items-start space-x-2.5 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{lookupError}</span>
              </div>
            )}

            <form onSubmit={handlePerformLookup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                  Quote Reference Number or Email
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={lookupQuery}
                    onChange={(e) => setLookupQuery(e.target.value)}
                    placeholder="e.g. QT-2026-0001 or client@example.com"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                  />
                  <Search className="w-4 h-4 absolute right-3 top-3 text-brand-warm-grey pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLookupModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-black text-brand-warm-grey hover:text-white border border-brand-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={lookupLoading || !lookupQuery.trim()}
                  className="px-6 py-2 rounded-lg text-xs font-bold bg-brand-gold hover:bg-brand-gold-light text-brand-black transition-all flex items-center disabled:opacity-50"
                >
                  {lookupLoading ? 'Searching...' : 'Find Quotation'}
                </button>
              </div>
            </form>

            {/* Multiple results selector */}
            {lookupResults.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-brand-border">
                <span className="text-xs font-semibold text-brand-warm-grey block">
                  Found {lookupResults.length} quotations for this account. Click to view:
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {lookupResults.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => loadQuoteByToken(r.access_token)}
                      className="w-full text-left p-3 rounded-xl bg-brand-black hover:bg-brand-gold/10 border border-brand-border hover:border-brand-gold/50 transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-mono font-bold text-xs text-brand-off-white group-hover:text-brand-gold">
                          {r.quote_number}
                        </div>
                        <div className="text-[11px] text-brand-warm-grey mt-0.5">
                          {r.package_name || 'Custom Package'} • Issued {r.issue_date}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-xs text-brand-off-white">
                          R {r.total_amount?.toFixed(2)}
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          r.status === 'Accepted'
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                            : 'bg-brand-black text-brand-gold border-brand-gold/40'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
