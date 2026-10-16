import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { recordAuditLog } from '../services/auditService.js';

const router = Router();

const enquirySchema = z.object({
  full_name: z.string().min(2, 'Full name is required (at least 2 characters)'),
  organization: z.string().optional().default(''),
  email: z.string().email('Valid email address is required'),
  phone: z.string().optional().default(''),
  service_required: z.string().min(1, 'Please select a service'),
  estimated_budget: z.string().optional().default(''),
  project_description: z.string().min(10, 'Please provide project description (at least 10 characters)'),
});

// Public enquiry submission
router.post('/', (req: Request, res: Response) => {
  const result = enquirySchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error.errors[0].message,
    });
    return;
  }

  const data = result.data;

  try {
    const insert = db.prepare(`
      INSERT INTO enquiries (full_name, organization, email, phone, service_required, estimated_budget, project_description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.full_name,
      data.organization,
      data.email,
      data.phone,
      data.service_required,
      data.estimated_budget,
      data.project_description
    );

    const refNumber = `ENQ-${String(insert.lastInsertRowid).padStart(4, '0')}`;

    res.status(201).json({
      success: true,
      message: 'Your enquiry has been successfully recorded in our project intake system. Our team will review your requirements and respond promptly.',
      referenceNumber: refNumber,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Failed to record enquiry:', err);
    res.status(500).json({
      success: false,
      error: 'Unable to process your enquiry at this time due to a database intake error. Please reach out to us directly.',
    });
  }
});

// Admin list enquiries
router.get('/', requireAuth, (req: Request, res: Response) => {
  const status = req.query.status ? String(req.query.status) : '';
  let query = 'SELECT * FROM enquiries';
  const params: any[] = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';
  const enquiries = db.prepare(query).all(...params);
  res.json({ enquiries });
});

// Admin update enquiry status
router.patch('/:id/status', requireAuth, (req: Request, res: Response) => {
  const statusSchema = z.object({
    status: z.enum(['New', 'Contacted', 'Converted', 'Archived']),
  });

  const result = statusSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  db.prepare('UPDATE enquiries SET status = ? WHERE id = ?').run(result.data.status, req.params.id);

  recordAuditLog({
    adminId: req.admin?.id,
    adminName: req.admin?.fullName || 'Admin',
    action: 'UPDATE_ENQUIRY_STATUS',
    entityType: 'CLIENT',
    entityId: req.params.id,
    details: `Updated enquiry #${req.params.id} status to ${result.data.status}`,
    ipAddress: req.ip,
  });

  res.json({ message: 'Status updated successfully', status: result.data.status });
});

export default router;
