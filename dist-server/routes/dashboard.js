import { Router } from 'express';
import { db } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { roundMoney } from '../services/calculationService.js';
const router = Router();
router.use(requireAuth);
router.get('/', (req, res) => {
    // Real database aggregates
    const totalQuotesRow = db.prepare('SELECT COUNT(*) as count FROM quotes WHERE is_archived = 0').get();
    const acceptedQuotesRow = db.prepare("SELECT COUNT(*) as count FROM quotes WHERE status = 'Accepted' AND is_archived = 0").get();
    const totalInvoicesRow = db.prepare('SELECT COUNT(*) as count FROM invoices WHERE is_archived = 0').get();
    const paidInvoicesRow = db.prepare("SELECT COUNT(*) as count FROM invoices WHERE status = 'Paid' AND is_archived = 0").get();
    const overdueInvoicesRow = db.prepare("SELECT COUNT(*) as count FROM invoices WHERE status = 'Overdue' AND is_archived = 0").get();
    const balancesRow = db.prepare(`
    SELECT SUM(balance_due) as total_balance, SUM(total_amount) as total_invoiced, SUM(paid_amount) as total_collected
    FROM invoices
    WHERE status != 'Cancelled' AND is_archived = 0
  `).get();
    const totalClientsRow = db.prepare('SELECT COUNT(*) as count FROM clients WHERE is_archived = 0').get();
    const totalEnquiriesRow = db.prepare("SELECT COUNT(*) as count FROM enquiries WHERE status = 'New'").get();
    // CRM & Leads Metrics
    const totalLeadsRow = db.prepare('SELECT COUNT(*) as count FROM leads').get();
    const completedLeadsRow = db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'Completed' OR status = 'Converted'").get();
    const abandonedLeadsRow = db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'Abandoned'").get();
    const pendingReviewQuotesRow = db.prepare("SELECT COUNT(*) as count FROM quotes WHERE status = 'Pending Review' OR status = 'Preliminary Estimate'").get();
    const pipelineValueRow = db.prepare("SELECT SUM(estimated_value) as total FROM leads WHERE status != 'Closed'").get();
    const followUpsDueRow = db.prepare("SELECT COUNT(*) as count FROM follow_ups WHERE status = 'Pending'").get();
    const totalLeads = totalLeadsRow?.count || 0;
    const completedLeads = completedLeadsRow?.count || 0;
    const conversionRate = totalLeads > 0 ? roundMoney((completedLeads / totalLeads) * 100) : 0;
    // Recent Quotes
    const recentQuotes = db.prepare(`
    SELECT q.*, c.name as client_name, c.company_name as client_company
    FROM quotes q
    JOIN clients c ON q.client_id = c.id
    WHERE q.is_archived = 0
    ORDER BY q.created_at DESC
    LIMIT 5
  `).all();
    // Recent Invoices
    const recentInvoices = db.prepare(`
    SELECT i.*, c.name as client_name, c.company_name as client_company
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    WHERE i.is_archived = 0
    ORDER BY i.created_at DESC
    LIMIT 5
  `).all();
    // Recent Leads
    const recentLeads = db.prepare(`
    SELECT * FROM leads ORDER BY last_activity_at DESC LIMIT 5
  `).all();
    // Recent Audit Logs
    const recentLogs = db.prepare(`
    SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 6
  `).all();
    res.json({
        metrics: {
            totalQuotes: totalQuotesRow?.count || 0,
            acceptedQuotes: acceptedQuotesRow?.count || 0,
            totalInvoices: totalInvoicesRow?.count || 0,
            paidInvoices: paidInvoicesRow?.count || 0,
            overdueInvoices: overdueInvoicesRow?.count || 0,
            outstandingBalance: roundMoney(balancesRow?.total_balance || 0),
            totalInvoiced: roundMoney(balancesRow?.total_invoiced || 0),
            totalCollected: roundMoney(balancesRow?.total_collected || 0),
            totalClients: totalClientsRow?.count || 0,
            newEnquiries: totalEnquiriesRow?.count || 0,
            totalLeads,
            completedLeads,
            abandonedLeads: abandonedLeadsRow?.count || 0,
            pendingReviewQuotes: pendingReviewQuotesRow?.count || 0,
            pipelineValue: roundMoney(pipelineValueRow?.total || 0),
            followUpsDue: followUpsDueRow?.count || 0,
            conversionRate,
        },
        recentQuotes,
        recentInvoices,
        recentLeads,
        recentLogs,
    });
});
export default router;
