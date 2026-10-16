import nodemailer, { Transporter } from 'nodemailer';
import { db } from '../db/database.js';
import { generateQuotePDFBuffer, generateInvoicePDFBuffer } from './pdfService.js';
import { recordAuditLog } from './auditService.js';

interface EmailSettings {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  from?: string;
  appUrl?: string;
}

function getEmailConfig(): EmailSettings {
  return {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'S&S Tech Group <quotes@sstechgroup.co.za>',
    appUrl: process.env.APP_URL || 'http://localhost:3000',
  };
}

let transporterInstance: Transporter | null = null;

async function getTransporter(): Promise<{ transporter: Transporter; isSimulated: boolean }> {
  const config = getEmailConfig();

  // If real SMTP credentials are provided, use them
  if (config.host && config.user && config.pass) {
    if (!transporterInstance) {
      transporterInstance = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.user,
          pass: config.pass,
        },
      });
    }
    return { transporter: transporterInstance, isSimulated: false };
  }

  // Fallback: Safe simulated stream transporter for development / test environments
  const simulatedTransporter = nodemailer.createTransport({
    streamTransport: true,
    newline: 'windows',
    buffer: true,
  });

  return { transporter: simulatedTransporter, isSimulated: true };
}

// Brand Email Wrapper
function wrapBrandedEmail(title: string, contentHtml: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #080808; color: #F7F7F5; }
        .wrapper { max-width: 600px; margin: 20px auto; background-color: #101010; border: 1px solid #262626; border-radius: 8px; overflow: hidden; }
        .header { background-color: #080808; padding: 24px 32px; border-bottom: 2px solid #D9AD32; text-align: left; }
        .logo-box { display: inline-block; width: 44px; height: 44px; background-color: #101010; border: 1px solid rgba(217, 173, 50, 0.4); text-align: center; line-height: 44px; color: #D9AD32; font-weight: bold; font-size: 16px; border-radius: 6px; vertical-align: middle; }
        .brand-title { display: inline-block; vertical-align: middle; margin-left: 14px; font-size: 18px; font-weight: 700; color: #F7F7F5; }
        .brand-sub { display: block; font-size: 10px; color: #D9AD32; text-transform: uppercase; letter-spacing: 1px; }
        .content { padding: 32px; font-size: 14px; line-height: 1.6; color: #C2C2BD; }
        .content h1, .content h2, .content h3 { color: #F7F7F5; margin-top: 0; }
        .meta-table { width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #080808; border-radius: 6px; border: 1px solid #262626; }
        .meta-table td { padding: 12px 16px; border-bottom: 1px solid #1a1a1a; font-size: 13px; }
        .meta-table td.label { color: #8A8A85; width: 40%; }
        .meta-table td.value { color: #F7F7F5; font-weight: 600; }
        .meta-table tr:last-child td { border-bottom: none; }
        .highlight-amount { font-size: 20px; color: #D9AD32; font-weight: 800; }
        .note-box { background-color: #181818; border-left: 3px solid #D9AD32; padding: 14px 18px; margin: 20px 0; border-radius: 0 6px 6px 0; color: #E0E0DE; font-size: 13px; font-style: italic; }
        .btn { display: inline-block; padding: 12px 24px; background-color: #D9AD32; color: #080808 !important; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 6px; margin: 16px 0; text-align: center; }
        .footer { background-color: #080808; padding: 24px 32px; border-top: 1px solid #262626; font-size: 11px; color: #7A7A75; text-align: center; line-height: 1.5; }
        .footer p { margin: 4px 0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <div class="logo-box">S&amp;S</div>
          <div class="brand-title">
            S&amp;S Tech Group
            <span class="brand-sub">Official Documentation</span>
          </div>
        </div>
        <div class="content">
          ${contentHtml}
        </div>
        <div class="footer">
          <p><strong>S&amp;S Tech Group (Pty) Ltd</strong> | Reg: 2026/802170/07</p>
          <p>Durban &amp; Johannesburg, South Africa | info@sstechgroup.co.za | www.sstechgroup.co.za</p>
          <p style="margin-top: 8px;">Confidentiality Notice: This electronic communication and attached PDF document are intended solely for the recipient named above.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export interface SendQuoteEmailOptions {
  quoteId: number;
  recipientEmail: string;
  subject?: string;
  customMessage?: string;
  adminName?: string;
  reqIp?: string;
}

export async function sendQuoteEmail(options: SendQuoteEmailOptions): Promise<{
  success: boolean;
  quoteNumber: string;
  recipient: string;
  isSimulated: boolean;
}> {
  const quote = db.prepare(`
    SELECT q.*, c.name as client_name, c.company_name as client_company, c.email as client_email
    FROM quotes q
    JOIN clients c ON q.client_id = c.id
    WHERE q.id = ?
  `).get(options.quoteId) as any;

  if (!quote) {
    throw new Error('Quotation not found');
  }

  const recipient = options.recipientEmail.trim() || quote.client_email;
  if (!recipient || !recipient.includes('@')) {
    throw new Error('A valid recipient email address is required');
  }

  const pdfBuffer = await generateQuotePDFBuffer(options.quoteId);
  const config = getEmailConfig();
  const { transporter, isSimulated } = await getTransporter();

  const subject = options.subject?.trim() || `Quotation ${quote.quote_number} — S&S Tech Group (Pty) Ltd`;

  const viewUrl = quote.access_token
    ? `${config.appUrl}/get-a-quote?view=${quote.access_token}`
    : `${config.appUrl}/contact`;

  const customMessageHtml = options.customMessage?.trim()
    ? `<div class="note-box">${options.customMessage.trim().replace(/\n/g, '<br/>')}</div>`
    : '';

  const bodyHtml = `
    <h2>Dear ${quote.client_name},</h2>
    <p>Thank you for your interest in partnering with <strong>S&amp;S Tech Group (Pty) Ltd</strong>.</p>
    <p>Please find attached our official, itemised quotation <strong>${quote.quote_number}</strong> for your review.</p>
    
    ${customMessageHtml}

    <table class="meta-table">
      <tr>
        <td class="label">Quotation Number</td>
        <td class="value">${quote.quote_number}</td>
      </tr>
      <tr>
        <td class="label">Issue Date</td>
        <td class="value">${quote.issue_date}</td>
      </tr>
      <tr>
        <td class="label">Valid Until</td>
        <td class="value">${quote.expiry_date}</td>
      </tr>
      <tr>
        <td class="label">Total Amount</td>
        <td class="value highlight-amount">R ${quote.total_amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    </table>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${viewUrl}" class="btn">View &amp; Accept Online</a>
    </div>

    <p style="font-size: 12px; color: #8A8A85;">
      • The full itemised scope, deliverables, and payment terms are detailed in the attached PDF: <code>SSTechGroup-Quote-${quote.quote_number}.pdf</code>.<br/>
      • To accept or request scope modifications, simply reply to this email or click the button above.
    </p>

    <p style="margin-top: 24px;">
      Warm regards,<br/>
      <strong>S&amp;S Tech Group Team</strong>
    </p>
  `;

  const html = wrapBrandedEmail(subject, bodyHtml);

  await transporter.sendMail({
    from: config.from,
    to: recipient,
    subject,
    html,
    attachments: [
      {
        filename: `SSTechGroup-Quote-${quote.quote_number}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });

  // Automatically transition Draft to Sent
  if (quote.status === 'Draft') {
    db.prepare('UPDATE quotes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('Sent', quote.id);
  }

  recordAuditLog({
    adminName: options.adminName || 'Admin',
    action: 'EMAIL_QUOTE',
    entityType: 'QUOTE',
    entityId: quote.id,
    details: `Emailed quotation ${quote.quote_number} to ${recipient} (Simulated: ${isSimulated})`,
    ipAddress: options.reqIp,
  });

  return {
    success: true,
    quoteNumber: quote.quote_number,
    recipient,
    isSimulated,
  };
}

export interface SendInvoiceEmailOptions {
  invoiceId: number;
  recipientEmail: string;
  subject?: string;
  customMessage?: string;
  adminName?: string;
  reqIp?: string;
}

export async function sendInvoiceEmail(options: SendInvoiceEmailOptions): Promise<{
  success: boolean;
  invoiceNumber: string;
  recipient: string;
  isSimulated: boolean;
}> {
  const invoice = db.prepare(`
    SELECT i.*, c.name as client_name, c.company_name as client_company, c.email as client_email
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    WHERE i.id = ?
  `).get(options.invoiceId) as any;

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  const recipient = options.recipientEmail.trim() || invoice.client_email;
  if (!recipient || !recipient.includes('@')) {
    throw new Error('A valid recipient email address is required');
  }

  const settings = (db.prepare('SELECT * FROM company_settings WHERE id = 1').get() || {}) as any;
  const pdfBuffer = await generateInvoicePDFBuffer(options.invoiceId);
  const config = getEmailConfig();
  const { transporter, isSimulated } = await getTransporter();

  const subject = options.subject?.trim() || `Tax Invoice ${invoice.invoice_number} — S&S Tech Group (Pty) Ltd`;

  const customMessageHtml = options.customMessage?.trim()
    ? `<div class="note-box">${options.customMessage.trim().replace(/\n/g, '<br/>')}</div>`
    : '';

  const bodyHtml = `
    <h2>Dear ${invoice.client_name},</h2>
    <p>Please find attached official Tax Invoice <strong>${invoice.invoice_number}</strong> from <strong>S&amp;S Tech Group (Pty) Ltd</strong>.</p>
    
    ${customMessageHtml}

    <table class="meta-table">
      <tr>
        <td class="label">Invoice Number</td>
        <td class="value">${invoice.invoice_number}</td>
      </tr>
      <tr>
        <td class="label">Issue Date</td>
        <td class="value">${invoice.issue_date}</td>
      </tr>
      <tr>
        <td class="label">Payment Due Date</td>
        <td class="value">${invoice.due_date}</td>
      </tr>
      <tr>
        <td class="label">Total Invoiced</td>
        <td class="value">R ${invoice.total_amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td class="label">Balance Due</td>
        <td class="value highlight-amount">R ${invoice.balance_due.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    </table>

    <h3 style="color: #D9AD32; margin-top: 24px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Banking Details For Electronic Transfer (EFT):</h3>
    <table class="meta-table">
      <tr>
        <td class="label">Bank</td>
        <td class="value">${settings.bank_name || 'FNB'}</td>
      </tr>
      <tr>
        <td class="label">Account Name</td>
        <td class="value">${settings.bank_account_name || 'S&S Tech Group (Pty) Ltd'}</td>
      </tr>
      <tr>
        <td class="label">Account Number</td>
        <td class="value"><code>${settings.bank_account_number || '63169376134'}</code></td>
      </tr>
      <tr>
        <td class="label">Branch Code</td>
        <td class="value">${settings.bank_branch_code || '250655'}</td>
      </tr>
      <tr>
        <td class="label">Account Type</td>
        <td class="value">${settings.bank_account_type || 'Business Account'}</td>
      </tr>
      <tr>
        <td class="label">Payment Reference</td>
        <td class="value" style="color: #D9AD32; font-weight: bold;">${invoice.invoice_number}</td>
      </tr>
    </table>

    <p style="font-size: 12px; color: #8A8A85;">
      • Please use your invoice number <strong>${invoice.invoice_number}</strong> as the beneficiary reference for prompt payment allocation.<br/>
      • Email proof of payment (POP) to <code>${settings.email || 'accounts@sstechgroup.co.za'}</code>.<br/>
      • The full tax invoice is attached as a PDF: <code>SSTechGroup-Invoice-${invoice.invoice_number}.pdf</code>.
    </p>

    <p style="margin-top: 24px;">
      Kind regards,<br/>
      <strong>Accounts Department</strong><br/>
      S&amp;S Tech Group (Pty) Ltd
    </p>
  `;

  const html = wrapBrandedEmail(subject, bodyHtml);

  await transporter.sendMail({
    from: config.from,
    to: recipient,
    subject,
    html,
    attachments: [
      {
        filename: `SSTechGroup-Invoice-${invoice.invoice_number}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });

  // If status is Draft, mark as Issued
  if (invoice.status === 'Draft') {
    db.prepare("UPDATE invoices SET status = 'Issued', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(invoice.id);
  }

  recordAuditLog({
    adminName: options.adminName || 'Admin',
    action: 'EMAIL_INVOICE',
    entityType: 'INVOICE',
    entityId: invoice.id,
    details: `Emailed invoice ${invoice.invoice_number} to ${recipient} (Balance Due: R ${invoice.balance_due.toFixed(2)}, Simulated: ${isSimulated})`,
    ipAddress: options.reqIp,
  });

  return {
    success: true,
    invoiceNumber: invoice.invoice_number,
    recipient,
    isSimulated,
  };
}

export async function sendPublicQuoteCopyEmail(accessToken: string, recipientEmail?: string): Promise<{
  success: boolean;
  quoteNumber: string;
  recipient: string;
  isSimulated: boolean;
}> {
  const quote = db.prepare(`
    SELECT q.*, c.name as client_name, c.email as client_email
    FROM quotes q
    JOIN clients c ON q.client_id = c.id
    WHERE q.access_token = ?
  `).get(accessToken) as any;

  if (!quote) {
    throw new Error('Quotation not found');
  }

  const targetEmail = recipientEmail?.trim() || quote.client_email;
  return sendQuoteEmail({
    quoteId: quote.id,
    recipientEmail: targetEmail,
    adminName: 'Online Quote System',
    customMessage: 'Thank you for requesting an instant estimate on our website. You can review your official PDF quotation attached or open the link below to accept.',
  });
}
