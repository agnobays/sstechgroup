export interface LineItemInput {
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  tax_rate?: number;
}

export interface CalculatedLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_rate: number;
  gross_amount: number;
  discount_amount: number;
  tax_amount: number;
  line_total: number;
}

export interface DocumentTotals {
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  items: CalculatedLineItem[];
}

export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function calculateDocumentTotals(items: LineItemInput[]): DocumentTotals {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  const calculatedItems: CalculatedLineItem[] = items.map((item) => {
    const qty = Math.max(0, Number(item.quantity) || 0);
    const unitPrice = Math.max(0, Number(item.unit_price) || 0);
    const discountPercent = Math.min(100, Math.max(0, Number(item.discount_percent) || 0));
    const taxRate = Math.max(0, Number(item.tax_rate) || 0);

    const gross = roundMoney(qty * unitPrice);
    const itemDiscount = roundMoney(gross * (discountPercent / 100));
    const net = roundMoney(gross - itemDiscount);
    const itemTax = roundMoney(net * (taxRate / 100));
    const lineTotal = roundMoney(net);

    subtotal = roundMoney(subtotal + gross);
    totalDiscount = roundMoney(totalDiscount + itemDiscount);
    totalTax = roundMoney(totalTax + itemTax);

    return {
      description: item.description.trim(),
      quantity: qty,
      unit_price: unitPrice,
      discount_percent: discountPercent,
      tax_rate: taxRate,
      gross_amount: gross,
      discount_amount: itemDiscount,
      tax_amount: itemTax,
      line_total: lineTotal,
    };
  });

  const totalAmount = roundMoney(subtotal - totalDiscount + totalTax);

  return {
    subtotal,
    discount_amount: totalDiscount,
    tax_amount: totalTax,
    total_amount: totalAmount,
    items: calculatedItems,
  };
}

export function computeInvoiceStatus(
  currentStatus: string,
  totalAmount: number,
  paidAmount: number,
  dueDateStr: string
): 'Draft' | 'Issued' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled' {
  if (currentStatus === 'Cancelled') return 'Cancelled';

  const roundedTotal = roundMoney(totalAmount);
  const roundedPaid = roundMoney(paidAmount);

  if (roundedTotal > 0 && roundedPaid >= roundedTotal) {
    return 'Paid';
  }

  if (roundedPaid > 0 && roundedPaid < roundedTotal) {
    return 'Partially Paid';
  }

  if (currentStatus === 'Draft') return 'Draft';

  // Not paid
  if (dueDateStr) {
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate < today) {
      return 'Overdue';
    }
  }

  return 'Issued';
}
