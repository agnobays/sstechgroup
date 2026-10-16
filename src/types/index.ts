export interface Admin {
  id: number;
  email: string;
  fullName: string;
  role: string;
}

export interface CompanySettings {
  id: number;
  company_name: string;
  registration_number: string;
  vat_number: string;
  email: string;
  phone: string;
  physical_address: string;
  postal_address: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_branch_code: string;
  bank_account_type: string;
  bank_swift: string;
  default_payment_terms: string;
  default_quote_notes: string;
  updated_at?: string;
}

export interface Client {
  id: number;
  name: string;
  company_name: string;
  email: string;
  phone: string;
  billing_address: string;
  tax_number: string;
  notes: string;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

export interface LineItem {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_rate: number;
  line_total?: number;
  sort_order?: number;
}

export type QuoteStatus =
  | 'Draft'
  | 'Preliminary Estimate'
  | 'Pending Review'
  | 'Ready for Customer'
  | 'Sent'
  | 'Accepted'
  | 'Revision Requested'
  | 'Rejected'
  | 'Expired'
  | 'Abandoned';

export interface Package {
  id: number;
  key: string;
  name: string;
  starting_price: number;
  description: string;
  features_json: string;
  features?: string[];
  ideal_for: string;
  sort_order: number;
  is_active: number;
}

export interface OptionalService {
  id: number;
  key: string;
  name: string;
  price: number;
  billing_cycle: 'once_off' | 'monthly' | 'annual';
  description: string;
  is_active: number;
  sort_order: number;
}

export interface Lead {
  id: number;
  session_token: string;
  full_name: string;
  email: string;
  phone: string;
  organization: string;
  business_type: string;
  service_required: string;
  step_progress: number;
  questionnaire_data_json: string;
  questionnaire_data?: Record<string, any>;
  recommended_package_id?: number | null;
  recommended_package_name?: string;
  estimated_value: number;
  status: 'In Progress' | 'Completed' | 'Abandoned' | 'Contacted' | 'Converted' | 'Closed';
  assigned_to: string;
  next_follow_up: string;
  notes: string;
  consent_marketing: number;
  consent_followup: number;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
}

export interface FollowUp {
  id: number;
  lead_id?: number | null;
  quote_id?: number | null;
  scheduled_at: string;
  status: 'Pending' | 'Sent' | 'Cancelled' | 'Failed';
  attempt_number: number;
  template_key: string;
  channel: 'Internal' | 'Email' | 'SMS';
  notes: string;
  sent_at?: string | null;
  error_message?: string | null;
  created_at: string;
  lead_name?: string;
  lead_email?: string;
  lead_phone?: string;
  service_required?: string;
  quote_number?: string;
}

export interface Quote {
  id: number;
  quote_number: string;
  client_id: number;
  lead_id?: number | null;
  package_id?: number | null;
  package_name?: string;
  access_token?: string | null;
  client_name?: string;
  client_company?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  client_tax?: string;
  issue_date: string;
  expiry_date: string;
  status: QuoteStatus;
  scope_of_work: string;
  notes: string;
  payment_terms: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  recurring_monthly: number;
  recurring_annual: number;
  ai_recommendation_notes?: string;
  revision_notes?: string;
  accepted_at?: string | null;
  accepted_by_ip?: string | null;
  acceptance_terms_agreed?: number;
  converted_to_invoice_id?: number | null;
  is_archived: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  items?: LineItem[];
}

export type InvoiceStatus = 'Draft' | 'Issued' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';

export interface Invoice {
  id: number;
  invoice_number: string;
  quote_id?: number | null;
  client_id: number;
  client_name?: string;
  client_company?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  client_tax?: string;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  notes: string;
  payment_terms: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  is_archived: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  items?: LineItem[];
  payments?: Payment[];
}

export interface Payment {
  id: number;
  invoice_id: number;
  amount: number;
  payment_date: string;
  payment_method: 'EFT' | 'Card' | 'Bank Deposit' | 'Other';
  reference: string;
  notes: string;
  recorded_by: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  admin_id: number | null;
  admin_name: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface Enquiry {
  id: number;
  full_name: string;
  organization: string;
  email: string;
  phone: string;
  service_required: string;
  estimated_budget: string;
  project_description: string;
  status: 'New' | 'Contacted' | 'Converted' | 'Archived';
  created_at: string;
}

export interface DashboardMetrics {
  totalQuotes: number;
  acceptedQuotes: number;
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  outstandingBalance: number;
  totalInvoiced: number;
  totalCollected: number;
  totalClients: number;
  newEnquiries: number;
  totalLeads?: number;
  completedLeads?: number;
  abandonedLeads?: number;
  pendingReviewQuotes?: number;
  pipelineValue?: number;
  followUpsDue?: number;
  conversionRate?: number;
}
