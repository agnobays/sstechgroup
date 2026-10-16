import { db } from '../db/database.js';
export function recordAuditLog(entry) {
    try {
        db.prepare(`
      INSERT INTO audit_logs (admin_id, admin_name, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(entry.adminId || null, entry.adminName, entry.action, entry.entityType, entry.entityId ? String(entry.entityId) : null, entry.details || null, entry.ipAddress || null);
    }
    catch (err) {
        console.error('Failed to write audit log:', err);
    }
}
