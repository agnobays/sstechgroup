import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Users,
  Inbox,
  ClipboardList,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Shield,
  User,
  Mail,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Quotations', path: '/admin/quotes', icon: FileText },
    { label: 'Invoices', path: '/admin/invoices', icon: Receipt },
    { label: 'CRM Leads', path: '/admin/leads', icon: Users },
    { label: 'Follow-up Queue', path: '/admin/follow-ups', icon: ClipboardList },
    { label: 'Our Team', path: '/admin/team', icon: Users },
    { label: 'Email Vault', path: '/admin/emails', icon: Mail },
    { label: 'Packages & Rates', path: '/admin/pricing', icon: Settings },
    { label: 'Clients', path: '/admin/clients', icon: Users },
    { label: 'Client Onboarding', path: '/admin/onboarding', icon: FileCheck },
    { label: 'Enquiries', path: '/admin/enquiries', icon: Inbox },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: ClipboardList },
    { label: 'Company Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-brand-black flex flex-col md:flex-row text-brand-off-white relative overflow-hidden">
      
      {/* Background Spotlight Lighting */}
      <div className="bg-spotlight-beam opacity-40 pointer-events-none" />
      <div className="bg-spotlight-beam-secondary opacity-30 pointer-events-none" />

      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0c0a08]/90 backdrop-blur-xl border-b border-white/10 relative z-30">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg glass-card border border-brand-amber/40 flex items-center justify-center text-brand-amber font-bold text-xs shadow-[0_0_12px_rgba(246,115,0,0.3)]">
            S&amp;S
          </div>
          <span className="font-bold text-sm tracking-tight text-white">Admin Portal</span>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg glass-pill text-brand-warm-grey hover:text-white"
          aria-label="Toggle navigation menu"
        >
          {sidebarOpen ? <X className="w-5 h-5 text-brand-amber" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'block' : 'hidden'
        } md:block md:w-64 bg-[#0c0a08]/95 backdrop-blur-2xl border-r border-white/10 flex-shrink-0 flex flex-col justify-between relative z-20`}
      >
        <div>
          {/* Logo & Portal Branding */}
          <div className="p-5 border-b border-white/10">
            <Link to="/admin" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl glass-card border border-brand-amber/40 flex items-center justify-center shadow-[0_0_15px_rgba(246,115,0,0.3)]">
                <span className="text-brand-amber font-extrabold text-sm">S&amp;S</span>
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-tight">S&amp;S Tech Group</h1>
                <span className="text-[10px] uppercase tracking-wider text-brand-champagne font-mono font-semibold flex items-center mt-0.5">
                  <Shield className="w-3 h-3 mr-1 text-brand-amber" /> Business Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-3.5 space-y-1.5" aria-label="Admin Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                      isActive
                        ? 'bg-brand-amber/15 text-brand-champagne border border-brand-amber/35 shadow-[0_0_12px_rgba(246,115,0,0.15)]'
                        : 'text-brand-warm-grey hover:text-white hover:bg-white/[0.04]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 mr-3" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Admin profile & Logout */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="p-2.5 rounded-xl glass-card border border-white/10 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full glass-pill border border-brand-amber/40 flex items-center justify-center text-brand-amber shrink-0 shadow-sm">
              <User className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{admin?.fullName}</p>
              <p className="text-[10px] text-brand-warm-grey truncate font-mono">{admin?.email}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-warm-grey hover:text-brand-champagne flex items-center transition-colors"
              title="Open public website in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1 text-brand-amber" />
              Public Site
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="text-xs text-red-400 hover:text-red-300 flex items-center font-medium transition-colors"
              title="End session"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto min-h-screen p-4 sm:p-8 lg:p-10 relative z-10">
        <Outlet />
      </main>

    </div>
  );
};
