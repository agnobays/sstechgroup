import React, { useState, useEffect } from 'react';
import {
  Mail,
  Shield,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Edit2,
  Plus,
  Trash2,
  ExternalLink,
  Send,
  AlertCircle,
  CheckCircle2,
  Server,
  HelpCircle,
  X
} from 'lucide-react';
import { apiRequest } from '../../api/client';

export interface EmailAccount {
  id: number;
  label: string;
  email: string;
  password?: string;
  incoming_server: string;
  incoming_port: string;
  smtp_server: string;
  smtp_port: string;
  webmail_url: string;
  is_system_smtp: number;
  notes: string;
  created_at?: string;
  updated_at?: string;
}

export const EmailVaultPage: React.FC = () => {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password visibility map: { [id: number]: boolean }
  const [revealedPasswords, setRevealedPasswords] = useState<{ [id: number]: boolean }>({});
  // Copied indicator map: { [key: string]: boolean }
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modal State for Edit / Add
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Test SMTP modal state
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testingAccount, setTestingAccount] = useState<EmailAccount | null>(null);
  const [testRecipient, setTestRecipient] = useState('');
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpResult, setSmtpResult] = useState<{ success: boolean; message: string } | null>(null);

  // Setup Guide modal
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    label: '',
    email: '',
    password: '',
    incoming_server: 'mail.sstechgroup.co.za',
    incoming_port: '993 (IMAP SSL) / 143',
    smtp_server: 'mail.sstechgroup.co.za',
    smtp_port: '587 (TLS) / 465 (SSL)',
    webmail_url: 'https://sstechgroup.co.za:2222/webmail',
    is_system_smtp: 0,
    notes: '',
  });

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<{ accounts: EmailAccount[] }>('/email-accounts');
      setAccounts(data.accounts || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load email vault accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const togglePasswordVisibility = (id: number) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const openEditModal = (account: EmailAccount) => {
    setEditingAccount(account);
    setFormData({
      label: account.label,
      email: account.email,
      password: account.password || '',
      incoming_server: account.incoming_server || 'mail.sstechgroup.co.za',
      incoming_port: account.incoming_port || '993 (IMAP SSL) / 143',
      smtp_server: account.smtp_server || 'mail.sstechgroup.co.za',
      smtp_port: account.smtp_port || '587 (TLS) / 465 (SSL)',
      webmail_url: account.webmail_url || 'https://sstechgroup.co.za:2222/webmail',
      is_system_smtp: account.is_system_smtp || 0,
      notes: account.notes || '',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingAccount(null);
    setFormData({
      label: '',
      email: '',
      password: '',
      incoming_server: 'mail.sstechgroup.co.za',
      incoming_port: '993 (IMAP SSL) / 143',
      smtp_server: 'mail.sstechgroup.co.za',
      smtp_port: '587 (TLS) / 465 (SSL)',
      webmail_url: 'https://sstechgroup.co.za:2222/webmail',
      is_system_smtp: 0,
      notes: '',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setModalError(null);

    try {
      if (editingAccount) {
        await apiRequest(`/email-accounts/${editingAccount.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        setSuccessMessage(`Updated credentials and label for ${formData.email}`);
      } else {
        await apiRequest('/email-accounts', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        setSuccessMessage(`Added new mailbox ${formData.email} to secure vault`);
      }

      setIsModalOpen(false);
      fetchAccounts();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save account');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async (account: EmailAccount) => {
    if (account.is_system_smtp === 1) {
      alert('The primary system SMTP mailbox cannot be deleted.');
      return;
    }

    if (!confirm(`Are you sure you want to remove the credentials for ${account.email} from the vault?`)) {
      return;
    }

    try {
      await apiRequest(`/email-accounts/${account.id}`, {
        method: 'DELETE',
      });
      setSuccessMessage(`Removed ${account.email} from vault`);
      fetchAccounts();
    } catch (err: any) {
      setError(err.message || 'Failed to remove account');
    }
  };

  const openTestSmtpModal = (account: EmailAccount) => {
    setTestingAccount(account);
    setTestRecipient(account.email);
    setSmtpResult(null);
    setIsTestModalOpen(true);
  };

  const handleRunSmtpTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testingAccount) return;
    setTestingSmtp(true);
    setSmtpResult(null);

    try {
      const res = await apiRequest<{ success: boolean; message: string }>('/email-accounts/test-smtp', {
        method: 'POST',
        body: JSON.stringify({
          email: testingAccount.email,
          password: testingAccount.password,
          recipient: testRecipient,
        }),
      });

      setSmtpResult({
        success: true,
        message: res.message,
      });
    } catch (err: any) {
      setSmtpResult({
        success: false,
        message: err.message || 'SMTP handshake or authentication failed',
      });
    } finally {
      setTestingSmtp(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-brand-border">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-off-white tracking-tight">
              Company Email Accounts &amp; Mailbox Vault
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center">
              <Shield className="w-3 h-3 mr-1 text-emerald-400" /> AES-256 Encrypted
            </span>
          </div>
          <p className="text-xs sm:text-sm text-brand-warm-grey mt-1">
            Secure vault for corporate email passwords, incoming IMAP/POP servers, and outgoing SMTP configurations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-charcoal text-brand-champagne hover:bg-brand-border/60 border border-brand-border flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Setup Guide</span>
          </button>
          
          <a
            href="https://sstechgroup.co.za:2222/webmail"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-charcoal text-brand-warm-grey hover:text-white border border-brand-border flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Webmail Portal</span>
          </a>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-gold text-brand-black hover:bg-brand-gold-light transition-all shadow-lg hover:shadow-[0_0_15px_rgba(217,173,50,0.3)] flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Mailbox</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between text-emerald-300 text-xs sm:text-sm animate-fade-in">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-emerald-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center justify-between text-red-300 text-xs sm:text-sm animate-fade-in">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Vault Info Box */}
      <div className="p-4 rounded-2xl glass-card border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-brand-warm-grey">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-lg bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center flex-shrink-0 text-brand-gold mt-0.5">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-brand-off-white text-sm">Hardware-grade Password Encryption Active</h4>
            <p className="mt-0.5 leading-relaxed">
              Passwords in this vault are encrypted with <strong>AES-256-GCM</strong>. Passwords are never logged or stored in plaintext, and can only be decrypted inside authenticated admin sessions.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className="text-[11px] px-3 py-1.5 rounded-lg bg-brand-black border border-brand-border">
            Incoming: <strong>mail.sstechgroup.co.za (993)</strong>
          </span>
          <span className="text-[11px] px-3 py-1.5 rounded-lg bg-brand-black border border-brand-border">
            Outgoing: <strong>mail.sstechgroup.co.za (587)</strong>
          </span>
        </div>
      </div>

      {/* Account Cards Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-brand-warm-grey">Decrypting and loading company mailbox vault...</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl border border-white/10 p-8 space-y-4">
          <Mail className="w-12 h-12 text-brand-warm-grey/50 mx-auto" />
          <h3 className="text-base font-bold text-white">No Email Accounts in Vault</h3>
          <p className="text-xs text-brand-warm-grey max-w-sm mx-auto">
            Add your company mailboxes to securely store their passwords, IMAP/SMTP configurations, and enable automated outbound emails.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-gold text-brand-black hover:bg-brand-gold-light"
          >
            Add First Mailbox
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map((acc) => {
            const isRevealed = revealedPasswords[acc.id] || false;
            const isCopiedEmail = copiedKey === `email-${acc.id}`;
            const isCopiedPass = copiedKey === `pass-${acc.id}`;

            return (
              <div
                key={acc.id}
                className="glass-card rounded-2xl border border-white/10 p-5 space-y-4 flex flex-col justify-between hover:border-brand-gold/40 transition-all duration-300 relative group overflow-hidden"
              >
                {/* System Outbound Ribbon */}
                {acc.is_system_smtp === 1 && (
                  <div className="absolute top-0 right-0">
                    <span className="px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider bg-brand-gold text-brand-black shadow-md flex items-center">
                      <Send className="w-2.5 h-2.5 mr-1" /> System Outbound SMTP
                    </span>
                  </div>
                )}

                <div className="space-y-3.5">
                  {/* Account Label / Name */}
                  <div className="pr-12">
                    <h3 className="text-base font-bold text-brand-off-white group-hover:text-brand-champagne transition-colors">
                      {acc.label}
                    </h3>
                    {acc.notes && (
                      <p className="text-[11px] text-brand-warm-grey mt-0.5 line-clamp-2">
                        {acc.notes}
                      </p>
                    )}
                  </div>

                  {/* Email Row */}
                  <div className="p-2.5 rounded-xl bg-brand-black/70 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center space-x-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-brand-champagne flex-shrink-0" />
                      <span className="text-xs font-mono font-medium text-brand-off-white truncate select-all">
                        {acc.email}
                      </span>
                    </div>
                    <button
                      type="button"
                      title="Copy Email Address"
                      onClick={() => handleCopy(acc.email, `email-${acc.id}`)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-brand-warm-grey hover:text-white transition-colors flex-shrink-0"
                    >
                      {isCopiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Password Row */}
                  <div className="p-2.5 rounded-xl bg-brand-black/70 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center space-x-2 truncate">
                      <Key className="w-3.5 h-3.5 text-brand-gold flex-shrink-0" />
                      <span className="text-xs font-mono font-medium text-brand-off-white truncate select-all">
                        {isRevealed ? (acc.password || '—') : '••••••••••••••••'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <button
                        type="button"
                        title={isRevealed ? 'Hide Password' : 'Show Password'}
                        onClick={() => togglePasswordVisibility(acc.id)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-brand-warm-grey hover:text-white transition-colors"
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5 text-brand-amber" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        title="Copy Password"
                        onClick={() => handleCopy(acc.password || '', `pass-${acc.id}`)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-brand-warm-grey hover:text-white transition-colors"
                      >
                        {isCopiedPass ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Server Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/5 space-y-0.5">
                      <span className="text-[10px] text-brand-warm-grey uppercase tracking-wider block">Incoming (IMAP)</span>
                      <p className="font-mono text-[11px] text-brand-off-white truncate">mail.sstechgroup.co.za</p>
                      <span className="text-[10px] text-brand-champagne/80 font-mono">Port 993 (SSL)</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5 border border-white/5 space-y-0.5">
                      <span className="text-[10px] text-brand-warm-grey uppercase tracking-wider block">Outgoing (SMTP)</span>
                      <p className="font-mono text-[11px] text-brand-off-white truncate">mail.sstechgroup.co.za</p>
                      <span className="text-[10px] text-brand-gold font-mono">Port 587 (TLS)</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  {acc.is_system_smtp === 1 ? (
                    <button
                      type="button"
                      onClick={() => openTestSmtpModal(acc)}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-brand-gold/15 text-brand-gold hover:bg-brand-gold/25 border border-brand-gold/30 flex items-center space-x-1 transition-all"
                    >
                      <Send className="w-3 h-3" />
                      <span>Test SMTP</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-brand-warm-grey flex items-center">
                      <Server className="w-3 h-3 mr-1 opacity-60" /> Active Mailbox
                    </span>
                  )}

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(acc)}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-white/5 hover:bg-white/10 text-brand-off-white border border-white/10 flex items-center space-x-1 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    {acc.is_system_smtp !== 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAccount(acc)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors"
                        title="Delete account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-charcoal border border-brand-border rounded-2xl w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-brand-border">
              <h2 className="text-xl font-bold text-brand-off-white flex items-center space-x-2">
                <Mail className="w-5 h-5 text-brand-gold" />
                <span>{editingAccount ? 'Edit Mailbox & Credentials' : 'Add New Mailbox to Vault'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-brand-warm-grey hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 flex items-start space-x-2.5 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-off-white mb-1">
                  Mailbox Label / Staff Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sam N. (Management) or General Enquiries"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-black border border-brand-border text-sm text-white focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-off-white mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@sstechgroup.co.za"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-black border border-brand-border text-sm text-white focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-off-white mb-1">
                  Mailbox Password {editingAccount && <span className="text-brand-warm-grey font-normal">(Leave blank to keep current password)</span>} *
                </label>
                <input
                  type="text"
                  required={!editingAccount}
                  placeholder="Enter mailbox password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-black border border-brand-border text-sm font-mono text-white focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-brand-warm-grey mb-1">
                    Incoming IMAP Server
                  </label>
                  <input
                    type="text"
                    value={formData.incoming_server}
                    onChange={(e) => setFormData({ ...formData, incoming_server: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-border text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-warm-grey mb-1">
                    Outgoing SMTP Server
                  </label>
                  <input
                    type="text"
                    value={formData.smtp_server}
                    onChange={(e) => setFormData({ ...formData, smtp_server: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-border text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-off-white mb-1">
                  Internal Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes about who uses this mailbox or department..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-brand-black border border-brand-border text-xs text-white focus:outline-none focus:border-brand-gold resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-brand-black text-brand-warm-grey hover:text-white border border-brand-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-brand-gold text-brand-black hover:bg-brand-gold-light disabled:opacity-50 transition-all shadow-lg"
                >
                  {saving ? 'Encrypting & Saving...' : editingAccount ? 'Save Changes' : 'Store in Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test SMTP Modal */}
      {isTestModalOpen && testingAccount && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-charcoal border border-brand-border rounded-2xl w-full max-w-md p-6 sm:p-7 space-y-5 shadow-2xl animate-fade-in relative">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <h2 className="text-lg font-bold text-brand-off-white flex items-center space-x-2">
                <Send className="w-5 h-5 text-brand-gold" />
                <span>Test Outbound SMTP Gateway</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsTestModalOpen(false)}
                className="text-brand-warm-grey hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-brand-warm-grey leading-relaxed">
              Verifies live SMTP authentication through <strong>mail.sstechgroup.co.za:587</strong> using account <strong>{testingAccount.email}</strong>.
            </p>

            {smtpResult && (
              <div
                className={`p-3.5 rounded-xl border flex items-start space-x-2.5 text-xs ${
                  smtpResult.success
                    ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                    : 'bg-red-950/50 border-red-800 text-red-300'
                }`}
              >
                {smtpResult.success ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
                )}
                <span>{smtpResult.message}</span>
              </div>
            )}

            <form onSubmit={handleRunSmtpTest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-off-white mb-1">
                  Deliver Test Email To:
                </label>
                <input
                  type="email"
                  required
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-black border border-brand-border text-sm text-white focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-black text-brand-warm-grey hover:text-white border border-brand-border"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={testingSmtp}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-gold text-brand-black hover:bg-brand-gold-light disabled:opacity-50 transition-all shadow-md flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{testingSmtp ? 'Verifying Gateway...' : 'Send Test Email'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mail Client Setup Guide Modal */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-charcoal border border-brand-border rounded-2xl w-full max-w-xl p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-brand-border">
              <h2 className="text-xl font-bold text-brand-off-white flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-brand-gold" />
                <span>Email Client Configuration Guide</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsGuideOpen(false)}
                className="text-brand-warm-grey hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-brand-warm-grey leading-relaxed">
              Use these exact parameters to configure Outlook, iPhone / iPad Mail, Apple Mail, Thunderbird, and Android Email apps:
            </p>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-brand-black border border-brand-border space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-champagne">
                  Incoming Server (Receiving Mail)
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-brand-warm-grey block text-[11px]">Server Hostname:</span>
                    <strong className="font-mono text-white">mail.sstechgroup.co.za</strong>
                  </div>
                  <div>
                    <span className="text-brand-warm-grey block text-[11px]">Protocol &amp; Port:</span>
                    <strong className="font-mono text-white">IMAP Port 993 (SSL/TLS)</strong>
                  </div>
                  <div>
                    <span className="text-brand-warm-grey block text-[11px]">Username:</span>
                    <span className="text-white">Your full email address</span>
                  </div>
                  <div>
                    <span className="text-brand-warm-grey block text-[11px]">Password:</span>
                    <span className="text-white">Your mailbox password</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-brand-black border border-brand-border space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-gold">
                  Outgoing Server (Sending Mail via SMTP)
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-brand-warm-grey block text-[11px]">Server Hostname:</span>
                    <strong className="font-mono text-white">mail.sstechgroup.co.za</strong>
                  </div>
                  <div>
                    <span className="text-brand-warm-grey block text-[11px]">Port &amp; Security:</span>
                    <strong className="font-mono text-white">Port 587 (STARTTLS) or 465 (SSL)</strong>
                  </div>
                  <div>
                    <span className="text-brand-warm-grey block text-[11px]">Authentication:</span>
                    <span className="text-white">Required (Same as incoming)</span>
                  </div>
                  <div>
                    <span className="text-brand-warm-grey block text-[11px]">Username:</span>
                    <span className="text-white">Your full email address</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsGuideOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-gold text-brand-black hover:bg-brand-gold-light transition-all"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
