import PDFDocument from 'pdfkit';
import { db } from '../db/database.js';
export function generateQuotePDF(quoteId) {
    const quote = db.prepare(`
    SELECT q.*, c.name as client_name, c.company_name as client_company,
           c.email as client_email, c.phone as client_phone,
           c.billing_address as client_address, c.tax_number as client_tax
    FROM quotes q
    JOIN clients c ON q.client_id = c.id
    WHERE q.id = ?
  `).get(quoteId);
    if (!quote) {
        throw new Error('Quotation not found');
    }
    const items = db.prepare(`
    SELECT * FROM quote_items WHERE quote_id = ? ORDER BY sort_order ASC, id ASC
  `).all(quoteId);
    const settings = (db.prepare('SELECT * FROM company_settings WHERE id = 1').get() || {});
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    // Brand Palette
    const black = '#080808';
    const gold = '#D9AD32';
    const charcoal = '#101010';
    const warmGrey = '#7A7A75';
    const offWhite = '#F7F7F5';
    // Header Banner
    doc.rect(40, 40, 515, 75).fill(black);
    // Logo Monogram
    doc.rect(55, 52, 50, 50).fill(charcoal);
    doc.rect(55, 52, 50, 50).strokeColor(gold).lineWidth(1).stroke();
    doc.fontSize(16).fillColor(gold).text('S&S', 55, 68, { width: 50, align: 'center' });
    // Company Name & Subtitle
    doc.fontSize(16).fillColor(gold).text(settings.company_name || 'S&S Tech Group (Pty) Ltd', 115, 56);
    doc.fontSize(9).fillColor(offWhite).text('Digital Solutions Built Around Your Business', 115, 76);
    // Document Badge
    doc.fontSize(18).fillColor(gold).text('QUOTATION', 400, 55, { align: 'right', width: 140 });
    doc.fontSize(10).fillColor(offWhite).text(quote.quote_number, 400, 78, { align: 'right', width: 140 });
    let y = 135;
    // Metadata Columns (Left: Company Details, Right: Quotation & Client Details)
    doc.fontSize(9).fillColor(charcoal);
    // Company Details (Left)
    doc.font('Helvetica-Bold').fillColor(black).text('ISSUED BY:', 40, y);
    doc.font('Helvetica').fillColor(charcoal);
    y += 14;
    doc.text(settings.company_name || 'S&S Tech Group (Pty) Ltd', 40, y);
    y += 12;
    if (settings.registration_number) {
        doc.text(`Reg No: ${settings.registration_number}`, 40, y);
        y += 12;
    }
    if (settings.vat_number) {
        doc.text(`VAT No: ${settings.vat_number}`, 40, y);
        y += 12;
    }
    if (settings.email) {
        doc.text(`Email: ${settings.email}`, 40, y);
        y += 12;
    }
    if (settings.phone) {
        doc.text(`Tel: ${settings.phone}`, 40, y);
        y += 12;
    }
    if (settings.physical_address) {
        doc.text(settings.physical_address, 40, y, { width: 200 });
        y += 24;
    }
    // Quote & Client Details (Right)
    let rightY = 135;
    doc.font('Helvetica-Bold').fillColor(black).text('QUOTATION DETAILS:', 320, rightY);
    rightY += 14;
    doc.font('Helvetica').fillColor(charcoal);
    doc.text(`Issue Date: ${quote.issue_date}`, 320, rightY);
    rightY += 12;
    doc.text(`Expiry Date: ${quote.expiry_date}`, 320, rightY);
    rightY += 12;
    doc.text(`Status: ${quote.status}`, 320, rightY);
    rightY += 16;
    doc.font('Helvetica-Bold').fillColor(black).text('PREPARED FOR:', 320, rightY);
    rightY += 14;
    doc.font('Helvetica').fillColor(charcoal);
    doc.text(quote.client_name, 320, rightY);
    rightY += 12;
    if (quote.client_company) {
        doc.text(quote.client_company, 320, rightY);
        rightY += 12;
    }
    if (quote.client_email) {
        doc.text(`Email: ${quote.client_email}`, 320, rightY);
        rightY += 12;
    }
    if (quote.client_phone) {
        doc.text(`Tel: ${quote.client_phone}`, 320, rightY);
        rightY += 12;
    }
    if (quote.client_tax) {
        doc.text(`Tax No: ${quote.client_tax}`, 320, rightY);
        rightY += 12;
    }
    if (quote.client_address) {
        doc.text(quote.client_address, 320, rightY, { width: 220 });
        rightY += 24;
    }
    // Line items table
    const tableStartY = Math.max(y, rightY) + 20;
    y = tableStartY;
    // Table Header
    doc.rect(40, y, 515, 22).fill(black);
    doc.fontSize(8).fillColor(gold).font('Helvetica-Bold');
    doc.text('DESCRIPTION', 50, y + 6);
    doc.text('QTY', 310, y + 6, { width: 40, align: 'right' });
    doc.text('UNIT PRICE', 360, y + 6, { width: 60, align: 'right' });
    doc.text('DISC %', 430, y + 6, { width: 40, align: 'right' });
    doc.text('TOTAL (ZAR)', 480, y + 6, { width: 65, align: 'right' });
    y += 22;
    // Table Rows
    doc.font('Helvetica').fontSize(8);
    items.forEach((item, index) => {
        const isEven = index % 2 === 0;
        if (isEven) {
            doc.rect(40, y, 515, 20).fill('#FAFAFA');
        }
        doc.fillColor(black).text(item.description, 50, y + 5, { width: 250 });
        doc.text(item.quantity.toString(), 310, y + 5, { width: 40, align: 'right' });
        doc.text(`R ${item.unit_price.toFixed(2)}`, 360, y + 5, { width: 60, align: 'right' });
        doc.text(item.discount_percent > 0 ? `${item.discount_percent}%` : '-', 430, y + 5, { width: 40, align: 'right' });
        doc.text(`R ${item.line_total.toFixed(2)}`, 480, y + 5, { width: 65, align: 'right' });
        y += 20;
    });
    // Table Bottom Divider
    doc.rect(40, y, 515, 1).fill(gold);
    y += 12;
    // Financial Summary Box
    const summaryX = 350;
    doc.fontSize(9).font('Helvetica');
    doc.text('Subtotal:', summaryX, y, { width: 90, align: 'left' });
    doc.text(`R ${quote.subtotal.toFixed(2)}`, 450, y, { width: 95, align: 'right' });
    y += 14;
    if (quote.discount_amount > 0) {
        doc.text('Discount:', summaryX, y, { width: 90, align: 'left' });
        doc.text(`- R ${quote.discount_amount.toFixed(2)}`, 450, y, { width: 95, align: 'right' });
        y += 14;
    }
    if (quote.tax_amount > 0) {
        doc.text('VAT / Tax:', summaryX, y, { width: 90, align: 'left' });
        doc.text(`R ${quote.tax_amount.toFixed(2)}`, 450, y, { width: 95, align: 'right' });
        y += 14;
    }
    // Final Total Highlight
    doc.rect(summaryX - 5, y - 2, 205, 24).fill(charcoal);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(gold);
    doc.text('Total (ZAR):', summaryX, y + 4, { width: 90, align: 'left' });
    doc.text(`R ${quote.total_amount.toFixed(2)}`, 450, y + 4, { width: 95, align: 'right' });
    y += 38;
    // Scope of Work or Notes
    if (quote.scope_of_work) {
        doc.font('Helvetica-Bold').fontSize(9).fillColor(black).text('SCOPE OF WORK:', 40, y);
        y += 12;
        doc.font('Helvetica').fontSize(8).fillColor(charcoal).text(quote.scope_of_work, 40, y, { width: 515 });
        y += doc.heightOfString(quote.scope_of_work, { width: 515 }) + 10;
    }
    if (quote.notes || settings.default_quote_notes) {
        const notesText = quote.notes || settings.default_quote_notes;
        doc.font('Helvetica-Bold').fontSize(9).fillColor(black).text('TERMS & NOTES:', 40, y);
        y += 12;
        doc.font('Helvetica').fontSize(8).fillColor(charcoal).text(notesText, 40, y, { width: 515 });
        y += doc.heightOfString(notesText, { width: 515 }) + 10;
    }
    // Footer banner
    doc.rect(40, 770, 515, 30).fill(black);
    doc.fontSize(8).fillColor(offWhite).text(`Official quotation generated by S&S Tech Group (Pty) Ltd. Page 1 of 1`, 40, 780, { width: 515, align: 'center' });
    doc.end();
    return doc;
}
export function generateInvoicePDF(invoiceId) {
    const invoice = db.prepare(`
    SELECT i.*, c.name as client_name, c.company_name as client_company,
           c.email as client_email, c.phone as client_phone,
           c.billing_address as client_address, c.tax_number as client_tax
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    WHERE i.id = ?
  `).get(invoiceId);
    if (!invoice) {
        throw new Error('Invoice not found');
    }
    const items = db.prepare(`
    SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order ASC, id ASC
  `).all(invoiceId);
    const payments = db.prepare(`
    SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date ASC, id ASC
  `).all(invoiceId);
    const settings = (db.prepare('SELECT * FROM company_settings WHERE id = 1').get() || {});
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    // Brand Palette
    const black = '#080808';
    const gold = '#D9AD32';
    const charcoal = '#101010';
    const offWhite = '#F7F7F5';
    // Header Banner
    doc.rect(40, 40, 515, 75).fill(black);
    // Logo Monogram
    doc.rect(55, 52, 50, 50).fill(charcoal);
    doc.rect(55, 52, 50, 50).strokeColor(gold).lineWidth(1).stroke();
    doc.fontSize(16).fillColor(gold).text('S&S', 55, 68, { width: 50, align: 'center' });
    // Company Name & Subtitle
    doc.fontSize(16).fillColor(gold).text(settings.company_name || 'S&S Tech Group (Pty) Ltd', 115, 56);
    doc.fontSize(9).fillColor(offWhite).text('Digital Solutions Built Around Your Business', 115, 76);
    // Document Badge
    doc.fontSize(18).fillColor(gold).text('TAX INVOICE', 400, 55, { align: 'right', width: 140 });
    doc.fontSize(10).fillColor(offWhite).text(invoice.invoice_number, 400, 78, { align: 'right', width: 140 });
    let y = 135;
    // Metadata Columns
    doc.fontSize(9).fillColor(charcoal);
    // Company Details (Left)
    doc.font('Helvetica-Bold').fillColor(black).text('PAY TO:', 40, y);
    doc.font('Helvetica').fillColor(charcoal);
    y += 14;
    doc.text(settings.company_name || 'S&S Tech Group (Pty) Ltd', 40, y);
    y += 12;
    if (settings.registration_number) {
        doc.text(`Reg No: ${settings.registration_number}`, 40, y);
        y += 12;
    }
    if (settings.vat_number) {
        doc.text(`VAT No: ${settings.vat_number}`, 40, y);
        y += 12;
    }
    if (settings.email) {
        doc.text(`Email: ${settings.email}`, 40, y);
        y += 12;
    }
    if (settings.phone) {
        doc.text(`Tel: ${settings.phone}`, 40, y);
        y += 12;
    }
    if (settings.physical_address) {
        doc.text(settings.physical_address, 40, y, { width: 200 });
        y += 24;
    }
    // Invoice & Client Details (Right)
    let rightY = 135;
    doc.font('Helvetica-Bold').fillColor(black).text('INVOICE DETAILS:', 320, rightY);
    rightY += 14;
    doc.font('Helvetica').fillColor(charcoal);
    doc.text(`Issue Date: ${invoice.issue_date}`, 320, rightY);
    rightY += 12;
    doc.text(`Due Date: ${invoice.due_date}`, 320, rightY);
    rightY += 12;
    doc.text(`Status: ${invoice.status}`, 320, rightY);
    rightY += 16;
    doc.font('Helvetica-Bold').fillColor(black).text('INVOICED TO:', 320, rightY);
    rightY += 14;
    doc.font('Helvetica').fillColor(charcoal);
    doc.text(invoice.client_name, 320, rightY);
    rightY += 12;
    if (invoice.client_company) {
        doc.text(invoice.client_company, 320, rightY);
        rightY += 12;
    }
    if (invoice.client_email) {
        doc.text(`Email: ${invoice.client_email}`, 320, rightY);
        rightY += 12;
    }
    if (invoice.client_phone) {
        doc.text(`Tel: ${invoice.client_phone}`, 320, rightY);
        rightY += 12;
    }
    if (invoice.client_tax) {
        doc.text(`Tax No: ${invoice.client_tax}`, 320, rightY);
        rightY += 12;
    }
    if (invoice.client_address) {
        doc.text(invoice.client_address, 320, rightY, { width: 220 });
        rightY += 24;
    }
    // Line items table
    const tableStartY = Math.max(y, rightY) + 20;
    y = tableStartY;
    // Table Header
    doc.rect(40, y, 515, 22).fill(black);
    doc.fontSize(8).fillColor(gold).font('Helvetica-Bold');
    doc.text('DESCRIPTION', 50, y + 6);
    doc.text('QTY', 310, y + 6, { width: 40, align: 'right' });
    doc.text('UNIT PRICE', 360, y + 6, { width: 60, align: 'right' });
    doc.text('DISC %', 430, y + 6, { width: 40, align: 'right' });
    doc.text('TOTAL (ZAR)', 480, y + 6, { width: 65, align: 'right' });
    y += 22;
    // Table Rows
    doc.font('Helvetica').fontSize(8);
    items.forEach((item, index) => {
        const isEven = index % 2 === 0;
        if (isEven) {
            doc.rect(40, y, 515, 20).fill('#FAFAFA');
        }
        doc.fillColor(black).text(item.description, 50, y + 5, { width: 250 });
        doc.text(item.quantity.toString(), 310, y + 5, { width: 40, align: 'right' });
        doc.text(`R ${item.unit_price.toFixed(2)}`, 360, y + 5, { width: 60, align: 'right' });
        doc.text(item.discount_percent > 0 ? `${item.discount_percent}%` : '-', 430, y + 5, { width: 40, align: 'right' });
        doc.text(`R ${item.line_total.toFixed(2)}`, 480, y + 5, { width: 65, align: 'right' });
        y += 20;
    });
    // Table Bottom Divider
    doc.rect(40, y, 515, 1).fill(gold);
    y += 12;
    // Summary & Banking Details
    const bankY = y;
    if (settings.bank_name && settings.bank_account_number) {
        doc.font('Helvetica-Bold').fontSize(9).fillColor(black).text('BANKING PAYMENT DETAILS:', 40, bankY);
        doc.font('Helvetica').fontSize(8).fillColor(charcoal);
        let by = bankY + 14;
        doc.text(`Bank: ${settings.bank_name}`, 40, by);
        by += 11;
        doc.text(`Account Name: ${settings.bank_account_name || settings.company_name}`, 40, by);
        by += 11;
        doc.text(`Account Number: ${settings.bank_account_number}`, 40, by);
        by += 11;
        if (settings.bank_branch_code) {
            doc.text(`Branch Code: ${settings.bank_branch_code}`, 40, by);
            by += 11;
        }
        if (settings.bank_account_type) {
            doc.text(`Account Type: ${settings.bank_account_type}`, 40, by);
            by += 11;
        }
        if (settings.bank_swift) {
            doc.text(`SWIFT: ${settings.bank_swift}`, 40, by);
            by += 11;
        }
        doc.font('Helvetica-Bold').text(`Reference: ${invoice.invoice_number}`, 40, by);
    }
    // Financial Summary Box (Right)
    const summaryX = 350;
    doc.fontSize(9).font('Helvetica');
    doc.text('Subtotal:', summaryX, y, { width: 90, align: 'left' });
    doc.text(`R ${invoice.subtotal.toFixed(2)}`, 450, y, { width: 95, align: 'right' });
    y += 14;
    if (invoice.discount_amount > 0) {
        doc.text('Discount:', summaryX, y, { width: 90, align: 'left' });
        doc.text(`- R ${invoice.discount_amount.toFixed(2)}`, 450, y, { width: 95, align: 'right' });
        y += 14;
    }
    if (invoice.tax_amount > 0) {
        doc.text('VAT / Tax:', summaryX, y, { width: 90, align: 'left' });
        doc.text(`R ${invoice.tax_amount.toFixed(2)}`, 450, y, { width: 95, align: 'right' });
        y += 14;
    }
    doc.text('Total Invoiced:', summaryX, y, { width: 90, align: 'left' });
    doc.text(`R ${invoice.total_amount.toFixed(2)}`, 450, y, { width: 95, align: 'right' });
    y += 14;
    if (invoice.paid_amount > 0) {
        doc.fillColor('#15803d');
        doc.text('Amount Paid:', summaryX, y, { width: 90, align: 'left' });
        doc.text(`- R ${invoice.paid_amount.toFixed(2)}`, 450, y, { width: 95, align: 'right' });
        doc.fillColor(black);
        y += 14;
    }
    // Balance Due Highlight
    doc.rect(summaryX - 5, y - 2, 205, 24).fill(charcoal);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(gold);
    doc.text('Balance Due (ZAR):', summaryX, y + 4, { width: 110, align: 'left' });
    doc.text(`R ${invoice.balance_due.toFixed(2)}`, 450, y + 4, { width: 95, align: 'right' });
    y += 38;
    // Payments log if present
    if (payments.length > 0) {
        doc.font('Helvetica-Bold').fontSize(9).fillColor(black).text('PAYMENT HISTORY:', 40, y);
        y += 14;
        doc.font('Helvetica').fontSize(8).fillColor(charcoal);
        payments.forEach((p) => {
            doc.text(`• ${p.payment_date}: R ${p.amount.toFixed(2)} (${p.payment_method}) Ref: ${p.reference}`, 40, y);
            y += 12;
        });
        y += 6;
    }
    // Notes & terms
    if (invoice.payment_terms || settings.default_payment_terms) {
        const terms = invoice.payment_terms || settings.default_payment_terms;
        doc.font('Helvetica-Bold').fontSize(9).fillColor(black).text('PAYMENT TERMS:', 40, y);
        y += 12;
        doc.font('Helvetica').fontSize(8).fillColor(charcoal).text(terms, 40, y, { width: 515 });
        y += doc.heightOfString(terms, { width: 515 }) + 8;
    }
    // Footer banner
    doc.rect(40, 770, 515, 30).fill(black);
    doc.fontSize(8).fillColor(offWhite).text(`Official tax invoice generated by S&S Tech Group (Pty) Ltd. Page 1 of 1`, 40, 780, { width: 515, align: 'center' });
    doc.end();
    return doc;
}
export function pdfDocumentToBuffer(doc) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err) => reject(err));
    });
}
export async function generateQuotePDFBuffer(quoteId) {
    const doc = generateQuotePDF(quoteId);
    return pdfDocumentToBuffer(doc);
}
export async function generateInvoicePDFBuffer(invoiceId) {
    const doc = generateInvoicePDF(invoiceId);
    return pdfDocumentToBuffer(doc);
}
