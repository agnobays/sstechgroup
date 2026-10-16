import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  Phone,
  Mail,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { apiRequest } from '../../api/client';
import { Lead } from '../../types';

export const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  // Selected Lead Drawer
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editAssignedTo, setEditAssignedTo] = useState('');
  const [editNextFollowUp, setEditNextFollowUp] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: '25',
      });
      if (search) query.set('search', search);
      if (statusFilter) query.set('status', statusFilter);
      if (serviceFilter) query.set('service', serviceFilter);

      const res = await apiRequest<{
        leads: Lead[];
        pagination: { total: number; page: number; totalPages: number };
      }>(`/leads?${query.toString()}`);

      setLeads(res.leads);
      setTotalPages(res.pagination.totalPages);
      setTotalLeads(res.pagination.total);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter, serviceFilter, page]);

  const openLeadDrawer = (lead: Lead) => {
    setSelectedLead(lead);
    setEditNotes(lead.notes || '');
    setEditStatus(lead.status);
    setEditAssignedTo(lead.assigned_to || '');
    setEditNextFollowUp(lead.next_follow_up || '');
  };

  const handleSaveLeadCrm = async () => {
    if (!selectedLead) return;
    setSavingNotes(true);
    try {
      await apiRequest(`/leads/${selectedLead.id}/crm`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: editStatus,
          notes: editNotes,
          assigned_to: editAssignedTo,
          next_follow_up: editNextFollowUp,
        }),
      });

      setSelectedLead({
        ...selectedLead,
        status: editStatus as any,
        notes: editNotes,
        assigned_to: editAssignedTo,
        next_follow_up: editNextFollowUp,
      });

      fetchLeads();
      alert('Lead CRM updated successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to update lead');
    } finally {
      setSavingNotes(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Converted':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40';
      case 'In Progress':
        return 'bg-blue-950/60 text-blue-400 border-blue-800/40';
      case 'Abandoned':
        return 'bg-amber-950/60 text-brand-gold border-brand-gold/40';
      case 'Contacted':
        return 'bg-purple-950/60 text-purple-400 border-purple-800/40';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-brand-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-off-white">
            Lead Management &amp; CRM Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-brand-warm-grey mt-1">
            Track questionnaire sessions, manage abandoned leads, review scope submissions, and assign follow-ups.
          </p>
        </div>

        <a
          href="/api/leads/export/csv"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center px-4 py-2.5 rounded-lg text-xs font-bold bg-brand-charcoal text-brand-gold hover:bg-brand-black border border-brand-gold/30 hover:border-brand-gold transition-all shadow-sm"
        >
          <FileSpreadsheet className="w-4 h-4 mr-1.5" />
          Export Leads CSV
        </a>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-brand-charcoal p-4 rounded-xl border border-brand-border">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-brand-warm-grey" />
          <input
            type="text"
            placeholder="Search name, email, organization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs placeholder-brand-warm-grey/50 focus:outline-none focus:border-brand-gold"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
          >
            <option value="">All Statuses ({totalLeads})</option>
            <option value="In Progress">In Progress (Active Session)</option>
            <option value="Completed">Completed (Generated Quote)</option>
            <option value="Abandoned">Abandoned (Drop-off)</option>
            <option value="Contacted">Contacted</option>
            <option value="Converted">Converted to Client</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
          >
            <option value="">All Service Types</option>
            <option value="business_website">Business Website</option>
            <option value="education_website">Education / University</option>
            <option value="custom_app">Custom Web Application</option>
            <option value="redesign">Website Redesign</option>
            <option value="api_automation">API &amp; Automation</option>
            <option value="hosting_maintenance">Hosting &amp; Maintenance</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-brand-charcoal rounded-xl border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-black border-b border-brand-border text-brand-warm-grey uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Lead / Contact</th>
                <th className="py-3 px-4">Service &amp; Package</th>
                <th className="py-3 px-4">Estimated Value</th>
                <th className="py-3 px-4">Step Progress</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-brand-warm-grey">
                    Loading CRM leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-brand-warm-grey">
                    No leads found matching query.
                  </td>
                </tr>
              ) : (
                leads.map((l) => (
                  <tr key={l.id} className="hover:bg-brand-black/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-brand-off-white text-sm">
                        {l.full_name || <span className="text-zinc-500 italic">Anonymous Visitor</span>}
                      </div>
                      {l.organization && (
                        <div className="text-[11px] text-brand-warm-grey">{l.organization}</div>
                      )}
                      <div className="text-[11px] text-brand-gold font-mono">{l.email || l.session_token.substring(0, 10) + '...'}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-brand-off-white capitalize">
                        {(l.service_required || 'Unspecified').replace(/_/g, ' ')}
                      </div>
                      {l.recommended_package_name && (
                        <div className="text-[10px] text-brand-gold">{l.recommended_package_name}</div>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-brand-off-white">
                      {l.estimated_value > 0 ? `R ${l.estimated_value.toLocaleString()}` : '-'}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-brand-off-white">Step {l.step_progress}/5</span>
                        <div className="w-12 bg-brand-black h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-brand-gold h-full"
                            style={{ width: `${(l.step_progress / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(l.status)}`}>
                        {l.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-brand-warm-grey text-[11px] font-mono">
                      {new Date(l.last_activity_at).toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openLeadDrawer(l)}
                        className="p-1.5 rounded bg-brand-black border border-brand-border text-brand-warm-grey hover:text-brand-gold hover:border-brand-gold"
                        title="View Full Lead Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Detail Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-end">
          <div className="bg-brand-charcoal border-l border-brand-border w-full max-w-xl h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-brand-border">
              <div>
                <h2 className="text-lg font-bold text-brand-off-white">
                  {selectedLead.full_name || 'Anonymous Visitor'}
                </h2>
                <p className="text-xs text-brand-gold font-mono">{selectedLead.email || selectedLead.session_token}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="text-brand-warm-grey hover:text-brand-off-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-brand-black border border-brand-border">
                <span className="text-brand-warm-grey block">Estimated Value</span>
                <span className="text-base font-bold font-mono text-brand-gold">
                  R {(selectedLead.estimated_value || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-brand-black border border-brand-border">
                <span className="text-brand-warm-grey block">Questionnaire Step</span>
                <span className="text-base font-bold text-brand-off-white">
                  {selectedLead.step_progress} of 5
                </span>
              </div>
            </div>

            {/* Questionnaire Answers Breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-off-white pb-1 border-b border-brand-border">
                Questionnaire Responses
              </h3>
              <div className="p-4 rounded-xl bg-brand-black border border-brand-border space-y-2 text-xs text-brand-warm-grey">
                <div><strong>Business Type:</strong> {selectedLead.business_type || 'Unspecified'}</div>
                <div><strong>Service:</strong> {selectedLead.service_required || 'Unspecified'}</div>
                <div><strong>Marketing Consent:</strong> {selectedLead.consent_marketing ? 'Granted' : 'Declined'}</div>
                <div><strong>Follow-up Consent:</strong> {selectedLead.consent_followup ? 'Granted' : 'Declined'}</div>
                {selectedLead.questionnaire_data && (
                  <div className="pt-2 border-t border-brand-border/60">
                    <span className="font-semibold text-brand-off-white block mb-1">Raw Answers:</span>
                    <pre className="text-[10px] font-mono bg-brand-charcoal p-2 rounded overflow-x-auto text-brand-warm-grey">
                      {JSON.stringify(selectedLead.questionnaire_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* CRM Management Form */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-off-white pb-1 border-b border-brand-border">
                CRM Controls &amp; Follow-up
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-brand-off-white font-semibold mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Abandoned">Abandoned</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Converted">Converted</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-brand-off-white font-semibold mb-1">Assigned Staff</label>
                  <input
                    type="text"
                    value={editAssignedTo}
                    onChange={(e) => setEditAssignedTo(e.target.value)}
                    placeholder="e.g. Sipho / Lead Tech"
                    className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-brand-off-white font-semibold mb-1">
                  Next Scheduled Follow-up Date
                </label>
                <input
                  type="date"
                  value={editNextFollowUp}
                  onChange={(e) => setEditNextFollowUp(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="block text-xs text-brand-off-white font-semibold mb-1">
                  Internal Staff Notes &amp; History
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Record outcome of call, scope clarification..."
                  className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                />
              </div>

              <button
                type="button"
                disabled={savingNotes}
                onClick={handleSaveLeadCrm}
                className="w-full py-2.5 rounded-lg text-xs font-bold bg-brand-gold text-brand-black hover:bg-brand-gold-light transition-colors disabled:opacity-50"
              >
                {savingNotes ? 'Saving Changes...' : 'Update Lead CRM Record'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
