import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Public Pages
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ServicesPage } from './pages/ServicesPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { ProcessPage } from './pages/ProcessPage';
import { ContactPage } from './pages/ContactPage';
import { PackagesPage } from './pages/PackagesPage';
import { GetAQuotePage } from './pages/GetAQuotePage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { QhaweOnboardingPage } from './pages/QhaweOnboardingPage';

// Admin Pages & Guards
import { ProtectedRoute } from './admin/components/ProtectedRoute';
import { AdminLayout } from './admin/components/AdminLayout';
import { LoginPage } from './admin/pages/LoginPage';
import { DashboardPage } from './admin/pages/DashboardPage';
import { ClientsPage } from './admin/pages/ClientsPage';
import { QuotesPage } from './admin/pages/QuotesPage';
import { InvoicesPage } from './admin/pages/InvoicesPage';
import { LeadsPage } from './admin/pages/LeadsPage';
import { FollowUpsPage } from './admin/pages/FollowUpsPage';
import { PricingCataloguePage } from './admin/pages/PricingCataloguePage';
import { SettingsPage } from './admin/pages/SettingsPage';
import { AuditLogsPage } from './admin/pages/AuditLogsPage';
import { EnquiriesPage } from './admin/pages/EnquiriesPage';
import { TeamManagementPage } from './admin/pages/TeamManagementPage';
import { EmailVaultPage } from './admin/pages/EmailVaultPage';
import { WhatsAppButton } from './components/WhatsAppButton';

// Public Layout Wrapper
const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-brand-black text-brand-off-white relative">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export const App: React.FC = () => {
  const location = useLocation();

  // Always scroll to top on redirect, route change, or browser back/forward
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const resetScroll = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetScroll();
    const frameId = requestAnimationFrame(resetScroll);
    const timeoutId = setTimeout(resetScroll, 20);

    window.addEventListener('popstate', resetScroll);

    // Dynamic Title Management for SEO & route clarity
    const path = location.pathname;
    let title = 'S&S Tech Group — Digital Solutions Built Around Your Business';

    if (path === '/about') {
      title = 'About Us | S&S Tech Group (Pty) Ltd';
    } else if (path === '/packages') {
      title = 'Website Packages & Pricing | S&S Tech Group';
    } else if (path === '/services') {
      title = 'Digital Services & Web Development | S&S Tech Group';
    } else if (path === '/work' || path === '/portfolio') {
      title = 'Our Work & Solution Architecture | S&S Tech Group';
    } else if (path === '/get-a-quote') {
      title = 'Interactive Quote Engine | S&S Tech Group';
    } else if (path === '/privacy-policy') {
      title = 'POPIA Privacy Policy | S&S Tech Group';
    } else if (path === '/how-we-work') {
      title = 'How We Work — 6-Step Delivery Framework | S&S Tech Group';
    } else if (path === '/contact') {
      title = 'Start a Project & Enquiries | S&S Tech Group';
    } else if (path.startsWith('/onboarding') || path.startsWith('/forms')) {
      title = 'Qhawe Credit Solutions — Platform Onboarding | S&S Tech Group';
    } else if (path.startsWith('/admin')) {
      title = 'Admin Business Portal | S&S Tech Group';
    }

    document.title = title;

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timeoutId);
      window.removeEventListener('popstate', resetScroll);
    };
  }, [location.pathname, location.search, location.key]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={
          <PublicLayout>
            <HomePage />
          </PublicLayout>
        }
      />
      <Route
        path="/about"
        element={
          <PublicLayout>
            <AboutPage />
          </PublicLayout>
        }
      />
      <Route
        path="/packages"
        element={
          <PublicLayout>
            <PackagesPage />
          </PublicLayout>
        }
      />
      <Route
        path="/services"
        element={
          <PublicLayout>
            <ServicesPage />
          </PublicLayout>
        }
      />
      <Route
        path="/work"
        element={
          <PublicLayout>
            <PortfolioPage />
          </PublicLayout>
        }
      />
      <Route
        path="/portfolio"
        element={
          <PublicLayout>
            <PortfolioPage />
          </PublicLayout>
        }
      />
      <Route
        path="/get-a-quote"
        element={
          <PublicLayout>
            <GetAQuotePage />
          </PublicLayout>
        }
      />
      <Route
        path="/privacy-policy"
        element={
          <PublicLayout>
            <PrivacyPolicyPage />
          </PublicLayout>
        }
      />
      <Route
        path="/how-we-work"
        element={
          <PublicLayout>
            <ProcessPage />
          </PublicLayout>
        }
      />
      <Route
        path="/contact"
        element={
          <PublicLayout>
            <ContactPage />
          </PublicLayout>
        }
      />
      <Route
        path="/onboarding/qhawe"
        element={
          <PublicLayout>
            <QhaweOnboardingPage />
          </PublicLayout>
        }
      />
      <Route
        path="/forms/qhawe"
        element={
          <PublicLayout>
            <QhaweOnboardingPage />
          </PublicLayout>
        }
      />
      <Route
        path="/onboarding/credit-solutions"
        element={
          <PublicLayout>
            <QhaweOnboardingPage />
          </PublicLayout>
        }
      />

      {/* Admin Authentication */}
      <Route path="/admin/login" element={<LoginPage />} />

      {/* Protected Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="quotes" element={<QuotesPage />} />
        <Route path="quotes/new" element={<QuotesPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="invoices/new" element={<InvoicesPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="follow-ups" element={<FollowUpsPage />} />
        <Route path="team" element={<TeamManagementPage />} />
        <Route path="emails" element={<EmailVaultPage />} />
        <Route path="pricing" element={<PricingCataloguePage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="enquiries" element={<EnquiriesPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* 404 Fallback */}
      <Route
        path="*"
        element={
          <PublicLayout>
            <NotFoundPage />
          </PublicLayout>
        }
      />
    </Routes>
  );
};

export default App;
