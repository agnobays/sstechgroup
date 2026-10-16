import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Receipt,
  Users,
  AlertCircle,
  TrendingUp,
  Clock,
  ArrowRight,
  Download,
  Plus,
  Inbox,
  CheckCircle2,
  X,
  Sparkles,
  Layers,
} from 'lucide-react';
import { apiRequest } from '../../api/client';
import { DashboardMetrics, Quote, Invoice, AuditLog } from '../../types';

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentQuotes, setRecentQuotes] = useState<Quote[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick Add Service Modal State
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState<number>(1500);
  const [serviceCycle, setServiceCycle] = useState<'once_off' | 'monthly' | 'annual'>('monthly');
  const [serviceDesc, setServiceDesc] = useState('');
  const [savingService, setSavingService] = useState(false);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) {
      alert('Please enter a service name.');
      return;
    }

    setSavingService(true);
    try {
      await apiRequest('/packages/options', {
        method: 'POST',
        body: JSON.stringify({
          name: serviceName.trim(),
          price: Number(servicePrice),
          billing_cycle: serviceCycle,
          description: serviceDesc.trim(),
          is_active: 1,
        }),
      });

      setIsAddServiceModalOpen(false);
      setServiceName('');
      setServicePrice(1500);
      setServiceDesc('');
      alert('New service added successfully to official catalogue!');
    } catch (err: any) {
      alert(err.message || 'Failed to add service.');
    } finally {
      setSavingService(false);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<{
        metrics: DashboardMetrics;
        recentQuotes: Quote[];
        recentInvoices: Invoice[];
        recentLogs: AuditLog[];
      }>('/dashboard');

      setMetrics(data.metrics);
      setRecentQuotes(data.recentQuotes);
      setRecentInvoices(data.recentInvoices);
      setRecentLogs(data.recentLogs);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
      case 'Accepted':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 glass-pill';
      case 'Partially Paid':
      case 'Sent':
        return 'bg-brand-amber/15 text-brand-champagne border border-brand-amber/30 glass-pill';
      case 'Overdue':
      case 'Rejected':
        return 'bg-red-500/15 text-red-400 border border-red-500/30 glass-pill';
      default:
        return 'bg-white/5 text-zinc-300 border border-white/10 glass-pill';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-pill text-xs font-semibold text-brand-champagne mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Operations &amp; Finance Command Node</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
            Operations &amp; <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-champagne via-brand-amber to-brand-gold">
              Financial Dashboard
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-brand-warm-grey mt-2">
            Real-time pipeline metrics, automated document ledger and financial balances for S&amp;S Tech Group (Pty) Ltd.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsAddServiceModalOpen(true)}
            className="inline-flex items-center px-4 py-2.5 rounded-full text-xs font-semibold glass-pill text-brand-champagne hover:text-white transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5 text-brand-amber" />
            <span>Add Service</span>
          </button>
          <Link
            to="/admin/quotes/new"
            className="inline-flex items-center px-5 py-2.5 rounded-full text-xs font-semibold glass-pill text-white hover:text-brand-champagne transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5 text-brand-amber" />
            <span>New Quote</span>
          </Link>
          <Link
            to="/admin/invoices/new"
            className="inline-flex items-center px-6 py-2.5 rounded-full text-xs font-bold bg-white text-black hover:bg-neutral-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)]"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>New Invoice</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-950/50 border border-red-500/40 flex items-center space-x-3 text-red-200 text-sm shadow-inner">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Quotes */}
        <div className="p-6 rounded-2xl md:rounded-3xl glass-card border border-white/10 space-y-3 shadow-xl hover:border-brand-amber/30 transition-all">
          <div className="flex items-center justify-between text-brand-warm-grey">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-champagne">Total Quotes</span>
            <div className="w-8 h-8 rounded-lg glass-pill flex items-center justify-center text-brand-amber">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {loading ? '-' : metrics?.totalQuotes}
            </span>
            <span className="text-xs text-brand-champagne font-medium">
              ({metrics?.acceptedQuotes} accepted)
            </span>
          </div>
          <p className="text-[11px] text-brand-warm-grey font-mono">Active quotation pipeline</p>
        </div>

        {/* Invoices Issued */}
        <div className="p-6 rounded-2xl md:rounded-3xl glass-card border border-white/10 space-y-3 shadow-xl hover:border-brand-amber/30 transition-all">
          <div className="flex items-center justify-between text-brand-warm-grey">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-champagne">Invoices Issued</span>
            <div className="w-8 h-8 rounded-lg glass-pill flex items-center justify-center text-brand-amber">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {loading ? '-' : metrics?.totalInvoices}
            </span>
            <span className="text-xs text-emerald-400 font-medium">
              ({metrics?.paidInvoices} settled)
            </span>
          </div>
          <p className="text-[11px] text-brand-warm-grey font-mono">Total billable documents</p>
        </div>

        {/* Outstanding Balance Due */}
        <div className="p-6 rounded-2xl md:rounded-3xl glass-card border border-brand-amber/35 space-y-3 relative overflow-hidden shadow-[0_0_25px_rgba(246,115,0,0.15)]">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-28 h-28 rounded-full bg-brand-amber/15 blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-brand-warm-grey relative z-10">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-amber">Outstanding Due</span>
            <div className="w-8 h-8 rounded-lg glass-pill border border-brand-amber/40 flex items-center justify-center text-brand-amber shadow-sm">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2 relative z-10">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              {loading ? '-' : `R ${(metrics?.outstandingBalance || 0).toFixed(2)}`}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-brand-warm-grey font-mono relative z-10">
            <span>Overdue invoices:</span>
            <span className="font-bold text-red-400">{metrics?.overdueInvoices || 0}</span>
          </div>
        </div>

        {/* Total Revenue Collected */}
        <div className="p-6 rounded-2xl md:rounded-3xl glass-card border border-emerald-500/25 space-y-3 shadow-xl hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-brand-warm-grey">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">Total Collected</span>
            <div className="w-8 h-8 rounded-lg glass-pill border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">
              {loading ? '-' : `R ${(metrics?.totalCollected || 0).toFixed(2)}`}
            </span>
          </div>
          <p className="text-[11px] text-brand-warm-grey font-mono">Verified payment receipts</p>
        </div>

      </div>

      {/* Two Column Layout for Invoices & Quotes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Invoices */}
        <div className="glass-card rounded-2xl md:rounded-3xl border border-white/10 p-6 sm:p-7 space-y-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg glass-pill flex items-center justify-center text-brand-amber">
                <Receipt className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">Recent Invoices</h2>
            </div>
            <Link
              to="/admin/invoices"
              className="text-xs text-brand-champagne hover:text-white flex items-center font-medium transition-colors"
            >
              View All <ArrowRight className="w-3.5 h-3.5 ml-1 text-brand-amber" />
            </Link>
          </div>

          <div className="divide-y divide-white/10">
            {recentInvoices.length === 0 ? (
              <p className="py-8 text-center text-xs text-brand-warm-grey">No invoices recorded yet.</p>
            ) : (
              recentInvoices.map((inv) => (
                <div key={inv.id} className="py-3.5 flex items-center justify-between hover:bg-white/[0.02] -mx-2 px-2 rounded-xl transition-colors">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-white">
                        {inv.invoice_number}
                      </span>
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${getStatusBadge(inv.status)}`}>
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-xs text-brand-warm-grey mt-1 truncate max-w-[180px] sm:max-w-[260px]">
                      {inv.client_name} {inv.client_company ? `(${inv.client_company})` : ''}
                    </p>
                  </div>

                  <div className="text-right flex items-center space-x-3 shrink-0">
                    <div>
                      <span className="text-xs font-mono font-bold text-white block">
                        R {inv.total_amount.toFixed(2)}
                      </span>
                      {inv.balance_due > 0 && (
                        <span className="text-[10px] text-brand-amber font-mono block">
                          Bal: R {inv.balance_due.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <a
                      href={`/api/invoices/${inv.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg glass-pill flex items-center justify-center text-brand-warm-grey hover:text-white hover:border-brand-amber/50 transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Quotes */}
        <div className="glass-card rounded-2xl md:rounded-3xl border border-white/10 p-6 sm:p-7 space-y-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg glass-pill flex items-center justify-center text-brand-amber">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">Recent Quotations</h2>
            </div>
            <Link
              to="/admin/quotes"
              className="text-xs text-brand-champagne hover:text-white flex items-center font-medium transition-colors"
            >
              View All <ArrowRight className="w-3.5 h-3.5 ml-1 text-brand-amber" />
            </Link>
          </div>

          <div className="divide-y divide-white/10">
            {recentQuotes.length === 0 ? (
              <p className="py-8 text-center text-xs text-brand-warm-grey">No quotations recorded yet.</p>
            ) : (
              recentQuotes.map((q) => (
                <div key={q.id} className="py-3.5 flex items-center justify-between hover:bg-white/[0.02] -mx-2 px-2 rounded-xl transition-colors">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-white">
                        {q.quote_number}
                      </span>
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${getStatusBadge(q.status)}`}>
                        {q.status}
                      </span>
                    </div>
                    <p className="text-xs text-brand-warm-grey mt-1 truncate max-w-[180px] sm:max-w-[260px]">
                      {q.client_name} {q.client_company ? `(${q.client_company})` : ''}
                    </p>
                  </div>

                  <div className="text-right flex items-center space-x-3 shrink-0">
                    <span className="text-xs font-mono font-bold text-white block">
                      R {q.total_amount.toFixed(2)}
                    </span>
                    <a
                      href={`/api/quotes/${q.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg glass-pill flex items-center justify-center text-brand-warm-grey hover:text-white hover:border-brand-amber/50 transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Recent Activity / Audit Log Preview */}
      <div className="glass-card rounded-2xl md:rounded-3xl border border-white/10 p-6 sm:p-7 space-y-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg glass-pill flex items-center justify-center text-brand-amber">
              <Clock className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">System Audit Trail</h2>
          </div>
          <Link
            to="/admin/audit-logs"
            className="text-xs text-brand-champagne hover:text-white flex items-center font-medium transition-colors"
          >
            Full Audit Logs <ArrowRight className="w-3.5 h-3.5 ml-1 text-brand-amber" />
          </Link>
        </div>

        <div className="space-y-2.5">
          {recentLogs.length === 0 ? (
            <p className="text-xs text-brand-warm-grey">No activity logged yet.</p>
          ) : (
            recentLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl glass-pill border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="px-2 py-0.5 rounded-md bg-brand-amber/20 text-brand-champagne font-mono font-semibold text-[10px] uppercase border border-brand-amber/30">
                    {log.action}
                  </span>
                  <span className="text-white font-medium">{log.details}</span>
                </div>
                <div className="flex items-center space-x-3 text-brand-warm-grey text-[11px] font-mono">
                  <span>operator: {log.admin_name}</span>
                  <span>•</span>
                  <span>{new Date(log.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* QUICK ADD SERVICE MODAL */}
      {isAddServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card border border-white/15 rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg glass-pill flex items-center justify-center text-brand-amber">
                  <Plus className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white tracking-tight">Add New Service</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAddServiceModalOpen(false)}
                className="w-8 h-8 rounded-lg glass-pill flex items-center justify-center text-brand-warm-grey hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-4 text-xs">
              <div>
                <label className="block text-brand-champagne font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  Service Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Email Marketing & Automation"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-brand-amber"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-brand-champagne font-semibold mb-1 uppercase tracking-wider text-[11px]">
                    Price (ZAR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    required
                    value={servicePrice}
                    onChange={(e) => setServicePrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white font-mono font-bold focus:outline-none focus:border-brand-amber"
                  />
                </div>

                <div>
                  <label className="block text-brand-champagne font-semibold mb-1 uppercase tracking-wider text-[11px]">
                    Billing Cycle
                  </label>
                  <select
                    value={serviceCycle}
                    onChange={(e) => setServiceCycle(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-brand-amber"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="once_off">Once-off</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-brand-champagne font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  Service Description
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed breakdown of what is delivered with this service..."
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-brand-amber"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddServiceModalOpen(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold glass-pill text-brand-warm-grey hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingService}
                  className="px-6 py-2.5 rounded-full text-xs font-bold bg-white text-black hover:bg-neutral-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)] disabled:opacity-50"
                >
                  {savingService ? 'Saving...' : 'Add Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
