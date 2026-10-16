import React, { useEffect, useState } from 'react';
import { ClipboardList, Search, Clock, Shield, RefreshCw } from 'lucide-react';
import { apiRequest } from '../../api/client';
import { AuditLog } from '../../types';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<{ logs: AuditLog[] }>('/audit-logs?limit=100');
      setLogs(data.logs);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter((l) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(term) ||
      l.admin_name.toLowerCase().includes(term) ||
      (l.details && l.details.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-brand-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-off-white">
            System Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-brand-warm-grey mt-1">
            Immutable chronological record of administrative actions, document creation, updates, and payment recording.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold bg-brand-charcoal text-brand-off-white hover:text-brand-gold border border-brand-border"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Refresh Log
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-brand-charcoal p-4 rounded-xl border border-brand-border">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-brand-warm-grey" />
          <input
            type="text"
            placeholder="Search action, admin or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-brand-black border border-brand-border text-brand-off-white text-xs placeholder-brand-warm-grey/50 focus:outline-none focus:border-brand-gold"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-brand-charcoal rounded-xl border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-black border-b border-brand-border text-brand-warm-grey uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Admin User</th>
                <th className="py-3 px-4 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-brand-warm-grey">
                    Loading audit trail...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-brand-warm-grey">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-brand-black/30 transition-colors">
                    <td className="py-3 px-4 text-[11px] text-brand-warm-grey font-mono whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-brand-black text-brand-gold border border-brand-gold/30">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-brand-off-white font-mono">
                      {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                    </td>
                    <td className="py-3 px-4 text-brand-off-white max-w-sm truncate">
                      {log.details || '-'}
                    </td>
                    <td className="py-3 px-4 text-brand-warm-grey font-medium">
                      {log.admin_name}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[11px] text-brand-warm-grey">
                      {log.ip_address || 'local'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
