import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { recordAuditLog } from '../services/auditService.js';
const router = Router();
// Public endpoint for company details (omits banking details)
router.get('/public', (_req, res) => {
    const settings = db.prepare(`
    SELECT company_name, registration_number, vat_number, email, phone, physical_address, postal_address
    FROM company_settings WHERE id = 1
  `).get();
    res.json({
        company: settings || {
            company_name: 'S&S Tech Group (Pty) Ltd',
            registration_number: '',
            vat_number: '',
            email: '',
            phone: '',
            physical_address: '',
            postal_address: '',
        },
    });
});
// Admin endpoints
const settingsUpdateSchema = z.object({
    company_name: z.string().min(1, 'Company name is required').default('S&S Tech Group (Pty) Ltd'),
    registration_number: z.string().optional().default(''),
    vat_number: z.string().optional().default(''),
    email: z.string().optional().default(''),
    phone: z.string().optional().default(''),
    physical_address: z.string().optional().default(''),
    postal_address: z.string().optional().default(''),
    bank_name: z.string().optional().default(''),
    bank_account_name: z.string().optional().default(''),
    bank_account_number: z.string().optional().default(''),
    bank_branch_code: z.string().optional().default(''),
    bank_account_type: z.string().optional().default(''),
    bank_swift: z.string().optional().default(''),
    default_payment_terms: z.string().optional().default(''),
    default_quote_notes: z.string().optional().default(''),
});
router.get('/', requireAuth, (_req, res) => {
    const settings = db.prepare('SELECT * FROM company_settings WHERE id = 1').get();
    res.json({ settings });
});
router.put('/', requireAuth, (req, res) => {
    const result = settingsUpdateSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: result.error.errors[0].message });
        return;
    }
    const data = result.data;
    // Enforce company name integrity
    if (!data.company_name.includes('S&S Tech Group')) {
        res.status(400).json({ error: 'Company name must be S&S Tech Group or S&S Tech Group (Pty) Ltd.' });
        return;
    }
    db.prepare(`
    UPDATE company_settings
    SET company_name = ?, registration_number = ?, vat_number = ?,
        email = ?, phone = ?, physical_address = ?, postal_address = ?,
        bank_name = ?, bank_account_name = ?, bank_account_number = ?,
        bank_branch_code = ?, bank_account_type = ?, bank_swift = ?,
        default_payment_terms = ?, default_quote_notes = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `).run(data.company_name, data.registration_number, data.vat_number, data.email, data.phone, data.physical_address, data.postal_address, data.bank_name, data.bank_account_name, data.bank_account_number, data.bank_branch_code, data.bank_account_type, data.bank_swift, data.default_payment_terms, data.default_quote_notes);
    recordAuditLog({
        adminId: req.admin?.id,
        adminName: req.admin?.fullName || 'Admin',
        action: 'UPDATE_SETTINGS',
        entityType: 'SETTINGS',
        entityId: 1,
        details: 'Updated company profile, banking details and default document terms',
        ipAddress: req.ip,
    });
    const updatedSettings = db.prepare('SELECT * FROM company_settings WHERE id = 1').get();
    res.json({ message: 'Company settings updated successfully', settings: updatedSettings });
});
export default router;
