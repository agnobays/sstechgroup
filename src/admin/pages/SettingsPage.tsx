import React, { useEffect, useState } from 'react';
import { Save, Building, CreditCard, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../../api/client';
import { CompanySettings } from '../../types';

export const SettingsPage: React.FC = () => {
  const [formData, setFormData] = useState<CompanySettings>({
    id: 1,
    company_name: 'S&S Tech Group (Pty) Ltd',
    registration_number: '',
    vat_number: '',
    email: '',
    phone: '',
    physical_address: '',
    postal_address: '',
    bank_name: '',
    bank_account_name: '',
    bank_account_number: '',
    bank_branch_code: '',
    bank_account_type: '',
    bank_swift: '',
    default_payment_terms: 'Payment due within 14 days of invoice date.',
    default_quote_notes: 'This quotation is valid for 30 days from the date of issue. Scope adjustments may affect timelines and costings.',
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<{ settings: CompanySettings }>('/settings');
      if (data.settings) {
        setFormData(data.settings);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const res = await apiRequest<{ message: string; settings: CompanySettings }>('/settings', {
        method: 'PUT',
        body: JSON.stringify(formData),
      });

      setSuccessMessage(res.message);
      setFormData(res.settings);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update company settings');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Top Header */}
      <div className="pb-6 border-b border-brand-border">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-off-white">
          Company Settings &amp; Banking Profile
        </h1>
        <p className="text-xs sm:text-sm text-brand-warm-grey mt-1">
          Configure legal entity details, official banking information, and default document terms.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center space-x-3 text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center space-x-3 text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Compliance / Truth-in-data Notice */}
      <div className="p-4 rounded-xl bg-brand-charcoal border border-brand-border/80 flex items-start space-x-3 text-xs text-brand-warm-grey">
        <Shield className="w-4 h-4 text-brand-gold flex-shrink-0 mt-0.5" />
        <p>
          <strong className="text-brand-off-white">Integrity Guardrail: </strong>
          In compliance with S&amp;S Tech Group quality standards, legal registration numbers, tax identifiers, banking details and physical addresses are strictly left blank on generated PDFs and the public website until verified details are provided below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Entity Profile */}
        <div className="bg-brand-charcoal rounded-xl border border-brand-border p-6 sm:p-8 space-y-6">
          <div className="flex items-center space-x-2 pb-3 border-b border-brand-border">
            <Building className="w-5 h-5 text-brand-gold" />
            <h2 className="text-base font-bold text-brand-off-white">Legal Entity Profile</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                Company Legal Name
              </label>
              <input
                type="text"
                required
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
              />
              <span className="text-[10px] text-brand-warm-grey mt-1 block">
                Must be "S&amp;S Tech Group" or "S&amp;S Tech Group (Pty) Ltd".
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                CIPC Registration Number
              </label>
              <input
                type="text"
                placeholder="e.g. 2026/123456/07"
                value={formData.registration_number || ''}
                onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                SARS VAT Number
              </label>
              <input
                type="text"
                placeholder="e.g. 4990123456"
                value={formData.vat_number || ''}
                onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                Contact Phone
              </label>
              <input
                type="text"
                placeholder="e.g. +27 11 000 0000"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                Official Inquiries Email
              </label>
              <input
                type="email"
                placeholder="e.g. info@sstechgroup.co.za"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                Physical Office Address
              </label>
              <textarea
                rows={2}
                placeholder="Street address, building, suburb, city, postal code"
                value={formData.physical_address || ''}
                onChange={(e) => setFormData({ ...formData, physical_address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>
        </div>

        {/* Banking Details */}
        <div className="bg-brand-charcoal rounded-xl border border-brand-border p-6 sm:p-8 space-y-6">
          <div className="flex items-center space-x-2 pb-3 border-b border-brand-border">
            <CreditCard className="w-5 h-5 text-brand-gold" />
            <h2 className="text-base font-bold text-brand-off-white">Official Banking Details (Printed on Invoices)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                Bank Name
              </label>
              <input
                type="text"
                placeholder="e.g. First National Bank (FNB)"
                value={formData.bank_name || ''}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                Account Holder Name
              </label>
              <input
                type="text"
                placeholder="S&S Tech Group (Pty) Ltd"
                value={formData.bank_account_name || ''}
                onChange={(e) => setFormData({ ...formData, bank_account_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                Account Number
              </label>
              <input
                type="text"
                placeholder="e.g. 62800000000"
                value={formData.bank_account_number || ''}
                onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs font-mono focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                Branch Code
              </label>
              <input
                type="text"
                placeholder="e.g. 250655"
                value={formData.bank_branch_code || ''}
                onChange={(e) => setFormData({ ...formData, bank_branch_code: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs font-mono focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                Account Type
              </label>
              <input
                type="text"
                placeholder="e.g. Cheque / Business Current"
                value={formData.bank_account_type || ''}
                onChange={(e) => setFormData({ ...formData, bank_account_type: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                SWIFT / BIC Code
              </label>
              <input
                type="text"
                placeholder="e.g. FIRNZAJJ"
                value={formData.bank_swift || ''}
                onChange={(e) => setFormData({ ...formData, bank_swift: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs font-mono focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>
        </div>

        {/* Default Document Terms */}
        <div className="bg-brand-charcoal rounded-xl border border-brand-border p-6 sm:p-8 space-y-6">
          <h2 className="text-base font-bold text-brand-off-white pb-3 border-b border-brand-border">
            Default Document Terms &amp; Policies
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                Default Invoice Payment Terms
              </label>
              <textarea
                rows={2}
                value={formData.default_payment_terms || ''}
                onChange={(e) => setFormData({ ...formData, default_payment_terms: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-off-white mb-1.5">
                Default Quotation Notes &amp; Validity
              </label>
              <textarea
                rows={2}
                value={formData.default_quote_notes || ''}
                onChange={(e) => setFormData({ ...formData, default_quote_notes: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-6 py-3 rounded-lg text-xs font-bold bg-brand-gold hover:bg-brand-gold-light text-brand-black transition-all shadow-md disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {submitting ? 'Saving Settings...' : 'Save Company Settings'}
          </button>
        </div>

      </form>

    </div>
  );
};
