import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { evaluateQuestionnaireAndCalculatePrice } from '../services/pricingEngine.js';
import { recordAuditLog } from '../services/auditService.js';

const router = Router();

// 1. Initialize or resume lead session
router.post('/init', (req: Request, res: Response) => {
  const existingToken = req.body.session_token;

  if (existingToken) {
    const existingLead = db.prepare('SELECT * FROM leads WHERE session_token = ?').get(existingToken) as any;
    if (existingLead) {
      db.prepare('UPDATE leads SET last_activity_at = CURRENT_TIMESTAMP WHERE id = ?').run(existingLead.id);
      res.json({
        session_token: existingLead.session_token,
        lead: {
          ...existingLead,
          questionnaire_data: JSON.parse(existingLead.questionnaire_data_json || '{}'),
        },
      });
      return;
    }
  }

  // Create new session token
  const sessionToken = crypto.randomBytes(24).toString('hex');
  const insert = db.prepare(`
    INSERT INTO leads (session_token, status, step_progress, questionnaire_data_json)
    VALUES (?, 'In Progress', 1, '{}')
  `).run(sessionToken);

  const newLead = db.prepare('SELECT * FROM leads WHERE id = ?').get(insert.lastInsertRowid) as any;

  res.status(201).json({
    session_token: sessionToken,
    lead: {
      ...newLead,
      questionnaire_data: {},
    },
  });
});

// 2. Incremental questionnaire step saving
router.patch('/:token/step', (req: Request, res: Response) => {
  const lead = db.prepare('SELECT * FROM leads WHERE session_token = ?').get(req.params.token) as any;
  if (!lead) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const { step, data } = req.body;
  const currentAnswers = JSON.parse(lead.questionnaire_data_json || '{}');
  const mergedAnswers = { ...currentAnswers, ...data };

  // Calculate recommendation & estimated value
  const evaluation = evaluateQuestionnaireAndCalculatePrice(mergedAnswers);

  const fullName = mergedAnswers.fullName || lead.full_name || '';
  const email = mergedAnswers.email || lead.email || '';
  const phone = mergedAnswers.phone || lead.phone || '';
  const organization = mergedAnswers.organization || lead.organization || '';
  const serviceRequired = mergedAnswers.serviceRequired || lead.service_required || '';
  const businessType = mergedAnswers.businessType || lead.business_type || '';
  const consentMarketing = mergedAnswers.consentMarketing ? 1 : lead.consent_marketing;
  const consentFollowup = mergedAnswers.consentFollowup !== undefined ? (mergedAnswers.consentFollowup ? 1 : 0) : lead.consent_followup;

  db.prepare(`
    UPDATE leads
    SET full_name = ?, email = ?, phone = ?, organization = ?, business_type = ?,
        service_required = ?, step_progress = ?, questionnaire_data_json = ?,
        recommended_package_id = ?, estimated_value = ?,
        consent_marketing = ?, consent_followup = ?,
        last_activity_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    fullName,
    email,
    phone,
    organization,
    businessType,
    serviceRequired,
    Math.max(lead.step_progress, Number(step) || 1),
    JSON.stringify(mergedAnswers),
    evaluation.recommendedPackage.id,
    evaluation.onceOffTotal,
    consentMarketing,
    consentFollowup,
    lead.id
  );

  res.json({
    success: true,
    step_progress: Math.max(lead.step_progress, Number(step) || 1),
    evaluation,
  });
});

// 3. Mark session as abandoned
router.post('/:token/abandon', (req: Request, res: Response) => {
  const lead = db.prepare('SELECT * FROM leads WHERE session_token = ?').get(req.params.token) as any;
  if (!lead) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  if (lead.status === 'In Progress') {
    db.prepare(`
      UPDATE leads
      SET status = 'Abandoned', last_activity_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(lead.id);

    // If customer provided an email and follow-up consent is granted, schedule an automated follow-up in 24 hours
    if (lead.email && lead.consent_followup === 1) {
      const scheduledTime = new Date();
      scheduledTime.setHours(scheduledTime.getHours() + 24);

      db.prepare(`
        INSERT INTO follow_ups (lead_id, scheduled_at, status, template_key, channel, notes)
        VALUES (?, ?, 'Pending', 'abandoned_questionnaire_recovery', 'Internal', 'Lead abandoned questionnaire at step ' || ?)
      `).run(lead.id, scheduledTime.toISOString(), lead.step_progress);
    }
  }

  res.json({ success: true, message: 'Session updated' });
});

// --- ADMIN CRM ENDPOINTS ---

// 4. Admin list leads with filters, search, and pagination
router.get('/', requireAuth, (req: Request, res: Response) => {
  const search = req.query.search ? String(req.query.search).trim() : '';
  const status = req.query.status ? String(req.query.status).trim() : '';
  const service = req.query.service ? String(req.query.service).trim() : '';
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const page = Math.max(1, Number(req.query.page) || 1);
  const offset = (page - 1) * limit;

  let countQuery = 'SELECT COUNT(*) as total FROM leads WHERE 1=1';
  let query = `
    SELECT l.*, p.name as recommended_package_name
    FROM leads l
    LEFT JOIN packages p ON l.recommended_package_id = p.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status) {
    countQuery += ' AND l.status = ?';
    query += ' AND l.status = ?';
    params.push(status);
  }

  if (service) {
    countQuery += ' AND l.service_required = ?';
    query += ' AND l.service_required = ?';
    params.push(service);
  }

  if (search) {
    const pattern = `%${search}%`;
    const searchClause = ' AND (l.full_name LIKE ? OR l.email LIKE ? OR l.organization LIKE ? OR l.phone LIKE ?)';
    countQuery += searchClause;
    query += searchClause;
    params.push(pattern, pattern, pattern, pattern);
  }

  const totalRow = db.prepare(countQuery).get(...params) as any;
  const total = totalRow?.total || 0;

  query += ' ORDER BY l.last_activity_at DESC LIMIT ? OFFSET ?';
  const leads = db.prepare(query).all(...params, limit, offset);

  // Parse questionnaire_data_json
  const parsedLeads = leads.map((l: any) => ({
    ...l,
    questionnaire_data: JSON.parse(l.questionnaire_data_json || '{}'),
  }));

  res.json({
    leads: parsedLeads,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// 5. Admin view lead details
router.get('/:id', requireAuth, (req: Request, res: Response) => {
  const lead = db.prepare(`
    SELECT l.*, p.name as recommended_package_name, p.starting_price as package_price
    FROM leads l
    LEFT JOIN packages p ON l.recommended_package_id = p.id
    WHERE l.id = ?
  `).get(req.params.id) as any;

  if (!lead) {
    res.status(404).json({ error: 'Lead not found' });
    return;
  }

  const quotes = db.prepare('SELECT * FROM quotes WHERE lead_id = ? ORDER BY created_at DESC').all(req.params.id);
  const followUps = db.prepare('SELECT * FROM follow_ups WHERE lead_id = ? ORDER BY scheduled_at ASC').all(req.params.id);

  res.json({
    lead: {
      ...lead,
      questionnaire_data: JSON.parse(lead.questionnaire_data_json || '{}'),
    },
    quotes,
    followUps,
  });
});

// 6. Admin update lead notes & assignments
router.patch('/:id/crm', requireAuth, (req: Request, res: Response) => {
  const { status, assigned_to, next_follow_up, notes } = req.body;

  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id) as any;
  if (!lead) {
    res.status(404).json({ error: 'Lead not found' });
    return;
  }

  db.prepare(`
    UPDATE leads
    SET status = COALESCE(?, status),
        assigned_to = COALESCE(?, assigned_to),
        next_follow_up = COALESCE(?, next_follow_up),
        notes = COALESCE(?, notes),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, assigned_to, next_follow_up, notes, req.params.id);

  recordAuditLog({
    adminId: req.admin?.id,
    adminName: req.admin?.fullName || 'Admin',
    action: 'UPDATE_LEAD_CRM',
    entityType: 'CLIENT',
    entityId: req.params.id,
    details: `Updated CRM record for lead ${lead.full_name || lead.session_token.substring(0, 8)} (Status: ${status || lead.status})`,
    ipAddress: req.ip,
  });

  res.json({ message: 'Lead CRM record updated successfully' });
});

// 7. CSV Export for authorized staff
router.get('/export/csv', requireAuth, (_req: Request, res: Response) => {
  const leads = db.prepare(`
    SELECT l.id, l.full_name, l.email, l.phone, l.organization, l.service_required,
           l.status, l.step_progress, l.estimated_value, l.consent_marketing,
           l.last_activity_at, l.created_at, p.name as recommended_package
    FROM leads l
    LEFT JOIN packages p ON l.recommended_package_id = p.id
    ORDER BY l.created_at DESC
  `).all() as any[];

  let csv = 'ID,Full Name,Email,Phone,Organization,Service Required,Package,Estimated Value (ZAR),Status,Step Progress,Marketing Consent,Created At,Last Activity\n';

  leads.forEach((l) => {
    const row = [
      l.id,
      `"${(l.full_name || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.organization || '').replace(/"/g, '""')}"`,
      `"${(l.service_required || '').replace(/"/g, '""')}"`,
      `"${(l.recommended_package || '').replace(/"/g, '""')}"`,
      l.estimated_value || 0,
      `"${l.status}"`,
      l.step_progress,
      l.consent_marketing ? 'Yes' : 'No',
      `"${l.created_at}"`,
      `"${l.last_activity_at}"`,
    ].join(',');
    csv += row + '\n';
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="SSTechGroup-Leads-Export.csv"');
  res.status(200).send(csv);
});

export default router;
