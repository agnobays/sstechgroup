import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { calculateDocumentTotals, computeInvoiceStatus, roundMoney } from '../services/calculationService.js';
import { getNextDocumentNumber } from '../services/documentNumberService.js';
import { generateInvoicePDF } from '../services/pdfService.js';
import { recordAuditLog } from '../services/auditService.js';
import { sendInvoiceEmail } from '../services/emailService.js';

const router = Router();
router.use(requireAuth);

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Item description is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unit_price: z.number().min(0, 'Unit price cannot be negative'),
  discount_percent: z.number().min(0).max(100).optional().default(0),
  tax_rate: z.number().min(0).optional().default(0),
});

const invoiceSchema = z.object({
  client_id: z.number().int().positive('Client is required'),
  quote_id: z.number().int().positive().optional().nullable(),
  issue_date: z.string().min(1, 'Issue date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  status: z.enum(['Draft', 'Issued', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled']).default('Draft'),
  notes: z.string().optional().default(''),
  payment_terms: z.string().optional().default(''),
  items: z.array(invoiceItemSchema).min(1, 'At least one line item is required'),
});

const paymentSchema = z.object({
  amount: z.number().positive('Payment amount must be greater than zero'),
  payment_date: z.string().min(1, 'Payment date is required'),
  payment_method: z.enum(['EFT', 'Card', 'Bank Deposit', 'Other']),
  reference: z.string().min(1, 'Payment reference is required'),
  notes: z.string().optional().default(''),
});

router.get('/', (req: Request, res: Response) => {
  const search = req.query.search ? String(req.query.search).trim() : '';
  const status = req.query.status ? String(req.query.status).trim() : '';
  const clientId = req.query.client_id ? Number(req.query.client_id) : null;
  const includeArchived = req.query.include_archived === 'true';

  let query = `
    SELECT i.*, c.name as client_name, c.company_name as client_company
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (!includeArchived) {
    query += ' AND i.is_archived = 0';
  }

  if (status) {
    query += ' AND i.status = ?';
    params.push(status);
  }

  if (clientId) {
    query += ' AND i.client_id = ?';
    params.push(clientId);
  }

  if (search) {
    query += ' AND (i.invoice_number LIKE ? OR c.name LIKE ? OR c.company_name LIKE ?)';
    const pattern = `%${search}%`;
    params.push(pattern, pattern, pattern);
  }

  query += ' ORDER BY i.created_at DESC';

  const invoices = db.prepare(query).all(...params);
  res.json({ invoices });
});

router.get('/:id', (req: Request, res: Response) => {
  const invoice = db.prepare(`
    SELECT i.*, c.name as client_name, c.company_name as client_company,
           c.email as client_email, c.phone as client_phone,
           c.billing_address as client_address, c.tax_number as client_tax
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    WHERE i.id = ?
  `).get(req.params.id) as any;

  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found.' });
    return;
  }

  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order ASC, id ASC').all(req.params.id);
  const payments = db.prepare('SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date DESC, id DESC').all(req.params.id);

  res.json({ invoice, items, payments });
});

router.post('/', (req: Request, res: Response) => {
  const result = invoiceSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.errors[0].message });
    return;
  }

  const data = result.data;
  const client = db.prepare('SELECT id, name FROM clients WHERE id = ?').get(data.client_id) as any;
  if (!client) {
    res.status(400).json({ error: 'Selected client does not exist.' });
    return;
  }

  const totals = calculateDocumentTotals(data.items);
  const invoiceNumber = getNextDocumentNumber('INVOICE');

  const createTransaction = db.transaction(() => {
    const insertInvoice = db.prepare(`
      INSERT INTO invoices (
        invoice_number, quote_id, client_id, issue_date, due_date, status,
        notes, payment_terms, subtotal, discount_amount, tax_amount, total_amount,
        paid_amount, balance_due, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      invoiceNumber,
      data.quote_id || null,
      data.client_id,
      data.issue_date,
      data.due_date,
      data.status,
      data.notes,
      data.payment_terms,
      totals.subtotal,
      totals.discount_amount,
      totals.tax_amount,
      totals.total_amount,
      totals.total_amount,
      req.admin?.fullName || 'Admin'
    );

    const invoiceId = insertInvoice.lastInsertRowid;

    const insertItem = db.prepare(`
      INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, discount_percent, tax_rate, line_total, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    totals.items.forEach((item, index) => {
      insertItem.run(
        invoiceId,
        item.description,
        item.quantity,
        item.unit_price,
        item.discount_percent,
        item.tax_rate,
        item.line_total,
        index
      );
    });

    return invoiceId;
  });

  const invoiceId = createTransaction();

  recordAuditLog({
    adminId: req.admin?.id,
    adminName: req.admin?.fullName || 'Admin',
    action: 'CREATE_INVOICE',
    entityType: 'INVOICE',
    entityId: Number(invoiceId),
    details: `Created invoice ${invoiceNumber} for client ${client.name} (Total: R ${totals.total_amount.toFixed(2)})`,
    ipAddress: req.ip,
  });

  const createdInvoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(invoiceId);

  res.status(201).json({ message: 'Invoice created successfully', invoice: createdInvoice, items });
});

router.put('/:id', (req: Request, res: Response) => {
  const result = invoiceSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.errors[0].message });
    return;
  }

  const existingInvoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id) as any;
  if (!existingInvoice) {
    res.status(404).json({ error: 'Invoice not found.' });
    return;
  }

  const data = result.data;
  const totals = calculateDocumentTotals(data.items);
  const balanceDue = roundMoney(Math.max(0, totals.total_amount - existingInvoice.paid_amount));
  const newStatus = computeInvoiceStatus(data.status, totals.total_amount, existingInvoice.paid_amount, data.due_date);

  const updateTransaction = db.transaction(() => {
    db.prepare(`
      UPDATE invoices
      SET client_id = ?, issue_date = ?, due_date = ?, status = ?,
          notes = ?, payment_terms = ?,
          subtotal = ?, discount_amount = ?, tax_amount = ?, total_amount = ?,
          balance_due = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.client_id,
      data.issue_date,
      data.due_date,
      newStatus,
      data.notes,
      data.payment_terms,
      totals.subtotal,
      totals.discount_amount,
      totals.tax_amount,
      totals.total_amount,
      balanceDue,
      req.params.id
    );

    db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(req.params.id);

    const insertItem = db.prepare(`
      INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, discount_percent, tax_rate, line_total, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    totals.items.forEach((item, index) => {
      insertItem.run(
        req.params.id,
        item.description,
        item.quantity,
        item.unit_price,
        item.discount_percent,
        item.tax_rate,
        item.line_total,
        index
      );
    });
  });

  updateTransaction();

  recordAuditLog({
    adminId: req.admin?.id,
    adminName: req.admin?.fullName || 'Admin',
    action: 'UPDATE_INVOICE',
    entityType: 'INVOICE',
    entityId: req.params.id,
    details: `Updated invoice ${existingInvoice.invoice_number} (New Total: R ${totals.total_amount.toFixed(2)}, Balance: R ${balanceDue.toFixed(2)})`,
    ipAddress: req.ip,
  });

  res.json({ message: 'Invoice updated successfully' });
});

router.post('/:id/payments', (req: Request, res: Response) => {
  const result = paymentSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.errors[0].message });
    return;
  }

  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id) as any;
  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found.' });
    return;
  }

  if (invoice.status === 'Cancelled') {
    res.status(400).json({ error: 'Cannot record payment on a cancelled invoice.' });
    return;
  }

  const paymentData = result.data;
  const newPaymentAmount = roundMoney(paymentData.amount);

  const paymentTransaction = db.transaction(() => {
    db.prepare(`
      INSERT INTO payments (invoice_id, amount, payment_date, payment_method, reference, notes, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      invoice.id,
      newPaymentAmount,
      paymentData.payment_date,
      paymentData.payment_method,
      paymentData.reference,
      paymentData.notes,
      req.admin?.fullName || 'Admin'
    );

    const totalPaidRow = db.prepare('SELECT SUM(amount) as total_paid FROM payments WHERE invoice_id = ?').get(invoice.id) as any;
    const totalPaid = roundMoney(totalPaidRow?.total_paid || 0);
    const balanceDue = roundMoney(Math.max(0, invoice.total_amount - totalPaid));
    const newStatus = computeInvoiceStatus(invoice.status, invoice.total_amount, totalPaid, invoice.due_date);

    db.prepare(`
      UPDATE invoices
      SET paid_amount = ?, balance_due = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(totalPaid, balanceDue, newStatus, invoice.id);

    return { totalPaid, balanceDue, newStatus };
  });

  const updatedStats = paymentTransaction();

  recordAuditLog({
    adminId: req.admin?.id,
    adminName: req.admin?.fullName || 'Admin',
    action: 'RECORD_PAYMENT',
    entityType: 'PAYMENT',
    entityId: invoice.id,
    details: `Recorded payment of R ${newPaymentAmount.toFixed(2)} (${paymentData.payment_method}, Ref: ${paymentData.reference}) on invoice ${invoice.invoice_number}. New status: ${updatedStats.newStatus}`,
    ipAddress: req.ip,
  });

  res.status(201).json({
    message: 'Payment recorded successfully',
    paid_amount: updatedStats.totalPaid,
    balance_due: updatedStats.balanceDue,
    status: updatedStats.newStatus,
  });
});

router.patch('/:id/status', (req: Request, res: Response) => {
  const statusSchema = z.object({
    status: z.enum(['Draft', 'Issued', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled']),
  });

  const result = statusSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id) as any;
  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found.' });
    return;
  }

  // Guardrail: Do not mark an invoice as paid unless a valid payment record supports that status
  if (result.data.status === 'Paid') {
    const paymentCheck = db.prepare('SELECT SUM(amount) as total_paid FROM payments WHERE invoice_id = ?').get(invoice.id) as any;
    const totalPaid = roundMoney(paymentCheck?.total_paid || 0);
    if (totalPaid < invoice.total_amount) {
      res.status(400).json({
        error: `Cannot mark invoice as Paid. Outstanding balance is R ${(invoice.total_amount - totalPaid).toFixed(2)}. Please record the payment first.`,
      });
      return;
    }
  }

  db.prepare('UPDATE invoices SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(result.data.status, req.params.id);

  recordAuditLog({
    adminId: req.admin?.id,
    adminName: req.admin?.fullName || 'Admin',
    action: 'STATUS_CHANGE_INVOICE',
    entityType: 'INVOICE',
    entityId: req.params.id,
    details: `Changed status of invoice ${invoice.invoice_number} from ${invoice.status} to ${result.data.status}`,
    ipAddress: req.ip,
  });

  res.json({ message: 'Status updated successfully', status: result.data.status });
});

router.get('/:id/pdf', (req: Request, res: Response) => {
  try {
    const doc = generateInvoicePDF(Number(req.params.id));
    const invoice = db.prepare('SELECT invoice_number FROM invoices WHERE id = ?').get(req.params.id) as any;
    const filename = invoice ? `SSTechGroup-Invoice-${invoice.invoice_number}.pdf` : `SSTechGroup-Invoice-${req.params.id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    doc.pipe(res);
  } catch (err: any) {
    res.status(404).json({ error: err.message || 'Invoice not found.' });
  }
});

router.post('/:id/send-email', async (req: Request, res: Response) => {
  try {
    const { recipient_email, subject, custom_message } = req.body;
    const result = await sendInvoiceEmail({
      invoiceId: Number(req.params.id),
      recipientEmail: recipient_email,
      subject,
      customMessage: custom_message,
      adminName: req.admin?.fullName || 'Admin',
      reqIp: req.ip,
    });
    res.json({ message: `Tax Invoice emailed successfully to ${result.recipient}`, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to email invoice.' });
  }
});

export default router;
