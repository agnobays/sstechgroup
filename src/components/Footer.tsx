import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#080705] border-t border-white/10 text-brand-warm-grey relative overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-40 bg-brand-amber/5 blur-[120px] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-amber/30 to-brand-gold/10 border border-brand-amber/40 flex items-center justify-center">
                <span className="text-brand-champagne font-black text-sm tracking-wider">S&amp;S</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-white">
                  S&amp;S Tech Group
                </span>
                <span className="text-[10px] tracking-widest uppercase text-brand-champagne/70 -mt-0.5">
                  (Pty) Ltd • Reg: 2026/802170/07
                </span>
              </div>
            </div>

            <p className="text-sm text-brand-warm-grey max-w-md leading-relaxed">
              We design, develop and support digital experiences that help businesses and organisations work smarter, connect with their audiences and grow.
            </p>

            {/* Direct Contact Touchpoints */}
            <div className="pt-2 space-y-2.5 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-white font-medium">Email:</span>
                <a href="mailto:info@sstechgroup.co.za" className="text-brand-champagne hover:text-white transition-colors">
                  info@sstechgroup.co.za
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-white font-medium">Phone / WhatsApp:</span>
                <a href="tel:0698847200" className="text-brand-champagne hover:text-white transition-colors">
                  069 884 7200
                </a>
                <span>•</span>
                <a
                  href="https://wa.me/27698847200?text=Hi%20S%26S%20Tech%20Group,%20I'd%20like%20to%20enquire%20about%20a%20project"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center glass-pill px-2.5 py-0.5 rounded-full"
                >
                  WhatsApp Us
                </a>
              </div>
            </div>

            <div className="pt-1 text-xs text-brand-warm-grey/70">
              Official South African Digital Technology Practice. FNB Business Account: 63169376134.
            </div>
          </div>

          {/* Core Services */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white mb-4">
              Digital Services
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  Website Design &amp; Development
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  Web Hosting &amp; Domain Setup
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  Web Application Development
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  Website Maintenance &amp; Support
                </Link>
              </li>
              <li>
                <Link to="/services#email-marketing" className="hover:text-white transition-colors">
                  Email Marketing &amp; Automation
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  Workflow Automation
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links & Portal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white mb-4">
              Navigation &amp; Legal
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/packages" className="hover:text-white transition-colors">
                  Packages &amp; Pricing
                </Link>
              </li>
              <li>
                <Link to="/portfolio" className="hover:text-white transition-colors">
                  Portfolio Showcase
                </Link>
              </li>
              <li>
                <Link to="/get-a-quote" className="hover:text-white transition-colors font-medium text-brand-champagne">
                  Get an Instant Quote
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-white transition-colors">
                  Privacy Policy (POPIA)
                </Link>
              </li>
              <li className="pt-2">
                <Link
                  to="/admin/login"
                  className="inline-flex items-center text-xs text-brand-champagne hover:text-white font-medium py-1.5 px-3 rounded-full glass-pill transition-all"
                >
                  <Shield className="w-3.5 h-3.5 mr-1.5 text-brand-amber" />
                  Staff Admin Portal
                  <ArrowUpRight className="w-3 h-3 ml-1" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-brand-warm-grey">
          <p>© {new Date().getFullYear()} S&amp;S Tech Group (Pty) Ltd. Reg: 2026/802170/07. All rights reserved.</p>
          <div className="flex items-center space-x-4 mt-2 sm:mt-0">
            <Link to="/privacy-policy" className="hover:text-brand-champagne">POPIA Privacy Notice</Link>
            <span>•</span>
            <span>South Africa</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
