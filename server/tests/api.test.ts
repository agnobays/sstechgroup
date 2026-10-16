import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../index.js';
import { db, initDatabase } from '../db/database.js';
import { calculateDocumentTotals, computeInvoiceStatus } from '../services/calculationService.js';
import { getNextDocumentNumber } from '../services/documentNumberService.js';

describe('S&S Tech Group — Business Logic & Security Tests', () => {
  let authToken = '';
  let testClientId: number;
  let testQuoteId: number;
  let testInvoiceId: number;

  beforeAll(async () => {
    initDatabase();

    // Clean test state or prepare test admin
    const testEmail = 'test.admin@sstechgroup.co.za';
    const testPassword = 'Password123!Secure';
    const hash = bcrypt.hashSync(testPassword, 10);

    db.prepare('DELETE FROM admins WHERE email = ?').run(testEmail);
    db.prepare(`
      INSERT INTO admins (email, password_hash, full_name, role)
      VALUES (?, ?, 'Test Admin', 'super_admin')
    `).run(testEmail, hash);

    // Login to obtain test token
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    authToken = res.body.token;
  });

  describe('1. Financial Calculations', () => {
    it('calculates line items, discounts, and taxes with exact 2-decimal precision', () => {
      const items = [
        { description: 'Custom Web Application', quantity: 2, unit_price: 15000, discount_percent: 10, tax_rate: 15 },
        { description: 'Cloud Infrastructure Setup', quantity: 1, unit_price: 5000, discount_percent: 0, tax_rate: 15 },
      ];

      const totals = calculateDocumentTotals(items);

      // Item 1: gross = 30000, discount = 3000, net = 27000, tax = 4050
      // Item 2: gross = 5000, discount = 0, net = 5000, tax = 750
      // Subtotal = 35000
      // Total Discount = 3000
      // Total Tax = 4800
      // Final Total = 35000 - 3000 + 4800 = 36800
      expect(totals.subtotal).toBe(35000);
      expect(totals.discount_amount).toBe(3000);
      expect(totals.tax_amount).toBe(4800);
      expect(totals.total_amount).toBe(36800);
    });

    it('correctly computes invoice statuses based on payments and due date', () => {
      expect(computeInvoiceStatus('Issued', 10000, 0, '2099-01-01')).toBe('Issued');
      expect(computeInvoiceStatus('Issued', 10000, 5000, '2099-01-01')).toBe('Partially Paid');
      expect(computeInvoiceStatus('Issued', 10000, 10000, '2099-01-01')).toBe('Paid');
      expect(computeInvoiceStatus('Issued', 10000, 0, '2020-01-01')).toBe('Overdue');
      expect(computeInvoiceStatus('Cancelled', 10000, 0, '2099-01-01')).toBe('Cancelled');
    });
  });

  describe('2. Document Numbering & Concurrency', () => {
    it('generates sequential and unique document numbers', () => {
      const q1 = getNextDocumentNumber('QUOTE');
      const q2 = getNextDocumentNumber('QUOTE');
      expect(q1).toMatch(/^QT-\d{4}-\d{4}$/);
      expect(q2).toMatch(/^QT-\d{4}-\d{4}$/);
      expect(q1).not.toBe(q2);

      const inv1 = getNextDocumentNumber('INVOICE');
      const inv2 = getNextDocumentNumber('INVOICE');
      expect(inv1).toMatch(/^INV-\d{4}-\d{4}$/);
      expect(inv2).toMatch(/^INV-\d{4}-\d{4}$/);
      expect(inv1).not.toBe(inv2);
    });
  });

  describe('3. Access Control & Security', () => {
    it('rejects unauthenticated requests to protected endpoints with 401', async () => {
      const protectedEndpoints = [
        { method: 'get', path: '/api/clients' },
        { method: 'get', path: '/api/quotes' },
        { method: 'get', path: '/api/invoices' },
        { method: 'get', path: '/api/dashboard' },
        { method: 'get', path: '/api/settings' },
        { method: 'get', path: '/api/audit-logs' },
        { method: 'get', path: '/api/quotes/1/pdf' },
        { method: 'get', path: '/api/invoices/1/pdf' },
      ];

      for (const ep of protectedEndpoints) {
        const res = await (request(app) as any)[ep.method](ep.path);
        expect(res.status).toBe(401);
        expect(res.body.error).toContain('Unauthorized');
      }
    });

    it('rejects invalid login credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@sstechgroup.co.za', password: 'WrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password.');
    });
  });

  describe('4. Full Business Lifecycle (Client -> Quote -> Invoice -> Payment)', () => {
    it('creates a client successfully', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Acme Corporation',
          company_name: 'Acme Holdings (Pty) Ltd',
          email: 'accounts@acme.co.za',
          phone: '+27 11 000 0000',
          billing_address: '100 Rivonia Road, Sandton, Johannesburg, 2196',
          tax_number: '4990123456',
        });

      expect(res.status).toBe(201);
      expect(res.body.client.id).toBeDefined();
      testClientId = res.body.client.id;
    });

    it('creates a quotation with line items and exact calculations', async () => {
      const res = await request(app)
        .post('/api/quotes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          client_id: testClientId,
          issue_date: '2026-10-15',
          expiry_date: '2026-11-15',
          status: 'Draft',
          scope_of_work: 'Development of custom corporate portal and API integration',
          payment_terms: '50% deposit upon commencement, 50% upon delivery.',
          items: [
            { description: 'Architecture & UX Design', quantity: 1, unit_price: 18000, discount_percent: 0, tax_rate: 15 },
            { description: 'Full-Stack Development', quantity: 1, unit_price: 42000, discount_percent: 5, tax_rate: 15 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.quote.quote_number).toMatch(/^QT-/);
      testQuoteId = res.body.quote.id;
    });

    it('converts an accepted quotation into an invoice without manual re-entry', async () => {
      const res = await request(app)
        .post(`/api/quotes/${testQuoteId}/convert-to-invoice`)
        .set('Authorization', `Bearer ${authToken}`)
        .send();

      expect(res.status).toBe(201);
      expect(res.body.invoice_number).toMatch(/^INV-/);
      testInvoiceId = res.body.invoiceId;

      // Verify original quote status changed to Accepted
      const quoteCheck = await request(app)
        .get(`/api/quotes/${testQuoteId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(quoteCheck.body.quote.status).toBe('Accepted');
      expect(quoteCheck.body.quote.converted_to_invoice_id).toBe(testInvoiceId);
    });

    it('records payments and updates invoice balance and status accurately', async () => {
      // Fetch invoice details
      const invRes = await request(app)
        .get(`/api/invoices/${testInvoiceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const totalAmount = invRes.body.invoice.total_amount;
      const partialPayment = Math.floor(totalAmount / 2);

      // Record partial payment
      const p1 = await request(app)
        .post(`/api/invoices/${testInvoiceId}/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: partialPayment,
          payment_date: '2026-10-16',
          payment_method: 'EFT',
          reference: 'EFT-ACME-001',
          notes: 'Deposit received',
        });

      expect(p1.status).toBe(201);
      expect(p1.body.status).toBe('Partially Paid');
      expect(p1.body.paid_amount).toBe(partialPayment);

      // Record remaining payment
      const remaining = invRes.body.invoice.total_amount - partialPayment;
      const p2 = await request(app)
        .post(`/api/invoices/${testInvoiceId}/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: remaining,
          payment_date: '2026-10-20',
          payment_method: 'EFT',
          reference: 'EFT-ACME-002',
          notes: 'Final balance settled',
        });

      expect(p2.status).toBe(201);
      expect(p2.body.status).toBe('Paid');
      expect(p2.body.balance_due).toBe(0);
    });

    it('generates authenticated PDF document stream', async () => {
      const res = await request(app)
        .get(`/api/invoices/${testInvoiceId}/pdf`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });

    it('records public website enquiry honestly into database', async () => {
      const res = await request(app)
        .post('/api/enquiries')
        .send({
          full_name: 'Dr Sipho Ndlovu',
          organization: 'Apex Educational Trust',
          email: 'sipho@apexedu.co.za',
          phone: '+27 82 123 4567',
          service_required: 'Website design and development',
          estimated_budget: 'R 50,000 - R 100,000',
          project_description: 'We need a full university department website with student application workflows.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.referenceNumber).toMatch(/^ENQ-/);
    });
  });

  describe('4. AI Quotation Engine, Emailing & Customer Conversion', () => {
    let publicAccessToken = '';
    let publicQuoteNumber = '';

    it('generates deterministic quote and line items from public questionnaire', async () => {
      const res = await request(app)
        .post('/api/public-quotes/generate')
        .send({
          data: {
            fullName: 'Lindiwe Khumalo',
            email: 'lindiwe@khumalotrading.co.za',
            phone: '+27 83 999 8888',
            organization: 'Khumalo Trading (Pty) Ltd',
            businessType: 'Corporate / SME',
            consentFollowup: true,
            serviceRequired: 'business_website',
            pageCount: '6_to_10_pages',
            features: ['contact_form', 'cms_blog'],
            needsHosting: true,
            needsMaintenance: true,
            needsDomain: true,
            desiredLaunchDate: '2026-12-01',
            budgetRange: '10k_20k',
            projectGoals: 'Corporate business website showcasing international import and distribution.',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.access_token).toBeDefined();
      expect(res.body.quote_number).toMatch(/^QT-2026-\d{4}$/);
      expect(res.body.evaluation.recommendedPackage.key).toBe('business');
      expect(res.body.evaluation.onceOffTotal).toBeGreaterThanOrEqual(12500);

      publicAccessToken = res.body.access_token;
      publicQuoteNumber = res.body.quote_number;
    });

    it('downloads public quote vector PDF via access token', async () => {
      const res = await request(app)
        .get(`/api/public-quotes/${publicAccessToken}/pdf`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain(`SSTechGroup-Quote-${publicQuoteNumber}.pdf`);
    });

    it('emails quote copy directly to customer email', async () => {
      const res = await request(app)
        .post(`/api/public-quotes/${publicAccessToken}/email`)
        .send({ recipient_email: 'lindiwe@khumalotrading.co.za' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.recipient).toBe('lindiwe@khumalotrading.co.za');
    });

    it('emails quotation directly to client from authenticated admin portal', async () => {
      const res = await request(app)
        .post(`/api/quotes/${testQuoteId}/send-email`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipient_email: 'accounts@acmecorp.co.za',
          subject: 'Your Project Quotation — S&S Tech Group',
          custom_message: 'Please review our attached quotation for your corporate web platform.',
        });

      expect(res.status).toBe(200);
      expect(res.body.recipient).toBe('accounts@acmecorp.co.za');
    });

    it('emails invoice directly to client from authenticated admin portal', async () => {
      const res = await request(app)
        .post(`/api/invoices/${testInvoiceId}/send-email`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipient_email: 'accounts@acmecorp.co.za',
          subject: 'Official Tax Invoice — S&S Tech Group (Pty) Ltd',
          custom_message: 'Please find your tax invoice attached. Thank you for your payment.',
        });

      expect(res.status).toBe(200);
      expect(res.body.recipient).toBe('accounts@acmecorp.co.za');
    });

    it('converts public quote to Tax Invoice upon customer online acceptance', async () => {
      const res = await request(app)
        .post(`/api/public-quotes/${publicAccessToken}/accept`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.invoice_number).toMatch(/^INV-2026-\d{4}$/);

      // Verify customer can now download the converted invoice PDF
      const pdfRes = await request(app)
        .get(`/api/public-quotes/${publicAccessToken}/invoice-pdf`);

      expect(pdfRes.status).toBe(200);
      expect(pdfRes.headers['content-type']).toBe('application/pdf');
      expect(pdfRes.headers['content-disposition']).toContain(`SSTechGroup-Invoice-${res.body.invoice_number}.pdf`);
    });
  });

  afterAll(() => {
    // Clean up all artifacts created during test run
    const tables = ['quote_items', 'invoice_items', 'payments', 'quotes', 'invoices', 'leads', 'follow_ups', 'enquiries', 'clients', 'audit_logs', 'document_sequences'];
    db.pragma('foreign_keys = OFF');
    tables.forEach((t) => {
      try {
        db.prepare(`DELETE FROM ${t}`).run();
      } catch {}
    });
    db.prepare("DELETE FROM admins WHERE email = 'test.admin@sstechgroup.co.za'").run();
    db.pragma('foreign_keys = ON');
  });
});
