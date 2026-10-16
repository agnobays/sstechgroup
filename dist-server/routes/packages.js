import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { recordAuditLog } from '../services/auditService.js';
const router = Router();
// Public: Fetch active package catalogue and optional services
router.get('/', (_req, res) => {
    const packages = db.prepare('SELECT * FROM packages WHERE is_active = 1 ORDER BY sort_order ASC').all();
    const optionalServices = db.prepare('SELECT * FROM optional_services WHERE is_active = 1 ORDER BY sort_order ASC').all();
    // Parse features_json
    const parsedPackages = packages.map((p) => ({
        ...p,
        features: JSON.parse(p.features_json || '[]'),
    }));
    res.json({
        packages: parsedPackages,
        optionalServices,
    });
});
// Admin: Update package prices and inclusions
router.put('/:id', requireAuth, (req, res) => {
    const schema = z.object({
        name: z.string().min(1),
        starting_price: z.number().min(0),
        description: z.string().min(1),
        features: z.array(z.string()).min(1),
        ideal_for: z.string().optional().default(''),
        is_active: z.number().int().min(0).max(1).default(1),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: result.error.errors[0].message });
        return;
    }
    const data = result.data;
    const existing = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id);
    if (!existing) {
        res.status(404).json({ error: 'Package not found' });
        return;
    }
    db.prepare(`
    UPDATE packages
    SET name = ?, starting_price = ?, description = ?, features_json = ?, ideal_for = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(data.name, data.starting_price, data.description, JSON.stringify(data.features), data.ideal_for, data.is_active, req.params.id);
    recordAuditLog({
        adminId: req.admin?.id,
        adminName: req.admin?.fullName || 'Admin',
        action: 'UPDATE_PACKAGE',
        entityType: 'SETTINGS',
        entityId: req.params.id,
        details: `Updated package ${data.name}: starting price changed from R ${existing.starting_price} to R ${data.starting_price}`,
        ipAddress: req.ip,
    });
    res.json({ message: 'Package updated successfully' });
});
// Admin: Create new package
router.post('/', requireAuth, (req, res) => {
    const schema = z.object({
        name: z.string().min(1, 'Package name is required'),
        starting_price: z.number().min(0, 'Starting price must be positive'),
        description: z.string().min(1, 'Description is required'),
        features: z.array(z.string()).min(1, 'At least one inclusion bullet is required'),
        ideal_for: z.string().optional().default(''),
        is_active: z.number().int().min(0).max(1).default(1),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: result.error.errors[0].message });
        return;
    }
    const data = result.data;
    const key = `pkg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM packages').get();
    const sortOrder = (maxOrder?.m || 0) + 1;
    const insert = db.prepare(`
    INSERT INTO packages (key, name, starting_price, description, features_json, ideal_for, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(key, data.name, data.starting_price, data.description, JSON.stringify(data.features), data.ideal_for, sortOrder, data.is_active);
    recordAuditLog({
        adminId: req.admin?.id,
        adminName: req.admin?.fullName || 'Admin',
        action: 'CREATE_PACKAGE',
        entityType: 'SETTINGS',
        entityId: Number(insert.lastInsertRowid),
        details: `Created new package: ${data.name} (starting R ${data.starting_price})`,
        ipAddress: req.ip,
    });
    res.status(201).json({
        message: 'Package created successfully',
        id: Number(insert.lastInsertRowid),
    });
});
// Admin: Delete package
router.delete('/:id', requireAuth, (req, res) => {
    const existing = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id);
    if (!existing) {
        res.status(404).json({ error: 'Package not found' });
        return;
    }
    db.prepare('DELETE FROM packages WHERE id = ?').run(req.params.id);
    recordAuditLog({
        adminId: req.admin?.id,
        adminName: req.admin?.fullName || 'Admin',
        action: 'DELETE_PACKAGE',
        entityType: 'SETTINGS',
        entityId: req.params.id,
        details: `Deleted package: ${existing.name}`,
        ipAddress: req.ip,
    });
    res.json({ message: 'Package removed successfully' });
});
// Admin: Update optional service price
router.put('/options/:id', requireAuth, (req, res) => {
    const schema = z.object({
        name: z.string().min(1),
        price: z.number().min(0),
        billing_cycle: z.enum(['once_off', 'monthly', 'annual']),
        description: z.string().min(1),
        is_active: z.number().int().min(0).max(1).default(1),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: result.error.errors[0].message });
        return;
    }
    const data = result.data;
    const existing = db.prepare('SELECT * FROM optional_services WHERE id = ?').get(req.params.id);
    if (!existing) {
        res.status(404).json({ error: 'Optional service not found' });
        return;
    }
    db.prepare(`
    UPDATE optional_services
    SET name = ?, price = ?, billing_cycle = ?, description = ?, is_active = ?
    WHERE id = ?
  `).run(data.name, data.price, data.billing_cycle, data.description, data.is_active, req.params.id);
    recordAuditLog({
        adminId: req.admin?.id,
        adminName: req.admin?.fullName || 'Admin',
        action: 'UPDATE_OPTIONAL_SERVICE',
        entityType: 'SETTINGS',
        entityId: req.params.id,
        details: `Updated optional service ${data.name}: price changed from R ${existing.price} to R ${data.price} (${data.billing_cycle})`,
        ipAddress: req.ip,
    });
    res.json({ message: 'Optional service updated successfully' });
});
// Admin: Create new optional service / add-on
router.post('/options', requireAuth, (req, res) => {
    const schema = z.object({
        name: z.string().min(1, 'Service name is required'),
        price: z.number().min(0, 'Price must be positive'),
        billing_cycle: z.enum(['once_off', 'monthly', 'annual']),
        description: z.string().min(1, 'Description is required'),
        is_active: z.number().int().min(0).max(1).default(1),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: result.error.errors[0].message });
        return;
    }
    const data = result.data;
    const key = `opt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM optional_services').get();
    const sortOrder = (maxOrder?.m || 0) + 1;
    const insert = db.prepare(`
    INSERT INTO optional_services (key, name, price, billing_cycle, description, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(key, data.name, data.price, data.billing_cycle, data.description, sortOrder, data.is_active);
    recordAuditLog({
        adminId: req.admin?.id,
        adminName: req.admin?.fullName || 'Admin',
        action: 'CREATE_OPTIONAL_SERVICE',
        entityType: 'SETTINGS',
        entityId: Number(insert.lastInsertRowid),
        details: `Created new service: ${data.name} (R ${data.price} / ${data.billing_cycle})`,
        ipAddress: req.ip,
    });
    res.status(201).json({
        message: 'Service created successfully',
        id: Number(insert.lastInsertRowid),
    });
});
// Admin: Delete optional service
router.delete('/options/:id', requireAuth, (req, res) => {
    const existing = db.prepare('SELECT * FROM optional_services WHERE id = ?').get(req.params.id);
    if (!existing) {
        res.status(404).json({ error: 'Optional service not found' });
        return;
    }
    db.prepare('DELETE FROM optional_services WHERE id = ?').run(req.params.id);
    recordAuditLog({
        adminId: req.admin?.id,
        adminName: req.admin?.fullName || 'Admin',
        action: 'DELETE_OPTIONAL_SERVICE',
        entityType: 'SETTINGS',
        entityId: req.params.id,
        details: `Deleted optional service: ${existing.name}`,
        ipAddress: req.ip,
    });
    res.json({ message: 'Service removed successfully' });
});
export default router;
