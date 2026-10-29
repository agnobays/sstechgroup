import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';

const router = Router();

// Helper to extract clean IP and Cloudflare Geolocation if available
const extractClientLocation = (req: Request) => {
  const forwarded = req.headers['x-forwarded-for'];
  const cfIp = req.headers['cf-connecting-ip'];
  const ip = (typeof cfIp === 'string' ? cfIp : typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress) || '127.0.0.1';

  const city = (req.headers['cf-ipcity'] as string) || (ip === '127.0.0.1' || ip.includes('::1') ? 'Local / Development' : 'KwaZulu-Natal / Margate');
  const region = (req.headers['cf-region'] as string) || 'KZN';
  const country = (req.headers['cf-ipcountry'] as string) || 'ZA';

  return { ip, city, region, country };
};

// ==========================================
// 1. PUBLIC TELEMETRY INGESTION ENDPOINTS
// ==========================================

// Uptime & Heartbeat Ping
router.post('/heartbeat', (req: Request, res: Response) => {
  try {
    const { appId, appName, sessionId, status, url, page, device, environment } = req.body || {};
    if (!appId) {
      return res.status(400).json({ error: 'Missing appId' });
    }

    const { ip, city, region, country } = extractClientLocation(req);
    const deviceType = device?.deviceType || 'Unknown';
    const screen = device?.screen || 'N/A';

    // 1. Upsert app in telemetry_apps
    const existing = db.prepare('SELECT id FROM telemetry_apps WHERE id = ?').get(appId);
    if (!existing) {
      db.prepare(`
        INSERT INTO telemetry_apps (id, name, url, status, last_heartbeat)
        VALUES (?, ?, ?, 'UP', CURRENT_TIMESTAMP)
      `).run(appId, appName || appId, url || null);
    } else {
      db.prepare(`
        UPDATE telemetry_apps 
        SET status = 'UP', last_heartbeat = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(appId);
    }

    // 2. Insert heartbeat
    db.prepare(`
      INSERT INTO telemetry_heartbeats (app_id, session_id, status, ip, city, region, country, device_type, screen, page, environment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(appId, sessionId || null, status || 'online', ip, city, region, country, deviceType, screen, page || '/', environment || 'production');

    return res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (err: any) {
    console.error('[SS Tech Telemetry] Heartbeat error:', err);
    return res.status(500).json({ error: 'Failed to record heartbeat' });
  }
});

// Events Batch (Page views, Rage Clicks, Funnel Steps)
router.post('/events', (req: Request, res: Response) => {
  try {
    const { appId, appName, events } = req.body || {};
    if (!appId || !Array.isArray(events) || events.length === 0) {
      return res.json({ status: 'ok', processed: 0 });
    }

    const { ip, city, region, country } = extractClientLocation(req);

    const insertStmt = db.prepare(`
      INSERT INTO telemetry_events (app_id, session_id, event_type, page, data_json, ip, city, region, country, device_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Ensure app registered
    const existing = db.prepare('SELECT id FROM telemetry_apps WHERE id = ?').get(appId);
    if (!existing) {
      db.prepare(`
        INSERT INTO telemetry_apps (id, name, status, last_heartbeat)
        VALUES (?, ?, 'UP', CURRENT_TIMESTAMP)
      `).run(appId, appName || appId);
    }

    for (const ev of events) {
      const deviceType = ev.device?.deviceType || 'Unknown';
      const dataStr = ev.data ? JSON.stringify(ev.data) : null;
      insertStmt.run(
        appId,
        ev.sessionId || null,
        ev.type || 'UNKNOWN',
        ev.page || '/',
        dataStr,
        ip,
        city,
        region,
        country,
        deviceType
      );
    }

    return res.json({ status: 'ok', processed: events.length });
  } catch (err: any) {
    console.error('[SS Tech Telemetry] Batch events error:', err);
    return res.status(500).json({ error: 'Failed to record events' });
  }
});

// Client Error & Crash Reports
router.post('/error', (req: Request, res: Response) => {
  try {
    const { appId, appName, sessionId, page, device, error } = req.body || {};
    if (!appId) {
      return res.status(400).json({ error: 'Missing appId' });
    }

    const { ip, city } = extractClientLocation(req);
    const deviceType = device?.deviceType || 'Unknown';

    db.prepare(`
      INSERT INTO telemetry_errors (app_id, session_id, error_type, message, stack, page, device_type, ip, city)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      appId,
      sessionId || null,
      error?.type || 'RUNTIME_ERROR',
      error?.message || 'Unknown runtime error',
      error?.stack || null,
      page || '/',
      deviceType,
      ip,
      city
    );

    console.warn(`[SS Tech Telemetry Alert] Error reported from '${appId}': ${error?.message || 'Error'}`);
    return res.json({ status: 'ok' });
  } catch (err: any) {
    console.error('[SS Tech Telemetry] Error logging failed:', err);
    return res.status(500).json({ error: 'Failed to record error' });
  }
});

// Public Ping Endpoint
router.get('/ping', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hub: 'SS Tech Group Pulse Platform',
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// 2. SS TECH FLEET & ANALYTICS DASHBOARD API
// ==========================================

// Get All Monitored Apps (Fleet Overview)
router.get('/fleet', (_req: Request, res: Response) => {
  try {
    const apps = db.prepare('SELECT * FROM telemetry_apps ORDER BY name ASC').all();

    const fleet = apps.map((app: any) => {
      // Check active sessions in last 15 minutes
      const activeSessionsRow = db.prepare(`
        SELECT COUNT(DISTINCT session_id) as count 
        FROM telemetry_heartbeats 
        WHERE app_id = ? AND datetime(created_at) >= datetime('now', '-15 minutes')
      `).get(app.id) as any;

      // Check errors in last 24 hours
      const errorsTodayRow = db.prepare(`
        SELECT COUNT(*) as count 
        FROM telemetry_errors 
        WHERE app_id = ? AND datetime(created_at) >= datetime('now', '-24 hours')
      `).get(app.id) as any;

      // Check total events in last 24 hours
      const eventsTodayRow = db.prepare(`
        SELECT COUNT(*) as count 
        FROM telemetry_events 
        WHERE app_id = ? AND datetime(created_at) >= datetime('now', '-24 hours')
      `).get(app.id) as any;

      // Determine live status: if last heartbeat was within 10 minutes -> UP, else if recent error rate high -> DEGRADED, else DOWN
      let liveStatus = 'UP';
      if (!app.last_heartbeat) {
        liveStatus = 'PENDING';
      } else {
        const lastHb = new Date(app.last_heartbeat).getTime();
        const diffMinutes = (Date.now() - lastHb) / 60000;
        if (diffMinutes > 15) {
          liveStatus = 'DOWN';
        } else if (errorsTodayRow?.count > 20) {
          liveStatus = 'DEGRADED';
        }
      }

      return {
        ...app,
        liveStatus,
        activeUsers: activeSessionsRow?.count || 0,
        errorsToday: errorsTodayRow?.count || 0,
        eventsToday: eventsTodayRow?.count || 0,
      };
    });

    return res.json({ fleet });
  } catch (err: any) {
    console.error('[SS Tech Telemetry] Fleet overview error:', err);
    return res.status(500).json({ error: 'Failed to retrieve fleet overview' });
  }
});

// Deep Dive Analytics for a Specific App
router.get('/apps/:appId/analytics', (req: Request, res: Response) => {
  try {
    const { appId } = req.params;

    const app = db.prepare('SELECT * FROM telemetry_apps WHERE id = ?').get(appId) as any;
    if (!app) {
      return res.status(404).json({ error: 'App not found in telemetry registry' });
    }

    // 1. Total & Active Stats
    const activeRow = db.prepare(`
      SELECT COUNT(DISTINCT session_id) as count 
      FROM telemetry_heartbeats 
      WHERE app_id = ? AND datetime(created_at) >= datetime('now', '-15 minutes')
    `).get(appId) as any;

    const totalViewsRow = db.prepare(`
      SELECT COUNT(*) as count 
      FROM telemetry_events 
      WHERE app_id = ? AND event_type = 'PAGE_VIEW'
    `).get(appId) as any;

    // 2. Geolocation Breakdown (Top Cities & Regions)
    const locations = db.prepare(`
      SELECT city, region, country, COUNT(*) as count 
      FROM telemetry_events 
      WHERE app_id = ? AND city IS NOT NULL 
      GROUP BY city, region 
      ORDER BY count DESC 
      LIMIT 10
    `).all(appId);

    // 3. Device Breakdown
    const devices = db.prepare(`
      SELECT device_type, COUNT(*) as count 
      FROM telemetry_events 
      WHERE app_id = ? 
      GROUP BY device_type 
      ORDER BY count DESC
    `).all(appId);

    // 4. "Where People Get Stuck" (Friction & Rage Clicks)
    const rageClicks = db.prepare(`
      SELECT page, data_json, COUNT(*) as count, MAX(created_at) as last_seen 
      FROM telemetry_events 
      WHERE app_id = ? AND event_type IN ('RAGE_CLICK', 'DEAD_CLICK_DISABLED')
      GROUP BY page, data_json 
      ORDER BY count DESC 
      LIMIT 10
    `).all(appId);

    // 5. Funnel Steps (e.g. form drop-offs)
    const funnelSteps = db.prepare(`
      SELECT data_json, COUNT(*) as count 
      FROM telemetry_events 
      WHERE app_id = ? AND event_type = 'FUNNEL_STEP'
      GROUP BY data_json 
      ORDER BY count DESC
    `).all(appId);

    // 6. Recent Crash / Error Reports
    const recentErrors = db.prepare(`
      SELECT * 
      FROM telemetry_errors 
      WHERE app_id = ? 
      ORDER BY created_at DESC 
      LIMIT 25
    `).all(appId);

    // 7. Recent Live Activity Stream
    const recentEvents = db.prepare(`
      SELECT id, event_type, page, device_type, city, created_at 
      FROM telemetry_events 
      WHERE app_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all(appId);

    return res.json({
      app,
      stats: {
        activeUsers: activeRow?.count || 0,
        totalPageViews: totalViewsRow?.count || 0,
        errorCount: recentErrors.length
      },
      locations,
      devices,
      friction: {
        rageClicks,
        funnelSteps
      },
      recentErrors,
      recentEvents
    });
  } catch (err: any) {
    console.error('[SS Tech Telemetry] App analytics error:', err);
    return res.status(500).json({ error: 'Failed to retrieve app analytics' });
  }
});

export default router;
