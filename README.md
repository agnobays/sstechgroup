# S&S Tech Group (Pty) Ltd — Official Website & Business Engine

Official production-grade web application and business management platform for **S&S Tech Group (Pty) Ltd**, a premier South African digital technology and software solutions company.

---

## 🏛️ Company Information & Branding

- **Company Name**: S&S Tech Group (Pty) Ltd
- **Telephone / WhatsApp**: `069 884 7200` (`+27 69 884 7200`)
- **Direct WhatsApp Chat**: [wa.me/27698847200](https://wa.me/27698847200)
- **Official Email**: `info@sstechgroup.co.za`
- **Official Brand Palette**:
  - Black: `#080808`
  - Charcoal: `#101010`
  - Gold: `#D9AD32`
  - Gold Highlight: `#F1CC59`
  - Warm Grey: `#C2C2BD`
  - Off-White: `#F7F7F5`

---

## 🚀 Key Modules & Capabilities

### 1. Public Web Experience
- **Home (`/`)**: High-impact company introduction, core service pillars, verified client showcases, 6-step delivery framework, and prominent quote CTA.
- **About Us (`/about`)**: Detailed company background, South African digital capabilities, architecture principles, and delivery standards.
- **Packages & Pricing (`/packages`)**: Transparent website development packages (Starter R7,500, Business R12,500, Professional R18,500, Custom from R25,000) and infrastructure services (Hosting R350/mo, Maintenance R750/mo, Domain R180/yr, M365 R750).
- **Portfolio & Case Studies (`/portfolio` & `/work`)**: Verified client production platforms with live links:
  - [ticketsta.com](https://ticketsta.com) — Event Ticketing & Reservation Platform
  - [agnoandfriends.com](https://agnoandfriends.com) — Entertainment & Media Platform
  - [newjack.co.za](https://www.newjack.co.za) — Corporate Business Website
  - [engineering.ukzn.ac.za](https://engineering.ukzn.ac.za/) — UKZN School of Engineering Academic Portal
  - [agriculture-science.ukzn.ac.za](https://agriculture-science.ukzn.ac.za/) — UKZN College of Agriculture, Engineering & Science
  - [falakhefunerals.co.za](https://falakhefunerals.co.za) — Funeral Services & Parlour Website
  - [isibayalifestylekzn.co.za](https://isibayalifestylekzn.co.za) — Hospitality & Lifestyle Venue Experience
- **Interactive AI Quotation Engine (`/get-a-quote`)**: Multi-step conversational estimation wizard powered by a deterministic SQLite pricing engine. Calculates once-off and recurring fees, generates persistent draft records, streams print-ready PDFs, allows direct email delivery to customer inboxes, and offers a 1-click legal acceptance and invoice generation flow.
- **How We Work (`/how-we-work`)**: 6-step project delivery framework.
- **Contact & Enquiries (`/contact`)**: Validated project intake form storing submissions directly in the SQLite database (`/api/enquiries`), with telephone, email, and direct WhatsApp links.
- **POPIA Privacy Policy (`/privacy-policy`)**: South African Protection of Personal Information Act (POPIA) compliance declaration and zero-training AI guarantee.

### 2. Private Admin Portal (`/admin`)
- **Protected by server-side JWT authentication and HTTP-only cookies.**
- **Quotations Management (`/admin/quotes`)**: Create, duplicate, edit, filter, email directly to clients, stream vector PDFs, and convert accepted quotes to invoices.
- **Tax Invoices & Payments (`/admin/invoices`)**: Sequential document numbering (`INV-YYYY-XXXX`), partial/full payment recording, balance calculations, audit trails, branded PDF generation, and direct client email dispatches with EFT banking details.
- **CRM Leads & Abandonment Tracker (`/admin/leads`)**: Captures questionnaire drop-offs, recovery triggers, and prospect communication notes.
- **Follow-up Queue (`/admin/follow-ups`)**: Time-prioritized sales pipeline tracking upcoming contact dates and status updates.
- **Packages & Rates Catalogue (`/admin/pricing`)**: Administrative controls over package deliverables and recurring fee structures.
- **Client Directory (`/admin/clients`)**: Full billing history and contact management.
- **Audit Logs (`/admin/audit-logs`)**: Immutable event logging for compliance and governance.
- **Company Settings (`/admin/settings`)**: Configurable banking details, VAT registrations, and invoice payment terms.

### 3. Branded PDF & Email Engine
- **Vector PDF Generation (`pdfkit`)**: Generates print-ready PDFs with S&S Tech Group gold/black header badges, double-entry financial tables, and South African banking details.
- **Direct Email Dispatch (`nodemailer`)**:
  - Automatically attaches the generated PDF.
  - Sends branded HTML emails with personalized notes.
  - Automatically transitions draft quotes to `Sent` and draft invoices to `Issued`.
  - Supports live SMTP (Gmail, Microsoft 365, Mailgun, AWS SES) or zero-config simulated streaming mode in development.

---

## 🛠️ Local Development & Rendering on Phone

### 1. Prerequisites
- Node.js 18+ (tested on Node v20+)
- npm or yarn

### 2. Installation
```bash
git clone <repository-url>
cd ss_tech_group
npm install
```

### 3. Initialize Default Admin
```bash
npm run admin:create
```
Default credentials:
- **Email**: `admin@sstechgroup.co.za`
- **Password**: `AdminPassword2026!`

### 4. Running the Application

To render on your local desktop machine:
```bash
# Terminal 1: Backend API (Port 5000)
npm run dev:server

# Terminal 2: Frontend (Port 3000)
npm run dev
```

To render and test on your **phone** over your local Wi-Fi:
```bash
# Start Vite with the host flag so it listens on your local network
npm run dev -- --host
```
Vite will output a local network URL such as:
```text
  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.1.xxx:3000/
```
Open the **Network URL** (`http://192.168.1.xxx:3000`) on your mobile browser (Safari, Chrome) to test the responsive mobile layout, sticky navigation drawer, and floating WhatsApp contact button.

### 5. Running the Test Suite
```bash
npm test
```
Executes all 17 integration tests covering financial precision, document numbering, auth guards, customer conversion, PDF generation, and email dispatches.

### 6. Building for Production
```bash
npm run build
```
Compiles TypeScript with 0 errors and bundles static assets via Vite.

---

## 🔒 Security & Privacy Architecture
- No public user registration.
- Passwords hashed with `bcryptjs` (salt rounds: 10).
- Rate-limited login endpoints (`express-rate-limit`).
- SQLite in Write-Ahead Logging (`WAL`) mode with atomic immediate transactions to guarantee strict sequential document numbering without race conditions.
- Strict POPIA compliance: customer data submitted through the AI questionnaire is never passed to external AI providers for model training.

---

© 2026 S&S Tech Group (Pty) Ltd. All rights reserved.
