import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-20 text-center">
      <div className="max-w-md space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-brand-charcoal border border-brand-gold/40 flex items-center justify-center text-brand-gold mx-auto">
          <span className="text-2xl font-black font-mono">404</span>
        </div>
        
        <h1 className="text-3xl font-extrabold text-brand-off-white">
          Page Not Found
        </h1>
        
        <p className="text-sm text-brand-warm-grey leading-relaxed">
          The requested page could not be located. It may have moved or the URL might be mistyped.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-lg text-sm font-bold bg-brand-gold text-brand-black hover:bg-brand-gold-light transition-colors shadow-sm"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Homepage
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-lg text-sm font-semibold bg-brand-charcoal text-brand-warm-grey hover:text-brand-off-white border border-brand-border transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};
