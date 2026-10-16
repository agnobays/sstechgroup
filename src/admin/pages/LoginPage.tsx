import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide both your registered admin email and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-black flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Radiant Amber Spotlight Beams */}
      <div className="bg-spotlight-beam" />
      <div className="bg-spotlight-beam-secondary" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 px-4">
        
        {/* Monogram Badge */}
        <div className="w-16 h-16 rounded-2xl glass-card border border-brand-amber/50 flex items-center justify-center text-brand-amber mx-auto shadow-[0_0_25px_rgba(246,115,0,0.4)]">
          <Shield className="w-8 h-8 text-brand-amber" />
        </div>

        {/* Security Pill Badge */}
        <div className="mt-5 inline-flex items-center space-x-2 px-4 py-1.5 rounded-full glass-pill text-xs font-semibold text-brand-champagne">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Restricted Portal • 256-Bit SSL Encrypted</span>
        </div>

        <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
          S&amp;S Tech Group <br />
          <span className="text-brand-violet font-mono">{'{'}</span>{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-champagne via-brand-amber to-brand-gold">
            Admin Access
          </span>{' '}
          <span className="text-brand-violet font-mono">{'}'}</span>
        </h1>
        <p className="mt-2 text-xs font-mono text-brand-warm-grey">
          Internal Operations &amp; Invoicing System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 relative z-10">
        <div className="glass-card rounded-3xl p-7 sm:p-10 border border-white/15 shadow-2xl backdrop-blur-2xl">
          
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            
            {error && (
              <div className="p-4 rounded-2xl bg-red-950/50 border border-red-500/40 flex items-start space-x-3 text-red-200 text-xs shadow-inner">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-brand-champagne mb-2">
                Administrator Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-warm-grey">
                  <Mail className="w-4 h-4 text-brand-amber/80" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.co.za"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder-brand-warm-grey/50 focus:outline-none focus:border-brand-amber focus:ring-1 focus:ring-brand-amber/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-brand-champagne mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-warm-grey">
                  <Lock className="w-4 h-4 text-brand-amber/80" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder-brand-warm-grey/50 focus:outline-none focus:border-brand-amber focus:ring-1 focus:ring-brand-amber/50 transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-3.5 px-6 rounded-full text-sm font-bold bg-white text-black hover:bg-neutral-100 transition-all shadow-[0_0_25px_rgba(255,255,255,0.25)] hover:shadow-[0_0_35px_rgba(255,255,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center space-x-2">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    <span>Verifying Session...</span>
                  </span>
                ) : (
                  'Sign In to Admin Portal'
                )}
              </button>
            </div>

          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center space-y-4">
            <div className="p-3 rounded-xl glass-pill text-[11px] text-brand-warm-grey leading-relaxed">
              🔒 <strong className="text-white">Strict Security:</strong> Only registered operators of S&amp;S Tech Group (Pty) Ltd may authenticate. Sessions are auditable and monitored.
            </div>

            <div>
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 rounded-full glass-pill text-xs font-semibold text-brand-champagne hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                Return to Public Website
              </Link>
            </div>
          </div>

        </div>

        {/* Enterprise Footnote */}
        <div className="mt-6 text-center text-[11px] text-brand-warm-grey/70 font-mono">
          <span>Enterprise: 2026/802170/07 • FNB Business Verified</span>
        </div>
      </div>
    </div>
  );
};
