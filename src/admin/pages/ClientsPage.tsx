import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Archive, RotateCcw, AlertCircle, Users, Mail, Phone, MapPin, Eye, X } from 'lucide-react';
import { apiRequest } from '../../api/client';
import { Client, Quote, Invoice } from '../../types';

export const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    billing_address: '',
    tax_number: '',
    notes: '',
  });
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Detail Drawer State
  const [selectedClientDetail, setSelectedClientDetail] = useState<{
    client: Client;
    quotes: Quote[];
    invoices: Invoice[];
  } | null>(null);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (includeArchived) query.set('include_archived', 'true');

      const data = await apiRequest<{ clients: Client[] }>(`/clients?${query.toString()}`);
      setClients(data.clients);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [search, includeArchived]);

  const openAddModal = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      company_name: '',
      email: '',
      phone: '',
      billing_address: '',
      tax_number: '',
      notes: '',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      company_name: client.company_name || '',
      email: client.email,
      phone: client.phone || '',
      billing_address: client.billing_address || '',
      tax_number: client.tax_number || '',
      notes: client.notes || '',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!formData.name.trim()) {
      setModalError('Client name is required.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setModalError('A valid email address is required.');
      return;
    }

    setModalSubmitting(true);
    try {
      if (editingClient) {
        await apiRequest(`/clients/${editingClient.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      } else {
        await apiRequest('/clients', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }

      setIsModalOpen(false);
      fetchClients();
    } catch (err: any) {
      setModalError(err.message || 'Operation failed.');
    } finally {
      setModalSubmitting(false);
    }
  };

  const toggleArchive = async (client: Client) => {
    try {
      await apiRequest(`/clients/${client.id}/archive`, { method: 'PATCH' });
      fetchClients();
    } catch (err: any) {
      alert(err.message || 'Failed to update archive status.');
    }
  };

  const viewClientDetails = async (client: Client) => {
    try {
      const data = await apiRequest<{
        client: Client;
        quotes: Quote[];
        invoices: Invoice[];
      }>(`/clients/${client.id}`);
      setSelectedClientDetail(data);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch client details.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-brand-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-off-white">
            Client Registry
          </h1>
          <p className="text-xs sm:text-sm text-brand-warm-grey mt-1">
            Manage client billing accounts, addresses, VAT registrations, and linked financial records.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center px-4 py-2.5 rounded-lg text-xs font-bold bg-brand-gold hover:bg-brand-gold-light text-brand-black transition-all shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Client
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center space-x-3 text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-brand-charcoal p-4 rounded-xl border border-brand-border">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-brand-warm-grey" />
          <input
            type="text"
            placeholder="Search by name, company, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs placeholder-brand-warm-grey/50 focus:outline-none focus:border-brand-gold"
          />
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs text-brand-warm-grey flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="rounded bg-brand-black border-brand-border text-brand-gold focus:ring-brand-gold"
            />
            <span>Show archived clients</span>
          </label>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-brand-charcoal rounded-xl border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-black border-b border-brand-border text-brand-warm-grey uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Client / Organisation</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Billing Address</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-brand-warm-grey">
                    Loading clients...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-brand-warm-grey">
                    No clients found. Click "Add Client" to register a client record.
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr key={c.id} className="hover:bg-brand-black/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-brand-off-white text-sm">{c.name}</div>
                      {c.company_name && (
                        <div className="text-brand-warm-grey text-[11px]">{c.company_name}</div>
                      )}
                      {c.tax_number && (
                        <div className="text-[10px] text-brand-gold font-mono">VAT: {c.tax_number}</div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-brand-warm-grey space-y-0.5">
                      <div className="flex items-center space-x-1.5">
                        <Mail className="w-3.5 h-3.5 text-brand-gold/70" />
                        <span>{c.email}</span>
                      </div>
                      {c.phone && (
                        <div className="flex items-center space-x-1.5">
                          <Phone className="w-3.5 h-3.5 text-brand-gold/70" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-brand-warm-grey max-w-xs truncate">
                      {c.billing_address || <span className="text-zinc-600 italic">None provided</span>}
                    </td>

                    <td className="py-3 px-4">
                      {c.is_archived === 1 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                          Archived
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                          Active
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => viewClientDetails(c)}
                          className="p-1.5 rounded bg-brand-black border border-brand-border text-brand-warm-grey hover:text-brand-off-white hover:border-brand-gold"
                          title="View quotes & invoices"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(c)}
                          className="p-1.5 rounded bg-brand-black border border-brand-border text-brand-warm-grey hover:text-brand-gold hover:border-brand-gold"
                          title="Edit client"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleArchive(c)}
                          className="p-1.5 rounded bg-brand-black border border-brand-border text-brand-warm-grey hover:text-red-400 hover:border-red-800"
                          title={c.is_archived ? 'Restore Client' : 'Archive Client'}
                        >
                          {c.is_archived ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-brand-charcoal border border-brand-border rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <h2 className="text-base font-bold text-brand-off-white">
                {editingClient ? 'Edit Client Record' : 'Register New Client'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-brand-warm-grey hover:text-brand-off-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-off-white mb-1">
                  Client / Primary Contact Name <span className="text-brand-gold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe or Acme Corporation"
                  className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-off-white mb-1">
                  Registered Business / Legal Company Name
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="e.g. Acme Holdings (Pty) Ltd"
                  className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-off-white mb-1">
                    Email Address <span className="text-brand-gold">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="accounts@acme.co.za"
                    className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-off-white mb-1">
                    Telephone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+27 11 000 0000"
                    className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-off-white mb-1">
                    Tax / VAT Registration Number
                  </label>
                  <input
                    type="text"
                    value={formData.tax_number}
                    onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                    placeholder="e.g. 4990123456"
                    className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-off-white mb-1">
                    Internal Notes
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Key contact person, billing cycle..."
                    className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-off-white mb-1">
                  Billing Physical / Postal Address
                </label>
                <textarea
                  rows={2}
                  value={formData.billing_address}
                  onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                  placeholder="Street, Suburb, City, Postal Code"
                  className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className="pt-3 border-t border-brand-border flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-black text-brand-warm-grey hover:text-brand-off-white border border-brand-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-brand-gold text-brand-black hover:bg-brand-gold-light transition-colors disabled:opacity-50"
                >
                  {modalSubmitting ? 'Saving...' : editingClient ? 'Update Client' : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Detail Drawer */}
      {selectedClientDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-end">
          <div className="bg-brand-charcoal border-l border-brand-border w-full max-w-xl h-full overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-brand-border">
              <div>
                <h2 className="text-lg font-bold text-brand-off-white">
                  {selectedClientDetail.client.name}
                </h2>
                {selectedClientDetail.client.company_name && (
                  <p className="text-xs text-brand-gold">{selectedClientDetail.client.company_name}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedClientDetail(null)}
                className="text-brand-warm-grey hover:text-brand-off-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-brand-warm-grey">
              <div><strong>Email:</strong> {selectedClientDetail.client.email}</div>
              {selectedClientDetail.client.phone && <div><strong>Phone:</strong> {selectedClientDetail.client.phone}</div>}
              {selectedClientDetail.client.tax_number && <div><strong>VAT No:</strong> {selectedClientDetail.client.tax_number}</div>}
              {selectedClientDetail.client.billing_address && <div><strong>Address:</strong> {selectedClientDetail.client.billing_address}</div>}
            </div>

            {/* Linked Invoices */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-off-white">
                Linked Invoices ({selectedClientDetail.invoices.length})
              </h3>
              {selectedClientDetail.invoices.length === 0 ? (
                <p className="text-xs text-brand-warm-grey">No invoices issued to this client yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedClientDetail.invoices.map((inv) => (
                    <div key={inv.id} className="p-3 rounded-lg bg-brand-black border border-brand-border flex items-center justify-between text-xs">
                      <div>
                        <div className="font-mono font-bold text-brand-off-white">{inv.invoice_number}</div>
                        <div className="text-[10px] text-brand-warm-grey">{inv.issue_date} • {inv.status}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-brand-gold">R {inv.total_amount.toFixed(2)}</div>
                        <a href={`/api/invoices/${inv.id}/pdf`} target="_blank" rel="noreferrer" className="text-[10px] text-brand-warm-grey hover:underline">
                          PDF
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Linked Quotes */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-off-white">
                Linked Quotations ({selectedClientDetail.quotes.length})
              </h3>
              {selectedClientDetail.quotes.length === 0 ? (
                <p className="text-xs text-brand-warm-grey">No quotations created for this client yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedClientDetail.quotes.map((q) => (
                    <div key={q.id} className="p-3 rounded-lg bg-brand-black border border-brand-border flex items-center justify-between text-xs">
                      <div>
                        <div className="font-mono font-bold text-brand-off-white">{q.quote_number}</div>
                        <div className="text-[10px] text-brand-warm-grey">{q.issue_date} • {q.status}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-brand-off-white">R {q.total_amount.toFixed(2)}</div>
                        <a href={`/api/quotes/${q.id}/pdf`} target="_blank" rel="noreferrer" className="text-[10px] text-brand-warm-grey hover:underline">
                          PDF
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
