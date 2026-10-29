import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { encryptCredential } from '../services/cryptoService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const dbPath = process.env.DATABASE_PATH || path.resolve(__dirname, '../../data/sstechgroup.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export interface DatabaseInterface {
  prepare(sql: string): {
    all(...params: any[]): any[];
    get(...params: any[]): any;
    run(...params: any[]): { changes: number; lastInsertRowid: number | bigint };
  };
  exec(sql: string): any;
  pragma(cmd: string): any;
  transaction<T extends (...args: any[]) => any>(fn: T): T;
}

let dbInstance: DatabaseInterface;

const tryNative = process.env.USE_WASM_SQLITE !== 'true';

if (tryNative) {
  try {
    const Database = require('better-sqlite3');
    const nativeDb = new Database(dbPath);
    nativeDb.pragma('journal_mode = WAL');
    nativeDb.pragma('foreign_keys = ON');
    dbInstance = nativeDb;
    console.log('📦 SQLite: Using native better-sqlite3 driver');
  } catch (nativeErr: any) {
    console.warn(`⚠️ SQLite: Native better-sqlite3 unavailable (${nativeErr?.message || nativeErr}). Loading WebAssembly SQLite (sql.js)...`);
    dbInstance = await initWasmDatabase();
  }
} else {
  console.log('📦 SQLite: USE_WASM_SQLITE requested. Loading WebAssembly SQLite (sql.js)...');
  dbInstance = await initWasmDatabase();
}

async function initWasmDatabase(): Promise<DatabaseInterface> {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();

  let wasmDb: any;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    wasmDb = new SQL.Database(fileBuffer);
  } else {
    wasmDb = new SQL.Database();
  }

  let inTransaction = false;
  const saveToDisk = () => {
    if (inTransaction) return;
    try {
      const data = wasmDb.export();
      fs.writeFileSync(dbPath, Buffer.from(data));
    } catch (err) {
      console.error('Failed to save SQLite database to disk:', err);
    }
  };

  const normalizeParams = (params: any[]): any[] => {
    let actual = params;
    if (params.length === 1 && Array.isArray(params[0])) {
      actual = params[0];
    }
    return actual.map(p => (p === undefined ? null : p));
  };

  return {
    prepare(sql: string) {
      return {
        all(...params: any[]) {
          const stmt = wasmDb.prepare(sql);
          const norm = normalizeParams(params);
          if (norm.length > 0) {
            stmt.bind(norm);
          }
          const rows: any[] = [];
          while (stmt.step()) {
            rows.push(stmt.getAsObject());
          }
          stmt.free();
          return rows;
        },
        get(...params: any[]) {
          const stmt = wasmDb.prepare(sql);
          const norm = normalizeParams(params);
          if (norm.length > 0) {
            stmt.bind(norm);
          }
          let row: any = undefined;
          if (stmt.step()) {
            row = stmt.getAsObject();
          }
          stmt.free();
          return row;
        },
        run(...params: any[]) {
          const stmt = wasmDb.prepare(sql);
          const norm = normalizeParams(params);
          if (norm.length > 0) {
            stmt.bind(norm);
          }
          stmt.step();
          stmt.free();
          saveToDisk();

          const changes = wasmDb.getRowsModified();
          const lastIdRes = wasmDb.exec('SELECT last_insert_rowid() as id');
          const lastInsertRowid = lastIdRes[0]?.values[0]?.[0] ?? 0;
          return { changes, lastInsertRowid };
        }
      };
    },
    exec(sql: string) {
      wasmDb.exec(sql);
      saveToDisk();
    },
    pragma(cmd: string) {
      try {
        wasmDb.exec('PRAGMA ' + cmd);
      } catch {
        // Safe ignore
      }
    },
    transaction<T extends (...args: any[]) => any>(fn: T): T {
      const wrapped = (...args: Parameters<T>): ReturnType<T> => {
        inTransaction = true;
        wasmDb.exec('BEGIN TRANSACTION;');
        try {
          const result = fn(...args);
          wasmDb.exec('COMMIT;');
          inTransaction = false;
          saveToDisk();
          return result;
        } catch (err) {
          try {
            wasmDb.exec('ROLLBACK;');
          } catch {}
          inTransaction = false;
          throw err;
        }
      };
      return wrapped as T;
    }
  };
}

export const db = dbInstance;

export function initDatabase(): void {
  const candidatePaths = [
    path.resolve(__dirname, 'schema.sql'),
    path.resolve(__dirname, '../../server/db/schema.sql'),
    path.resolve(__dirname, '../server/db/schema.sql'),
    path.resolve(process.cwd(), 'server/db/schema.sql'),
    path.resolve(process.cwd(), 'dist-server/db/schema.sql'),
  ];

  let schemaSql = '';
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        schemaSql = fs.readFileSync(p, 'utf-8');
        break;
      } catch {
        // Continue to next candidate
      }
    }
  }

  if (schemaSql) {
    try {
      db.exec(schemaSql);
    } catch (err) {
      console.warn('Notice while applying schema.sql:', err);
    }
  }

  // Safe schema migrations for existing database files
  const columnsToAdd = [
    { table: 'quotes', column: 'lead_id', type: 'INTEGER' },
    { table: 'quotes', column: 'package_id', type: 'INTEGER' },
    { table: 'quotes', column: 'access_token', type: 'TEXT' },
    { table: 'quotes', column: 'recurring_monthly', type: 'REAL DEFAULT 0' },
    { table: 'quotes', column: 'recurring_annual', type: 'REAL DEFAULT 0' },
    { table: 'quotes', column: 'ai_recommendation_notes', type: 'TEXT DEFAULT ""' },
    { table: 'quotes', column: 'revision_notes', type: 'TEXT DEFAULT ""' },
    { table: 'quotes', column: 'accepted_at', type: 'TEXT' },
    { table: 'quotes', column: 'accepted_by_ip', type: 'TEXT' },
    { table: 'quotes', column: 'acceptance_terms_agreed', type: 'INTEGER DEFAULT 0' },
  ];

  for (const col of columnsToAdd) {
    try {
      db.prepare(`ALTER TABLE ${col.table} ADD COLUMN ${col.column} ${col.type}`).run();
    } catch {
      // Column already exists, safe to ignore
    }
  }

  // Initialize company_settings default row if not present
  const existingSettings = db.prepare('SELECT id FROM company_settings WHERE id = 1').get();
  if (!existingSettings) {
    db.prepare(`
      INSERT INTO company_settings (
        id, company_name, registration_number, vat_number,
        email, phone, physical_address, postal_address,
        bank_name, bank_account_name, bank_account_number,
        bank_branch_code, bank_account_type, bank_swift,
        default_payment_terms, default_quote_notes
      ) VALUES (
        1, 'S&S Tech Group (Pty) Ltd', '2026/802170/07', '',
        'info@sstechgroup.co.za', '069 884 7200', 'South Africa', '',
        'FNB', 'S&S Tech Group (Pty) Ltd', '63169376134',
        '250655', 'Business Account', '',
        'Payment due within 14 days of invoice date.',
        'This quotation is valid for 30 days from the date of issue. Scope adjustments may affect timelines and costings.'
      )
    `).run();
  }

  // Seed Approved Initial Packages
  const existingPackages = db.prepare('SELECT COUNT(*) as count FROM packages').get() as any;
  if (!existingPackages || existingPackages.count === 0) {
    const insertPackage = db.prepare(`
      INSERT INTO packages (key, name, starting_price, description, features_json, ideal_for, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertPackage.run(
      'landing_page',
      'Landing Page / Launchpad',
      2500,
      'A high-impact, single-page responsive website designed for rapid launches, startup profiles, and immediate lead generation.',
      JSON.stringify([
        '1 high-impact responsive single-page layout (Hero, About, Services, Call to Action)',
        'Direct WhatsApp click-to-chat & lead capture contact form',
        'Mobile-first responsive UX and fast asset loading',
        'Basic Google Search Console indexing & local SEO meta tags',
        'Social media preview card (Open Graph / WhatsApp preview) & SSL encryption',
        'Standard 7-day post-launch warranty & setup support',
      ]),
      'Startups, sole proprietors, promotions, single products, and micro-enterprises',
      1
    );

    insertPackage.run(
      'starter',
      'Starter Website',
      7500,
      'A streamlined, professional 1-3 page web presence engineered for emerging businesses and sole proprietors.',
      JSON.stringify([
        'Up to 3 responsive custom-designed pages (Home, About/Services, Contact)',
        'Mobile-friendly responsive layout and accessible navigation',
        'Direct project enquiry form with email notifications',
        'Basic SEO metadata and Google Search Console sitemap setup',
        'Social media and WhatsApp chat integration',
        'Standard 14-day post-launch warranty',
      ]),
      'Small businesses, consultants, sole practitioners, and local services',
      2
    );

    insertPackage.run(
      'business',
      'Business Website',
      12500,
      'A comprehensive, high-credibility 4-7 page digital platform designed for established SMEs and growing companies.',
      JSON.stringify([
        'Up to 7 structured pages (Home, About, Multi-Service breakdown, Portfolio/Case Studies, Team, Contact)',
        'Bespoke visual design reflecting established company branding',
        'Interactive enquiry forms with service-specific dropdown routing',
        'Performance optimisation and rapid asset loading',
        'Full Open Graph and structured data schema implementation',
        'CMS readiness or structured editable sections',
        '30-day post-launch warranty and technical support',
      ]),
      'Growing enterprises, commercial firms, educational departments, and service providers',
      3
    );

    insertPackage.run(
      'professional',
      'Professional Website',
      18500,
      'An advanced, high-performance web platform for larger organisations, educational institutions, and corporate entities.',
      JSON.stringify([
        'Up to 12 pages with tailored section templates',
        'Structured publication, blog, or document download repositories',
        'Multi-step intake forms, application flows, or booking pipelines',
        'Advanced accessibility and cross-browser compliance testing',
        'Search engine optimisation with canonical hierarchies',
        'Interactive components, filterable galleries, or course directories',
        'Priority 45-day post-launch warranty and support',
      ]),
      'Institutions, multi-branch companies, colleges, and demanding corporate presences',
      4
    );

    insertPackage.run(
      'custom_app',
      'Custom Web Application',
      25000,
      'Bespoke web applications, workflow automation tools, and internal portals designed around your business logic.',
      JSON.stringify([
        'Architecture consultation, database modeling, and API specifications',
        'Secure user authentication and role-based access control',
        'Custom administrative dashboards and operational workflows',
        'ACID database transactions with automated audit logs',
        'Document generation (PDF invoices, job cards, certificates)',
        'Third-party API and payment gateway integrations',
        '60-day post-launch warranty and comprehensive system handover',
      ]),
      'Businesses requiring custom SaaS, quoting systems, field operation tools, or portal automation',
      5
    );
  } else {
    // Migration check: ensure 'landing_page' package exists for existing databases
    const hasLandingPkg = db.prepare("SELECT id FROM packages WHERE key = 'landing_page'").get() as any;
    if (!hasLandingPkg) {
      db.prepare(`
        INSERT INTO packages (key, name, starting_price, description, features_json, ideal_for, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        'landing_page',
        'Landing Page / Launchpad',
        2500,
        'A high-impact, single-page responsive website designed for rapid launches, startup profiles, and immediate lead generation.',
        JSON.stringify([
          '1 high-impact responsive single-page layout (Hero, About, Services, Call to Action)',
          'Direct WhatsApp click-to-chat & lead capture contact form',
          'Mobile-first responsive UX and fast asset loading',
          'Basic Google Search Console indexing & local SEO meta tags',
          'Social media preview card (Open Graph / WhatsApp preview) & SSL encryption',
          'Standard 7-day post-launch warranty & setup support',
        ]),
        'Startups, sole proprietors, promotions, single products, and micro-enterprises',
        1
      );

      db.prepare("UPDATE packages SET sort_order = 2 WHERE key = 'starter'").run();
      db.prepare("UPDATE packages SET sort_order = 3 WHERE key = 'business'").run();
      db.prepare("UPDATE packages SET sort_order = 4 WHERE key = 'professional'").run();
      db.prepare("UPDATE packages SET sort_order = 5 WHERE key = 'custom_app'").run();
    }
  }

  // Seed Approved Optional Services
  const existingOptions = db.prepare('SELECT COUNT(*) as count FROM optional_services').get() as any;
  if (!existingOptions || existingOptions.count === 0) {
    const insertOption = db.prepare(`
      INSERT INTO optional_services (key, name, price, billing_cycle, description, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertOption.run(
      'hosting',
      'Managed Cloud Hosting',
      350,
      'monthly',
      'High-speed, secure SSD cloud hosting with automated SSL encryption, DDoS mitigation, and daily server backups.',
      1
    );

    insertOption.run(
      'maintenance',
      'Ongoing Website Maintenance',
      750,
      'monthly',
      'Proactive framework updates, security dependency patching, content updates, uptime monitoring, and priority technical support.',
      2
    );

    insertOption.run(
      'domain',
      'Domain Registration & DNS Setup',
      180,
      'annual',
      '.co.za or international domain registration assistance with full DNS routing (A, CNAME, MX, SPF, DKIM).',
      3
    );

    insertOption.run(
      'm365',
      'Microsoft 365 Setup & Migration',
      750,
      'once_off',
      'Professional business email domain configuration, user mailbox setup, and DNS security hardening (licences charged separately).',
      4
    );
  }

  // Ensure team_members table exists
  db.exec(`
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
  `);

  // Seed initial 6 team members if table is empty
  const existingTeam = db.prepare('SELECT COUNT(*) as count FROM team_members').get() as any;
  if (!existingTeam || existingTeam.count === 0) {
    const insertMember = db.prepare(`
      INSERT INTO team_members (name, role, image_url, bio, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `);

    for (let i = 1; i <= 6; i++) {
      insertMember.run('', '', `/images/team/team-${i}.jpg`, '', i);
    }
  }

  // Ensure email_accounts table exists
  db.exec(`
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
  `);

  // Seed default 6 email accounts if empty
  const existingEmails = db.prepare('SELECT COUNT(*) as count FROM email_accounts').get() as any;
  if (!existingEmails || existingEmails.count === 0) {
    const insertEmail = db.prepare(`
      INSERT INTO email_accounts (
        label, email, encrypted_password,
        incoming_server, incoming_port,
        smtp_server, smtp_port,
        webmail_url, is_system_smtp, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const defaultAccounts = [
      {
        label: 'General Enquiries & System Outbound SMTP',
        email: 'info@sstechgroup.co.za',
        password: 'mMfZKH3vanytTmUhFhQn',
        is_system_smtp: 1,
        notes: 'Primary corporate address used for automated quotes, invoices, and website client enquiries.'
      },
      {
        label: 'Sam N. (Management / Operations)',
        email: 'sam.n@sstechgroup.co.za',
        password: 'DTQgb46Tp5YBhgf7Spj5',
        is_system_smtp: 0,
        notes: 'Official mailbox for Sam N.'
      },
      {
        label: 'Nhlakanipho S. (Executive / Solutions)',
        email: 'nhlakanipho.s@sstechgroup.co.za',
        password: '5WyMJzxfCtNmp3rTY7F4',
        is_system_smtp: 0,
        notes: 'Official mailbox for Nhlakanipho S.'
      },
      {
        label: 'Nhlakanipho M. (Technical / Delivery)',
        email: 'nhlakanipho.m@sstechgroup.co.za',
        password: 'F2pMDjdgkwQckr7E5h6h',
        is_system_smtp: 0,
        notes: 'Official mailbox for Nhlakanipho M.'
      },
      {
        label: 'Sibusiso M. (Engineering / Systems)',
        email: 'sibusiso.m@sstechgroup.co.za',
        password: 'fU8Spgp76mqD5Q3p7Lt6',
        is_system_smtp: 0,
        notes: 'Official mailbox for Sibusiso M.'
      },
      {
        label: 'Siyabonga N. (Engineering / Support)',
        email: 'siyabonga.n@sstechgroup.co.za',
        password: 'GEsuXScLB4dRBtT6pL5v',
        is_system_smtp: 0,
        notes: 'Official mailbox for Siyabonga N.'
      }
    ];

    for (const acc of defaultAccounts) {
      insertEmail.run(
        acc.label,
        acc.email,
        encryptCredential(acc.password),
        'mail.sstechgroup.co.za',
        '993 (IMAP SSL) / 143 (IMAP)',
        'mail.sstechgroup.co.za',
        '587 (SMTP TLS) / 465 (SSL)',
        'https://sstechgroup.co.za:2222/webmail',
        acc.is_system_smtp,
        acc.notes
      );
    }
  }

  // Ensure telemetry tables exist for multi-app fleet monitoring
  db.exec(`
    CREATE TABLE IF NOT EXISTS telemetry_apps (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT,
      status TEXT NOT NULL DEFAULT 'UP',
      last_heartbeat TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS telemetry_heartbeats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id TEXT NOT NULL,
      session_id TEXT,
      status TEXT NOT NULL,
      ip TEXT,
      city TEXT,
      region TEXT,
      country TEXT,
      device_type TEXT,
      screen TEXT,
      page TEXT,
      environment TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS telemetry_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id TEXT NOT NULL,
      session_id TEXT,
      event_type TEXT NOT NULL,
      page TEXT,
      data_json TEXT,
      ip TEXT,
      city TEXT,
      region TEXT,
      country TEXT,
      device_type TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS telemetry_errors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id TEXT NOT NULL,
      session_id TEXT,
      error_type TEXT NOT NULL,
      message TEXT NOT NULL,
      stack TEXT,
      page TEXT,
      device_type TEXT,
      ip TEXT,
      city TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed Falakhe Funerals as the primary fleet app
  try {
    const existingFalakhe = db.prepare('SELECT id FROM telemetry_apps WHERE id = ?').get('falakhe-funerals');
    if (!existingFalakhe) {
      db.prepare(`
        INSERT INTO telemetry_apps (id, name, url, status, last_heartbeat)
        VALUES (?, ?, ?, 'UP', CURRENT_TIMESTAMP)
      `).run('falakhe-funerals', 'Falakhe Funeral Services', 'https://falakhefunerals.co.za');
    }
  } catch (err) {
    console.warn('Telemetry app seed notice:', err);
  }
}

export default db;
