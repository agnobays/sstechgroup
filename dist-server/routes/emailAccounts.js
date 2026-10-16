import { Router } from 'express';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { db } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { encryptCredential, decryptCredential } from '../services/cryptoService.js';
import { recordAuditLog } from '../services/auditService.js';
const router = Router();
// Protect all routes with requireAuth
router.use(requireAuth);
const emailAccountSchema = z.object({
    label: z.string().min(1, 'Label or staff name is required'),
    email: z.string().email('Valid email address is required'),
    password: z.string().optional(),
    incoming_server: z.string().default('mail.sstechgroup.co.za'),
    incoming_port: z.string().default('993 (IMAP SSL) / 143'),
    smtp_server: z.string().default('mail.sstechgroup.co.za'),
    smtp_port: z.string().default('587 (TLS) / 465 (SSL)'),
    webmail_url: z.string().default('https://sstechgroup.co.za:2222/webmail'),
    is_system_smtp: z.number().int().min(0).max(1).default(0),
    notes: z.string().optional().default(''),
});
// GET /api/email-accounts - List all company email accounts with decrypted credentials
router.get('/', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM email_accounts ORDER BY is_system_smtp DESC, id ASC').all();
        const accounts = rows.map((row) => ({
            ...row,
            password: decryptCredential(row.encrypted_password),
            encrypted_password: undefined,
        }));
        res.json({ accounts });
    }
    catch (err) {
        console.error('Failed to list email accounts:', err);
        res.status(500).json({ error: 'Failed to retrieve email accounts' });
    }
});
// POST /api/email-accounts - Create a new email account
router.post('/', (req, res) => {
    try {
        const parsed = emailAccountSchema.parse(req.body);
        if (!parsed.password) {
            return res.status(400).json({ error: 'Password is required for new mailbox' });
        }
        const encryptedPassword = encryptCredential(parsed.password);
        const result = db.prepare(`
      INSERT INTO email_accounts (
        label, email, encrypted_password,
        incoming_server, incoming_port,
        smtp_server, smtp_port,
        webmail_url, is_system_smtp, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(parsed.label, parsed.email.toLowerCase().trim(), encryptedPassword, parsed.incoming_server, parsed.incoming_port, parsed.smtp_server, parsed.smtp_port, parsed.webmail_url, parsed.is_system_smtp, parsed.notes);
        recordAuditLog({
            adminId: req.admin?.id,
            adminName: req.admin?.name || 'Admin',
            action: 'CREATE_EMAIL_ACCOUNT',
            entityType: 'EMAIL_VAULT',
            entityId: Number(result.lastInsertRowid),
            details: `Created mailbox credentials for ${parsed.email} (${parsed.label})`,
            ipAddress: req.ip,
        });
        res.status(201).json({
            message: 'Email account securely stored in vault',
            id: result.lastInsertRowid,
        });
    }
    catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: err.errors[0].message });
        }
        if (err?.message?.includes('UNIQUE constraint')) {
            return res.status(400).json({ error: 'An email account with this address already exists' });
        }
        console.error('Failed to create email account:', err);
        res.status(500).json({ error: 'Failed to create email account' });
    }
});
// PUT /api/email-accounts/:id - Update an email account
router.put('/:id', (req, res) => {
    try {
        const id = Number(req.params.id);
        const existing = db.prepare('SELECT * FROM email_accounts WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Email account not found' });
        }
        const parsed = emailAccountSchema.parse(req.body);
        let encryptedPassword = existing.encrypted_password;
        if (parsed.password && parsed.password.trim() !== '') {
            encryptedPassword = encryptCredential(parsed.password);
        }
        db.prepare(`
      UPDATE email_accounts
      SET label = ?, email = ?, encrypted_password = ?,
          incoming_server = ?, incoming_port = ?,
          smtp_server = ?, smtp_port = ?,
          webmail_url = ?, is_system_smtp = ?, notes = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(parsed.label, parsed.email.toLowerCase().trim(), encryptedPassword, parsed.incoming_server, parsed.incoming_port, parsed.smtp_server, parsed.smtp_port, parsed.webmail_url, parsed.is_system_smtp, parsed.notes, id);
        recordAuditLog({
            adminId: req.admin?.id,
            adminName: req.admin?.name || 'Admin',
            action: 'UPDATE_EMAIL_ACCOUNT',
            entityType: 'EMAIL_VAULT',
            entityId: id,
            details: `Updated mailbox credentials/settings for ${parsed.email}`,
            ipAddress: req.ip,
        });
        res.json({ message: 'Email account updated successfully' });
    }
    catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: err.errors[0].message });
        }
        console.error('Failed to update email account:', err);
        res.status(500).json({ error: 'Failed to update email account' });
    }
});
// DELETE /api/email-accounts/:id - Delete an email account
router.delete('/:id', (req, res) => {
    try {
        const id = Number(req.params.id);
        const existing = db.prepare('SELECT * FROM email_accounts WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Email account not found' });
        }
        if (existing.is_system_smtp === 1) {
            return res.status(400).json({ error: 'Cannot delete the primary system SMTP account' });
        }
        db.prepare('DELETE FROM email_accounts WHERE id = ?').run(id);
        recordAuditLog({
            adminId: req.admin?.id,
            adminName: req.admin?.name || 'Admin',
            action: 'DELETE_EMAIL_ACCOUNT',
            entityType: 'EMAIL_VAULT',
            entityId: id,
            details: `Removed mailbox credentials for ${existing.email}`,
            ipAddress: req.ip,
        });
        res.json({ message: 'Email account removed from vault' });
    }
    catch (err) {
        console.error('Failed to delete email account:', err);
        res.status(500).json({ error: 'Failed to delete email account' });
    }
});
// POST /api/email-accounts/test-smtp - Test live SMTP connection
router.post('/test-smtp', async (req, res) => {
    try {
        const { email, password, recipient } = req.body;
        const testRecipient = recipient || email || 'info@sstechgroup.co.za';
        const transporter = nodemailer.createTransport({
            host: 'mail.sstechgroup.co.za',
            port: 587,
            secure: false,
            auth: {
                user: email,
                pass: password,
            },
            tls: {
                rejectUnauthorized: false,
            },
        });
        await transporter.verify();
        const info = await transporter.sendMail({
            from: `"S&S Tech Group System" <${email}>`,
            to: testRecipient,
            subject: '✅ SMTP Gateway Verification — S&S Tech Group',
            html: `
        <div style="font-family: Arial, sans-serif; background-color: #0c0a08; color: #f5f2eb; padding: 32px; border-radius: 12px;">
          <h2 style="color: #f67300; margin-top: 0;">SMTP Connection Verified Successfully</h2>
          <p>This automated test confirms that outbound email dispatching from <strong>${email}</strong> via <code>mail.sstechgroup.co.za:587</code> is fully operational.</p>
          <div style="background-color: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Sender Account:</strong> ${email}</p>
            <p style="margin: 4px 0;"><strong>SMTP Server:</strong> mail.sstechgroup.co.za</p>
            <p style="margin: 4px 0;"><strong>Port:</strong> 587 (TLS)</p>
            <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          </div>
          <p style="font-size: 12px; color: #a8a29e;">S&S Tech Group (Pty) Ltd &bull; Confidential &bull; System Health Check</p>
        </div>
      `,
        });
        recordAuditLog({
            adminId: req.admin?.id,
            adminName: req.admin?.name || 'Admin',
            action: 'TEST_SMTP_CONNECTION',
            entityType: 'EMAIL_VAULT',
            details: `Successful SMTP verification for ${email} -> sent to ${testRecipient}`,
            ipAddress: req.ip,
        });
        res.json({
            success: true,
            message: `SMTP connection verified successfully! Test email delivered to ${testRecipient}.`,
            messageId: info.messageId,
        });
    }
    catch (err) {
        console.error('SMTP test failed:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'SMTP authentication failed',
        });
    }
});
export default router;
