import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { calculateDocumentTotals } from '../services/calculationService.js';
import { getNextDocumentNumber } from '../services/documentNumberService.js';
import { generateQuotePDF } from '../services/pdfService.js';
import { recordAuditLog } from '../services/auditService.js';
import { sendQuoteEmail } from '../services/emailService.js';
const router = Router();
router.use(requireAuth);
const quoteItemSchema = z.object({
    description: z.string().min(1, 'Item description is required'),
    quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
    unit_price: z.number().min(0, 'Unit price cannot be negative'),
    discount_percent: z.number().min(0).max(100).optional().default(0),
    tax_rate: z.number().min(0).optional().default(0),
});
const quoteSchema = z.object({
    client_id: z.number().int().positive('Client is required'),
    issue_date: z.string().min(1, 'Issue date is required'),
    expiry_date: z.string().min(1, 'Expiry date is required'),
    status: z.enum(['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired']).default('Draft'),
    scope_of_work: z.string().optional().default(''),
    notes: z.string().optional().default(''),
    payment_terms: z.string().optional().default(''),
    items: z.array(quoteItemSchema).min(1, 'At least one line item is required'),
});
router.get('/', (req, res) => {
    const search = req.query.search ? String(req.query.search).trim() : '';
    const status = req.query.status ? String(req.query.status).trim() : '';
    const clientId = req.query.client_id ? Number(req.query.client_id) : null;
    const includeArchived = req.query.include_archived === 'true';
    let query = `
    SELECT q.*, c.name as client_name, c.company_name as client_company, c.email as client_email, c.phone as client_phone
    FROM quotes q
    JOIN clients c ON q.client_id = c.id
    WHERE 1=1
  `;
    const params = [];
    if (!includeArchived) {
        query += ' AND q.is_archived = 0';
    }
    if (status) {
        query += ' AND q.status = ?';
        params.push(status);
    }
    if (clientId) {
        query += ' AND q.client_id = ?';
        params.push(clientId);
    }
    if (search) {
        query += ' AND (q.quote_number LIKE ? OR c.name LIKE ? OR c.company_name LIKE ? OR c.email LIKE ?)';
        const pattern = `%${search}%`;
        params.push(pattern, pattern, pattern, pattern);
    }
    query += ' ORDER BY q.created_at DESC';
    const quotes = db.prepare(query).all(...params);
    res.json({ quotes });
});
router.get('/:id', (req, res) => {
    const quote = db.prepare(`
    SELECT q.*, c.name as client_name, c.company_name as client_company,
           c.email as client_email, c.phone as client_phone,
           c.billing_address as client_address, c.tax_number as client_tax
    FROM quotes q
    JOIN clients c ON q.client_id = c.id
    WHERE q.id = ?
  `).get(req.params.id);
    if (!quote) {
        res.status(404).json({ error: 'Quotation not found.' });
        return;
    }
    const items = db.prepare('SELECT * FROM quote_items WHERE quote_id = ? ORDER BY sort_order ASC, id ASC').all(req.params.id);
    res.json({ quote, items });
});
router.post('/', (req, res) => {
    const result = quoteSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: result.error.errors[0].message });
        return;
    }
    const data = result.data;
    const client = db.prepare('SELECT id, name FROM clients WHERE id = ?').get(data.client_id);
    if (!client) {
        res.status(400).json({ error: 'Selected client does not exist.' });
        return;
    }
    const totals = calculateDocumentTotals(data.items);
    const quoteNumber = getNextDocumentNumber('QUOTE');
    const createTransaction = db.transaction(() => {
        const insertQuote = db.prepare(`
      INSERT INTO quotes (
        quote_number, client_id, issue_date, expiry_date, status,
        scope_of_work, notes, payment_terms,
        subtotal, discount_amount, tax_amount, total_amount, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(quoteNumber, data.client_id, data.issue_date, data.expiry_date, data.status, data.scope_of_work, data.notes, data.payment_terms, totals.subtotal, totals.discount_amount, totals.tax_amount, totals.total_amount, req.admin?.fullName || 'Admin');
        const quoteId = insertQuote.lastInsertRowid;
        const insertItem = db.prepare(`
      INSERT INTO quote_items (quote_id, description, quantity, unit_price, discount_percent, tax_rate, line_total, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        totals.items.forEach((item, index) => {
            insertItem.run(quoteId, item.description, item.quantity, item.unit_price, item.discount_percent, item.tax_rate, item.line_total, index);
        });
        return quoteId;
    });
    const quoteId = createTransaction();
    recordAuditLog({
        adminId: req.admin?.id,
        adminName: req.admin?.fullName || 'Admin',
        action: 'CREATE_QUOTE',
        entityType: 'QUOTE',
        entityId: Number(quoteId),
        details: `Created quotation ${quoteNumber} for client ${client.name} (Total: R ${totals.total_amount.toFixed(2)})`,
        ipAddress: req.ip,
    });
    const createdQuote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(quoteId);
    const items = db.prepare('SELECT * FROM quote_items WHERE quote_id = ?').all(quoteId);
    res.status(201).json({ message: 'Quotation created successfully', quote: createdQuote, items });
});
router.put('/:id', (req, res) => {
    const result = quoteSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: result.error.errors[0].message });
        return;
    }
    const existingQuote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
    if (!existingQuote) {
        res.status(404).json({ error: 'Quotation not found.' });
        return;
    }
    const data = result.data;
    const totals = calculateDocumentTotals(data.items);
    const updateTransaction = db.transaction(() => {
        db.prepare(`
      UPDATE quotes
      SET client_id = ?, issue_date = ?, expiry_date = ?, status = ?,
          scope_of_work = ?, notes = ?, payment_terms = ?,
          subtotal = ?, discount_amount = ?, tax_amount = ?, total_amount = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(data.client_id, data.issue_date, data.expiry_date, data.status, data.scope_of_work, data.notes, data.payment_terms, totals.subtotal, totals.discount_amount, totals.tax_amount, totals.total_amount, req.params.id);
        // Delete existing items and re-insert updated items
        db.prepare('DELETE FROM quote_items WHERE quote_id = ?').run(req.params.id);
        const insertItem = db.prepare(`
      INSERT INTO quote_items (quote_id, description, quantity, unit_price, discount_percent, tax_rate, line_total, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        totals.items.forEach((item, index) => {
            insertItem.run(req.params.id, item.description, item.quantity, item.unit_price, item.discount_percent, item.tax_rate, item.line_total, index);
        });
    });
    updateTransaction();
    recordAuditLog({
        adminId: req.admin?.id,
        adminName: req.admin?.fullName || 'Admin',
        action: 'UPDATE_QUOTE',
        entityType: 'QUOTE',
        entityId: req.params.id,
        details: `Updated quotation ${existingQuote.quote_number} (New Total: R ${totals.total_amount.toFixed(2)})`,
        ipAddress: req.ip,
    });
    res.json({ message: 'Quotation updated successfully' });
});
router.post('/:id/duplicate', (req, res) => {
    const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
    if (!quote) {
        res.status(404).json({ error: 'Quotation not found.' });
        return;
    }
    const items = db.prepare('SELECT * FROM quote_items WHERE quote_id = ?').all(req.params.id);
    const newQuoteNumber = getNextDocumentNumber('QUOTE');
    const today = new Date().toISOString().split('T')[0];
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    const expiryStr = expiryDate.toISOString().split('T')[0];
    const duplicateTransaction = db.transaction(() => {
        const insertQuote = db.prepare(`
      INSERT INTO quotes (
        quote_number, client_id, issue_date, expiry_date, status,
        scope_of_work, notes, payment_terms,
        subtotal, discount_amount, tax_amount, total_amount, created_by
      ) VALUES (?, ?, ?, ?, 'Draft', ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(newQuoteNumber, quote.client_id, today, expiryStr, quote.scope_of_work, quote.notes, quote.payment_terms, quote.subtotal, quote.discount_amount, quote.tax_amount, quote.total_amount, req.admin?.fullName || 'Admin');
        const newQuoteId = insertQuote.lastInsertRowid;
        const insertItem = db.prepare(`
      INSERT INTO quote_items (quote_id, description, quantity, unit_price, discount_percent, tax_rate, line_total, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        items.forEach((item, index) => {
            insertItem.run(newQuoteId, item.description, item.quantity, item.unit_price, item.discount_percent, item.tax_rate, item.line_total, index);
        });
        return newQuoteId;
    });
    const newQuoteId = duplicateTransaction();
    recordAuditLog({
        adminId: req.admin?.id,
        adminName: req.admin?.fullName || 'Admin',
        action: 'DUPLICATE_QUOTE',
        entityType: 'QUOTE',
        entityId: Number(newQuoteId),
        details: `Duplicated quote ${quote.quote_number} to new quote ${newQuoteNumber}`,
        ipAddress: req.ip,
    });
    res.status(201).json({ message: 'Quotation duplicated successfully', newQuoteId, quote_number: newQuoteNumber });
});
router.post('/:id/convert-to-invoice', (req, res) => {
    const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
    if (!quote) {
        res.status(404).json({ error: 'Quotation not found.' });
        return;
    }
    if (quote.converted_to_invoice_id) {
        res.status(400).json({ error: 'This quotation has already been converted to an invoice.' });
        return;
    }
    const items = db.prepare('SELECT * FROM quote_items WHERE quote_id = ?').all(req.params.id);
    const invoiceNumber = getNextDocumentNumber('INVOICE');
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    const dueDateStr = dueDate.toISOString().split('T')[0];
    const convertTransaction = db.transaction(() => {
        const insertInvoice = db.prepare(`
      INSERT INTO invoices (
        invoice_number, quote_id, client_id, issue_date, due_date, status,
        notes, payment_terms, subtotal, discount_amount, tax_amount, total_amount,
        paid_amount, balance_due, created_by
      ) VALUES (?, ?, ?, ?, ?, 'Draft', ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(invoiceNumber, quote.id, quote.client_id, today, dueDateStr, quote.notes, quote.payment_terms || 'Payment due within 14 days of invoice date.', quote.subtotal, quote.discount_amount, quote.tax_amount, quote.total_amount, quote.total_amount, req.admin?.fullName || 'Admin');
        const invoiceId = insertInvoice.lastInsertRowid;
        const insertItem = db.prepare(`
      INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, discount_percent, tax_rate, line_total, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        items.forEach((item, index) => {
            insertItem.run(invoiceId, item.description, item.quantity, item.unit_price, item.discount_percent, item.tax_rate, item.line_total, index);
        });
        // Update quote status to Accepted and link converted invoice
        db.prepare(`
      UPDATE quotes
      SET status = 'Accepted', converted_to_invoice_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(invoiceId, quote.id);
        return invoiceId;
    });
    const invoiceId = convertTransaction();
    recordAuditLog({
        adminId: req.admin?.id,
        adminName: req.admin?.fullName || 'Admin',
        action: 'CONVERT_QUOTE_TO_INVOICE',
        entityType: 'QUOTE',
        entityId: quote.id,
        details: `Converted quotation ${quote.quote_number} into invoice ${invoiceNumber}`,
        ipAddress: req.ip,
    });
    res.status(201).json({ message: 'Quotation converted to invoice successfully', invoiceId, invoice_number: invoiceNumber });
});
router.patch('/:id/status', (req, res) => {
    const statusSchema = z.object({
        status: z.enum(['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired']),
    });
    const result = statusSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: 'Invalid status' });
        return;
    }
    const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
    if (!quote) {
        res.status(404).json({ error: 'Quotation not found.' });
        return;
    }
    db.prepare('UPDATE quotes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(result.data.status, req.params.id);
    recordAuditLog({
        adminId: req.admin?.id,
        adminName: req.admin?.fullName || 'Admin',
        action: 'STATUS_CHANGE_QUOTE',
        entityType: 'QUOTE',
        entityId: req.params.id,
        details: `Changed status of quote ${quote.quote_number} from ${quote.status} to ${result.data.status}`,
        ipAddress: req.ip,
    });
    res.json({ message: 'Status updated successfully', status: result.data.status });
});
router.get('/:id/pdf', (req, res) => {
    try {
        const doc = generateQuotePDF(Number(req.params.id));
        const quote = db.prepare('SELECT quote_number FROM quotes WHERE id = ?').get(req.params.id);
        const filename = quote ? `SSTechGroup-Quote-${quote.quote_number}.pdf` : `SSTechGroup-Quote-${req.params.id}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        doc.pipe(res);
    }
    catch (err) {
        res.status(404).json({ error: err.message || 'Quotation not found.' });
    }
});
router.delete('/:id', (req, res) => {
    const quote = db.prepare('SELECT id, quote_number, client_id, converted_to_invoice_id FROM quotes WHERE id = ?').get(req.params.id);
    if (!quote) {
        res.status(404).json({ error: 'Quotation not found.' });
        return;
    }
    const deleteTransaction = db.transaction(() => {
        // 1. Delete items
        db.prepare('DELETE FROM quote_items WHERE quote_id = ?').run(quote.id);
        // 2. Unlink follow-ups
        db.prepare('UPDATE follow_ups SET quote_id = NULL WHERE quote_id = ?').run(quote.id);
        // 3. Unlink invoice if attached
        if (quote.converted_to_invoice_id) {
            db.prepare('UPDATE invoices SET quote_id = NULL WHERE id = ?').run(quote.converted_to_invoice_id);
        }
        // 4. Delete quote
        db.prepare('DELETE FROM quotes WHERE id = ?').run(quote.id);
    });
    deleteTransaction();
    recordAuditLog({
        adminId: req.admin?.id,
        adminName: req.admin?.fullName || 'Admin',
        action: 'DELETE_QUOTE',
        entityType: 'QUOTE',
        entityId: quote.id,
        details: `Deleted quotation ${quote.quote_number}`,
        ipAddress: req.ip,
    });
    res.json({ message: `Quotation ${quote.quote_number} deleted successfully.` });
});
router.get('/:id/send-history', (req, res) => {
    const quote = db.prepare('SELECT id, quote_number, status, updated_at FROM quotes WHERE id = ?').get(req.params.id);
    if (!quote) {
        res.status(404).json({ error: 'Quotation not found.' });
        return;
    }
    const sends = db.prepare(`
    SELECT id, admin_name, details, created_at
    FROM audit_logs
    WHERE entity_type = 'QUOTE' AND entity_id = ? AND action = 'EMAIL_QUOTE'
    ORDER BY created_at DESC
  `).all(quote.id);
    res.json({
        quote_number: quote.quote_number,
        status: quote.status,
        sends,
        has_been_sent: quote.status === 'Sent' || quote.status === 'Accepted' || sends.length > 0,
    });
});
router.post('/:id/send-email', async (req, res) => {
    try {
        const { recipient_email, subject, custom_message, confirm_resend } = req.body;
        const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
        if (!quote) {
            res.status(404).json({ error: 'Quotation not found.' });
            return;
        }
        // Check if previously sent
        const priorSends = db.prepare(`
      SELECT created_at, details FROM audit_logs
      WHERE entity_type = 'QUOTE' AND entity_id = ? AND action = 'EMAIL_QUOTE'
      ORDER BY created_at DESC
    `).all(quote.id);
        const hasBeenSent = quote.status === 'Sent' || quote.status === 'Accepted' || priorSends.length > 0;
        if (hasBeenSent && !confirm_resend) {
            const lastSentTime = priorSends[0]?.created_at || quote.updated_at;
            res.status(409).json({
                error: `This quotation was already sent previously (Last sent: ${lastSentTime}). Please confirm re-sending.`,
                requiresConfirmation: true,
                lastSentAt: lastSentTime,
                sentCount: priorSends.length,
            });
            return;
        }
        const result = await sendQuoteEmail({
            quoteId: Number(req.params.id),
            recipientEmail: recipient_email,
            subject,
            customMessage: custom_message,
            adminName: req.admin?.fullName || 'Admin',
            reqIp: req.ip,
        });
        res.json({ message: `Quotation emailed successfully to ${result.recipient}`, ...result });
    }
    catch (err) {
        res.status(400).json({ error: err.message || 'Failed to email quotation.' });
    }
});
export default router;
