import { db } from '../db/database.js';

export type DocumentType = 'QUOTE' | 'INVOICE';

export function getNextDocumentNumber(docType: DocumentType, explicitYear?: number): string {
  const year = explicitYear || new Date().getFullYear();
  const prefix = docType === 'QUOTE' ? 'QT' : 'INV';

  // Execute atomically in an immediate transaction
  const allocateNumber = db.transaction(() => {
    const existing = db.prepare(
      'SELECT current_number FROM document_sequences WHERE doc_type = ? AND year = ?'
    ).get(docType, year) as { current_number: number } | undefined;

    let nextNum: number;
    if (!existing) {
      db.prepare(
        'INSERT INTO document_sequences (doc_type, year, current_number) VALUES (?, ?, 1)'
      ).run(docType, year);
      nextNum = 1;
    } else {
      nextNum = existing.current_number + 1;
      db.prepare(
        'UPDATE document_sequences SET current_number = ? WHERE doc_type = ? AND year = ?'
      ).run(nextNum, docType, year);
    }

    const paddedNum = String(nextNum).padStart(4, '0');
    return `${prefix}-${year}-${paddedNum}`;
  });

  return allocateNumber();
}
