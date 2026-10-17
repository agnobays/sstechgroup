import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
const router = Router();
// Ensure onboarding_submissions table exists
try {
    db.exec(`
    CREATE TABLE IF NOT EXISTS onboarding_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_slug TEXT NOT NULL,
      organization TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT DEFAULT '',
      reference_number TEXT UNIQUE NOT NULL,
      submission_data TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Submitted',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
catch (err) {
    console.error('Failed to ensure onboarding_submissions table:', err);
}
const submissionSchema = z.object({
    client_slug: z.string().default('qhawe'),
    organization: z.string().min(2, 'Organization name is required'),
    contact_name: z.string().min(2, 'Contact person name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional().default(''),
    data: z.record(z.any()),
});
// POST /api/onboarding
router.post('/', (req, res) => {
    const result = submissionSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({
            success: false,
            error: result.error.errors[0]?.message || 'Invalid submission data',
        });
        return;
    }
    const { client_slug, organization, contact_name, email, phone, data } = result.data;
    const timestamp = Date.now().toString().slice(-4);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const refNumber = `SPEC-${client_slug.toUpperCase()}-${timestamp}-${randomSuffix}`;
    try {
        // 1. Insert into onboarding_submissions
        db.prepare(`
      INSERT INTO onboarding_submissions (
        client_slug, organization, contact_name, email, phone, reference_number, submission_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(client_slug, organization, contact_name, email, phone, refNumber, JSON.stringify(data));
        // 2. Also register in enquiries table so it surfaces in admin dashboard
        try {
            db.prepare(`
        INSERT INTO enquiries (full_name, organization, email, phone, service_required, estimated_budget, project_description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(contact_name, organization, email, phone, 'Fintech Loan Platform & LOS Development', 'Custom Enterprise Solution', `Completed digital lending onboarding questionnaire. Reference: ${refNumber}. Focus: Micro-lending automated platform, bureau integration, open banking & DebiCheck.`);
        }
        catch (enqErr) {
            console.warn('Notice: Enquiry dual-write skipped or logged:', enqErr);
        }
        res.status(201).json({
            success: true,
            message: 'Onboarding specifications received and recorded successfully.',
            referenceNumber: refNumber,
            receivedAt: new Date().toISOString(),
        });
    }
    catch (err) {
        console.error('Failed to save onboarding submission:', err);
        res.status(500).json({
            success: false,
            error: 'An unexpected database error occurred while saving specifications. Please try again or contact S&S Tech Group directly.',
        });
    }
});
// GET /api/onboarding/:refNumber (Fetch submission summary by ref)
router.get('/:refNumber', (req, res) => {
    try {
        const row = db.prepare(`
      SELECT id, client_slug, organization, contact_name, email, phone, reference_number, submission_data, status, created_at
      FROM onboarding_submissions
      WHERE reference_number = ?
    `).get(req.params.refNumber);
        if (!row) {
            res.status(404).json({ success: false, error: 'Submission not found' });
            return;
        }
        res.json({
            success: true,
            submission: {
                ...row,
                data: JSON.parse(row.submission_data || '{}'),
            },
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Failed to retrieve submission' });
    }
});
export default router;
