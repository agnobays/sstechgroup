import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { recordAuditLog } from '../services/auditService.js';

const router = Router();

// Public endpoint: get active team members
router.get('/', (_req: Request, res: Response) => {
  try {
    const team = db
      .prepare(
        'SELECT id, name, role, image_url, bio, sort_order FROM team_members WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
      )
      .all();
    res.json({ team });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch team members' });
  }
});

// Admin endpoint: get all team members (including inactive)
router.get('/admin/all', requireAuth, (_req: Request, res: Response) => {
  try {
    const team = db
      .prepare('SELECT * FROM team_members ORDER BY sort_order ASC, id ASC')
      .all();
    res.json({ team });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch team members' });
  }
});

const teamMemberSchema = z.object({
  name: z.string().optional().default(''),
  role: z.string().optional().default(''),
  image_url: z.string().optional(),
  bio: z.string().optional().default(''),
  sort_order: z.number().int().optional(),
  is_active: z.number().int().min(0).max(1).optional(),
});

// Admin endpoint: update a team member
router.put('/:id', requireAuth, (req: Request, res: Response) => {
  const memberId = parseInt(req.params.id, 10);
  if (isNaN(memberId)) {
    res.status(400).json({ error: 'Invalid team member ID' });
    return;
  }

  const existing = db.prepare('SELECT * FROM team_members WHERE id = ?').get(memberId) as any;
  if (!existing) {
    res.status(404).json({ error: 'Team member not found' });
    return;
  }

  const parseResult = teamMemberSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.errors[0].message });
    return;
  }

  const data = parseResult.data;
  const name = data.name !== undefined ? data.name.trim() : existing.name;
  const role = data.role !== undefined ? data.role.trim() : existing.role;
  const imageUrl = data.image_url !== undefined ? data.image_url.trim() : existing.image_url;
  const bio = data.bio !== undefined ? data.bio.trim() : existing.bio;
  const sortOrder = data.sort_order !== undefined ? data.sort_order : existing.sort_order;
  const isActive = data.is_active !== undefined ? data.is_active : existing.is_active;

  db.prepare(`
    UPDATE team_members
    SET name = ?, role = ?, image_url = ?, bio = ?, sort_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, role, imageUrl, bio, sortOrder, isActive, memberId);

  recordAuditLog({
    adminId: req.admin?.id,
    adminName: req.admin?.fullName || 'Admin',
    action: 'UPDATE',
    entityType: 'TEAM',
    entityId: memberId,
    details: `Updated team member profile: "${name || 'Unnamed'}" (${role || 'No role'})`,
    ipAddress: req.ip,
  });

  const updated = db.prepare('SELECT * FROM team_members WHERE id = ?').get(memberId);
  res.json({ success: true, member: updated });
});

// Admin endpoint: add a new team member
router.post('/', requireAuth, (req: Request, res: Response) => {
  const parseResult = teamMemberSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.errors[0].message });
    return;
  }

  const data = parseResult.data;
  const name = (data.name || '').trim();
  const role = (data.role || '').trim();
  const imageUrl = (data.image_url || '/images/team/team-1.jpg').trim();
  const bio = (data.bio || '').trim();

  // Determine sort_order
  const maxOrder = db.prepare('SELECT MAX(sort_order) as max_order FROM team_members').get() as any;
  const sortOrder = data.sort_order !== undefined ? data.sort_order : (maxOrder?.max_order || 0) + 1;
  const isActive = data.is_active !== undefined ? data.is_active : 1;

  const insert = db.prepare(`
    INSERT INTO team_members (name, role, image_url, bio, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, role, imageUrl, bio, sortOrder, isActive);

  const newId = Number(insert.lastInsertRowid);

  recordAuditLog({
    adminId: req.admin?.id,
    adminName: req.admin?.fullName || 'Admin',
    action: 'CREATE',
    entityType: 'TEAM',
    entityId: newId,
    details: `Created new team member: "${name || 'Unnamed'}"`,
    ipAddress: req.ip,
  });

  const created = db.prepare('SELECT * FROM team_members WHERE id = ?').get(newId);
  res.status(201).json({ success: true, member: created });
});

// Admin endpoint: delete a team member
router.delete('/:id', requireAuth, (req: Request, res: Response) => {
  const memberId = parseInt(req.params.id, 10);
  if (isNaN(memberId)) {
    res.status(400).json({ error: 'Invalid team member ID' });
    return;
  }

  const existing = db.prepare('SELECT * FROM team_members WHERE id = ?').get(memberId) as any;
  if (!existing) {
    res.status(404).json({ error: 'Team member not found' });
    return;
  }

  db.prepare('DELETE FROM team_members WHERE id = ?').run(memberId);

  recordAuditLog({
    adminId: req.admin?.id,
    adminName: req.admin?.fullName || 'Admin',
    action: 'DELETE',
    entityType: 'TEAM',
    entityId: memberId,
    details: `Deleted team member profile: "${existing.name || 'Unnamed'}"`,
    ipAddress: req.ip,
  });

  res.json({ success: true, message: 'Team member deleted' });
});

export default router;
