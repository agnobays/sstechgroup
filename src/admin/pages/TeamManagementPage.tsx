import React, { useState, useEffect } from 'react';
import {
  Users,
  Edit2,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  X,
  UserCheck
} from 'lucide-react';
import { apiRequest } from '../../api/client';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  image_url: string;
  bio: string;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export const TeamManagementPage: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Edit / Create modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    image_url: '/images/team/team-1.jpg',
    bio: '',
    sort_order: 1,
    is_active: 1,
  });

  const availablePhotos = [
    '/images/team/team-1.jpg',
    '/images/team/team-2.jpg',
    '/images/team/team-3.jpg',
    '/images/team/team-4.jpg',
    '/images/team/team-5.jpg',
    '/images/team/team-6.jpg',
  ];

  const fetchTeam = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ team: TeamMember[] }>('/team/admin/all');
      setTeam(res.team || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load team members');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const openCreateModal = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      role: '',
      image_url: '/images/team/team-1.jpg',
      bio: '',
      sort_order: team.length + 1,
      is_active: 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name || '',
      role: member.role || '',
      image_url: member.image_url || '/images/team/team-1.jpg',
      bio: member.bio || '',
      sort_order: member.sort_order,
      is_active: member.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (editingMember) {
        await apiRequest<{ success: boolean; member: TeamMember }>(`/team/${editingMember.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        setSuccessMessage(`Updated profile for ${formData.name || 'Team Member #' + editingMember.id}`);
      } else {
        await apiRequest<{ success: boolean; member: TeamMember }>('/team', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        setSuccessMessage('New team member added successfully');
      }

      setIsModalOpen(false);
      await fetchTeam();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save team member');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (member: TeamMember) => {
    if (!window.confirm(`Are you sure you want to remove ${member.name || 'this team member'}?`)) {
      return;
    }

    try {
      await apiRequest(`/team/${member.id}`, { method: 'DELETE' });
      setSuccessMessage('Team member removed');
      await fetchTeam();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete team member');
    }
  };

  const handleToggleActive = async (member: TeamMember) => {
    try {
      const nextActive = member.is_active === 1 ? 0 : 1;
      await apiRequest(`/team/${member.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: nextActive }),
      });
      setTeam((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, is_active: nextActive } : m))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update visibility');
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full glass-pill text-xs font-semibold tracking-wider uppercase text-brand-champagne mb-2">
            <Users className="w-3.5 h-3.5 text-brand-amber" />
            <span>Public Website Staff &amp; Leadership</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Team Management
          </h1>
          <p className="text-xs sm:text-sm text-brand-warm-grey mt-1">
            Edit team member names, leadership roles, and bios. Updates reflect immediately on the public About page.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-white text-black hover:bg-neutral-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Member
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-200 text-xs sm:text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-700/60 text-rose-200 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Team Cards Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-brand-warm-grey">
          <div className="w-8 h-8 border-2 border-brand-amber border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Loading team roster...</p>
        </div>
      ) : team.length === 0 ? (
        <div className="py-16 text-center glass-card rounded-2xl border border-white/10 p-8 space-y-4">
          <Users className="w-12 h-12 text-brand-warm-grey mx-auto opacity-40" />
          <h3 className="text-base font-bold text-white">No Team Members Found</h3>
          <p className="text-xs text-brand-warm-grey max-w-sm mx-auto">
            Click &quot;Add Member&quot; to register your first team member.
          </p>
          <button
            onClick={openCreateModal}
            className="px-5 py-2 rounded-full text-xs font-semibold bg-white text-black hover:bg-neutral-100"
          >
            Add Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map((member) => {
            const hasName = Boolean(member.name && member.name.trim().length > 0);
            const hasRole = Boolean(member.role && member.role.trim().length > 0);

            return (
              <div
                key={member.id}
                className="glass-card rounded-2xl border border-white/10 overflow-hidden flex flex-col justify-between hover:border-brand-amber/40 transition-all duration-300 group"
              >
                <div>
                  {/* Image Display */}
                  <div className="relative aspect-[4/5] bg-neutral-900 overflow-hidden">
                    <img
                      src={member.image_url}
                      alt={member.name || `Team Member #${member.id}`}
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/images/team/team-1.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex items-center space-x-2">
                      <span className="glass-pill px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-white bg-black/60 backdrop-blur-md border border-white/10">
                        #{member.sort_order}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(member)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center space-x-1 backdrop-blur-md border transition-colors ${
                          member.is_active === 1
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                            : 'bg-neutral-900/80 text-neutral-400 border-neutral-700'
                        }`}
                        title="Click to toggle visibility"
                      >
                        {member.is_active === 1 ? (
                          <>
                            <Eye className="w-3 h-3 mr-1 text-emerald-400" /> Visible
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 mr-1 text-neutral-400" /> Hidden
                          </>
                        )}
                      </button>
                    </div>

                    {/* Image Footer Label */}
                    <div className="absolute bottom-3 left-4 right-4 space-y-1">
                      <h3 className="text-lg font-bold text-white drop-shadow-md flex items-center">
                        {hasName ? (
                          member.name
                        ) : (
                          <span className="text-brand-champagne/80 italic font-normal text-sm">
                            [Name Pending — Click Edit]
                          </span>
                        )}
                      </h3>
                      <p className="text-xs font-mono font-medium text-brand-champagne drop-shadow">
                        {hasRole ? (
                          member.role
                        ) : (
                          <span className="text-neutral-400 italic font-normal text-[11px]">
                            [Role Pending — Click Edit]
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    {member.bio ? (
                      <p className="text-xs text-brand-warm-grey leading-relaxed line-clamp-2">
                        {member.bio}
                      </p>
                    ) : (
                      <p className="text-xs text-neutral-500 italic">
                        No bio summary provided.
                      </p>
                    )}

                    <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-neutral-400 border-t border-white/5">
                      <span>Image: {member.image_url.split('/').pop()}</span>
                      {hasName && hasRole ? (
                        <span className="text-emerald-400 flex items-center">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Profile Ready
                        </span>
                      ) : (
                        <span className="text-brand-amber flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" /> Action Required
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 bg-white/[0.02] border-t border-white/10 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(member)}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-semibold bg-white text-black hover:bg-neutral-100 transition-colors shadow-sm"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                    Edit Details
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(member)}
                    className="p-2 rounded-full glass-pill text-neutral-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                    title="Delete member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-card rounded-2xl md:rounded-3xl border border-white/15 w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg glass-pill flex items-center justify-center text-brand-amber">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  {editingMember ? 'Edit Team Member Profile' : 'Add New Team Member'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Photo Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-champagne">
                  Select Photo Asset
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {availablePhotos.map((photo) => (
                    <button
                      key={photo}
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: photo })}
                      className={`relative aspect-[4/5] rounded-lg overflow-hidden border-2 transition-all ${
                        formData.image_url === photo
                          ? 'border-brand-amber ring-2 ring-brand-amber/40 scale-105'
                          : 'border-white/10 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={photo} alt="Thumbnail" className="w-full h-full object-cover object-top" />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="/images/team/team-1.jpg"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-brand-off-white focus:outline-none focus:border-brand-amber"
                />
              </div>

              {/* Name Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-champagne">
                  Full Name <span className="text-brand-amber">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sipho Khumalo"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-amber focus:ring-1 focus:ring-brand-amber transition-all"
                />
              </div>

              {/* Role / Job Title Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-champagne">
                  Role / Job Title <span className="text-brand-amber">*</span>
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g. Lead Solutions Architect & Co-Founder"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-amber focus:ring-1 focus:ring-brand-amber transition-all"
                />
              </div>

              {/* Bio / Specialization */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-champagne">
                  Professional Bio / Specialization (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Brief 1-2 sentence description of background, responsibilities, or engineering focus..."
                  className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-brand-amber transition-all resize-none"
                />
              </div>

              {/* Display Order & Active Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-champagne">
                    Display Order (#)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-4 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-amber"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-white cursor-pointer select-none p-2 rounded-xl border border-white/10 bg-black/40">
                    <input
                      type="checkbox"
                      checked={formData.is_active === 1}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                      className="rounded border-white/20 text-brand-amber focus:ring-brand-amber"
                    />
                    <span>Show Publicly on Website</span>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold text-neutral-300 hover:text-white glass-pill"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-full text-xs font-semibold bg-white text-black hover:bg-neutral-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)] flex items-center"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Profile'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
