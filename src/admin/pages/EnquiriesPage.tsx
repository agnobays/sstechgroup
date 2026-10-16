import React, { useEffect, useState } from 'react';
import { Inbox, Mail, Phone, Calendar, CheckCircle2, UserPlus, Eye, X } from 'lucide-react';
import { apiRequest } from '../../api/client';
import { Enquiry } from '../../types';

export const EnquiriesPage: React.FC = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/enquiries?status=${statusFilter}` : '/enquiries';
      const data = await apiRequest<{ enquiries: Enquiry[] }>(url);
      setEnquiries(data.enquiries);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [statusFilter]);

  const updateStatus = async (id: number, status: string) => {
    try {
      await apiRequest(`/enquiries/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      fetchEnquiries();
      if (selectedEnquiry && selectedEnquiry.id === id) {
        setSelectedEnquiry({ ...selectedEnquiry, status: status as any });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update enquiry status.');
    }
  };

  const convertToClient = async (enquiry: Enquiry) => {
    if (!confirm(`Register "${enquiry.full_name}" as a client in the database?`)) return;
    try {
      await apiRequest('/clients', {
        method: 'POST',
        body: JSON.stringify({
          name: enquiry.full_name,
          company_name: enquiry.organization || '',
          email: enquiry.email,
          phone: enquiry.phone || '',
          notes: `Created from enquiry #${enquiry.id}. Service requested: ${enquiry.service_required}. Budget: ${enquiry.estimated_budget || 'Unspecified'}`,
        }),
      });

      await updateStatus(enquiry.id, 'Converted');
      alert(`Client "${enquiry.full_name}" created successfully.`);
    } catch (err: any) {
      alert(err.message || 'Failed to convert enquiry to client.');
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'New':
        return 'bg-blue-950/60 text-blue-400 border-blue-800/40';
      case 'Contacted':
        return 'bg-amber-950/60 text-brand-gold border-brand-gold/40';
      case 'Converted':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40';
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
            Client Enquiries Inbox
          </h1>
          <p className="text-xs sm:text-sm text-brand-warm-grey mt-1">
            Inbound project scopes submitted by prospective clients through the official website.
          </p>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-brand-charcoal border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
          >
            <option value="">All Enquiries</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Converted">Converted</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-brand-charcoal rounded-xl border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-black border-b border-brand-border text-brand-warm-grey uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Contact &amp; Org</th>
                <th className="py-3 px-4">Service Required</th>
                <th className="py-3 px-4">Budget</th>
                <th className="py-3 px-4">Received</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-brand-warm-grey">
                    Loading enquiries...
                  </td>
                </tr>
              ) : enquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-brand-warm-grey">
                    No enquiries recorded. Submissions through the contact form appear here.
                  </td>
                </tr>
              ) : (
                enquiries.map((enq) => (
                  <tr key={enq.id} className="hover:bg-brand-black/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-brand-off-white text-sm">{enq.full_name}</div>
                      {enq.organization && (
                        <div className="text-[11px] text-brand-warm-grey">{enq.organization}</div>
                      )}
                      <div className="text-[11px] text-brand-gold">{enq.email}</div>
                    </td>

                    <td className="py-3 px-4 text-brand-off-white font-medium">
                      {enq.service_required}
                    </td>

                    <td className="py-3 px-4 text-brand-warm-grey font-mono text-[11px]">
                      {enq.estimated_budget || 'Unspecified'}
                    </td>

                    <td className="py-3 px-4 text-brand-warm-grey font-mono text-[11px]">
                      {new Date(enq.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4">
                      <select
                        value={enq.status}
                        onChange={(e) => updateStatus(enq.id, e.target.value)}
                        className={`text-[10px] font-semibold px-2 py-1 rounded border bg-brand-black focus:outline-none ${getStatusBadge(
                          enq.status
                        )}`}
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Converted">Converted</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedEnquiry(enq)}
                          className="p-1.5 rounded bg-brand-black border border-brand-border text-brand-warm-grey hover:text-brand-off-white hover:border-brand-gold"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {enq.status !== 'Converted' && (
                          <button
                            type="button"
                            onClick={() => convertToClient(enq)}
                            className="p-1.5 rounded bg-brand-gold/10 border border-brand-gold/30 text-brand-gold hover:bg-brand-gold hover:text-brand-black transition-colors"
                            title="Convert to Client Record"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-brand-charcoal border border-brand-border rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div>
                <h2 className="text-base font-bold text-brand-off-white">{selectedEnquiry.full_name}</h2>
                <p className="text-xs text-brand-gold">{selectedEnquiry.organization || 'Individual'}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="text-brand-warm-grey hover:text-brand-off-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-brand-warm-grey">
              <div><strong>Email:</strong> <a href={`mailto:${selectedEnquiry.email}`} className="text-brand-gold hover:underline">{selectedEnquiry.email}</a></div>
              {selectedEnquiry.phone && <div><strong>Phone:</strong> {selectedEnquiry.phone}</div>}
              <div><strong>Service Required:</strong> {selectedEnquiry.service_required}</div>
              <div><strong>Budget:</strong> {selectedEnquiry.estimated_budget || 'Unspecified'}</div>
              <div><strong>Submitted:</strong> {new Date(selectedEnquiry.created_at).toLocaleString()}</div>
            </div>

            <div className="p-3.5 rounded-lg bg-brand-black border border-brand-border/80">
              <span className="text-xs font-semibold text-brand-off-white block mb-1">Project Scope &amp; Notes:</span>
              <p className="text-xs text-brand-warm-grey leading-relaxed whitespace-pre-wrap">
                {selectedEnquiry.project_description}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <a
                href={`mailto:${selectedEnquiry.email}?subject=S%26S%20Tech%20Group%20%E2%80%94%20Project%20Enquiry`}
                className="inline-flex items-center text-xs font-semibold px-4 py-2 rounded-lg bg-brand-gold text-brand-black hover:bg-brand-gold-light"
              >
                <Mail className="w-3.5 h-3.5 mr-1.5" /> Reply by Email
              </a>

              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-black text-brand-warm-grey hover:text-brand-off-white border border-brand-border"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
