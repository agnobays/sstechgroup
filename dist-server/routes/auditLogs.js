import { Router } from 'express';
import { db } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.use(requireAuth);
router.get('/', (req, res) => {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?').all(limit);
    res.json({ logs });
});
export default router;
