import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { recordAuditLog } from '../services/auditService.js';
const router = Router();
router.use(requireAuth);
const clientSchema = z.object({
    name: z.string().min(1, 'Client name is required'),
    company_name: z.string().optional().default(''),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional().default(''),
    billing_address: z.string().optional().default(''),
    tax_number: z.string().optional().default(''),
    notes: z.string().optional().default(''),
});
router.get('/', (req, res) => {
    const search = req.query.search ? String(req.query.search).trim() : '';
    const includeArchived = req.query.include_archived === 'true';
    let query = 'SELECT * FROM clients WHERE 1=1';
    const params = [];
    if (!includeArchived) {
        query += ' AND is_archived = 0';
    }
    if (search) {
        query += ' AND (name LIKE ? OR company_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    query += ' ORDER BY name ASC';
    const clients = db.prepare(query).all(...params);
    res.json({ clients });
});
router.get('/:id', (req, res) => {
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
    if (!client) {
        res.status(404).json({ error: 'Client not found.' });
        return;
    }
    const quotes = db.prepare('SELECT * FROM quotes WHERE client_id = ? ORDER BY issue_date DESC').all(req.params.id);
    const invoices = db.prepare('SELECT * FROM invoices WHERE client_id = ? ORDER BY issue_date DESC').all(req.params.id);
    res.json({ client, quotes, invoices });
});
router.post('/', (req, res) => {
    const result = clientSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: result.error.errors[0].message });
        return;
    }
    const data = result.data;
    const insert = db.prepare(`
    INSERT INTO clients (name, company_name, email, phone, billing_address, tax_number, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(data.name, data.company_name, data.email, data.phone, data.billing_address, data.tax_number, data.notes);
    const newClient = db.prepare('SELECT * FROM clients WHERE id = ?').get(insert.lastInsertRowid);
    recordAuditLog({
        adminId: req.admin?.id,
        adminName: req.admin?.fullName || 'Admin',
        action: 'CREATE_CLIENT',
        entityType: 'CLIENT',
        entityId: Number(insert.lastInsertRowid),
        details: `Created client: ${data.name} (${data.company_name || 'Individual'})`,
        ipAddress: req.ip,
    });
    res.status(201).json({ message: 'Client created successfully', client: newClient });
});
router.put('/:id', (req, res) => {
    const result = clientSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: result.error.errors[0].message });
        return;
    }
    const existing = db.prepare('SELECT id FROM clients WHERE id = ?').get(req.params.id);
    if (!existing) {
        res.status(404).json({ error: 'Client not found.' });
        return;
    }
    const data = result.data;
    db.prepare(`
    UPDATE clients
    SET name = ?, company_name = ?, email = ?, phone = ?, billing_address = ?, tax_number = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(data.name, data.company_name, data.email, data.phone, data.billing_address, data.tax_number, data.notes, req.params.id);
    const updatedClient = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
    recordAuditLog({
        adminId: req.admin?.id,
        adminName: req.admin?.fullName || 'Admin',
        action: 'UPDATE_CLIENT',
        entityType: 'CLIENT',
        entityId: req.params.id,
        details: `Updated client: ${data.name}`,
        ipAddress: req.ip,
    });
    res.json({ message: 'Client updated successfully', client: updatedClient });
});
router.patch('/:id/archive', (req, res) => {
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
    if (!client) {
        res.status(404).json({ error: 'Client not found.' });
        return;
    }
    const newStatus = client.is_archived === 1 ? 0 : 1;
    db.prepare('UPDATE clients SET is_archived = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, req.params.id);
    recordAuditLog({
        adminId: req.admin?.id,
        adminName: req.admin?.fullName || 'Admin',
        action: newStatus === 1 ? 'ARCHIVE_CLIENT' : 'UNARCHIVE_CLIENT',
        entityType: 'CLIENT',
        entityId: req.params.id,
        details: `${newStatus === 1 ? 'Archived' : 'Restored'} client: ${client.name}`,
        ipAddress: req.ip,
    });
    res.json({ message: `Client ${newStatus === 1 ? 'archived' : 'restored'} successfully`, is_archived: newStatus });
});
export default router;
