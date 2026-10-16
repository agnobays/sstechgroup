import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../db/database.js';
import { evaluateQuestionnaireAndCalculatePrice } from '../services/pricingEngine.js';
import { getNextDocumentNumber } from '../services/documentNumberService.js';
import { generateQuotePDF, generateInvoicePDF } from '../services/pdfService.js';
import { recordAuditLog } from '../services/auditService.js';
import { sendPublicQuoteCopyEmail, sendInvoiceEmail } from '../services/emailService.js';
const router = Router();
// 1. Generate or update persistent quote from questionnaire data
router.post('/generate', (req, res) => {
    const { session_token, data } = req.body;
    if (!data.fullName?.trim() || !data.email?.trim() || !data.email.includes('@')) {
        res.status(400).json({ error: 'Full name and a valid email address are required to generate an official quotation.' });
        return;
    }
    // 1. Evaluate pricing deterministically
    const evaluation = evaluateQuestionnaireAndCalculatePrice(data);
    // 2. Locate or create client record
    let client = db.prepare('SELECT id, name FROM clients WHERE email = ?').get(data.email.trim().toLowerCase());
    if (!client) {
        const insertClient = db.prepare(`
      INSERT INTO clients (name, company_name, email, phone, billing_address, notes)
      VALUES (?, ?, ?, ?, '', ?)
    `).run(data.fullName.trim(), data.organization?.trim() || '', data.email.trim().toLowerCase(), data.phone?.trim() || '', `Lead from AI Quotation Assistant. Service: ${data.serviceRequired}`);
        client = { id: insertClient.lastInsertRowid, name: data.fullName };
    }
    // 3. Find associated lead if session token provided
    let leadId = null;
    if (session_token) {
        const lead = db.prepare('SELECT id FROM leads WHERE session_token = ?').get(session_token);
        if (lead) {
            leadId = lead.id;
            db.prepare(`
        UPDATE leads
        SET full_name = ?, email = ?, phone = ?, organization = ?, service_required = ?,
            status = 'Completed', recommended_package_id = ?, estimated_value = ?,
            last_activity_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(data.fullName, data.email.toLowerCase(), data.phone || '', data.organization || '', data.serviceRequired, evaluation.recommendedPackage.id, evaluation.onceOffTotal, lead.id);
        }
    }
    // 4. Generate unique access token & atomic quote number
    const accessToken = crypto.randomBytes(24).toString('hex');
    const quoteNumber = getNextDocumentNumber('QUOTE');
    const today = new Date().toISOString().split('T')[0];
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    const expiryStr = expiryDate.toISOString().split('T')[0];
    const transaction = db.transaction(() => {
        const insertQuote = db.prepare(`
      INSERT INTO quotes (
        quote_number, client_id, lead_id, package_id, access_token,
        issue_date, expiry_date, status, scope_of_work, notes, payment_terms,
        subtotal, discount_amount, tax_amount, total_amount,
        recurring_monthly, recurring_annual, ai_recommendation_notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'AI Quotation Engine')
    `).run(quoteNumber, client.id, leadId, evaluation.recommendedPackage.id, accessToken, today, expiryStr, evaluation.status, evaluation.reasoning, evaluation.assumptions.join('\n'), '50% deposit upon commencement, 50% upon delivery.', evaluation.onceOffSubtotal, 0, 0, evaluation.onceOffTotal, evaluation.recurringMonthly, evaluation.recurringAnnual, evaluation.reasoning);
        const quoteId = insertQuote.lastInsertRowid;
        // Insert line items
        const insertItem = db.prepare(`
      INSERT INTO quote_items (quote_id, description, quantity, unit_price, discount_percent, tax_rate, line_total, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        evaluation.lineItems.forEach((item, idx) => {
            insertItem.run(quoteId, item.description, item.quantity, item.unit_price, item.discount_percent, item.tax_rate, item.line_total, idx);
        });
        return quoteId;
    });
    const quoteId = transaction();
    recordAuditLog({
        adminName: 'AI Quotation Engine',
        action: 'GENERATE_PUBLIC_QUOTE',
        entityType: 'QUOTE',
        entityId: Number(quoteId),
        details: `Generated quote ${quoteNumber} for ${data.fullName} (Total: R ${evaluation.onceOffTotal.toFixed(2)}, Package: ${evaluation.recommendedPackage.name})`,
        ipAddress: req.ip,
    });
    res.status(201).json({
        success: true,
        access_token: accessToken,
        quote_number: quoteNumber,
        status: evaluation.status,
        evaluation,
    });
});
// 2. Lookup existing quote by Reference Number (QT-YYYY-XXXX) or Email address
router.post('/lookup', (req, res) => {
    const query = req.body.query ? String(req.body.query).trim() : '';
    if (!query || query.length < 3) {
        res.status(400).json({ error: 'Please enter a valid Quotation Reference Number (e.g. QT-2026-0001) or Email address.' });
        return;
    }
    // Check if reference number (case-insensitive) or email
    const quotes = db.prepare(`
    SELECT q.id, q.quote_number, q.access_token, q.status, q.issue_date, q.expiry_date,
           q.total_amount, q.recurring_monthly, q.recurring_annual,
           q.converted_to_invoice_id,
           c.name as client_name, c.company_name as client_company, c.email as client_email,
           p.name as package_name
    FROM quotes q
    JOIN clients c ON q.client_id = c.id
    LEFT JOIN packages p ON q.package_id = p.id
    WHERE LOWER(q.quote_number) = LOWER(?)
       OR LOWER(c.email) = LOWER(?)
    ORDER BY q.id DESC
  `).all(query, query);
    if (!quotes || quotes.length === 0) {
        res.status(404).json({
            error: `No quotation found matching "${query}". Please verify your quotation reference or email.`,
        });
        return;
    }
    res.json({
        success: true,
        count: quotes.length,
        quotes,
    });
});
// 3. View quote by access token
router.get('/:accessToken', (req, res) => {
    const quote = db.prepare(`
    SELECT q.*, c.name as client_name, c.company_name as client_company,
           c.email as client_email, c.phone as client_phone,
           p.name as package_name, p.description as package_description
    FROM quotes q
    JOIN clients c ON q.client_id = c.id
    LEFT JOIN packages p ON q.package_id = p.id
    WHERE q.access_token = ?
  `).get(req.params.accessToken);
    if (!quote) {
        res.status(404).json({ error: 'Quotation not found or link has expired.' });
        return;
    }
    const items = db.prepare('SELECT * FROM quote_items WHERE quote_id = ? ORDER BY sort_order ASC, id ASC').all(quote.id);
    const invoice = quote.converted_to_invoice_id
        ? db.prepare('SELECT id, invoice_number, status, total_amount, paid_amount, balance_due FROM invoices WHERE id = ?').get(quote.converted_to_invoice_id)
        : null;
    res.json({
        quote,
        items,
        invoice,
    });
});
// 3. Customer explicitly accepts quote -> transactional invoice generation
router.post('/:accessToken/accept', (req, res) => {
    const quote = db.prepare(`
    SELECT q.*, c.name as client_name, c.email as client_email
    FROM quotes q
    JOIN clients c ON q.client_id = c.id
    WHERE q.access_token = ?
  `).get(req.params.accessToken);
    if (!quote) {
        res.status(404).json({ error: 'Quotation not found.' });
        return;
    }
    if (quote.status === 'Accepted' || quote.converted_to_invoice_id) {
        res.status(400).json({ error: 'This quotation has already been accepted and confirmed.' });
        return;
    }
    if (quote.status === 'Expired' || quote.status === 'Rejected') {
        res.status(400).json({ error: `Cannot accept quotation with status: ${quote.status}. Please request a renewed quote.` });
        return;
    }
    const items = db.prepare('SELECT * FROM quote_items WHERE quote_id = ?').all(quote.id);
    const invoiceNumber = getNextDocumentNumber('INVOICE');
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    const dueDateStr = dueDate.toISOString().split('T')[0];
    const transaction = db.transaction(() => {
        // 1. Create Tax Invoice
        const insertInvoice = db.prepare(`
      INSERT INTO invoices (
        invoice_number, quote_id, client_id, issue_date, due_date, status,
        notes, payment_terms, subtotal, discount_amount, tax_amount, total_amount,
        paid_amount, balance_due, created_by
      ) VALUES (?, ?, ?, ?, ?, 'Issued', ?, ?, ?, ?, ?, ?, 0, ?, 'Customer Acceptance')
    `).run(invoiceNumber, quote.id, quote.client_id, today, dueDateStr, `Generated upon online customer acceptance of Quote ${quote.quote_number}.`, quote.payment_terms || 'Payment due within 14 days of invoice date.', quote.subtotal, quote.discount_amount, quote.tax_amount, quote.total_amount, quote.total_amount);
        const invoiceId = insertInvoice.lastInsertRowid;
        // 2. Insert invoice items
        const insertItem = db.prepare(`
      INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, discount_percent, tax_rate, line_total, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        items.forEach((item, idx) => {
            insertItem.run(invoiceId, item.description, item.quantity, item.unit_price, item.discount_percent, item.tax_rate, item.line_total, idx);
        });
        // 3. Mark quote as Accepted and record timestamp, IP, and terms agreement
        db.prepare(`
      UPDATE quotes
      SET status = 'Accepted',
          accepted_at = CURRENT_TIMESTAMP,
          accepted_by_ip = ?,
          acceptance_terms_agreed = 1,
          converted_to_invoice_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.ip || 'online', invoiceId, quote.id);
        return { invoiceId, invoiceNumber };
    });
    const outcome = transaction();
    recordAuditLog({
        adminName: quote.client_name,
        action: 'CUSTOMER_ACCEPT_QUOTE',
        entityType: 'QUOTE',
        entityId: quote.id,
        details: `Customer accepted quote ${quote.quote_number}. Converted to Tax Invoice ${outcome.invoiceNumber} (Total: R ${quote.total_amount.toFixed(2)})`,
        ipAddress: req.ip,
    });
    // Automatically dispatch Tax Invoice PDF directly to the client's email
    let emailedInvoice = false;
    if (quote.client_email && quote.client_email.includes('@')) {
        sendInvoiceEmail({
            invoiceId: Number(outcome.invoiceId),
            recipientEmail: quote.client_email,
            adminName: 'Automated Billing System',
            customMessage: `Thank you for accepting quotation ${quote.quote_number}. Your official Tax Invoice ${outcome.invoiceNumber} has been generated and is attached below for your records and payment processing.`,
            reqIp: req.ip,
        })
            .then(() => {
            console.log(`[Invoice] Automatically emailed ${outcome.invoiceNumber} to ${quote.client_email}`);
        })
            .catch((err) => {
            console.warn(`[Invoice] Failed to auto-email ${outcome.invoiceNumber}:`, err.message);
        });
        emailedInvoice = true;
    }
    res.json({
        success: true,
        message: 'Quotation accepted successfully. Official Tax Invoice has been generated.',
        invoice_number: outcome.invoiceNumber,
        invoice_id: outcome.invoiceId,
        emailed_to: emailedInvoice ? quote.client_email : null,
    });
});
// 4. Request revision
router.post('/:accessToken/revise', (req, res) => {
    const { notes } = req.body;
    if (!notes || !notes.trim()) {
        res.status(400).json({ error: 'Please describe the revisions or scope adjustments you would like.' });
        return;
    }
    const quote = db.prepare('SELECT id, quote_number FROM quotes WHERE access_token = ?').get(req.params.accessToken);
    if (!quote) {
        res.status(404).json({ error: 'Quotation not found.' });
        return;
    }
    db.prepare(`
    UPDATE quotes
    SET status = 'Revision Requested',
        revision_notes = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(notes.trim(), quote.id);
    recordAuditLog({
        adminName: 'Customer',
        action: 'CUSTOMER_REQUEST_REVISION',
        entityType: 'QUOTE',
        entityId: quote.id,
        details: `Customer requested revision on ${quote.quote_number}: "${notes.trim().substring(0, 100)}"`,
        ipAddress: req.ip,
    });
    res.json({ success: true, message: 'Revision request recorded. An S&S Tech Group consultant will review and contact you.' });
});
// 5. Customer declines quote
router.post('/:accessToken/decline', (req, res) => {
    const quote = db.prepare('SELECT id, quote_number FROM quotes WHERE access_token = ?').get(req.params.accessToken);
    if (!quote) {
        res.status(404).json({ error: 'Quotation not found.' });
        return;
    }
    db.prepare(`
    UPDATE quotes
    SET status = 'Rejected', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(quote.id);
    recordAuditLog({
        adminName: 'Customer',
        action: 'CUSTOMER_DECLINE_QUOTE',
        entityType: 'QUOTE',
        entityId: quote.id,
        details: `Customer declined quote ${quote.quote_number}`,
        ipAddress: req.ip,
    });
    res.json({ success: true, message: 'Quotation status updated.' });
});
// 6. Download Quote PDF via access token
router.get('/:accessToken/pdf', (req, res) => {
    const quote = db.prepare('SELECT id, quote_number FROM quotes WHERE access_token = ?').get(req.params.accessToken);
    if (!quote) {
        res.status(404).json({ error: 'Quotation not found.' });
        return;
    }
    try {
        const doc = generateQuotePDF(quote.id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="SSTechGroup-Quote-${quote.quote_number}.pdf"`);
        doc.pipe(res);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to generate PDF.' });
    }
});
// 7. Download Invoice PDF via access token
router.get('/:accessToken/invoice-pdf', (req, res) => {
    const quote = db.prepare('SELECT converted_to_invoice_id FROM quotes WHERE access_token = ?').get(req.params.accessToken);
    if (!quote || !quote.converted_to_invoice_id) {
        res.status(404).json({ error: 'Invoice not found or quotation has not been converted yet.' });
        return;
    }
    try {
        const doc = generateInvoicePDF(quote.converted_to_invoice_id);
        const invoice = db.prepare('SELECT invoice_number FROM invoices WHERE id = ?').get(quote.converted_to_invoice_id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="SSTechGroup-Invoice-${invoice?.invoice_number || 'TaxInvoice'}.pdf"`);
        doc.pipe(res);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to generate invoice PDF.' });
    }
});
// 8. Email quote PDF copy to prospective client
router.post('/:accessToken/email', async (req, res) => {
    try {
        const { recipient_email } = req.body;
        const result = await sendPublicQuoteCopyEmail(req.params.accessToken, recipient_email);
        res.json({
            success: true,
            message: `Official quotation PDF has been dispatched to ${result.recipient}.`,
            quote_number: result.quoteNumber,
            recipient: result.recipient,
        });
    }
    catch (err) {
        res.status(400).json({ error: err.message || 'Failed to email quotation copy.' });
    }
});
export default router;
