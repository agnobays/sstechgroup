import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db/database.js';
import { generateToken, requireAuth } from '../middleware/auth.js';
import { recordAuditLog } from '../services/auditService.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

router.post('/login', (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.errors[0].message });
    return;
  }

  const { email, password } = result.data;
  const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email.toLowerCase().trim()) as any;

  if (!admin) {
    recordAuditLog({
      adminName: 'Unknown',
      action: 'FAILED_LOGIN',
      entityType: 'AUTH',
      details: `Failed login attempt for email: ${email}`,
      ipAddress: req.ip,
    });
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const isPasswordValid = bcrypt.compareSync(password, admin.password_hash);
  if (!isPasswordValid) {
    recordAuditLog({
      adminId: admin.id,
      adminName: admin.full_name,
      action: 'FAILED_LOGIN',
      entityType: 'AUTH',
      details: 'Incorrect password entered',
      ipAddress: req.ip,
    });
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  // Update last login
  db.prepare('UPDATE admins SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(admin.id);

  const payload = {
    id: admin.id,
    email: admin.email,
    fullName: admin.full_name,
    role: admin.role,
  };

  const token = generateToken(payload);

  // Set HTTP-only cookie
  res.cookie('sstg_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });

  recordAuditLog({
    adminId: admin.id,
    adminName: admin.full_name,
    action: 'LOGIN',
    entityType: 'AUTH',
    details: 'Admin authenticated successfully',
    ipAddress: req.ip,
  });

  res.json({
    message: 'Authentication successful',
    token,
    admin: payload,
  });
});

router.post('/logout', requireAuth, (req: Request, res: Response) => {
  if (req.admin) {
    recordAuditLog({
      adminId: req.admin.id,
      adminName: req.admin.fullName,
      action: 'LOGOUT',
      entityType: 'AUTH',
      details: 'Admin logged out',
      ipAddress: req.ip,
    });
  }

  res.clearCookie('sstg_token');
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({ admin: req.admin });
});

export default router;
