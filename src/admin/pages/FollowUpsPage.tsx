import React, { useEffect, useState } from 'react';
import { Clock, Calendar, Mail, CheckCircle2, XCircle, Plus, AlertCircle, X } from 'lucide-react';
import { apiRequest } from '../../api/client';
import { FollowUp } from '../../types';

export const FollowUpsPage: React.FC = () => {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // New follow-up modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leadId, setLeadId] = useState<string>('');
  const [quoteId, setQuoteId] = useState<string>('');
  const [scheduledAt, setScheduledAt] = useState<string>(new Date().toISOString().split('T')[0]);
  const [templateKey, setTemplateKey] = useState<string>('lead_abandonment');
  const [channel, setChannel] = useState<'Internal' | 'Email' | 'SMS'>('Internal');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchFollowUps = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/follow-ups?status=${statusFilter}` : '/follow-ups';
      const data = await apiRequest<{ followUps: FollowUp[] }>(url);
      setFollowUps(data.followUps);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [statusFilter]);

  const updateStatus = async (id: number, status: 'Sent' | 'Cancelled' | 'Failed') => {
    try {
      await apiRequest(`/follow-ups/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      fetchFollowUps();
    } catch (err: any) {
      alert(err.message || 'Failed to update follow-up');
    }
  };

  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiRequest('/follow-ups', {
        method: 'POST',
        body: JSON.stringify({
          lead_id: leadId ? Number(leadId) : null,
          quote_id: quoteId ? Number(quoteId) : null,
          scheduled_at: scheduledAt,
          template_key: templateKey,
          channel,
          notes,
        }),
      });

      setIsModalOpen(false);
      fetchFollowUps();
    } catch (err: any) {
      alert(err.message || 'Failed to schedule follow-up');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-brand-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-off-white">
            Follow-Up &amp; Outreach Queue
          </h1>
          <p className="text-xs sm:text-sm text-brand-warm-grey mt-1">
            Automated and manual outreach tasks for abandoned questionnaire leads and quotations awaiting client review.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2.5 rounded-lg text-xs font-bold bg-brand-gold hover:bg-brand-gold-light text-brand-black transition-all shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Schedule Follow-up
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center space-x-3 bg-brand-charcoal p-4 rounded-xl border border-brand-border">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
        >
          <option value="">All Follow-up Tasks</option>
          <option value="Pending">Pending / Scheduled</option>
          <option value="Sent">Sent / Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-brand-charcoal rounded-xl border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-black border-b border-brand-border text-brand-warm-grey uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Contact / Lead</th>
                <th className="py-3 px-4">Scheduled For</th>
                <th className="py-3 px-4">Template / Purpose</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-brand-warm-grey">
                    Loading follow-up tasks...
                  </td>
                </tr>
              ) : followUps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-brand-warm-grey">
                    No follow-up tasks in the queue.
                  </td>
                </tr>
              ) : (
                followUps.map((f) => (
                  <tr key={f.id} className="hover:bg-brand-black/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-brand-off-white text-sm">
                        {f.lead_name || (f.quote_number ? `Quote ${f.quote_number}` : 'Lead #' + f.lead_id)}
                      </div>
                      {f.lead_email && <div className="text-[11px] text-brand-gold">{f.lead_email}</div>}
                    </td>

                    <td className="py-3 px-4 text-brand-off-white font-mono text-[11px]">
                      {new Date(f.scheduled_at).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-brand-off-white capitalize">
                        {f.template_key.replace(/_/g, ' ')}
                      </div>
                      {f.notes && <div className="text-[10px] text-brand-warm-grey truncate max-w-xs">{f.notes}</div>}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-brand-black text-brand-warm-grey border border-brand-border font-medium">
                        {f.channel}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          f.status === 'Sent'
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                            : f.status === 'Cancelled'
                            ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            : 'bg-amber-950/60 text-brand-gold border-brand-gold/40'
                        }`}
                      >
                        {f.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {f.status === 'Pending' && (
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => updateStatus(f.id, 'Sent')}
                            className="px-2.5 py-1 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/60 text-[10px] font-bold"
                          >
                            Mark Done
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStatus(f.id, 'Cancelled')}
                            className="px-2 py-1 rounded bg-brand-black text-zinc-400 border border-brand-border hover:text-red-400 text-[10px]"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-brand-charcoal border border-brand-border rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <h2 className="text-base font-bold text-brand-off-white">Schedule Outreach Task</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-brand-warm-grey hover:text-brand-off-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFollowUp} className="space-y-4 text-xs">
              <div>
                <label className="block text-brand-off-white font-semibold mb-1">Scheduled Date</label>
                <input
                  type="date"
                  required
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="block text-brand-off-white font-semibold mb-1">Outreach Purpose / Template</label>
                <select
                  value={templateKey}
                  onChange={(e) => setTemplateKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white focus:outline-none focus:border-brand-gold"
                >
                  <option value="lead_abandonment">Lead Abandonment Recovery</option>
                  <option value="quote_follow_up">Quotation Response Follow-up</option>
                  <option value="onboarding_kickoff">Project Onboarding Kick-off</option>
                  <option value="custom_outreach">Custom Consultation Call</option>
                </select>
              </div>

              <div>
                <label className="block text-brand-off-white font-semibold mb-1">Channel</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white focus:outline-none focus:border-brand-gold"
                >
                  <option value="Internal">Internal Phone / Staff Reminder</option>
                  <option value="Email">Email Communication</option>
                </select>
              </div>

              <div>
                <label className="block text-brand-off-white font-semibold mb-1">Notes / Objectives</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Inquire if they need help sizing their hosting or domain..."
                  className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className="pt-3 border-t border-brand-border flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-brand-warm-grey hover:text-brand-off-white border border-brand-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg font-bold bg-brand-gold text-brand-black hover:bg-brand-gold-light disabled:opacity-50"
                >
                  {submitting ? 'Scheduling...' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
