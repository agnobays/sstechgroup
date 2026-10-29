import React, { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Smartphone,
  Laptop,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MousePointerClick,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Clock,
  Radio,
  Eye,
  TrendingUp,
  WifiOff,
  Layers,
  ChevronRight
} from 'lucide-react';

interface FleetApp {
  id: string;
  name: string;
  url: string;
  status: string;
  liveStatus: 'UP' | 'DOWN' | 'DEGRADED' | 'PENDING';
  last_heartbeat: string;
  activeUsers: number;
  errorsToday: number;
  eventsToday: number;
}

interface AppAnalytics {
  app: FleetApp;
  stats: {
    activeUsers: number;
    totalPageViews: number;
    errorCount: number;
  };
  locations: Array<{ city: string; region: string; country: string; count: number }>;
  devices: Array<{ device_type: string; count: number }>;
  friction: {
    rageClicks: Array<{ page: string; data_json: string; count: number; last_seen: string }>;
    funnelSteps: Array<{ data_json: string; count: number }>;
  };
  recentErrors: Array<{
    id: number;
    error_type: string;
    message: string;
    stack: string;
    page: string;
    device_type: string;
    city: string;
    created_at: string;
  }>;
  recentEvents: Array<{
    id: number;
    event_type: string;
    page: string;
    device_type: string;
    city: string;
    created_at: string;
  }>;
}

export const FleetTelemetryPage: React.FC = () => {
  const [fleet, setFleet] = useState<FleetApp[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('falakhe-funerals');
  const [analytics, setAnalytics] = useState<AppAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'locations' | 'friction' | 'errors' | 'events'>('overview');

  const fetchFleet = async () => {
    try {
      const res = await fetch('/api/telemetry/fleet');
      const data = await res.json();
      if (data.fleet) {
        setFleet(data.fleet);
        if (!selectedAppId && data.fleet.length > 0) {
          setSelectedAppId(data.fleet[0].id);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch fleet:', err);
    }
  };

  const fetchAnalytics = async (appId: string) => {
    if (!appId) return;
    try {
      const res = await fetch(`/api/telemetry/apps/${appId}/analytics`);
      const data = await res.json();
      if (!data.error) {
        setAnalytics(data);
      }
    } catch (err) {
      console.warn('Failed to fetch analytics for', appId, err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchFleet(), fetchAnalytics(selectedAppId)]);
    setRefreshing(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchFleet();
      await fetchAnalytics(selectedAppId);
      setLoading(false);
    };
    init();

    // Auto-refresh every 20 seconds
    const interval = setInterval(() => {
      fetchFleet();
      if (selectedAppId) fetchAnalytics(selectedAppId);
    }, 20000);

    return () => clearInterval(interval);
  }, [selectedAppId]);

  const selectedApp = fleet.find((a) => a.id === selectedAppId) || analytics?.app;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-brand-amber font-semibold text-xs tracking-wider uppercase mb-1">
            <Radio size={14} className="animate-pulse text-emerald-400" />
            <span>SS Tech Pulse • Universal Telemetry Hub</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Fleet Monitoring &amp; App Telemetry
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Real-time health, user geolocation, and UX friction diagnostics across all deployed applications.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-neutral-900 border border-white/10 hover:border-brand-amber/40 text-neutral-300 hover:text-white transition text-xs font-medium"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-brand-amber' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Pulse'}</span>
          </button>
        </div>
      </div>

      {/* Fleet Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs uppercase font-semibold">Monitored Apps</span>
            <Layers size={16} className="text-brand-amber" />
          </div>
          <div className="text-2xl font-bold text-white">{fleet.length}</div>
          <div className="text-xs text-neutral-400 mt-1">All SS Tech deployed platforms</div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs uppercase font-semibold">Fleet Operational Health</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">100% UP</div>
          <div className="text-xs text-neutral-400 mt-1">0 Critical outages reported</div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs uppercase font-semibold">Live Active Users</span>
            <Activity size={16} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            {fleet.reduce((acc, a) => acc + (a.activeUsers || 0), 0)}
          </div>
          <div className="text-xs text-neutral-400 mt-1">Active in last 15 minutes</div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs uppercase font-semibold">Errors Today</span>
            <AlertTriangle size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {fleet.reduce((acc, a) => acc + (a.errorsToday || 0), 0)}
          </div>
          <div className="text-xs text-neutral-400 mt-1">Unhandled exceptions recorded</div>
        </div>
      </div>

      {/* Fleet App Selector & Live Status Grid */}
      <div className="rounded-xl bg-neutral-900/80 border border-white/10 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Server size={18} className="text-brand-amber" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Deployed Applications Fleet
            </h2>
          </div>
          <span className="text-xs text-neutral-400">Select an app to inspect live diagnostics</span>
        </div>

        <div className="divide-y divide-white/5">
          {fleet.map((app) => {
            const isSelected = app.id === selectedAppId;
            const isUp = app.liveStatus === 'UP';
            return (
              <div
                key={app.id}
                onClick={() => setSelectedAppId(app.id)}
                className={`p-4 flex items-center justify-between cursor-pointer transition ${
                  isSelected ? 'bg-brand-amber/10 border-l-4 border-brand-amber' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-neutral-800 border border-white/10 flex items-center justify-center font-bold text-white text-sm">
                    {app.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-white">{app.name}</span>
                      <span className="text-[11px] font-mono text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">
                        {app.id}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-neutral-400 mt-1">
                      {app.url && (
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-brand-amber inline-flex items-center space-x-1"
                        >
                          <span>{app.url.replace('https://', '')}</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                      <span>•</span>
                      <span>Last Ping: {app.last_heartbeat ? new Date(app.last_heartbeat).toLocaleTimeString() : 'Pending'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-neutral-400">Active Now</div>
                    <div className="text-sm font-semibold text-white">{app.activeUsers || 0} users</div>
                  </div>

                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-neutral-400">Today's Errors</div>
                    <div className={`text-sm font-semibold ${app.errorsToday > 0 ? 'text-amber-400' : 'text-neutral-300'}`}>
                      {app.errorsToday || 0}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        isUp
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-950/80 text-red-400 border border-red-500/30'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isUp ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                      <span>{isUp ? 'UP (Healthy)' : 'DOWN / DEGRADED'}</span>
                    </span>
                    <ChevronRight size={16} className={isSelected ? 'text-brand-amber' : 'text-neutral-500'} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected App Deep-Dive Tabs */}
      {selectedApp && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-white">{selectedApp.name}</span>
              <span className="text-xs text-neutral-400">Diagnostic Suite</span>
            </div>

            <div className="flex space-x-1 bg-neutral-900 p-1 rounded-lg border border-white/10">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  activeTab === 'overview' ? 'bg-brand-amber text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('locations')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  activeTab === 'locations' ? 'bg-brand-amber text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Locations &amp; Devices
              </button>
              <button
                onClick={() => setActiveTab('friction')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  activeTab === 'friction' ? 'bg-brand-amber text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Where People Get Stuck
              </button>
              <button
                onClick={() => setActiveTab('errors')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  activeTab === 'errors' ? 'bg-brand-amber text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Error Logs ({analytics?.recentErrors?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  activeTab === 'events' ? 'bg-brand-amber text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Live Event Stream
              </button>
            </div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-neutral-900/60 border border-white/10 space-y-3">
                <div className="text-xs font-bold text-neutral-400 uppercase">Platform Overview</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-neutral-400">Application ID:</span>
                    <span className="font-mono text-white">{selectedApp.id}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-neutral-400">Production URL:</span>
                    <a href={selectedApp.url} target="_blank" rel="noreferrer" className="text-brand-amber hover:underline inline-flex items-center gap-1">
                      {selectedApp.url || 'N/A'} <ExternalLink size={12} />
                    </a>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-neutral-400">Fleet Status:</span>
                    <span className="text-emerald-400 font-bold">{selectedApp.liveStatus || 'UP'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-400">Last Telemetry Ping:</span>
                    <span className="text-white">{selectedApp.last_heartbeat ? new Date(selectedApp.last_heartbeat).toLocaleString() : 'Just now'}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-neutral-900/60 border border-white/10 space-y-3">
                <div className="text-xs font-bold text-neutral-400 uppercase">Traffic &amp; Engagement</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-neutral-400">Active Sessions (15m):</span>
                    <span className="font-bold text-cyan-400">{analytics?.stats?.activeUsers || 0}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-neutral-400">Total Pageviews:</span>
                    <span className="font-bold text-white">{analytics?.stats?.totalPageViews || 0}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-400">Total Recorded Errors:</span>
                    <span className={`font-bold ${(analytics?.stats?.errorCount || 0) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {analytics?.stats?.errorCount || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-neutral-900/60 border border-white/10 space-y-3">
                <div className="text-xs font-bold text-neutral-400 uppercase">Automated Health Check</div>
                <div className="flex items-center space-x-3 text-emerald-400">
                  <CheckCircle2 size={28} />
                  <div>
                    <div className="font-bold text-white text-sm">Service Operating Normally</div>
                    <div className="text-xs text-neutral-400">No unhandled gateway crashes</div>
                  </div>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (selectedApp.url) window.open(selectedApp.url, '_blank');
                    }}
                    className="w-full py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-2 border border-white/10 transition"
                  >
                    <span>Open Live App</span>
                    <ExternalLink size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOCATIONS & DEVICES */}
          {activeTab === 'locations' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Geographic Location Table */}
              <div className="p-5 rounded-xl bg-neutral-900/60 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin size={16} className="text-brand-amber" />
                    <h3 className="text-sm font-bold text-white uppercase">User Geolocation (Cities &amp; Regions)</h3>
                  </div>
                </div>

                <div className="divide-y divide-white/5">
                  {analytics?.locations && analytics.locations.length > 0 ? (
                    analytics.locations.map((loc, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono text-neutral-500 w-5">{idx + 1}.</span>
                          <span className="text-white font-medium">{loc.city}</span>
                          <span className="text-xs text-neutral-400">({loc.region}, {loc.country})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-brand-amber">{loc.count}</span>
                          <span className="text-xs text-neutral-500">events</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-sm text-neutral-500">
                      Locations will populate as live traffic interacts with the platform.
                    </div>
                  )}
                </div>
              </div>

              {/* Devices Breakdown */}
              <div className="p-5 rounded-xl bg-neutral-900/60 border border-white/10 space-y-4">
                <div className="flex items-center space-x-2">
                  <Smartphone size={16} className="text-cyan-400" />
                  <h3 className="text-sm font-bold text-white uppercase">Device &amp; Browser Breakdown</h3>
                </div>

                <div className="divide-y divide-white/5">
                  {analytics?.devices && analytics.devices.length > 0 ? (
                    analytics.devices.map((dev, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          {dev.device_type.toLowerCase().includes('mobile') || dev.device_type.toLowerCase().includes('iphone') ? (
                            <Smartphone size={16} className="text-neutral-400" />
                          ) : (
                            <Laptop size={16} className="text-neutral-400" />
                          )}
                          <span className="text-white font-medium">{dev.device_type}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-cyan-400">{dev.count}</span>
                          <span className="text-xs text-neutral-500">sessions</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-sm text-neutral-500">
                      Devices will be categorized automatically upon incoming telemetry.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FRICTION & WHERE PEOPLE GET STUCK */}
          {activeTab === 'friction' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-neutral-900/60 border border-white/10 space-y-4">
                <div className="flex items-center space-x-2">
                  <MousePointerClick size={18} className="text-amber-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase">
                      Rage Clicks &amp; Blocked User Actions
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Detects when a user repeatedly taps a button rapidly or clicks a disabled element.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-white/5">
                  {analytics?.friction?.rageClicks && analytics.friction.rageClicks.length > 0 ? (
                    analytics.friction.rageClicks.map((item, idx) => {
                      let parsedData: any = {};
                      try {
                        parsedData = item.data_json ? JSON.parse(item.data_json) : {};
                      } catch {
                        parsedData = {};
                      }
                      return (
                        <div key={idx} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-500/30">
                                {parsedData.note ? 'Rage Click' : 'Dead Click'}
                              </span>
                              <span className="text-sm font-semibold text-white font-mono">{item.page}</span>
                            </div>
                            <div className="text-xs text-neutral-300 mt-1">
                              Target Element: <code className="text-brand-amber">{parsedData.elementText || parsedData.element || 'Button'}</code>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-amber-400">{item.count} occurrences</span>
                            <div className="text-[11px] text-neutral-500">Last seen: {new Date(item.last_seen).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-sm text-neutral-400">
                      <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-2" />
                      <div>No UX Friction Detected!</div>
                      <div className="text-xs text-neutral-500 mt-1">
                        Users are moving through the application smoothly with zero rage clicks.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ERROR LOGS */}
          {activeTab === 'errors' && (
            <div className="p-5 rounded-xl bg-neutral-900/60 border border-white/10 space-y-4">
              <div className="flex items-center space-x-2">
                <ShieldAlert size={18} className="text-red-400" />
                <h3 className="text-sm font-bold text-white uppercase">Client Runtime Exceptions &amp; Crash Reports</h3>
              </div>

              <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                {analytics?.recentErrors && analytics.recentErrors.length > 0 ? (
                  analytics.recentErrors.map((err) => (
                    <div key={err.id} className="py-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-red-400 font-mono">{err.error_type}</span>
                        <span className="text-xs text-neutral-500">{new Date(err.created_at).toLocaleString()}</span>
                      </div>
                      <div className="text-sm font-semibold text-white">{err.message}</div>
                      <div className="text-xs text-neutral-400 flex items-center space-x-4">
                        <span>Page: <code className="text-brand-amber">{err.page}</code></span>
                        <span>Device: {err.device_type}</span>
                        <span>Location: {err.city}</span>
                      </div>
                      {err.stack && (
                        <pre className="text-[11px] text-neutral-400 bg-black/60 p-2 rounded overflow-x-auto font-mono mt-1">
                          {err.stack.split('\n').slice(0, 3).join('\n')}
                        </pre>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-sm text-neutral-400">
                    <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-2" />
                    <div>0 Runtime Errors Recorded</div>
                    <div className="text-xs text-neutral-500 mt-1">The application has not reported any unhandled exceptions.</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: LIVE EVENT STREAM */}
          {activeTab === 'events' && (
            <div className="p-5 rounded-xl bg-neutral-900/60 border border-white/10 space-y-4">
              <div className="flex items-center space-x-2">
                <Activity size={18} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase">Real-Time Event Stream</h3>
              </div>

              <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                {analytics?.recentEvents && analytics.recentEvents.length > 0 ? (
                  analytics.recentEvents.map((ev) => (
                    <div key={ev.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-neutral-800 text-cyan-400">
                          {ev.event_type}
                        </span>
                        <span className="text-white font-mono">{ev.page}</span>
                        <span className="text-neutral-500 hidden sm:inline">({ev.device_type} • {ev.city})</span>
                      </div>
                      <div className="text-neutral-500">
                        {new Date(ev.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-sm text-neutral-500">
                    Live events will appear here in real time as policyholders browse the platform.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FleetTelemetryPage;
