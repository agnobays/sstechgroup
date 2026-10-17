import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDatabase } from './db/database.js';
import authRoutes from './routes/auth.js';
import clientRoutes from './routes/clients.js';
import quoteRoutes from './routes/quotes.js';
import invoiceRoutes from './routes/invoices.js';
import dashboardRoutes from './routes/dashboard.js';
import settingsRoutes from './routes/settings.js';
import auditLogRoutes from './routes/auditLogs.js';
import enquiryRoutes from './routes/enquiries.js';
import packageRoutes from './routes/packages.js';
import leadRoutes from './routes/leads.js';
import publicQuoteRoutes from './routes/publicQuotes.js';
import followUpRoutes from './routes/followUps.js';
import teamRoutes from './routes/team.js';
import emailAccountsRoutes from './routes/emailAccounts.js';
import onboardingRoutes from './routes/onboarding.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB schema & default settings row
initDatabase();

export const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 login requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
});

// API Routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/public-quotes', publicQuoteRoutes);
app.use('/api/public/quotes', publicQuoteRoutes);
app.use('/api/follow-ups', followUpRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/email-accounts', emailAccountsRoutes);
app.use('/api/onboarding', onboardingRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    company: 'S&S Tech Group (Pty) Ltd',
    timestamp: new Date().toISOString(),
  });
});

// Production: serve built static files from dist directory
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// Client-side routing fallback for non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.resolve(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // In development when Vite runs separately, this is normal
      res.status(200).send('S&S Tech Group API Server Running. (Frontend running on Vite dev server)');
    }
  });
});

if (process.env.NODE_ENV !== 'test') {
  let portToListen: any = 5000;
  const isPassenger =
    typeof (globalThis as any).PhusionPassenger !== 'undefined' ||
    typeof (global as any).PhusionPassenger !== 'undefined' ||
    Boolean(process.env.PASSENGER_APP_ENV) ||
    Boolean(process.env.IN_PASSENGER) ||
    process.env.PORT === 'passenger' ||
    process.env.NODE_ENV === 'production';

  if (isPassenger) {
    portToListen = 'passenger';
  } else if (process.env.PORT) {
    if (!isNaN(Number(process.env.PORT))) {
      portToListen = Number(process.env.PORT);
    } else {
      portToListen = process.env.PORT;
    }
  }

  app.listen(portToListen, () => {
    console.log(`🚀 S&S Tech Group backend running on: ${portToListen}`);
  });
}
