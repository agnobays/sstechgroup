# S&S TECH GROUP — PROJECT RULES & QUALITY GUARDRAILS

These rules govern the development, maintenance, and deployment of the official website and private business management portal for **S&S Tech Group (Pty) Ltd**.

---

## 1. Brand & Naming Integrity
- **Exact Name**: The company name must ALWAYS be written as **S&S Tech Group** or **S&S Tech Group (Pty) Ltd**.
- **No Variations**: Never write `S;S Tech Group`, and never replace the ampersand (`&`) with a semicolon (`;`).
- **Official Palette**:
  - Black: `#080808` (Primary background, navigation, hero, footer)
  - Gold: `#D9AD32` (Primary CTA, highlights, badges, active states)
  - Gold Highlight: `#F1CC59` (Hover accents, focal highlights)
  - Warm Grey: `#C2C2BD` (Subheadings, secondary copy, muted borders)
  - Off-White: `#F7F7F5` (Readable text, high-contrast badges)
  - Charcoal: `#101010` (Card backgrounds, secondary dark surfaces)

---

## 2. Integrity & Truth in Information
- **No Mock Data as Real Data**: Never present mocked or dummy data as authentic company or client records.
- **No Fabricated Social Proof**: Do not invent testimonials, customer quotes, awards, or arbitrary performance statistics (e.g., "99.9% uptime guaranteed", "500+ happy clients").
- **No Fabricated Contact or Legal Details**: Never invent registration numbers, physical addresses, telephone numbers, or banking details. Unconfirmed details must be left blank in configuration or marked clearly as "Pending Company Approval".
- **Concept Labelling**: Unconfirmed or demonstration portfolio projects must be explicitly marked as *"Demonstration Concept"* or *"Internal Case Study"*, never claimed as executed client contracts without verification.
- **Honest Submissions**: Contact forms must never claim an enquiry was sent unless a verified backend storage or dispatch mechanism actually succeeded. Failed or unconfigured channels must report their true status.

---

## 3. Security & Access Control
- **No Exposed Secrets**: Never commit passwords, private keys, API keys, or JWT secrets into frontend bundles, git history, or client responses.
- **Server-Side Enforcement**: All authorization, financial calculations, document numbering, and PDF rendering must be enforced and computed on the server. Frontend guards are for UX only.
- **Password Protection**: Passwords must be hashed with `bcryptjs` (work factor >= 10).
- **Private Documents**: Quote and Invoice PDFs, financial figures, and client registries are strictly private and accessible only via authenticated admin sessions.
- **No Public Registration**: Admin accounts can only be provisioned through secure server-side CLI execution (`npm run admin:create`).

---

## 4. Financial Calculations & Document Integrity
- **Concurrency & Numbering**: Sequential document numbers (e.g. `QT-2026-0001`, `INV-2026-0001`) must be generated atomically inside database transactions to eliminate race conditions.
- **Double-Entry Accuracy**: Subtotals, line-item discounts, VAT/tax, invoice totals, paid amounts, and balances due must calculate with arithmetic consistency on the backend.
- **Payment Verification**: An invoice cannot be marked as `Paid` or `Partially Paid` without a verified payment record detailing date, amount, reference, and recording user.
- **Audit Trails**: All creation, update, status change, and payment actions must be logged in an audit log with timestamps and user identifiers.

---

## 5. Engineering & Deployment Standards
- **No Dead Links or Buttons**: Every button, link, and action must perform its advertised purpose.
- **Verified Testing**: Never claim tests pass without executing the automated test suite (`npm test`).
- **Clean Builds**: Production build (`npm run build`) must compile cleanly with zero TypeScript errors.
- **Deployment Protocol**: No deployment to production or modifications to production DNS/hosting configuration without explicit client authorization.
