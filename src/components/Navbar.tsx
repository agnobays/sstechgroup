import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, Shield } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Packages', path: '/packages' },
    { label: 'Services', path: '/services' },
    { label: 'Portfolio', path: '/portfolio' },
    { label: 'How We Work', path: '/how-we-work' },
    { label: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-4 z-50 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-2">
      <div className="glass-pill rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between transition-all duration-300">
        
        {/* Brand Monogram & Name */}
        <Link to="/" className="flex items-center space-x-3 group" aria-label="S&S Tech Group Home">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-amber/30 to-brand-gold/10 border border-brand-amber/40 flex items-center justify-center transition-all group-hover:border-brand-amber group-hover:shadow-[0_0_15px_rgba(246,115,0,0.4)]">
            <span className="text-brand-champagne font-black text-xs tracking-wider">S&amp;S</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-bold tracking-tight text-white group-hover:text-brand-champagne transition-colors">
              S&amp;S Tech Group
            </span>
            <span className="text-[9px] tracking-widest uppercase text-brand-warm-grey/80 -mt-0.5">
              Digital Systems
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Pills */}
        <nav className="hidden lg:flex items-center space-x-1" aria-label="Primary Navigation">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all duration-200 flex items-center space-x-1.5 ${
                  active
                    ? 'bg-white/10 text-white border border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.1)]'
                    : 'text-brand-warm-grey hover:text-white hover:bg-white/5'
                }`}
              >
                {active && <span className="w-1.5 h-1.5 rounded-full bg-brand-amber" />}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Action CTAs */}
        <div className="hidden sm:flex items-center space-x-2.5">
          <Link
            to="/admin/login"
            className="w-9 h-9 rounded-full glass-pill flex items-center justify-center text-brand-warm-grey hover:text-brand-champagne transition-all hover:border-brand-amber/40"
            title="Admin Portal"
            aria-label="Staff Portal Login"
          >
            <Shield className="w-3.5 h-3.5" />
          </Link>

          <Link
            to="/get-a-quote"
            className="inline-flex items-center justify-center px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold bg-white hover:bg-neutral-100 text-black transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.35)]"
          >
            <span>Get a Quote</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex lg:hidden items-center space-x-2">
          <Link
            to="/get-a-quote"
            className="sm:hidden px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-black"
          >
            Quote
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-full glass-pill text-brand-warm-grey hover:text-white focus:outline-none"
            aria-expanded={isOpen}
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="lg:hidden mt-2 glass-card rounded-2xl p-4 space-y-1.5 animate-in fade-in slide-in-from-top-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                isActive(link.path)
                  ? 'text-brand-champagne bg-white/10'
                  : 'text-brand-warm-grey hover:text-white hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-3 mt-2 border-t border-white/10 flex flex-col space-y-2">
            <Link
              to="/get-a-quote"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center px-4 py-2.5 rounded-full text-sm font-semibold bg-white text-black shadow-sm"
            >
              Get a Quote
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>

            <Link
              to="/admin/login"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center px-4 py-2 rounded-full text-xs text-brand-warm-grey hover:text-brand-champagne glass-pill"
            >
              <Shield className="w-3.5 h-3.5 mr-2" />
              Staff / Admin Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
