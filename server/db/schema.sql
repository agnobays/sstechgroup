-- S&S Tech Group Database Schema

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS company_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  company_name TEXT NOT NULL DEFAULT 'S&S Tech Group (Pty) Ltd',
  registration_number TEXT DEFAULT '',
  vat_number TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  physical_address TEXT DEFAULT '',
  postal_address TEXT DEFAULT '',
  bank_name TEXT DEFAULT '',
  bank_account_name TEXT DEFAULT '',
  bank_account_number TEXT DEFAULT '',
  bank_branch_code TEXT DEFAULT '',
  bank_account_type TEXT DEFAULT '',
  bank_swift TEXT DEFAULT '',
  default_payment_terms TEXT DEFAULT 'Payment due within 14 days of invoice date.',
  default_quote_notes TEXT DEFAULT 'This quotation is valid for 30 days from the date of issue. Scope adjustments may affect timelines and costings.',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  company_name TEXT DEFAULT '',
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  billing_address TEXT DEFAULT '',
  tax_number TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_sequences (
  doc_type TEXT NOT NULL,
  year INTEGER NOT NULL,
  current_number INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (doc_type, year)
);

CREATE TABLE IF NOT EXISTS packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  starting_price REAL NOT NULL,
  description TEXT NOT NULL,
  features_json TEXT NOT NULL DEFAULT '[]',
  ideal_for TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS optional_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  billing_cycle TEXT NOT NULL DEFAULT 'once_off', -- once_off, monthly, annual
  description TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_token TEXT UNIQUE NOT NULL,
  full_name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  organization TEXT DEFAULT '',
  business_type TEXT DEFAULT '',
  service_required TEXT DEFAULT '',
  step_progress INTEGER NOT NULL DEFAULT 1,
  questionnaire_data_json TEXT NOT NULL DEFAULT '{}',
  recommended_package_id INTEGER,
  estimated_value REAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'In Progress', -- In Progress, Completed, Abandoned, Contacted, Converted, Closed
  assigned_to TEXT DEFAULT '',
  next_follow_up TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  consent_marketing INTEGER NOT NULL DEFAULT 0,
  consent_followup INTEGER NOT NULL DEFAULT 1,
  last_activity_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recommended_package_id) REFERENCES packages (id)
);

CREATE TABLE IF NOT EXISTS follow_ups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER,
  quote_id INTEGER,
  scheduled_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Sent, Cancelled, Failed
  attempt_number INTEGER NOT NULL DEFAULT 1,
  template_key TEXT NOT NULL DEFAULT 'lead_abandonment',
  channel TEXT NOT NULL DEFAULT 'Internal', -- Internal, Email, SMS
  notes TEXT DEFAULT '',
  sent_at TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads (id),
  FOREIGN KEY (quote_id) REFERENCES quotes (id)
);

CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_number TEXT UNIQUE NOT NULL,
  client_id INTEGER NOT NULL,
  lead_id INTEGER,
  package_id INTEGER,
  access_token TEXT UNIQUE,
  issue_date TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft', -- Draft, Preliminary Estimate, Pending Review, Ready for Customer, Sent, Accepted, Revision Requested, Rejected, Expired, Abandoned
  scope_of_work TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  payment_terms TEXT DEFAULT '',
  subtotal REAL NOT NULL DEFAULT 0,
  discount_amount REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  recurring_monthly REAL NOT NULL DEFAULT 0,
  recurring_annual REAL NOT NULL DEFAULT 0,
  ai_recommendation_notes TEXT DEFAULT '',
  revision_notes TEXT DEFAULT '',
  accepted_at TEXT,
  accepted_by_ip TEXT,
  acceptance_terms_agreed INTEGER DEFAULT 0,
  converted_to_invoice_id INTEGER,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL DEFAULT 'System',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients (id),
  FOREIGN KEY (lead_id) REFERENCES leads (id),
  FOREIGN KEY (package_id) REFERENCES packages (id),
  FOREIGN KEY (converted_to_invoice_id) REFERENCES invoices (id)
);

CREATE TABLE IF NOT EXISTS quote_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  discount_percent REAL NOT NULL DEFAULT 0,
  tax_rate REAL NOT NULL DEFAULT 0,
  line_total REAL NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (quote_id) REFERENCES quotes (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT UNIQUE NOT NULL,
  quote_id INTEGER,
  client_id INTEGER NOT NULL,
  issue_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft', -- Draft, Issued, Partially Paid, Paid, Overdue, Cancelled
  notes TEXT DEFAULT '',
  payment_terms TEXT DEFAULT '',
  subtotal REAL NOT NULL DEFAULT 0,
  discount_amount REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  paid_amount REAL NOT NULL DEFAULT 0,
  balance_due REAL NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL DEFAULT 'System',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quote_id) REFERENCES quotes (id),
  FOREIGN KEY (client_id) REFERENCES clients (id)
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  discount_percent REAL NOT NULL DEFAULT 0,
  tax_rate REAL NOT NULL DEFAULT 0,
  line_total REAL NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  payment_date TEXT NOT NULL,
  payment_method TEXT NOT NULL, -- EFT, Card, Bank Deposit, Other
  reference TEXT NOT NULL,
  notes TEXT DEFAULT '',
  recorded_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER,
  admin_name TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  organization TEXT DEFAULT '',
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  service_required TEXT NOT NULL,
  estimated_budget TEXT DEFAULT '',
  project_description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'New', -- New, Contacted, Converted, Archived
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL,
  bio TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  encrypted_password TEXT NOT NULL,
  incoming_server TEXT NOT NULL DEFAULT 'mail.sstechgroup.co.za',
  incoming_port TEXT NOT NULL DEFAULT '993 (IMAP SSL) / 143',
  smtp_server TEXT NOT NULL DEFAULT 'mail.sstechgroup.co.za',
  smtp_port TEXT NOT NULL DEFAULT '587 (TLS) / 465 (SSL)',
  webmail_url TEXT DEFAULT 'https://sstechgroup.co.za:2222/webmail',
  is_system_smtp INTEGER NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

