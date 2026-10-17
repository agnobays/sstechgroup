import React, { useEffect, useState } from 'react';
import {
  Building2,
  Palette,
  CreditCard,
  ShieldCheck,
  Sliders,
  Globe,
  Download,
  Eye,
  X,
  CheckCircle2,
  UserPlus,
  Sparkles,
  RefreshCw,
  Calendar,
  Mail,
  Phone,
  ExternalLink,
  AlertCircle,
  FileText,
  Check,
  Layers,
} from 'lucide-react';
import { apiRequest } from '../../api/client';

interface SubmissionData {
  organization?: string;
  website?: string;
  contact_name?: string;
  contact_role?: string;
  email?: string;
  phone?: string;
  office_address?: string;
  ncr_status?: string;
  cipc_number?: string;
  logo_status?: string;
  logo_download_link?: string;
  logo_file?: {
    name: string;
    size: number;
    type: string;
    dataUrl: string;
  } | null;
  app_icon_symbol?: string;
  primary_color?: string;
  accent_color?: string;
  neutral_bg?: string;
  heading_font?: string;
  body_font?: string;
  photography_style?: string;
  tone_of_voice?: string;
  languages?: string;
  short_term_min?: string;
  short_term_max?: string;
  short_term_first_time_cap?: string;
  short_term_terms?: string;
  personal_min?: string;
  personal_max?: string;
  personal_first_time_cap?: string;
  personal_terms?: string;
  debt_consolidation_min?: string;
  debt_consolidation_max?: string;
  business_loan_max?: string;
  interest_rate_structure?: string;
  initiation_fee_structure?: string;
  monthly_service_fee?: string;
  credit_life_insurance?: string;
  insurance_partner_name?: string;
  min_age?: string;
  citizenship_requirement?: string;
  min_net_salary?: string;
  min_employment_months?: string;
  accepted_employment?: string[];
  auto_decline_debt_review?: boolean;
  auto_decline_admin_order?: boolean;
  auto_decline_sequestration?: boolean;
  auto_decline_judgments?: boolean;
  desired_subdomain?: string;
  sms_sender_id?: string;
  whatsapp_bot_enabled?: boolean;
  whatsapp_number?: string;
  operating_model?: string;
  admin_team_emails?: string;
  notification_alerts?: string;
  special_requirements?: string;
}

interface OnboardingSubmission {
  id: number;
  client_slug: string;
  organization: string;
  contact_name: string;
  email: string;
  phone: string;
  reference_number: string;
  submission_data: string;
  status: string;
  revision_count: number;
  created_at: string;
  updated_at: string;
  data: SubmissionData;
}

export const OnboardingSubmissionsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<OnboardingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<OnboardingSubmission | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'brand' | 'loans' | 'underwriting' | 'operations'>('overview');

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; submissions: OnboardingSubmission[] }>('/onboarding');
      if (res.success && res.submissions) {
        setSubmissions(res.submissions);
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const updateStatus = async (refNumber: string, status: string) => {
    try {
      await apiRequest(`/onboarding/${refNumber}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      fetchSubmissions();
      if (selectedSub && selectedSub.reference_number === refNumber) {
        setSelectedSub({ ...selectedSub, status });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const convertToClient = async (sub: OnboardingSubmission) => {
    if (!confirm(`Register "${sub.contact_name}" (${sub.organization}) as an active client in the CRM?`)) return;
    try {
      await apiRequest('/clients', {
        method: 'POST',
        body: JSON.stringify({
          name: sub.contact_name,
          company_name: sub.organization,
          email: sub.email,
          phone: sub.phone || '',
          notes: `Created from Onboarding Specification ${sub.reference_number}. Rev: v${sub.revision_count || 1}. Status: ${sub.status}`,
        }),
      });

      await updateStatus(sub.reference_number, 'Converted');
      alert(`Client "${sub.organization}" registered successfully.`);
    } catch (err: any) {
      alert(err.message || 'Failed to convert to client.');
    }
  };

  const downloadLogoFile = (logo: { name: string; dataUrl: string }) => {
    const a = document.createElement('a');
    a.href = logo.dataUrl;
    a.download = logo.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'Submitted':
        return 'bg-blue-950/60 text-blue-400 border-blue-800/40';
      case 'Updated':
        return 'bg-amber-950/60 text-brand-gold border-brand-gold/40 shadow-[0_0_8px_rgba(246,115,0,0.2)]';
      case 'In Review':
        return 'bg-purple-950/60 text-purple-400 border-purple-800/40';
      case 'Approved':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40';
      case 'Converted':
        return 'bg-teal-950/60 text-teal-400 border-teal-800/40';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-brand-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
              Intake Submissions
            </span>
            <span className="text-xs text-brand-warm-grey">&bull; Client Specifications</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-off-white">
            Platform Onboarding Specifications
          </h1>
          <p className="text-xs sm:text-sm text-brand-warm-grey mt-1">
            Review client parameters, brand guidelines, uploaded logos, and underwriting limits submitted by clients.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSubmissions}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-brand-charcoal border border-brand-border text-brand-off-white text-xs font-semibold hover:border-brand-gold flex items-center gap-2 self-start sm:self-auto transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Submissions
        </button>
      </div>

      {/* Submissions Table */}
      <div className="bg-brand-charcoal rounded-xl border border-brand-border overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-black border-b border-brand-border text-brand-warm-grey uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Client &amp; Contact</th>
                <th className="py-3 px-4">Reference Code</th>
                <th className="py-3 px-4">Revision</th>
                <th className="py-3 px-4">Uploaded Logo</th>
                <th className="py-3 px-4">Last Modified</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-brand-warm-grey">
                    Loading specifications...
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-brand-warm-grey">
                    No onboarding specifications received yet. Forms submitted by clients will appear here with instant revision alerts.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => {
                  const hasLogoFile = !!sub.data?.logo_file;
                  const isRevised = (sub.revision_count || 1) > 1 || sub.status === 'Updated';
                  return (
                    <tr
                      key={sub.id}
                      className={`hover:bg-brand-black/30 transition-colors ${
                        isRevised ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-brand-off-white text-sm flex items-center gap-2">
                          <span>{sub.organization}</span>
                          {isRevised && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-brand-gold border border-brand-gold/30 font-semibold">
                              Client Made Changes
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-brand-warm-grey mt-0.5">
                          {sub.contact_name} &bull; <span className="text-brand-gold">{sub.email}</span>
                        </div>
                        {sub.phone && <div className="text-[10px] text-gray-400 font-mono">{sub.phone}</div>}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-brand-gold text-xs">
                        {sub.reference_number}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                            isRevised
                              ? 'bg-amber-500/20 text-brand-gold border-brand-gold/40'
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                          }`}
                        >
                          v{sub.revision_count || 1}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {hasLogoFile ? (
                          <div className="flex items-center gap-2">
                            {sub.data.logo_file?.dataUrl?.startsWith('data:image/') ? (
                              <img
                                src={sub.data.logo_file.dataUrl}
                                alt="Logo"
                                className="w-7 h-7 object-contain rounded bg-white/10 p-0.5 border border-brand-border"
                              />
                            ) : (
                              <FileText className="w-4 h-4 text-brand-gold" />
                            )}
                            <span className="text-[11px] text-emerald-400 font-medium truncate max-w-[120px]">
                              {sub.data.logo_file?.name}
                            </span>
                          </div>
                        ) : sub.data?.logo_download_link ? (
                          <a
                            href={sub.data.logo_download_link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
                          >
                            Cloud Link <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-zinc-500">None provided</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-brand-warm-grey font-mono text-[11px]">
                        <div>{new Date(sub.updated_at || sub.created_at).toLocaleDateString()}</div>
                        <div className="text-[10px] text-zinc-500">
                          {new Date(sub.updated_at || sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={sub.status}
                          onChange={(e) => updateStatus(sub.reference_number, e.target.value)}
                          className={`text-[10px] font-semibold px-2 py-1 rounded border bg-brand-black focus:outline-none ${getStatusBadge(
                            sub.status
                          )}`}
                        >
                          <option value="Submitted">Submitted</option>
                          <option value="Updated">Updated (Revised)</option>
                          <option value="In Review">In Review</option>
                          <option value="Approved">Approved</option>
                          <option value="Converted">Converted</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSub(sub);
                              setActiveTab('overview');
                            }}
                            className="p-1.5 rounded-lg bg-brand-black border border-brand-border text-brand-warm-grey hover:text-brand-off-white hover:border-brand-gold flex items-center gap-1 px-2.5"
                            title="View Full Specifications & Logo"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-semibold">View Specs</span>
                          </button>

                          {sub.status !== 'Converted' && (
                            <button
                              type="button"
                              onClick={() => convertToClient(sub)}
                              className="p-1.5 rounded-lg bg-brand-gold/10 border border-brand-gold/30 text-brand-gold hover:bg-brand-gold hover:text-brand-black transition-colors"
                              title="Convert to Client Record"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Specifications Inspection Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-6 overflow-y-auto backdrop-blur-sm">
          <div className="bg-brand-charcoal border border-brand-border rounded-2xl w-full max-w-4xl p-6 sm:p-8 space-y-6 shadow-2xl my-auto">
            {/* Modal Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-brand-border gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-brand-gold bg-brand-gold/15 px-2.5 py-0.5 rounded border border-brand-gold/30">
                    {selectedSub.reference_number}
                  </span>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                    Revision v{selectedSub.revision_count || 1}
                  </span>
                  {(selectedSub.revision_count > 1 || selectedSub.status === 'Updated') && (
                    <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Modified after submission
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white">{selectedSub.organization}</h2>
                <p className="text-xs text-brand-warm-grey mt-0.5">
                  Authorized Contact: <strong className="text-white">{selectedSub.contact_name}</strong> ({selectedSub.data?.contact_role || 'Director'}) &bull; Submitted {new Date(selectedSub.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedSub.status}
                  onChange={(e) => updateStatus(selectedSub.reference_number, e.target.value)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border bg-brand-black ${getStatusBadge(selectedSub.status)}`}
                >
                  <option value="Submitted">Submitted</option>
                  <option value="Updated">Updated</option>
                  <option value="In Review">In Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Converted">Converted</option>
                </select>

                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="p-1.5 rounded-lg text-brand-warm-grey hover:text-white bg-brand-black border border-brand-border"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-brand-border pb-3">
              {[
                { id: 'overview', label: 'Overview & Entity', icon: Building2 },
                { id: 'brand', label: 'Brand & Logo Assets', icon: Palette },
                { id: 'loans', label: 'Loan Products & Fees', icon: CreditCard },
                { id: 'underwriting', label: 'Underwriting Rules', icon: ShieldCheck },
                { id: 'operations', label: 'UX & Subdomain', icon: Globe },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      isActive
                        ? 'bg-brand-gold text-brand-black shadow-md'
                        : 'text-brand-warm-grey hover:text-white bg-brand-black/60 border border-brand-border/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Tab Content */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-xs">
              {/* TAB 1: OVERVIEW & ENTITY */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-brand-black border border-brand-border">
                      <span className="text-gray-400 block mb-1 font-semibold uppercase text-[10px]">Contact Information</span>
                      <p className="font-bold text-white text-sm">{selectedSub.contact_name}</p>
                      <p className="text-brand-warm-grey">{selectedSub.data?.contact_role}</p>
                      <div className="mt-2 space-y-1 font-mono text-[11px]">
                        <div>Email: <a href={`mailto:${selectedSub.email}`} className="text-brand-gold hover:underline">{selectedSub.email}</a></div>
                        <div>Phone: <a href={`tel:${selectedSub.phone}`} className="text-brand-gold hover:underline">{selectedSub.phone || 'None'}</a></div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-brand-black border border-brand-border">
                      <span className="text-gray-400 block mb-1 font-semibold uppercase text-[10px]">Registration & Entity</span>
                      <p className="font-bold text-white text-sm">{selectedSub.organization}</p>
                      <div className="mt-2 space-y-1 text-brand-warm-grey">
                        <div>Website: <a href={selectedSub.data?.website} target="_blank" rel="noreferrer" className="text-brand-gold hover:underline">{selectedSub.data?.website || 'None'}</a></div>
                        <div>CIPC / Reg: <span className="text-white font-mono">{selectedSub.data?.cipc_number || 'N/A'}</span></div>
                        <div>NCR Status: <span className="text-white font-semibold">{selectedSub.data?.ncr_status || 'Pending'}</span></div>
                      </div>
                    </div>

                    <div className="sm:col-span-2 p-3.5 rounded-xl bg-brand-black border border-brand-border">
                      <span className="text-gray-400 block mb-1 font-semibold uppercase text-[10px]">Physical Address</span>
                      <p className="text-white">{selectedSub.data?.office_address || 'Suite 4, 120 Florida Road, Morningside, Durban, 4001'}</p>
                    </div>
                  </div>

                  {selectedSub.data?.special_requirements && (
                    <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200">
                      <span className="block text-xs font-bold text-brand-gold mb-1">Client Notes &amp; Special Requirements:</span>
                      <p className="text-xs leading-relaxed whitespace-pre-wrap">{selectedSub.data.special_requirements}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: BRAND & LOGO ASSETS */}
              {activeTab === 'brand' && (
                <div className="space-y-4">
                  {/* Uploaded Logo Box */}
                  <div className="p-5 rounded-xl bg-brand-black border border-brand-border space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm flex items-center gap-2">
                        <Palette className="w-4 h-4 text-brand-gold" /> Brand Logo File
                      </span>
                      {selectedSub.data?.logo_file && (
                        <button
                          type="button"
                          onClick={() => downloadLogoFile(selectedSub.data.logo_file!)}
                          className="px-3 py-1.5 rounded-lg bg-brand-gold hover:bg-brand-gold-light text-brand-black text-xs font-bold flex items-center gap-1.5 shadow transition"
                        >
                          <Download className="w-3.5 h-3.5" /> Download Logo File
                        </button>
                      )}
                    </div>

                    {selectedSub.data?.logo_file ? (
                      <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-gray-900 border border-gray-800">
                        {selectedSub.data.logo_file.dataUrl?.startsWith('data:image/') ? (
                          <div className="w-32 h-32 rounded-lg bg-white/5 border border-gray-700 p-2 flex items-center justify-center shrink-0">
                            <img
                              src={selectedSub.data.logo_file.dataUrl}
                              alt="Uploaded Logo"
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-32 h-32 rounded-lg bg-white/5 border border-gray-700 flex items-center justify-center shrink-0">
                            <FileText className="w-10 h-10 text-brand-gold" />
                          </div>
                        )}
                        <div className="space-y-1 text-center sm:text-left">
                          <p className="text-sm font-bold text-white">{selectedSub.data.logo_file.name}</p>
                          <p className="text-xs text-brand-gold font-mono">
                            {(selectedSub.data.logo_file.size / 1024).toFixed(1)} KB &bull; {selectedSub.data.logo_file.type || 'Image Asset'}
                          </p>
                          <p className="text-xs text-brand-warm-grey pt-1">
                            Ready for direct use in the lending platform headers, emails, and client statements.
                          </p>
                        </div>
                      </div>
                    ) : selectedSub.data?.logo_download_link ? (
                      <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 text-blue-200 flex items-center justify-between">
                        <div>
                          <span className="block text-xs font-bold text-white">Shared Cloud Drive Link:</span>
                          <span className="font-mono text-xs text-blue-300 break-all">{selectedSub.data.logo_download_link}</span>
                        </div>
                        <a
                          href={selectedSub.data.logo_download_link}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 ml-4"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Open Folder
                        </a>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-center">
                        No direct file or cloud link uploaded. Selected status: "{selectedSub.data?.logo_status}"
                      </div>
                    )}
                  </div>

                  {/* Colors & Fonts Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-brand-black border border-brand-border flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg border border-white/20 shrink-0 shadow"
                        style={{ backgroundColor: selectedSub.data?.primary_color || '#0A2540' }}
                      />
                      <div>
                        <span className="text-gray-400 text-[10px] uppercase font-semibold block">Primary Brand Color</span>
                        <span className="font-mono font-bold text-white text-xs">{selectedSub.data?.primary_color || '#0A2540'}</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-brand-black border border-brand-border flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg border border-white/20 shrink-0 shadow"
                        style={{ backgroundColor: selectedSub.data?.accent_color || '#D97706' }}
                      />
                      <div>
                        <span className="text-gray-400 text-[10px] uppercase font-semibold block">Accent / Action Color</span>
                        <span className="font-mono font-bold text-white text-xs">{selectedSub.data?.accent_color || '#D97706'}</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-brand-black border border-brand-border">
                      <span className="text-gray-400 text-[10px] uppercase font-semibold block mb-1">Typography</span>
                      <p className="text-white font-medium">Heading: <strong className="text-brand-gold">{selectedSub.data?.heading_font || 'DM Serif Display'}</strong></p>
                      <p className="text-white font-medium">Body: <strong className="text-brand-gold">{selectedSub.data?.body_font || 'Plus Jakarta Sans'}</strong></p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-brand-black border border-brand-border">
                      <span className="text-gray-400 text-[10px] uppercase font-semibold block mb-1">Tone &amp; Languages</span>
                      <p className="text-white">{selectedSub.data?.languages || 'English (+ isiZulu toggle)'}</p>
                      <p className="text-brand-warm-grey text-[11px] mt-1">{selectedSub.data?.tone_of_voice}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: LOANS & FEES */}
              {activeTab === 'loans' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-brand-black border border-brand-border space-y-2">
                      <span className="font-bold text-brand-gold text-xs block uppercase tracking-wider">Short-Term Loan Tier</span>
                      <div className="flex justify-between border-b border-gray-800 pb-1.5">
                        <span className="text-gray-400">Allowed Range:</span>
                        <span className="text-white font-mono font-bold">R{selectedSub.data?.short_term_min} – R{selectedSub.data?.short_term_max}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 pb-1.5">
                        <span className="text-gray-400">1st Time Borrower Cap:</span>
                        <span className="text-white font-mono font-bold">R{selectedSub.data?.short_term_first_time_cap}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Repayment Term:</span>
                        <span className="text-white">{selectedSub.data?.short_term_terms || '1 to 6 months'}</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-brand-black border border-brand-border space-y-2">
                      <span className="font-bold text-brand-gold text-xs block uppercase tracking-wider">Personal Loan Tier</span>
                      <div className="flex justify-between border-b border-gray-800 pb-1.5">
                        <span className="text-gray-400">Allowed Range:</span>
                        <span className="text-white font-mono font-bold">R{selectedSub.data?.personal_min} – R{selectedSub.data?.personal_max}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 pb-1.5">
                        <span className="text-gray-400">1st Time Borrower Cap:</span>
                        <span className="text-white font-mono font-bold">R{selectedSub.data?.personal_first_time_cap}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Repayment Term:</span>
                        <span className="text-white">{selectedSub.data?.personal_terms || '12 to 60 months'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-brand-black border border-brand-border space-y-2">
                    <span className="font-bold text-white text-xs block uppercase tracking-wider">NCA Statutory Fee Structure</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                      <div className="p-2.5 rounded-lg bg-gray-900 border border-gray-800">
                        <span className="text-gray-400 text-[10px] block">Monthly Admin Fee</span>
                        <span className="text-white font-bold font-mono">{selectedSub.data?.monthly_service_fee || 'R69.00'}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-gray-900 border border-gray-800">
                        <span className="text-gray-400 text-[10px] block">Initiation Fee</span>
                        <span className="text-white font-bold font-mono">Standard NCA Formula</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-gray-900 border border-gray-800">
                        <span className="text-gray-400 text-[10px] block">Credit Life Insurance</span>
                        <span className="text-white font-bold">{selectedSub.data?.credit_life_insurance || 'Optional'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: UNDERWRITING RULES */}
              {activeTab === 'underwriting' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-brand-black border border-brand-border">
                      <span className="text-gray-400 text-[10px] uppercase font-semibold block">Minimum Age</span>
                      <span className="font-bold text-white text-base font-mono">{selectedSub.data?.min_age || '18'} years</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-brand-black border border-brand-border">
                      <span className="text-gray-400 text-[10px] uppercase font-semibold block">Min. Net Salary</span>
                      <span className="font-bold text-brand-gold text-base font-mono">R{selectedSub.data?.min_net_salary || '4,500'} / mo</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-brand-black border border-brand-border">
                      <span className="text-gray-400 text-[10px] uppercase font-semibold block">Min. Employment</span>
                      <span className="font-bold text-white text-base font-mono">{selectedSub.data?.min_employment_months || '3'} months</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-brand-black border border-brand-border space-y-2">
                    <span className="font-bold text-white text-xs block">Automated Decline Filters</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {[
                        { label: 'Debt Review', active: selectedSub.data?.auto_decline_debt_review ?? true },
                        { label: 'Admin Order', active: selectedSub.data?.auto_decline_admin_order ?? true },
                        { label: 'Sequestration', active: selectedSub.data?.auto_decline_sequestration ?? true },
                        { label: 'Adverse Judgments', active: selectedSub.data?.auto_decline_judgments ?? true },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className={`p-2.5 rounded-lg border text-center ${
                            item.active
                              ? 'bg-red-950/20 border-red-500/30 text-red-400'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                          }`}
                        >
                          <span className="block text-[11px] font-bold">{item.label}</span>
                          <span className="text-[10px]">{item.active ? 'Auto-Decline' : 'Manual Review'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: UX & OPERATIONS */}
              {activeTab === 'operations' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-brand-black border border-brand-border">
                      <span className="text-gray-400 text-[10px] uppercase font-semibold block">Desired Web Subdomain</span>
                      <span className="font-mono font-bold text-brand-gold text-xs">{selectedSub.data?.desired_subdomain || 'apply.qhawecreditsolutions.co.za'}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-brand-black border border-brand-border">
                      <span className="text-gray-400 text-[10px] uppercase font-semibold block">SMS Sender ID</span>
                      <span className="font-mono font-bold text-white text-xs">{selectedSub.data?.sms_sender_id || 'QhaweCredit'}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-brand-black border border-brand-border">
                      <span className="text-gray-400 text-[10px] uppercase font-semibold block">Operating Model</span>
                      <span className="text-white text-xs">{selectedSub.data?.operating_model || 'Hybrid Instant & Underwriter'}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-brand-black border border-brand-border">
                      <span className="text-gray-400 text-[10px] uppercase font-semibold block">Admin Notification Alerts</span>
                      <span className="text-white text-xs font-mono">{selectedSub.data?.admin_team_emails || selectedSub.email}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-[11px] text-brand-warm-grey">
                Reference: <strong className="text-brand-gold font-mono">{selectedSub.reference_number}</strong>
              </div>

              <div className="flex items-center gap-2">
                {selectedSub.status !== 'Converted' && (
                  <button
                    type="button"
                    onClick={() => convertToClient(selectedSub)}
                    className="px-4 py-2 rounded-lg bg-brand-gold hover:bg-brand-gold-light text-brand-black font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Register as Client in CRM
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="px-4 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-warm-grey hover:text-white text-xs font-semibold"
                >
                  Close Modal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
