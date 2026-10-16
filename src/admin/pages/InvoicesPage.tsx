import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Download,
  CreditCard,
  Edit2,
  AlertCircle,
  X,
  History,
  Mail,
  Send,
  Check,
  Trash2,
} from 'lucide-react';
import { apiRequest } from '../../api/client';
import { Invoice, Client, LineItem, Payment } from '../../types';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Email Invoice Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailTargetInvoice, setEmailTargetInvoice] = useState<Invoice | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [customEmailMessage, setCustomEmailMessage] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [hasBeenSentBefore, setHasBeenSentBefore] = useState(false);
  const [lastSentDetails, setLastSentDetails] = useState<string | null>(null);
  const [confirmResendCheckbox, setConfirmResendCheckbox] = useState(false);

  // Delete Invoice Modal State
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingInvoice, setIsDeletingInvoice] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Invoice Creator / Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);
  const [clientId, setClientId] = useState<number>(0);
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [status, setStatus] = useState<'Draft' | 'Issued' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled'>('Draft');
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Payment due within 14 days of invoice date.');
  const [items, setItems] = useState<LineItem[]>([
    { description: 'Website Design & Implementation', quantity: 1, unit_price: 15000, discount_percent: 0, tax_rate: 15 },
  ]);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [editorSubmitting, setEditorSubmitting] = useState(false);

  // Record Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'EFT' | 'Card' | 'Bank Deposit' | 'Other'>('EFT');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // View Payments History Drawer
  const [viewingPayments, setViewingPayments] = useState<{
    invoice: Invoice;
    payments: Payment[];
  } | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (statusFilter) query.set('status', statusFilter);

      const [invoicesRes, clientsRes] = await Promise.all([
        apiRequest<{ invoices: Invoice[] }>(`/invoices?${query.toString()}`),
        apiRequest<{ clients: Client[] }>('/clients'),
      ]);

      setInvoices(invoicesRes.invoices);
      setClients(clientsRes.clients);
    } catch (err: any) {
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
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

  const openNewInvoiceModal = () => {
    setEditingInvoiceId(null);
    setClientId(clients[0]?.id || 0);
    setIssueDate(new Date().toISOString().split('T')[0]);
    const due = new Date();
    due.setDate(due.getDate() + 14);
    setDueDate(due.toISOString().split('T')[0]);
    setStatus('Draft');
    setNotes('');
    setPaymentTerms('Payment due within 14 days of invoice date.');
    setItems([
      { description: 'Website Design & Development', quantity: 1, unit_price: 15000, discount_percent: 0, tax_rate: 15 },
    ]);
    setEditorError(null);
    setIsEditorOpen(true);
  };

  const openEditInvoiceModal = async (invoice: Invoice) => {
    try {
      const data = await apiRequest<{ invoice: Invoice; items: LineItem[] }>(`/invoices/${invoice.id}`);
      setEditingInvoiceId(invoice.id);
      setClientId(data.invoice.client_id);
      setIssueDate(data.invoice.issue_date);
      setDueDate(data.invoice.due_date);
      setStatus(data.invoice.status);
      setNotes(data.invoice.notes || '');
      setPaymentTerms(data.invoice.payment_terms || '');
      setItems(data.items.length > 0 ? data.items : [
        { description: 'Standard Service', quantity: 1, unit_price: 0, discount_percent: 0, tax_rate: 15 },
      ]);
      setEditorError(null);
      setIsEditorOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to load invoice details.');
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
      due_date: dueDate,
      status,
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
      if (editingInvoiceId) {
        await apiRequest(`/invoices/${editingInvoiceId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/invoices', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setIsEditorOpen(false);
      fetchInvoices();
    } catch (err: any) {
      setEditorError(err.message || 'Failed to save invoice.');
    } finally {
      setEditorSubmitting(false);
    }
  };

  // Record Payment
  const openPaymentModal = (invoice: Invoice) => {
    setSelectedInvoiceForPayment(invoice);
    setPaymentAmount(invoice.balance_due);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('EFT');
    setPaymentReference(`EFT-${invoice.invoice_number.replace('INV-', '')}`);
    setPaymentNotes('');
    setPaymentError(null);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;
    setPaymentError(null);

    if (paymentAmount <= 0) {
      setPaymentError('Payment amount must be greater than zero.');
      return;
    }

    if (!paymentReference.trim()) {
      setPaymentError('Payment reference code is required.');
      return;
    }

    setPaymentSubmitting(true);
    try {
      await apiRequest(`/invoices/${selectedInvoiceForPayment.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(paymentAmount),
          payment_date: paymentDate,
          payment_method: paymentMethod,
          reference: paymentReference,
          notes: paymentNotes,
        }),
      });

      setIsPaymentModalOpen(false);
      fetchInvoices();
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to record payment.');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const viewPaymentHistory = async (invoice: Invoice) => {
    try {
      const data = await apiRequest<{ invoice: Invoice; payments: Payment[] }>(`/invoices/${invoice.id}`);
      setViewingPayments(data);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch payment records.');
    }
  };

  const updateInvoiceStatus = async (invoiceId: number, newStatus: string) => {
    try {
      await apiRequest(`/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchInvoices();
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const openDeleteModal = (inv: Invoice) => {
    setInvoiceToDelete(inv);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    setIsDeletingInvoice(true);
    setDeleteError(null);
    try {
      await apiRequest(`/invoices/${invoiceToDelete.id}`, { method: 'DELETE' });
      setIsDeleteModalOpen(false);
      setInvoiceToDelete(null);
      fetchInvoices();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete invoice.');
    } finally {
      setIsDeletingInvoice(false);
    }
  };

  const openEmailModal = (inv: Invoice) => {
    setEmailTargetInvoice(inv);
    const client = clients.find((c) => c.id === inv.client_id);
    setRecipientEmail(client?.email || (inv as any).client_email || '');
    setEmailSubject(`Tax Invoice ${inv.invoice_number} — S&S Tech Group (Pty) Ltd`);
    setCustomEmailMessage(
      `Dear ${inv.client_name},\n\nPlease find attached official Tax Invoice ${inv.invoice_number} from S&S Tech Group (Pty) Ltd.\n\nBalance Due: R ${inv.balance_due.toFixed(2)} (Payment Due: ${inv.due_date}).\n\nBanking details and payment reference are detailed in the attached document.`
    );
    setEmailSuccess(null);
    setEmailError(null);
    setConfirmResendCheckbox(false);

    const isAlreadySent = inv.status === 'Issued' || inv.status === 'Paid' || inv.status === 'Partially Paid';
    setHasBeenSentBefore(isAlreadySent);
    setLastSentDetails(isAlreadySent ? `Invoice status is currently '${inv.status}'.` : null);

    setIsEmailModalOpen(true);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTargetInvoice) return;
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setEmailError('Please enter a valid recipient email address.');
      return;
    }

    if (hasBeenSentBefore && !confirmResendCheckbox) {
      setEmailError('This tax invoice has already been issued/sent. Please check the confirmation box below to verify re-sending.');
      return;
    }

    setEmailSending(true);
    setEmailError(null);
    setEmailSuccess(null);

    try {
      const res = await apiRequest<{ message: string }>(`/invoices/${emailTargetInvoice.id}/send-email`, {
        method: 'POST',
        body: JSON.stringify({
          recipient_email: recipientEmail,
          subject: emailSubject,
          custom_message: customEmailMessage,
          confirm_resend: confirmResendCheckbox,
        }),
      });

      setEmailSuccess(res.message);
      fetchInvoices();
      setTimeout(() => {
        setIsEmailModalOpen(false);
        setEmailSuccess(null);
      }, 2000);
    } catch (err: any) {
      if (err.requiresConfirmation || err.status === 409) {
        setHasBeenSentBefore(true);
        setLastSentDetails(err.message || 'Invoice was previously sent.');
      }
      setEmailError(err.message || 'Failed to dispatch tax invoice email.');
    } finally {
      setEmailSending(false);
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'Paid':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40';
      case 'Partially Paid':
        return 'bg-amber-950/60 text-brand-gold border-brand-gold/40';
      case 'Issued':
        return 'bg-blue-950/60 text-blue-400 border-blue-800/40';
      case 'Overdue':
        return 'bg-red-950/60 text-red-400 border-red-800/40';
      case 'Cancelled':
        return 'bg-zinc-800 text-zinc-500 border-zinc-700 line-through';
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
            Tax Invoices &amp; Payments
          </h1>
          <p className="text-xs sm:text-sm text-brand-warm-grey mt-1">
            Generate sequential tax invoices, record verified payment receipts, track outstanding balances, and export print-ready PDFs.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewInvoiceModal}
          className="inline-flex items-center px-4 py-2.5 rounded-lg text-xs font-bold bg-brand-gold hover:bg-brand-gold-light text-brand-black transition-all shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Invoice
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
            placeholder="Search by invoice # or client name..."
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
            <option value="Issued">Issued</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-brand-charcoal rounded-xl border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-black border-b border-brand-border text-brand-warm-grey uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Invoice Number</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Financials (ZAR)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-brand-warm-grey">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-brand-warm-grey">
                    No invoices recorded yet. Click "Create Invoice" or convert an accepted quotation.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-brand-black/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-brand-off-white text-sm">
                        {inv.invoice_number}
                      </div>
                      {inv.quote_id && (
                        <div className="text-[10px] text-brand-warm-grey">
                          From Quote #{inv.quote_id}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-brand-off-white">{inv.client_name}</div>
                      {inv.client_company && (
                        <div className="text-[11px] text-brand-warm-grey">{inv.client_company}</div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-brand-warm-grey text-[11px]">
                      <div>Issued: {inv.issue_date}</div>
                      <div>Due: {inv.due_date}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-brand-off-white text-sm">
                        Total: R {inv.total_amount.toFixed(2)}
                      </div>
                      <div className="text-[11px] font-mono">
                        {inv.balance_due > 0 ? (
                          <span className="text-brand-gold font-semibold">
                            Balance Due: R {inv.balance_due.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-semibold">
                            Paid in Full
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <select
                        value={inv.status}
                        onChange={(e) => updateInvoiceStatus(inv.id, e.target.value)}
                        className={`text-[10px] font-semibold px-2 py-1 rounded border bg-brand-black focus:outline-none ${getStatusBadge(
                          inv.status
                        )}`}
                      >
                        <option value="Draft">Draft</option>
                        <option value="Issued">Issued</option>
                        <option value="Partially Paid">Partially Paid</option>
                        <option value="Paid">Paid</option>
                        <option value="Overdue">Overdue</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => openEmailModal(inv)}
                          className="p-1.5 rounded bg-brand-black border border-brand-border text-brand-warm-grey hover:text-brand-gold hover:border-brand-gold"
                          title="Email Invoice to Client directly"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={`/api/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded bg-brand-black border border-brand-border text-brand-warm-grey hover:text-brand-gold hover:border-brand-gold"
                          title="Download Branded PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>

                        {inv.balance_due > 0 && inv.status !== 'Cancelled' && (
                          <button
                            type="button"
                            onClick={() => openPaymentModal(inv)}
                            className="p-1.5 rounded bg-brand-gold/10 border border-brand-gold/30 text-brand-gold hover:bg-brand-gold hover:text-brand-black transition-colors"
                            title="Record payment"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => viewPaymentHistory(inv)}
                          className="p-1.5 rounded bg-brand-black border border-brand-border text-brand-warm-grey hover:text-brand-off-white hover:border-brand-gold"
                          title="View Payment History"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditInvoiceModal(inv)}
                          className="p-1.5 rounded bg-brand-black border border-brand-border text-brand-warm-grey hover:text-brand-off-white hover:border-brand-gold"
                          title="Edit invoice"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openDeleteModal(inv)}
                          className="p-1.5 rounded bg-brand-black border border-brand-border text-brand-warm-grey hover:text-red-400 hover:border-red-500/50 transition-colors"
                          title="Delete invoice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Record Payment Modal */}
      {isPaymentModalOpen && selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-brand-charcoal border border-brand-border rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div>
                <h2 className="text-base font-bold text-brand-off-white">Record Verified Payment</h2>
                <p className="text-xs text-brand-gold font-mono">{selectedInvoiceForPayment.invoice_number}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-brand-warm-grey hover:text-brand-off-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {paymentError && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-xs">
                {paymentError}
              </div>
            )}

            <div className="p-3 rounded-lg bg-brand-black border border-brand-border/60 text-xs space-y-1">
              <div className="flex justify-between text-brand-warm-grey">
                <span>Invoice Total:</span>
                <span className="font-mono text-brand-off-white">R {selectedInvoiceForPayment.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-brand-gold font-bold">
                <span>Outstanding Balance:</span>
                <span className="font-mono">R {selectedInvoiceForPayment.balance_due.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-off-white mb-1">
                  Payment Amount (ZAR) <span className="text-brand-gold">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs font-mono font-bold focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-off-white mb-1">
                    Payment Date <span className="text-brand-gold">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-off-white mb-1">
                    Method <span className="text-brand-gold">*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                  >
                    <option value="EFT">EFT / Bank Transfer</option>
                    <option value="Card">Card</option>
                    <option value="Bank Deposit">Bank Deposit</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-off-white mb-1">
                  Transaction Reference <span className="text-brand-gold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. Bank statement ref or transaction ID"
                  className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-off-white mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. 50% project deposit"
                  className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className="pt-3 border-t border-brand-border flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-black text-brand-warm-grey hover:text-brand-off-white border border-brand-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-brand-gold text-brand-black hover:bg-brand-gold-light transition-colors disabled:opacity-50"
                >
                  {paymentSubmitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Creator & Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-brand-charcoal border border-brand-border rounded-2xl w-full max-w-4xl p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <h2 className="text-lg font-bold text-brand-off-white">
                {editingInvoiceId ? 'Edit Invoice' : 'Create Tax Invoice'}
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
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                  />
                </div>
              </div>

              {/* Line items table */}
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
                                placeholder="Service description"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-off-white mb-1">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Reference, project description..."
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
                    placeholder="Payment due within 14 days of invoice date."
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
                  {editorSubmitting ? 'Saving...' : editingInvoiceId ? 'Update Invoice' : 'Create Invoice'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Payment History Drawer */}
      {viewingPayments && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-end">
          <div className="bg-brand-charcoal border-l border-brand-border w-full max-w-md h-full overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div>
                <h2 className="text-base font-bold text-brand-off-white">Payment History</h2>
                <p className="text-xs text-brand-gold font-mono">{viewingPayments.invoice.invoice_number}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingPayments(null)}
                className="text-brand-warm-grey hover:text-brand-off-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-lg bg-brand-black border border-brand-border/60 text-xs space-y-1">
              <div className="flex justify-between text-brand-warm-grey">
                <span>Total Invoiced:</span>
                <span className="font-mono text-brand-off-white">R {viewingPayments.invoice.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Total Received:</span>
                <span className="font-mono">R {viewingPayments.invoice.paid_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-brand-gold font-bold pt-1 border-t border-brand-border/40">
                <span>Remaining Balance:</span>
                <span className="font-mono">R {viewingPayments.invoice.balance_due.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-off-white">
                Recorded Payments ({viewingPayments.payments.length})
              </h3>

              {viewingPayments.payments.length === 0 ? (
                <p className="text-xs text-brand-warm-grey">No payments recorded against this invoice yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {viewingPayments.payments.map((p) => (
                    <div key={p.id} className="p-3 rounded-lg bg-brand-black border border-brand-border text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-emerald-400">R {p.amount.toFixed(2)}</span>
                        <span className="text-[10px] text-brand-warm-grey">{p.payment_date}</span>
                      </div>
                      <div className="text-brand-off-white text-[11px]">
                        <strong>Method:</strong> {p.payment_method} • <strong>Ref:</strong> {p.reference}
                      </div>
                      {p.notes && <div className="text-[11px] text-brand-warm-grey">Notes: {p.notes}</div>}
                      <div className="text-[9px] text-brand-warm-grey/60 pt-0.5">Recorded by {p.recorded_by}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Email Invoice to Client Modal */}
      {isEmailModalOpen && emailTargetInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-brand-charcoal border border-brand-border rounded-2xl w-full max-w-xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-brand-border">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-brand-black border border-brand-gold/40 flex items-center justify-center text-brand-gold">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-brand-off-white">
                    Email Tax Invoice {emailTargetInvoice.invoice_number}
                  </h2>
                  <p className="text-xs text-brand-warm-grey">
                    Directly email official PDF tax invoice with EFT banking details to client.
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
                  <span>Notice: Tax Invoice Already Issued / Sent</span>
                </div>
                <p className="text-[11px] text-brand-off-white/90 leading-relaxed">
                  {lastSentDetails || `This invoice has already been issued or dispatched. Re-sending will dispatch a fresh copy to the client.`}
                </p>
                <label className="flex items-start space-x-2.5 pt-2 border-t border-amber-800/50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={confirmResendCheckbox}
                    onChange={(e) => setConfirmResendCheckbox(e.target.checked)}
                    className="mt-0.5 rounded bg-brand-black border-brand-border text-brand-gold focus:ring-brand-gold w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs text-brand-gold font-semibold leading-snug">
                    Confirm re-sending invoice to {recipientEmail || 'client'}
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
                    {emailTargetInvoice.client_name}
                    {emailTargetInvoice.client_company && ` • ${emailTargetInvoice.client_company}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-brand-warm-grey uppercase tracking-wider font-semibold">
                    Balance Due
                  </div>
                  <div className="font-mono font-bold text-brand-gold text-sm">
                    R {emailTargetInvoice.balance_due.toFixed(2)}
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
                  Personal Message / Payment Note
                </label>
                <textarea
                  rows={4}
                  value={customEmailMessage}
                  onChange={(e) => setCustomEmailMessage(e.target.value)}
                  placeholder="Payment instructions, due dates, project references..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
                />
              </div>

              {/* Attachment & EFT Summary */}
              <div className="p-3.5 rounded-xl bg-brand-black border border-brand-border space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="px-2 py-0.5 rounded bg-brand-charcoal text-[10px] font-mono font-bold text-brand-gold border border-brand-gold/30">
                      PDF ATTACHMENT
                    </span>
                    <span className="font-mono text-brand-off-white text-xs">
                      SSTechGroup-Invoice-{emailTargetInvoice.invoice_number}.pdf
                    </span>
                  </div>
                  <a
                    href={`/api/invoices/${emailTargetInvoice.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-gold hover:text-brand-gold-light flex items-center font-semibold"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" /> Preview
                  </a>
                </div>
                <div className="pt-2 border-t border-brand-border/60 flex justify-between text-[11px] text-brand-warm-grey">
                  <span>Balance Due: <strong className="text-brand-gold font-mono">R {emailTargetInvoice.balance_due.toFixed(2)}</strong></span>
                  <span>Due Date: <strong className="text-brand-off-white">{emailTargetInvoice.due_date}</strong></span>
                </div>
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
                    'Sending Invoice...'
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      {hasBeenSentBefore ? 'Confirm & Re-send Invoice' : 'Send Tax Invoice with PDF'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && invoiceToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-brand-charcoal border border-brand-border rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center space-x-3 text-red-400">
              <div className="p-2 rounded-lg bg-red-950/60 border border-red-800/60">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-off-white">Delete Tax Invoice</h3>
                <p className="text-xs text-brand-warm-grey">Permanent accounting action</p>
              </div>
            </div>

            <p className="text-xs text-brand-off-white/90 leading-relaxed">
              Are you sure you want to permanently delete invoice{' '}
              <strong className="text-brand-gold">{invoiceToDelete.invoice_number}</strong> for{' '}
              <strong className="text-brand-off-white">{invoiceToDelete.client_name}</strong> (Total: R {invoiceToDelete.total_amount.toFixed(2)})?
            </p>

            {invoiceToDelete.paid_amount > 0 && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300">
                ⚠️ Warning: This invoice has <strong>R {invoiceToDelete.paid_amount.toFixed(2)}</strong> in recorded payments. Deleting this invoice will remove these payment records.
              </div>
            )}

            {invoiceToDelete.quote_id && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-brand-gold">
                ℹ️ Note: This invoice was generated from a quotation. Deleting it will restore the source quote to 'Sent' status.
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
                  setInvoiceToDelete(null);
                }}
                disabled={isDeletingInvoice}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-brand-black text-brand-warm-grey hover:text-brand-off-white border border-brand-border"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteInvoice}
                disabled={isDeletingInvoice}
                className="px-5 py-2.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-all shadow-md disabled:opacity-50 flex items-center"
              >
                {isDeletingInvoice ? 'Deleting...' : 'Delete Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
