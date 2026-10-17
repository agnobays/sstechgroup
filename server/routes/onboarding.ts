import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';

const router = Router();

// Ensure onboarding_submissions table exists with revision support
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
      revision_count INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Safely ensure revision_count column exists for existing tables
  try {
    db.exec(`ALTER TABLE onboarding_submissions ADD COLUMN revision_count INTEGER DEFAULT 1;`);
  } catch {}
} catch (err) {
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

// GET /api/onboarding (Admin: List all onboarding submissions)
router.get('/', (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT id, client_slug, organization, contact_name, email, phone, reference_number, submission_data, status, revision_count, created_at, updated_at
      FROM onboarding_submissions
      ORDER BY updated_at DESC, created_at DESC
    `).all() as any[];

    const submissions = rows.map((row) => ({
      ...row,
      data: JSON.parse(row.submission_data || '{}'),
    }));

    res.json({
      success: true,
      submissions,
    });
  } catch (err: any) {
    console.error('Failed to list onboarding submissions:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve onboarding submissions' });
  }
});

// POST /api/onboarding (Initial client submission)
router.post('/', (req: Request, res: Response) => {
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
        client_slug, organization, contact_name, email, phone, reference_number, submission_data, status, revision_count, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Submitted', 1, CURRENT_TIMESTAMP)
    `).run(
      client_slug,
      organization,
      contact_name,
      email,
      phone,
      refNumber,
      JSON.stringify(data)
    );

    // 2. Also register in enquiries table so it surfaces in admin dashboard
    try {
      db.prepare(`
        INSERT INTO enquiries (full_name, organization, email, phone, service_required, estimated_budget, project_description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        contact_name,
        organization,
        email,
        phone,
        'Fintech Loan Platform & LOS Development',
        'Custom Enterprise Solution',
        `Completed digital lending onboarding questionnaire. Reference: ${refNumber}. Focus: Micro-lending automated platform, bureau integration, open banking & DebiCheck.`
      );
    } catch (enqErr) {
      console.warn('Notice: Enquiry dual-write skipped or logged:', enqErr);
    }

    res.status(201).json({
      success: true,
      message: 'Onboarding specifications received and recorded successfully.',
      referenceNumber: refNumber,
      receivedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Failed to save onboarding submission:', err);
    res.status(500).json({
      success: false,
      error: 'An unexpected database error occurred while saving specifications. Please try again or contact S&S Tech Group directly.',
    });
  }
});

// PUT /api/onboarding/:refNumber (Client makes changes / updates their submitted specifications)
router.put('/:refNumber', (req: Request, res: Response) => {
  const refNumber = req.params.refNumber;
  const result = submissionSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error.errors[0]?.message || 'Invalid submission data',
    });
    return;
  }

  const { organization, contact_name, email, phone, data } = result.data;

  try {
    const existing = db.prepare(`
      SELECT id, revision_count FROM onboarding_submissions WHERE reference_number = ?
    `).get(refNumber) as any;

    if (!existing) {
      res.status(404).json({ success: false, error: 'Submission not found to update' });
      return;
    }

    const nextRev = (existing.revision_count || 1) + 1;

    db.prepare(`
      UPDATE onboarding_submissions
      SET organization = ?,
          contact_name = ?,
          email = ?,
          phone = ?,
          submission_data = ?,
          status = 'Updated',
          revision_count = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE reference_number = ?
    `).run(
      organization,
      contact_name,
      email,
      phone,
      JSON.stringify(data),
      nextRev,
      refNumber
    );

    // Also update project_description note in enquiries
    try {
      db.prepare(`
        UPDATE enquiries
        SET project_description = project_description || ?
        WHERE project_description LIKE ?
      `).run(
        `\n[Updated v${nextRev} on ${new Date().toLocaleString('en-ZA')}]: Client revised specifications & brand assets.`,
        `%${refNumber}%`
      );
    } catch (e) {
      console.warn('Notice: Enquiry description update skipped:', e);
    }

    res.json({
      success: true,
      message: `Specifications successfully updated (Revision v${nextRev}). Changes are now live on the Admin Dashboard.`,
      referenceNumber: refNumber,
      revision: nextRev,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Failed to update onboarding submission:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update specifications. Please try again.',
    });
  }
});

// PATCH /api/onboarding/:refNumber/status (Admin updates status: 'Reviewing', 'Approved', 'Converted', etc.)
router.patch('/:refNumber/status', (req: Request, res: Response) => {
  const { status } = req.body;
  if (!status) {
    res.status(400).json({ success: false, error: 'Status is required' });
    return;
  }

  try {
    db.prepare(`
      UPDATE onboarding_submissions
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE reference_number = ?
    `).run(status, req.params.refNumber);

    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

// GET /api/onboarding/:refNumber (Fetch submission summary by ref)
router.get('/:refNumber', (req: Request, res: Response) => {
  try {
    const row = db.prepare(`
      SELECT id, client_slug, organization, contact_name, email, phone, reference_number, submission_data, status, revision_count, created_at, updated_at
      FROM onboarding_submissions
      WHERE reference_number = ?
    `).get(req.params.refNumber) as any;

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
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve submission' });
  }
});

export default router;
