# S&S Tech Group (Pty) Ltd — Production Deployment Guide

This guide explains how to deploy the production package to your hosting server, cPanel / DirectAdmin, or cloud VPS.

---

## 📦 What Is in the Package?

- **dist/**: Pre-compiled production React/Vite frontend bundle (including all 6 cropped team photos, minified assets, sitemap, robots.txt).
- **dist-server/**: Pre-compiled Express Node.js API backend (serving /api and SPA fallback routing).
- **data/sstechgroup.sqlite**: Pre-seeded, vacuumed, and checkpointed SQLite production database (with primary admin user, pricing packages, email marketing, and the 6 team member slots).
- **package.json & package-lock.json**: Production dependency definitions.
- **.env.production.example**: Configuration template for your domain, secrets, and optional SMTP email credentials.

---

## 🏢 cPanel / DirectAdmin Deployment (Recommended for Shared Hosting)

If your server gives -bash: npm: command not found, that is normal on cPanel/DirectAdmin because Node.js runs in an isolated environment. Follow these simple steps:

### Method 1: Using the cPanel Web Interface (Easiest — No SSH Needed)

1. Log in to your hosting control panel (cPanel or DirectAdmin).
2. Go to **Setup Node.js App** (or **NodeJS Selector**).
3. Click **Create Application**:
   - **Node.js version**: Choose 20.x (or 18.x).
   - **Application mode**: Production.
   - **Application root**: Enter the folder name where you uploaded the package (e.g. sstechgroup or public_html).
   - **Application URL**: Your domain (sstechgroup.co.za).
   - **Application startup file**: dist-server/index.js.
4. Click **Create**.
5. Once created, in the application details page, click the **\"Run NPM Install\"** button!
   *(The server will run npm install automatically in the correct Node.js environment).*
6. Add your environment variables under **Configuration / Environment variables**:
   - NODE_ENV = production
   - JWT_SECRET = (Enter a secure 64+ char random string)
   - CLIENT_URL = https://sstechgroup.co.za
7. Click **Restart Application** at the top. Your website and API are now live!

---

### Method 2: In SSH Terminal

If you are using the terminal ([sstechgr@da40 ~]$):

1. In your cPanel **Setup Node.js App** page, look at the top. There is an activation line:
   `ash
   source /home/sstechgr/nodevenv/sstechgroup/20/bin/activate && cd /home/sstechgr/sstechgroup
   `
2. Copy that command and paste it directly into your terminal.
3. Once activated, your terminal prompt will change to show the Node version, and 
pm will work immediately:
   `ash
   npm install --omit=dev
   `

*(Alternatively, try running /opt/alt/alt-nodejs20/root/usr/bin/npm install --omit=dev or /opt/cpanel/ea-nodejs20/bin/npm install --omit=dev).*

---

## 👥 Managing Your Team on the Admin Portal

1. Log into your admin portal at:
   https://sstechgroup.co.za/admin/login
2. In the sidebar, click **Our Team** (/admin/team).
3. You will see all 6 cropped team photos.
4. Click **Edit Details** on any card:
   - Type in the member's **Full Name**
   - Type in their **Role / Job Title** (e.g., *Lead Solutions Architect & Co-Founder*)
   - Add an optional **Bio summary**
   - Click **Save Profile**
5. Open your public About page (https://sstechgroup.co.za/about) to see the changes live!
