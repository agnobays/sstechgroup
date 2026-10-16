import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { recordAuditLog } from '../services/auditService.js';

const router = Router();
router.use(requireAuth);

// 1. List follow-up queue
router.get('/', (req: Request, res: Response) => {
  const status = req.query.status ? String(req.query.status) : '';
  let query = `
    SELECT f.*, l.full_name as lead_name, l.email as lead_email, l.phone as lead_phone,
           l.service_required, l.estimated_value, q.quote_number
    FROM follow_ups f
    LEFT JOIN leads l ON f.lead_id = l.id
    LEFT JOIN quotes q ON f.quote_id = q.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status) {
    query += ' AND f.status = ?';
    params.push(status);
  }

  query += ' ORDER BY f.scheduled_at ASC';
  const followUps = db.prepare(query).all(...params);

  res.json({ followUps });
});

// 2. Schedule follow-up
router.post('/', (req: Request, res: Response) => {
  const schema = z.object({
    lead_id: z.number().int().optional().nullable(),
    quote_id: z.number().int().optional().nullable(),
    scheduled_at: z.string().min(1),
    template_key: z.string().default('quote_follow_up'),
    channel: z.enum(['Internal', 'Email', 'SMS']).default('Internal'),
    notes: z.string().optional().default(''),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.errors[0].message });
    return;
  }

  const data = result.data;
  const insert = db.prepare(`
    INSERT INTO follow_ups (lead_id, quote_id, scheduled_at, template_key, channel, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    data.lead_id || null,
    data.quote_id || null,
    data.scheduled_at,
    data.template_key,
    data.channel,
    data.notes
  );

  recordAuditLog({
    adminId: req.admin?.id,
    adminName: req.admin?.fullName || 'Admin',
    action: 'SCHEDULE_FOLLOW_UP',
    entityType: 'CLIENT',
    entityId: Number(insert.lastInsertRowid),
    details: `Scheduled follow-up for ${data.scheduled_at} via ${data.channel}`,
    ipAddress: req.ip,
  });

  res.status(201).json({ message: 'Follow-up scheduled successfully', id: Number(insert.lastInsertRowid) });
});

// 3. Mark follow-up as Sent or Cancelled
router.patch('/:id/status', (req: Request, res: Response) => {
  const schema = z.object({
    status: z.enum(['Sent', 'Cancelled', 'Failed']),
    notes: z.string().optional(),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.errors[0].message });
    return;
  }

  const { status, notes } = result.data;
  const sentAt = status === 'Sent' ? new Date().toISOString() : null;

  db.prepare(`
    UPDATE follow_ups
    SET status = ?, sent_at = COALESCE(?, sent_at), notes = COALESCE(?, notes)
    WHERE id = ?
  `).run(status, sentAt, notes || null, req.params.id);

  recordAuditLog({
    adminId: req.admin?.id,
    adminName: req.admin?.fullName || 'Admin',
    action: 'UPDATE_FOLLOW_UP_STATUS',
    entityType: 'CLIENT',
    entityId: req.params.id,
    details: `Updated follow-up #${req.params.id} to ${status}`,
    ipAddress: req.ip,
  });

  res.json({ message: 'Follow-up status updated' });
});

export default router;
