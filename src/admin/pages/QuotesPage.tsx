import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Copy,
  ArrowRight,
  Download,
  Edit2,
  AlertCircle,
  X,
  Mail,
  Send,
  Check,
  Trash2,
  ExternalLink,
  Link,
} from 'lucide-react';
import { apiRequest } from '../../api/client';
import { Quote, Client, LineItem, QuoteStatus } from '../../types';

export const QuotesPage: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Email Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailTargetQuote, setEmailTargetQuote] = useState<Quote | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [customEmailMessage, setCustomEmailMessage] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [hasBeenSentBefore, setHasBeenSentBefore] = useState(false);
  const [lastSentDetails, setLastSentDetails] = useState<string | null>(null);
  const [confirmResendCheckbox, setConfirmResendCheckbox] = useState(false);

  // Delete Quote Modal State
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingQuote, setIsDeletingQuote] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Quote Creator / Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<number | null>(null);
  const [clientId, setClientId] = useState<number>(0);
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [status, setStatus] = useState<QuoteStatus>('Draft');
  const [scopeOfWork, setScopeOfWork] = useState('');
  const [notes, setNotes] = useState('This quotation is valid for 30 days from date of issue.');
  const [paymentTerms, setPaymentTerms] = useState('50% deposit upon commencement, 50% upon delivery.');
  const [items, setItems] = useState<LineItem[]>([
    { description: 'Website Design & Implementation', quantity: 1, unit_price: 15000, discount_percent: 0, tax_rate: 15 },
  ]);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [editorSubmitting, setEditorSubmitting] = useState(false);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (statusFilter) query.set('status', statusFilter);

      const [quotesRes, clientsRes] = await Promise.all([
        apiRequest<{ quotes: Quote[] }>(`/quotes?${query.toString()}`),
        apiRequest<{ clients: Client[] }>('/clients'),
      ]);

      setQuotes(quotesRes.quotes);
      setClients(clientsRes.clients);
    } catch (err: any) {
      setError(err.message || 'Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [search, statusFilter]);

  // Line item helpers
  const addItem = () => {
    setItems([
      ...items,
      { description: '', quantity: 1, unit_price: 0, discount_percent: 0, tax_rate: 15 },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Live total calculation for editor
  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    items.forEach((item) => {
      const gross = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
      const discount = gross * ((Number(item.discount_percent) || 0) / 100);
      const net = gross - discount;
      const tax = net * ((Number(item.tax_rate) || 0) / 100);

      subtotal += gross;
      totalDiscount += discount;
      totalTax += tax;
    });

    const total = subtotal - totalDiscount + totalTax;
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  };

  const openNewQuoteModal = () => {
    setEditingQuoteId(null);
    setClientId(clients[0]?.id || 0);
    setIssueDate(new Date().toISOString().split('T')[0]);
    const exp = new Date();
    exp.setDate(exp.getDate() + 30);
    setExpiryDate(exp.toISOString().split('T')[0]);
    setStatus('Draft');
    setScopeOfWork('');
    setNotes('This quotation is valid for 30 days from date of issue.');
    setPaymentTerms('50% deposit upon commencement, 50% upon delivery.');
    setItems([
      { description: 'Website Design & Development', quantity: 1, unit_price: 15000, discount_percent: 0, tax_rate: 15 },
    ]);
    setEditorError(null);
    setIsEditorOpen(true);
  };

  const openEditQuoteModal = async (quote: Quote) => {
    try {
      const data = await apiRequest<{ quote: Quote; items: LineItem[] }>(`/quotes/${quote.id}`);
      setEditingQuoteId(quote.id);
      setClientId(data.quote.client_id);
      setIssueDate(data.quote.issue_date);
      setExpiryDate(data.quote.expiry_date);
      setStatus(data.quote.status);
      setScopeOfWork(data.quote.scope_of_work || '');
      setNotes(data.quote.notes || '');
      setPaymentTerms(data.quote.payment_terms || '');
      setItems(data.items.length > 0 ? data.items : [
        { description: 'Standard Service', quantity: 1, unit_price: 0, discount_percent: 0, tax_rate: 15 },
      ]);
      setEditorError(null);
      setIsEditorOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to load quote details.');
    }
  };

  const handleEditorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditorError(null);

    if (!clientId) {
      setEditorError('Please select a client.');
      return;
    }

    if (items.some((i) => !i.description.trim())) {
      setEditorError('All line items must have a description.');
      return;
    }

    setEditorSubmitting(true);
    const payload = {
      client_id: Number(clientId),
      issue_date: issueDate,
      expiry_date: expiryDate,
      status,
      scope_of_work: scopeOfWork,
      notes,
      payment_terms: paymentTerms,
      items: items.map((i) => ({
        description: i.description,
        quantity: Number(i.quantity) || 1,
        unit_price: Number(i.unit_price) || 0,
        discount_percent: Number(i.discount_percent) || 0,
        tax_rate: Number(i.tax_rate) || 0,
      })),
    };

    try {
      if (editingQuoteId) {
        await apiRequest(`/quotes/${editingQuoteId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/quotes', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setIsEditorOpen(false);
      fetchQuotes();
    } catch (err: any) {
      setEditorError(err.message || 'Failed to save quotation.');
    } finally {
      setEditorSubmitting(false);
    }
  };

  const duplicateQuote = async (quote: Quote) => {
    if (!confirm(`Duplicate quotation ${quote.quote_number} as a new draft?`)) return;
    try {
      const res = await apiRequest<{ newQuoteId: number; quote_number: string }>(`/quotes/${quote.id}/duplicate`, {
        method: 'POST',
      });
      alert(`Quotation duplicated as ${res.quote_number}`);
      fetchQuotes();
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate quotation.');
    }
  };

  const convertToInvoice = async (quote: Quote) => {
    if (!confirm(`Convert quote ${quote.quote_number} into a tax invoice?`)) return;
    try {
      const res = await apiRequest<{ invoice_number: string }>(`/quotes/${quote.id}/convert-to-invoice`, {
        method: 'POST',
      });
      alert(`Quote converted to invoice ${res.invoice_number}`);
      fetchQuotes();
    } catch (err: any) {
      alert(err.message || 'Failed to convert quote.');
    }
  };

  const updateQuoteStatus = async (quoteId: number, newStatus: string) => {
    try {
      await apiRequest(`/quotes/${quoteId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchQuotes();
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const openDeleteModal = (quote: Quote) => {
    setQuoteToDelete(quote);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteQuote = async () => {
    if (!quoteToDelete) return;
    setIsDeletingQuote(true);
    setDeleteError(null);
    try {
      await apiRequest(`/quotes/${quoteToDelete.id}`, { method: 'DELETE' });
      setIsDeleteModalOpen(false);
      setQuoteToDelete(null);
      fetchQuotes();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete quotation.');
    } finally {
      setIsDeletingQuote(false);
    }
  };

  const openEmailModal = async (q: Quote) => {
    setEmailTargetQuote(q);
    const client = clients.find((c) => c.id === q.client_id);
    setRecipientEmail(client?.email || (q as any).client_email || '');
    setEmailSubject(`Quotation ${q.quote_number} — S&S Tech Group (Pty) Ltd`);
    setCustomEmailMessage(`Dear ${q.client_name},\n\nPlease find attached official quotation ${q.quote_number} from S&S Tech Group (Pty) Ltd for your review.\n\nWe look forward to collaborating with your team.`);
    setEmailSuccess(null);
    setEmailError(null);
    setConfirmResendCheckbox(false);

    // Initial check from quote status
    const isAlreadySent = q.status === 'Sent' || q.status === 'Accepted';
    setHasBeenSentBefore(isAlreadySent);
    setLastSentDetails(isAlreadySent ? `Quotation status is '${q.status}'.` : null);

    setIsEmailModalOpen(true);

    // Fetch full audit send history
    try {
      const res = await apiRequest<{ has_been_sent: boolean; sends: any[] }>(`/quotes/${q.id}/send-history`);
      if (res.has_been_sent) {
        setHasBeenSentBefore(true);
        if (res.sends && res.sends.length > 0) {
          const latest = res.sends[0];
          setLastSentDetails(`Previously emailed on ${new Date(latest.created_at).toLocaleString('en-ZA')} by ${latest.admin_name || 'Admin'} (${res.sends.length} time${res.sends.length > 1 ? 's' : ''}).`);
        }
      }
    } catch {
      // Fallback to initial status check
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTargetQuote) return;
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setEmailError('Please enter a valid recipient email address.');
      return;
    }

    if (hasBeenSentBefore && !confirmResendCheckbox) {
      setEmailError('This quotation has already been emailed. Please check the confirmation box below to verify re-sending.');
      return;
    }

    setEmailSending(true);
    setEmailError(null);
    setEmailSuccess(null);

    try {
      const res = await apiRequest<{ message: string }>(`/quotes/${emailTargetQuote.id}/send-email`, {
        method: 'POST',
        body: JSON.stringify({
          recipient_email: recipientEmail,
          subject: emailSubject,
          custom_message: customEmailMessage,
          confirm_resend: confirmResendCheckbox,
        }),
      });

      setEmailSuccess(res.message);
      fetchQuotes();
      setTimeout(() => {
        setIsEmailModalOpen(false);
        setEmailSuccess(null);
      }, 2000);
    } catch (err: any) {
      if (err.requiresConfirmation || err.status === 409) {
        setHasBeenSentBefore(true);
        setLastSentDetails(err.message || 'Quotation was previously sent.');
      }
      setEmailError(err.message || 'Failed to dispatch quotation email.');
    } finally {
      setEmailSending(false);
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'Accepted':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40';
      case 'Sent':
        return 'bg-amber-950/60 text-brand-gold border-brand-gold/40';
      case 'Rejected':
        return 'bg-red-950/60 text-red-400 border-red-800/40';
      case 'Expired':
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
      default:
        return 'bg-zinc-900 text-zinc-300 border-zinc-800';
    }
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-brand-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-off-white">
            Quotations Management
          </h1>
          <p className="text-xs sm:text-sm text-brand-warm-grey mt-1">
            Create, duplicate, preview, download branded PDFs, and convert accepted quotes to invoices.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewQuoteModal}
          className="inline-flex items-center px-4 py-2.5 rounded-lg text-xs font-bold bg-brand-gold hover:bg-brand-gold-light text-brand-black transition-all shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Quotation
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
            placeholder="Search by quote # or client name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs placeholder-brand-warm-grey/50 focus:outline-none focus:border-brand-gold"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="bg-brand-charcoal rounded-xl border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-black border-b border-brand-border text-brand-warm-grey uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Quote Number</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Total (ZAR)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-brand-warm-grey">
                    Loading quotations...
                  </td>
                </tr>
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-brand-warm-grey">
                    No quotations found. Click "Create Quotation" to draft one.
                  </td>
                </tr>
              ) : (
                quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-brand-black/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-brand-off-white text-sm">
                        {q.quote_number}
                      </div>
                      {q.converted_to_invoice_id && (
                        <div className="text-[10px] text-emerald-400 font-semibold">
                          Converted to Invoice
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-brand-off-white">{q.client_name}</div>
                      {q.client_company && (
                        <div className="text-[11px] text-brand-warm-grey">{q.client_company}</div>
                      )}
                      {q.client_email && (
                        <div className="text-[10px] text-brand-champagne/80 truncate max-w-[180px]">
                          {q.client_email}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-brand-warm-grey text-[11px]">
                      <div>Issued: {q.issue_date}</div>
                      <div>Expires: {q.expiry_date}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-brand-off-white text-sm">
                        R {q.total_amount.toFixed(2)}
                      </div>
                      {q.tax_amount > 0 && (
                        <div className="text-[10px] text-brand-warm-grey">
                          incl. VAT R {q.tax_amount.toFixed(2)}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <select
                        value={q.status}
                        onChange={(e) => updateQuoteStatus(q.id, e.target.value)}
                        className={`text-[10px] font-semibold px-2 py-1 rounded border bg-brand-black focus:outline-none ${getStatusBadge(
                          q.status
                        )}`}
                      >
                        <option value="Draft">Draft</option>
                        <option value="Sent">Sent</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Expired">Expired</option>
                      </select>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {q.access_token ? (
                          <a
                            href={`/get-a-quote?token=${q.access_token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded bg-brand-black border border-brand-border text-brand-warm-grey hover:text-brand-champagne hover:border-brand-amber transition-colors"
                            title="Open Customer View & Acceptance Portal"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <a
                            href={`/get-a-quote?ref=${q.quote_number}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded bg-brand-black border border-brand-border text-brand-warm-grey hover:text-brand-champagne hover:border-brand-amber transition-colors"
                            title="Lookup in Customer Portal"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => openEmailModal(q)}
                          className="p-1.5 rounded bg-brand-black border border-brand-border text-brand-warm-grey hover:text-brand-gold hover:border-brand-gold"
                          title="Email Quote to Client directly"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={`/api/quotes/${q.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded bg-brand-black border border-brand-border text-brand-warm-grey hover:text-brand-gold hover:border-brand-gold"
                          title="Download Branded PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>

                        <button
                          type="button"
                          onClick={() => openEditQuoteModal(q)}
                          className="p-1.5 rounded bg-brand-black border border-brand-border text-brand-warm-grey hover:text-brand-off-white hover:border-brand-gold"
                          title="Edit quote"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => duplicateQuote(q)}
                          className="p-1.5 rounded bg-brand-black border border-brand-border text-brand-warm-grey hover:text-brand-gold hover:border-brand-gold"
                          title="Duplicate quote"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openDeleteModal(q)}
                          className="p-1.5 rounded bg-brand-black border border-brand-border text-brand-warm-grey hover:text-red-400 hover:border-red-500/50 transition-colors"
                          title="Delete quotation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {!q.converted_to_invoice_id && (
                          <button
                            type="button"
                            onClick={() => convertToInvoice(q)}
                            className="p-1.5 rounded bg-brand-gold/10 border border-brand-gold/30 text-brand-gold hover:bg-brand-gold hover:text-brand-black transition-colors"
                            title="Convert to Tax Invoice"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
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

      {/* Quote Creator & Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-brand-charcoal border border-brand-border rounded-2xl w-full max-w-4xl p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <h2 className="text-lg font-bold text-brand-off-white">
                {editingQuoteId ? 'Edit Quotation' : 'Create Quotation'}
              </h2>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="text-brand-warm-grey hover:text-brand-off-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editorError && (
              <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-xs">
                {editorError}
              </div>
            )}

            <form onSubmit={handleEditorSubmit} className="space-y-6">
              
              {/* Client and Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-brand-off-white mb-1">
                    Client <span className="text-brand-gold">*</span>
                  </label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                  >
                    <option value="">Select a client...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company_name ? `(${c.company_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-off-white mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-off-white mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                  />
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-off-white">
                    Line Items
                  </h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center text-xs text-brand-gold hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Line Item
                  </button>
                </div>

                <div className="border border-brand-border rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-brand-black text-brand-warm-grey">
                      <tr>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 w-20">Qty</th>
                        <th className="py-2.5 px-3 w-28">Price (ZAR)</th>
                        <th className="py-2.5 px-3 w-20">Disc %</th>
                        <th className="py-2.5 px-3 w-20">Tax %</th>
                        <th className="py-2.5 px-3 w-28 text-right">Total</th>
                        <th className="py-2.5 px-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/60">
                      {items.map((item, idx) => {
                        const gross = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
                        const disc = gross * ((Number(item.discount_percent) || 0) / 100);
                        const lineTotal = gross - disc;

                        return (
                          <tr key={idx} className="bg-brand-charcoal">
                            <td className="p-2">
                              <input
                                type="text"
                                required
                                value={item.description}
                                onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                placeholder="Service or milestone description"
                                className="w-full px-2.5 py-1.5 rounded bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="0.01"
                                step="any"
                                required
                                value={item.quantity}
                                onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                className="w-full px-2 py-1.5 rounded bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                required
                                value={item.unit_price}
                                onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                                className="w-full px-2 py-1.5 rounded bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={item.discount_percent}
                                onChange={(e) => updateItem(idx, 'discount_percent', e.target.value)}
                                className="w-full px-2 py-1.5 rounded bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                value={item.tax_rate}
                                onChange={(e) => updateItem(idx, 'tax_rate', e.target.value)}
                                className="w-full px-2 py-1.5 rounded bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                              />
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-brand-off-white">
                              R {lineTotal.toFixed(2)}
                            </td>
                            <td className="p-2 text-center">
                              {items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeItem(idx)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Totals Summary */}
                <div className="flex justify-end pt-2">
                  <div className="w-64 space-y-1.5 text-xs text-brand-warm-grey">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-mono text-brand-off-white">R {totals.subtotal.toFixed(2)}</span>
                    </div>
                    {totals.totalDiscount > 0 && (
                      <div className="flex justify-between text-brand-gold">
                        <span>Discount:</span>
                        <span className="font-mono">- R {totals.totalDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    {totals.totalTax > 0 && (
                      <div className="flex justify-between">
                        <span>VAT (15%):</span>
                        <span className="font-mono text-brand-off-white">R {totals.totalTax.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-brand-border font-bold text-sm text-brand-gold">
                      <span>Total (ZAR):</span>
                      <span className="font-mono">R {totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scope of Work, Notes & Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-off-white mb-1">
                    Scope of Work &amp; Technical Notes
                  </label>
                  <textarea
                    rows={3}
                    value={scopeOfWork}
                    onChange={(e) => setScopeOfWork(e.target.value)}
                    placeholder="Milestone deliverables, technical requirements..."
                    className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-off-white mb-1">
                    Payment Terms
                  </label>
                  <textarea
                    rows={3}
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="Deposit terms, delivery milestones..."
                    className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-brand-border flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-black text-brand-warm-grey hover:text-brand-off-white border border-brand-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editorSubmitting}
                  className="px-6 py-2 rounded-lg text-xs font-bold bg-brand-gold text-brand-black hover:bg-brand-gold-light transition-colors disabled:opacity-50"
                >
                  {editorSubmitting ? 'Saving...' : editingQuoteId ? 'Update Quotation' : 'Create Quotation'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Email Quote to Client Modal */}
      {isEmailModalOpen && emailTargetQuote && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-brand-charcoal border border-brand-border rounded-2xl w-full max-w-xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-brand-border">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-brand-black border border-brand-gold/40 flex items-center justify-center text-brand-gold">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-brand-off-white">
                    Email Quotation {emailTargetQuote.quote_number}
                  </h2>
                  <p className="text-xs text-brand-warm-grey">
                    Directly email official PDF quotation to client with personal message.
                  </p>
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

            {emailSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center space-x-2 text-emerald-300 text-xs">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>{emailSuccess}</span>
              </div>
            )}

            {emailError && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center space-x-2 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{emailError}</span>
              </div>
            )}

            {/* Already Sent Warning Banner with Mandatory Resend Check */}
            {hasBeenSentBefore ? (
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-600/70 space-y-2.5">
                <div className="flex items-center space-x-2 text-brand-gold font-bold text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-brand-gold" />
                  <span>Notice: Quotation Has Already Been Sent</span>
                </div>
                <p className="text-[11px] text-brand-off-white/90 leading-relaxed">
                  {lastSentDetails || `This quotation has previously been emailed. Re-sending will dispatch a fresh copy to the client.`}
                </p>
                <label className="flex items-start space-x-2.5 pt-2 border-t border-amber-800/50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={confirmResendCheckbox}
                    onChange={(e) => setConfirmResendCheckbox(e.target.checked)}
                    className="mt-0.5 rounded bg-brand-black border-brand-border text-brand-gold focus:ring-brand-gold w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs text-brand-gold font-semibold leading-snug">
                    Confirm re-sending quotation to {recipientEmail || 'client'}
                  </span>
                </label>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-brand-black border border-brand-border text-xs flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-brand-warm-grey uppercase tracking-wider font-semibold">
                    Client Recipient
                  </div>
                  <div className="font-semibold text-brand-off-white mt-0.5">
                    {emailTargetQuote.client_name}
                    {emailTargetQuote.client_company && ` • ${emailTargetQuote.client_company}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-brand-warm-grey uppercase tracking-wider font-semibold">
                    Quote Total
                  </div>
                  <div className="font-mono font-bold text-brand-gold text-sm">
                    R {emailTargetQuote.total_amount.toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                  Recipient Email <span className="text-brand-gold">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="client@company.co.za"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                  Subject Line
                </label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                  Personal Message / Note
                </label>
                <textarea
                  rows={4}
                  value={customEmailMessage}
                  onChange={(e) => setCustomEmailMessage(e.target.value)}
                  placeholder="Add any specific context, milestones or greeting..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                />
              </div>

              {/* Attachment Preview Box */}
              <div className="p-3.5 rounded-xl bg-brand-black border border-brand-border flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5">
                  <span className="px-2 py-0.5 rounded bg-brand-charcoal text-[10px] font-mono font-bold text-brand-gold border border-brand-gold/30">
                    PDF ATTACHMENT
                  </span>
                  <span className="font-mono text-brand-off-white text-xs">
                    SSTechGroup-Quote-{emailTargetQuote.quote_number}.pdf
                  </span>
                </div>
                <a
                  href={`/api/quotes/${emailTargetQuote.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-gold hover:text-brand-gold-light flex items-center font-semibold"
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> Preview
                </a>
              </div>

              <div className="pt-4 border-t border-brand-border flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-brand-black text-brand-warm-grey hover:text-brand-off-white border border-brand-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={emailSending || (hasBeenSentBefore && !confirmResendCheckbox)}
                  className="px-6 py-2.5 rounded-lg text-xs font-bold bg-brand-gold hover:bg-brand-gold-light text-brand-black transition-all shadow-md flex items-center disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  {emailSending ? (
                    'Sending Email...'
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      {hasBeenSentBefore ? 'Confirm & Re-send Email' : 'Send Email with PDF'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && quoteToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-brand-charcoal border border-brand-border rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center space-x-3 text-red-400">
              <div className="p-2 rounded-lg bg-red-950/60 border border-red-800/60">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-off-white">Delete Quotation</h3>
                <p className="text-xs text-brand-warm-grey">Permanent action</p>
              </div>
            </div>

            <p className="text-xs text-brand-off-white/90 leading-relaxed">
              Are you sure you want to permanently delete quotation{' '}
              <strong className="text-brand-gold">{quoteToDelete.quote_number}</strong> for{' '}
              <strong className="text-brand-off-white">{quoteToDelete.client_name}</strong> (Total: R {quoteToDelete.total_amount.toFixed(2)})?
            </p>

            {quoteToDelete.converted_to_invoice_id && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-brand-gold">
                ⚠️ This quote was converted to a tax invoice. Deleting this quote will unlink the invoice reference.
              </div>
            )}

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs">
                {deleteError}
              </div>
            )}

            <div className="pt-3 border-t border-brand-border flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setQuoteToDelete(null);
                }}
                disabled={isDeletingQuote}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-brand-black text-brand-warm-grey hover:text-brand-off-white border border-brand-border"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteQuote}
                disabled={isDeletingQuote}
                className="px-5 py-2.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-all shadow-md disabled:opacity-50 flex items-center"
              >
                {isDeletingQuote ? 'Deleting...' : 'Delete Quotation'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
