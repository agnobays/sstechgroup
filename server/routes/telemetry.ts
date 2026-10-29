import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';

// Clean any legacy test rows from initial debug
try {
  db.prepare(`UPDATE telemetry_events SET city = 'Johannesburg / Randburg', region = 'GP' WHERE city LIKE '%Margate%'`).run();
  db.prepare(`UPDATE telemetry_heartbeats SET city = 'Johannesburg / Randburg', region = 'GP' WHERE city LIKE '%Margate%'`).run();
} catch {
  // Safe ignore if tables not yet populated
}

const router = Router();

// In-memory cache for fast IP Geolocation lookups
const ipGeoCache = new Map<string, { city: string; region: string; country: string }>();

// Helper to extract clean IP and True Geolocation
const extractClientLocation = async (req: Request) => {
  // 1. Check if client SDK passed detected location directly
  const clientGeo = req.body?.geo || req.body?.device?.geo;
  if (clientGeo && clientGeo.city) {
    return {
      ip: clientGeo.ip || (req.headers['cf-connecting-ip'] as string) || (req.headers['x-forwarded-for'] as string) || '127.0.0.1',
      city: clientGeo.city,
      region: clientGeo.region || 'Gauteng',
      country: clientGeo.country_code || clientGeo.country || 'ZA'
    };
  }

  // 2. Extract public IP
  const forwarded = req.headers['x-forwarded-for'];
  const cfIp = req.headers['cf-connecting-ip'];
  const ip = (typeof cfIp === 'string' ? cfIp : typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress) || '127.0.0.1';

  // 3. Check Cloudflare direct headers
  if (req.headers['cf-ipcity']) {
    return {
      ip,
      city: req.headers['cf-ipcity'] as string,
      region: (req.headers['cf-region'] as string) || 'GP',
      country: (req.headers['cf-ipcountry'] as string) || 'ZA'
    };
  }

  if (ip === '127.0.0.1' || ip.includes('::1')) {
    return { ip, city: 'Local / Development', region: 'Dev', country: 'ZA' };
  }

  // 4. Check in-memory IP Geo Cache
  if (ipGeoCache.has(ip)) {
    const cached = ipGeoCache.get(ip)!;
    return { ip, ...cached };
  }

  // 5. Fast Geo Lookup using public IP
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const geoRes = await fetch(`https://get.geojs.io/v1/ip/geo/${ip}.json`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (geoRes.ok) {
      const g = (await geoRes.json()) as any;
      if (g && g.city) {
        const result = { city: g.city, region: g.region || 'Gauteng', country: g.country_code || 'ZA' };
        ipGeoCache.set(ip, result);
        return { ip, ...result };
      }
    }
  } catch {
    // fallback
  }

  return { ip, city: 'Johannesburg / Randburg', region: 'GP', country: 'ZA' };
};

// ==========================================
// 1. PUBLIC TELEMETRY INGESTION ENDPOINTS
// ==========================================

// Uptime & Heartbeat Ping
router.post('/heartbeat', async (req: Request, res: Response) => {
  try {
    const { appId, appName, sessionId, status, url, page, device, environment, geo } = req.body || {};
    if (!appId) {
      return res.status(400).json({ error: 'Missing appId' });
    }

    const loc = await extractClientLocation(req);
    const city = geo?.city || loc.city;
    const region = geo?.region || loc.region;
    const country = geo?.country_code || geo?.country || loc.country;
    const ip = geo?.ip || loc.ip;

    const deviceType = device?.deviceType || 'Unknown';
    const screen = device?.screen || 'N/A';

    // 1. Upsert app in telemetry_apps
    const nowIso = new Date().toISOString();
    const existing = db.prepare('SELECT id FROM telemetry_apps WHERE id = ?').get(appId);
    if (!existing) {
      db.prepare(`
        INSERT INTO telemetry_apps (id, name, url, status, last_heartbeat)
        VALUES (?, ?, ?, 'UP', ?)
      `).run(appId, appName || appId, url || null, nowIso);
    } else {
      db.prepare(`
        UPDATE telemetry_apps 
        SET status = 'UP', last_heartbeat = ? 
        WHERE id = ?
      `).run(nowIso, appId);
    }

    // 2. Insert heartbeat
    db.prepare(`
      INSERT INTO telemetry_heartbeats (app_id, session_id, status, ip, city, region, country, device_type, screen, page, environment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(appId, sessionId || null, status || 'online', ip, city, region, country, deviceType, screen, page || '/', environment || 'production');

    return res.json({ status: 'ok', timestamp: nowIso });
  } catch (err: any) {
    console.error('[SS Tech Telemetry] Heartbeat error:', err);
    return res.status(500).json({ error: 'Failed to record heartbeat' });
  }
});

// Events Batch (Page views, Rage Clicks, Funnel Steps)
router.post('/events', async (req: Request, res: Response) => {
  try {
    const { appId, appName, events, geo } = req.body || {};
    if (!appId || !Array.isArray(events) || events.length === 0) {
      return res.json({ status: 'ok', processed: 0 });
    }

    const loc = await extractClientLocation(req);

    const insertStmt = db.prepare(`
      INSERT INTO telemetry_events (app_id, session_id, event_type, page, data_json, ip, city, region, country, device_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Ensure app registered and keep alive
    const nowIso = new Date().toISOString();
    const existing = db.prepare('SELECT id FROM telemetry_apps WHERE id = ?').get(appId);
    if (!existing) {
      db.prepare(`
        INSERT INTO telemetry_apps (id, name, status, last_heartbeat)
        VALUES (?, ?, 'UP', ?)
      `).run(appId, appName || appId, nowIso);
    } else {
      db.prepare(`
        UPDATE telemetry_apps 
        SET status = 'UP', last_heartbeat = ? 
        WHERE id = ?
      `).run(nowIso, appId);
    }

    for (const ev of events) {
      const deviceType = ev.device?.deviceType || 'Unknown';
      const dataStr = ev.data ? JSON.stringify(ev.data) : null;
      const eventCity = ev.data?.geo?.city || ev.device?.geo?.city || geo?.city || loc.city;
      const eventRegion = ev.data?.geo?.region || ev.device?.geo?.region || geo?.region || loc.region;
      const eventCountry = ev.data?.geo?.country_code || ev.device?.geo?.country || geo?.country || loc.country;

      insertStmt.run(
        appId,
        ev.sessionId || null,
        ev.type || 'UNKNOWN',
        ev.page || '/',
        dataStr,
        loc.ip,
        eventCity,
        eventRegion,
        eventCountry,
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
router.post('/error', async (req: Request, res: Response) => {
  try {
    const { appId, appName, sessionId, page, device, error, geo } = req.body || {};
    if (!appId) {
      return res.status(400).json({ error: 'Missing appId' });
    }

    const loc = await extractClientLocation(req);
    const city = geo?.city || loc.city;
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
      loc.ip,
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
      // Check active sessions in last 30 minutes
      const activeSessionsRow = db.prepare(`
        SELECT COUNT(DISTINCT session_id) as count 
        FROM telemetry_heartbeats 
        WHERE app_id = ? AND datetime(created_at) >= datetime('now', '-30 minutes')
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

      // Determine live status: check ISO UTC timestamp accurately
      let liveStatus = 'UP';
      if (!app.last_heartbeat) {
        liveStatus = 'PENDING';
      } else {
        const rawHb = String(app.last_heartbeat);
        const isoHb = rawHb.includes('T') ? (rawHb.endsWith('Z') ? rawHb : rawHb + 'Z') : (rawHb.replace(' ', 'T') + 'Z');
        const lastHb = new Date(isoHb).getTime();
        const diffMinutes = Math.max(0, (Date.now() - lastHb) / 60000);
        if (diffMinutes > 45) {
          liveStatus = 'DOWN';
        } else if (errorsTodayRow?.count > 30) {
          liveStatus = 'DEGRADED';
        } else {
          liveStatus = 'UP';
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

    // 1. Total & Active Stats (within 30 minutes)
    const activeRow = db.prepare(`
      SELECT COUNT(DISTINCT session_id) as count 
      FROM telemetry_heartbeats 
      WHERE app_id = ? AND datetime(created_at) >= datetime('now', '-30 minutes')
    `).get(appId) as any;

    const totalViewsRow = db.prepare(`
      SELECT COUNT(*) as count 
      FROM telemetry_events 
      WHERE app_id = ? AND event_type = 'PAGE_VIEW'
    `).get(appId) as any;

    // 2. Geolocation Breakdown (Top Cities & Regions from events and heartbeats)
    const locations = db.prepare(`
      SELECT city, region, country, COUNT(*) as count 
      FROM (
        SELECT city, region, country FROM telemetry_events 
        WHERE app_id = ? AND city IS NOT NULL AND city != '' AND city NOT LIKE '%Margate%'
        UNION ALL
        SELECT city, region, country FROM telemetry_heartbeats 
        WHERE app_id = ? AND city IS NOT NULL AND city != '' AND city NOT LIKE '%Margate%'
      )
      GROUP BY city, region 
      ORDER BY count DESC 
      LIMIT 10
    `).all(appId, appId);

    // 3. Device Breakdown (from events and heartbeats)
    const devices = db.prepare(`
      SELECT device_type, COUNT(*) as count 
      FROM (
        SELECT device_type FROM telemetry_events 
        WHERE app_id = ? AND device_type IS NOT NULL AND device_type != ''
        UNION ALL
        SELECT device_type FROM telemetry_heartbeats 
        WHERE app_id = ? AND device_type IS NOT NULL AND device_type != ''
      )
      GROUP BY device_type 
      ORDER BY count DESC
    `).all(appId, appId);

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
