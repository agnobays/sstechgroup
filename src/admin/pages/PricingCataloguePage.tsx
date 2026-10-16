import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Package, OptionalService } from '../../types';
import { apiRequest } from '../../api/client';
import { Edit2, Plus, Trash2, Check, X, Shield, Sparkles, Layers, ArrowRight, AlertCircle } from 'lucide-react';

export const PricingCataloguePage: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [options, setOptions] = useState<OptionalService[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Create Service State
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState<number>(1500);
  const [newServiceCycle, setNewServiceCycle] = useState<'once_off' | 'monthly' | 'annual'>('monthly');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [creatingService, setCreatingService] = useState(false);

  // Create Package State
  const [isNewPkgModalOpen, setIsNewPkgModalOpen] = useState(false);
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgPrice, setNewPkgPrice] = useState<number>(10000);
  const [newPkgDesc, setNewPkgDesc] = useState('');
  const [newPkgIdealFor, setNewPkgIdealFor] = useState('');
  const [newPkgFeatures, setNewPkgFeatures] = useState<string[]>([
    'Responsive mobile-first design',
    'Interactive customer contact workflow',
    'Standard warranty & support',
  ]);
  const [creatingPkg, setCreatingPkg] = useState(false);

  // Editing state
  const [editingPkg, setEditingPkg] = useState<Package | null>(null);
  const [pkgFeatures, setPkgFeatures] = useState<string[]>([]);
  const [savingPkg, setSavingPkg] = useState(false);

  const [editingOpt, setEditingOpt] = useState<OptionalService | null>(null);
  const [savingOpt, setSavingOpt] = useState(false);

  const fetchCatalogue = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<{ packages: Package[]; optionalServices: OptionalService[] }>('/packages');
      setPackages(data.packages);
      setOptions(data.optionalServices);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogue();

    // Check query params if navigated with ?action=new-service
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('action') === 'new-service') {
      setIsNewServiceModalOpen(true);
    }
  }, [location.search]);

  // Create New Service Handler
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) {
      alert('Please provide a service name.');
      return;
    }

    setCreatingService(true);
    try {
      await apiRequest('/packages/options', {
        method: 'POST',
        body: JSON.stringify({
          name: newServiceName.trim(),
          price: Number(newServicePrice),
          billing_cycle: newServiceCycle,
          description: newServiceDesc.trim(),
          is_active: 1,
        }),
      });

      setIsNewServiceModalOpen(false);
      setNewServiceName('');
      setNewServicePrice(1500);
      setNewServiceDesc('');
      fetchCatalogue();
      alert('New service added successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to create service.');
    } finally {
      setCreatingService(false);
    }
  };

  // Delete Service Handler
  const handleDeleteService = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the service "${name}"?`)) return;

    try {
      await apiRequest(`/packages/options/${id}`, { method: 'DELETE' });
      fetchCatalogue();
      alert('Service deleted successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to delete service.');
    }
  };

  // Create New Package Handler
  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgName.trim()) {
      alert('Please provide a package name.');
      return;
    }

    setCreatingPkg(true);
    try {
      await apiRequest('/packages', {
        method: 'POST',
        body: JSON.stringify({
          name: newPkgName.trim(),
          starting_price: Number(newPkgPrice),
          description: newPkgDesc.trim(),
          features: newPkgFeatures.filter((f) => f.trim().length > 0),
          ideal_for: newPkgIdealFor.trim(),
          is_active: 1,
        }),
      });

      setIsNewPkgModalOpen(false);
      setNewPkgName('');
      setNewPkgPrice(10000);
      setNewPkgDesc('');
      setNewPkgIdealFor('');
      fetchCatalogue();
      alert('New package added successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to create package.');
    } finally {
      setCreatingPkg(false);
    }
  };

  // Delete Package Handler
  const handleDeletePackage = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the package "${name}"?`)) return;

    try {
      await apiRequest(`/packages/${id}`, { method: 'DELETE' });
      fetchCatalogue();
      alert('Package deleted successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to delete package.');
    }
  };

  const openPkgEditor = (pkg: Package) => {
    setEditingPkg({ ...pkg });
    setPkgFeatures(pkg.features || JSON.parse(pkg.features_json || '[]'));
  };

  const handleSavePkg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPkg) return;
    setSavingPkg(true);

    try {
      await apiRequest(`/packages/${editingPkg.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editingPkg.name,
          starting_price: Number(editingPkg.starting_price),
          description: editingPkg.description,
          features: pkgFeatures,
          ideal_for: editingPkg.ideal_for,
          is_active: editingPkg.is_active,
        }),
      });

      setEditingPkg(null);
      fetchCatalogue();
      alert('Package updated successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to update package');
    } finally {
      setSavingPkg(false);
    }
  };

  const handleSaveOpt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOpt) return;
    setSavingOpt(true);

    try {
      await apiRequest(`/packages/options/${editingOpt.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editingOpt.name,
          price: Number(editingOpt.price),
          billing_cycle: editingOpt.billing_cycle,
          description: editingOpt.description,
          is_active: editingOpt.is_active,
        }),
      });

      setEditingOpt(null);
      fetchCatalogue();
      alert('Service updated successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to update service');
    } finally {
      setSavingOpt(false);
    }
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-pill text-xs font-semibold text-brand-champagne mb-3">
            <Sparkles className="w-3.5 h-3.5 text-brand-amber animate-pulse" />
            <span>Official Catalogue &amp; Pricing Management</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
            Services &amp; <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-champagne via-brand-amber to-brand-gold">
              Pricing Catalogue
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-brand-warm-grey mt-2 max-w-2xl">
            Live source-of-truth service rates and website solutions. Add new offerings or modify rates; updates apply immediately across quotation tools and public catalogues.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsNewServiceModalOpen(true)}
            className="inline-flex items-center px-6 py-2.5 rounded-full text-xs font-bold bg-white text-black hover:bg-neutral-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)]"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add New Service</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewPkgModalOpen(true)}
            className="inline-flex items-center px-5 py-2.5 rounded-full text-xs font-semibold glass-pill text-white hover:text-brand-champagne transition-all"
          >
            <Layers className="w-4 h-4 mr-1.5 text-brand-amber" />
            <span>Add New Package</span>
          </button>
        </div>
      </div>

      {/* Optional Services & Add-ons Section */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Services &amp; Infrastructure Add-ons</h2>
            <p className="text-xs text-brand-warm-grey mt-0.5">Recurring retainers, domain registration, cloud hosting, and automation services.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsNewServiceModalOpen(true)}
            className="text-xs text-brand-champagne hover:text-white inline-flex items-center font-semibold"
          >
            <Plus className="w-3.5 h-3.5 mr-1 text-brand-amber" />
            Add Service
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-brand-warm-grey">Loading services...</div>
        ) : options.length === 0 ? (
          <div className="p-8 rounded-2xl glass-card text-center text-xs text-brand-warm-grey">
            No services configured yet. Click "Add New Service" above to add your first offering.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {options.map((opt) => (
              <div
                key={opt.id}
                className="p-5 rounded-2xl md:rounded-3xl glass-card border border-white/10 space-y-4 flex flex-col justify-between shadow-xl hover:border-brand-amber/30 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full glass-pill text-brand-champagne border border-brand-amber/30">
                      {opt.billing_cycle}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${opt.is_active ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-500'}`}>
                      {opt.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-white">{opt.name}</h3>
                  <div className="mt-2 text-xl font-bold font-mono text-brand-champagne">
                    R {opt.price.toLocaleString()}
                    <span className="text-xs text-brand-warm-grey font-sans font-normal ml-1">/{opt.billing_cycle}</span>
                  </div>
                  <p className="mt-2 text-xs text-brand-warm-grey leading-relaxed">{opt.description}</p>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingOpt(opt)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold glass-pill text-white hover:text-brand-champagne flex items-center justify-center transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1 text-brand-amber" />
                    <span>Edit Rate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteService(opt.id, opt.name)}
                    className="p-2 rounded-xl glass-pill text-red-400 hover:text-red-300 hover:border-red-500/40 transition-colors"
                    title="Delete service"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Website Solution Packages Section */}
      <section className="space-y-5 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Website Solution Packages</h2>
            <p className="text-xs text-brand-warm-grey mt-0.5">Core packages that power public quotes and customer website estimation.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsNewPkgModalOpen(true)}
            className="text-xs text-brand-champagne hover:text-white inline-flex items-center font-semibold"
          >
            <Plus className="w-3.5 h-3.5 mr-1 text-brand-amber" />
            Add Package
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-brand-warm-grey">Loading packages...</div>
        ) : packages.length === 0 ? (
          <div className="p-8 rounded-2xl glass-card text-center text-xs text-brand-warm-grey">
            No packages configured yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="p-6 rounded-2xl md:rounded-3xl glass-card border border-white/10 space-y-4 flex flex-col justify-between shadow-xl hover:border-brand-amber/30 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                    <h3 className="font-bold text-sm text-white">{pkg.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${pkg.is_active ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-500'}`}>
                      {pkg.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </div>

                  <div className="my-2 text-2xl font-bold font-mono text-brand-champagne">
                    R {pkg.starting_price.toLocaleString()}
                    <span className="text-xs text-brand-warm-grey font-sans font-normal ml-1">starting</span>
                  </div>

                  <p className="text-xs text-brand-warm-grey leading-relaxed">{pkg.description}</p>

                  {pkg.ideal_for && (
                    <div className="mt-3 p-2.5 rounded-xl glass-pill text-[11px] text-brand-champagne">
                      <span className="font-semibold text-white">Ideal for:</span> {pkg.ideal_for}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openPkgEditor(pkg)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold glass-pill text-white hover:text-brand-champagne flex items-center justify-center transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1 text-brand-amber" />
                    <span>Edit Package</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                    className="p-2 rounded-xl glass-pill text-red-400 hover:text-red-300 hover:border-red-500/40 transition-colors"
                    title="Delete package"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CREATE NEW SERVICE MODAL */}
      {isNewServiceModalOpen && (
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
                onClick={() => setIsNewServiceModalOpen(false)}
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
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
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
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white font-mono font-bold focus:outline-none focus:border-brand-amber"
                  />
                </div>

                <div>
                  <label className="block text-brand-champagne font-semibold mb-1 uppercase tracking-wider text-[11px]">
                    Billing Cycle
                  </label>
                  <select
                    value={newServiceCycle}
                    onChange={(e) => setNewServiceCycle(e.target.value as any)}
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
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-brand-amber"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsNewServiceModalOpen(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold glass-pill text-brand-warm-grey hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingService}
                  className="px-6 py-2.5 rounded-full text-xs font-bold bg-white text-black hover:bg-neutral-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)] disabled:opacity-50"
                >
                  {creatingService ? 'Saving...' : 'Add Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW PACKAGE MODAL */}
      {isNewPkgModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card border border-white/15 rounded-3xl w-full max-w-xl p-6 sm:p-8 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg glass-pill flex items-center justify-center text-brand-amber">
                  <Layers className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white tracking-tight">Add New Website Package</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsNewPkgModalOpen(false)}
                className="w-8 h-8 rounded-lg glass-pill flex items-center justify-center text-brand-warm-grey hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePackage} className="space-y-4 text-xs">
              <div>
                <label className="block text-brand-champagne font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  Package Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise E-Commerce Platform"
                  value={newPkgName}
                  onChange={(e) => setNewPkgName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-brand-amber"
                />
              </div>

              <div>
                <label className="block text-brand-champagne font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  Starting Price (ZAR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  required
                  value={newPkgPrice}
                  onChange={(e) => setNewPkgPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white font-mono font-bold focus:outline-none focus:border-brand-amber"
                />
              </div>

              <div>
                <label className="block text-brand-champagne font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  Description
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Brief summary of the package..."
                  value={newPkgDesc}
                  onChange={(e) => setNewPkgDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-brand-amber"
                />
              </div>

              <div>
                <label className="block text-brand-champagne font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  Ideal For Audience
                </label>
                <input
                  type="text"
                  placeholder="e.g. Retailers, distributors, multi-vendor stores"
                  value={newPkgIdealFor}
                  onChange={(e) => setNewPkgIdealFor(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-brand-amber"
                />
              </div>

              {/* Inclusions */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-brand-champagne uppercase tracking-wider text-[11px]">
                    Included Features (Bullets):
                  </span>
                  <button
                    type="button"
                    onClick={() => setNewPkgFeatures([...newPkgFeatures, 'New feature item'])}
                    className="text-brand-amber hover:underline text-xs font-semibold"
                  >
                    + Add Bullet
                  </button>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {newPkgFeatures.map((feat, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={feat}
                        onChange={(e) => {
                          const updated = [...newPkgFeatures];
                          updated[idx] = e.target.value;
                          setNewPkgFeatures(updated);
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setNewPkgFeatures(newPkgFeatures.filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsNewPkgModalOpen(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold glass-pill text-brand-warm-grey hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingPkg}
                  className="px-6 py-2.5 rounded-full text-xs font-bold bg-white text-black hover:bg-neutral-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)] disabled:opacity-50"
                >
                  {creatingPkg ? 'Saving...' : 'Add Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Package Edit Modal */}
      {editingPkg && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card border border-white/15 rounded-3xl w-full max-w-xl p-6 sm:p-8 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-base font-bold text-white">Edit Package: {editingPkg.name}</h2>
              <button
                type="button"
                onClick={() => setEditingPkg(null)}
                className="w-8 h-8 rounded-lg glass-pill flex items-center justify-center text-brand-warm-grey hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePkg} className="space-y-4 text-xs">
              <div>
                <label className="block text-brand-champagne font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  Package Name
                </label>
                <input
                  type="text"
                  required
                  value={editingPkg.name}
                  onChange={(e) => setEditingPkg({ ...editingPkg, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-brand-amber"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-brand-champagne font-semibold mb-1 uppercase tracking-wider text-[11px]">
                    Starting Price (ZAR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={editingPkg.starting_price}
                    onChange={(e) => setEditingPkg({ ...editingPkg, starting_price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white font-mono font-bold focus:outline-none focus:border-brand-amber"
                  />
                </div>

                <div>
                  <label className="block text-brand-champagne font-semibold mb-1 uppercase tracking-wider text-[11px]">
                    Status
                  </label>
                  <select
                    value={editingPkg.is_active}
                    onChange={(e) => setEditingPkg({ ...editingPkg, is_active: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-brand-amber"
                  >
                    <option value={1}>Active in Catalogue</option>
                    <option value={0}>Hidden / Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-brand-champagne font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editingPkg.description}
                  onChange={(e) => setEditingPkg({ ...editingPkg, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-brand-amber"
                />
              </div>

              <div>
                <label className="block text-brand-champagne font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  Ideal For Audience
                </label>
                <input
                  type="text"
                  value={editingPkg.ideal_for}
                  onChange={(e) => setEditingPkg({ ...editingPkg, ideal_for: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-brand-amber"
                />
              </div>

              {/* Features list editor */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-brand-champagne uppercase tracking-wider text-[11px]">
                    Inclusions (Bullets):
                  </span>
                  <button
                    type="button"
                    onClick={() => setPkgFeatures([...pkgFeatures, 'New inclusion item'])}
                    className="text-brand-amber hover:underline text-xs font-semibold"
                  >
                    + Add Bullet
                  </button>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {pkgFeatures.map((feat, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={feat}
                        onChange={(e) => {
                          const updated = [...pkgFeatures];
                          updated[idx] = e.target.value;
                          setPkgFeatures(updated);
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setPkgFeatures(pkgFeatures.filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingPkg(null)}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold glass-pill text-brand-warm-grey hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPkg}
                  className="px-6 py-2.5 rounded-full text-xs font-bold bg-white text-black hover:bg-neutral-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)] disabled:opacity-50"
                >
                  {savingPkg ? 'Saving...' : 'Save Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Optional Service Edit Modal */}
      {editingOpt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card border border-white/15 rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-base font-bold text-white">Edit Service: {editingOpt.name}</h2>
              <button
                type="button"
                onClick={() => setEditingOpt(null)}
                className="w-8 h-8 rounded-lg glass-pill flex items-center justify-center text-brand-warm-grey hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOpt} className="space-y-4 text-xs">
              <div>
                <label className="block text-brand-champagne font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  Service Name
                </label>
                <input
                  type="text"
                  required
                  value={editingOpt.name}
                  onChange={(e) => setEditingOpt({ ...editingOpt, name: e.target.value })}
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
                    value={editingOpt.price}
                    onChange={(e) => setEditingOpt({ ...editingOpt, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white font-mono font-bold focus:outline-none focus:border-brand-amber"
                  />
                </div>

                <div>
                  <label className="block text-brand-champagne font-semibold mb-1 uppercase tracking-wider text-[11px]">
                    Billing Cycle
                  </label>
                  <select
                    value={editingOpt.billing_cycle}
                    onChange={(e) => setEditingOpt({ ...editingOpt, billing_cycle: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-brand-amber"
                  >
                    <option value="once_off">Once-off</option>
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-brand-champagne font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editingOpt.description}
                  onChange={(e) => setEditingOpt({ ...editingOpt, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-brand-amber"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingOpt(null)}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold glass-pill text-brand-warm-grey hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingOpt}
                  className="px-6 py-2.5 rounded-full text-xs font-bold bg-white text-black hover:bg-neutral-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)] disabled:opacity-50"
                >
                  {savingOpt ? 'Saving...' : 'Save Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
