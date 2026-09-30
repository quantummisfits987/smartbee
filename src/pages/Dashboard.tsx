import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Layers, 
  CheckCircle2, 
  Thermometer, 
  Droplets, 
  Scale, 
  Activity, 
  Cpu, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCw, 
  AlertTriangle,
  Radio,
  Clock,
  Server
} from 'lucide-react';
import WeatherCard from '../components/WeatherCard';
import WeatherAdvisoryCard from '../components/WeatherAdvisoryCard';
import SimulateIoTBanner from '../components/SimulateIoTBanner';
import SmartAlertsSection from '../components/SmartAlertsSection';
import HiveHealthScoreSection from '../components/HiveHealthScoreSection';
import HiveTrendsAnalyticsSection from '../components/HiveTrendsAnalyticsSection';
import { 
  getHives, 
  getRecentSensors, 
  getSystemStatus, 
  getSmartAlerts, 
  getHiveHealthScores,
  SmartAlert,
  HiveHealthScore
} from '../services/api';

export default function Dashboard() {
  const [hives, setHives] = useState<any[]>([]);
  const [readings, setReadings] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [healthScores, setHealthScores] = useState<HiveHealthScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  async function loadAlerts() {
    setAlertsLoading(true);
    setAlertsError(null);
    try {
      const alertsData = await getSmartAlerts();
      setAlerts(alertsData || []);
    } catch (err: any) {
      console.error('Smart alerts load error:', err);
      setAlertsError('Unable to load smart alerts. Database unavailable.');
    } finally {
      setAlertsLoading(false);
    }
  }

  async function loadHealthScores() {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const scoresData = await getHiveHealthScores();
      setHealthScores(scoresData || []);
    } catch (err: any) {
      console.error('Hive health scores load error:', err);
      setHealthError('Unable to load hive health scores. Database unavailable.');
    } finally {
      setHealthLoading(false);
    }
  }

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [hivesData, sensorsData, statusData] = await Promise.all([
        getHives(),
        getRecentSensors(8),
        getSystemStatus(),
        loadAlerts(),
        loadHealthScores(),
      ]);

      setHives(hivesData || []);
      setReadings(sensorsData || []);
      setSystemStatus(statusData || null);
    } catch (err: any) {
      console.error('Dashboard load error:', err);
      setError('Backend API is unavailable. Please start the SmartBee backend on port 5000.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Compute stat metrics from actual API data
  const totalHives = hives.length;
  const activeHives = hives.filter((h) => h.status === 'Active').length;

  // Latest telemetry reading across the apiary
  const latestReading = readings.length > 0 ? readings[0] : null;
  const latestTemp = latestReading ? parseFloat(latestReading.temperature) : null;
  const latestHumidity = latestReading ? parseFloat(latestReading.humidity) : null;
  const latestWeight = latestReading ? parseFloat(latestReading.weight) : null;
  const latestActivity = latestReading ? latestReading.bee_activity : 'N/A';

  return (
    <div className="space-y-6">
      {/* Top Banner for Demo Mode */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 flex items-center justify-between text-xs text-amber-900">
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-wider text-amber-800">
            DEMO MODE — Simulated IoT Data
          </span>
          <span className="text-amber-700 hidden sm:inline">
            • Prototype utilizes simulated brood telemetry in lieu of physical hardware.
          </span>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="text-amber-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-rose-900 text-sm">System Connection Issue</h4>
            <p className="mt-0.5">{error}</p>
          </div>
          <button
            onClick={loadData}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Header and Quick Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Apiary Operations Dashboard
          </h1>
          <p className="text-slate-600 text-xs mt-0.5">
            Real-time hive telemetry ingestion, local AI health advisories, and SHA-256 honey traceability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/ai-health"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI Health Advisory</span>
          </Link>
          <Link
            to="/batches"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Traceability Ledger</span>
          </Link>
        </div>
      </div>

      {/* Simulated IoT Banner */}
      <SimulateIoTBanner hives={hives} onReadingAdded={loadData} />

      {/* Primary KPI Metrics: Total Hives, Active Hives, Latest Temp, Humidity, Weight, Activity */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Total Hives */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Hives</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {loading ? '--' : totalHives}
          </div>
          <span className="text-[10px] text-slate-400">Registered apiaries</span>
        </div>

        {/* 2. Active Hives */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Hives</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {loading ? '--' : activeHives}
          </div>
          <span className="text-[10px] text-slate-400">Normal condition</span>
        </div>

        {/* 3. Latest Temperature */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Latest Temp</span>
            <Thermometer className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {latestTemp !== null ? `${latestTemp.toFixed(1)}°C` : '--'}
          </div>
          <span className="text-[10px] text-slate-400">Brood target 34.5-36°C</span>
        </div>

        {/* 4. Latest Humidity */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Latest RH</span>
            <Droplets className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {latestHumidity !== null ? `${latestHumidity.toFixed(1)}%` : '--'}
          </div>
          <span className="text-[10px] text-slate-400">Chamber moisture</span>
        </div>

        {/* 5. Latest Hive Weight */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Hive Weight</span>
            <Scale className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {latestWeight !== null ? `${latestWeight.toFixed(1)}` : '--'}{' '}
            <span className="text-xs font-normal text-slate-500">kg</span>
          </div>
          <span className="text-[10px] text-slate-400">Honey store index</span>
        </div>

        {/* 6. Bee Activity */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Activity</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 truncate">
            {latestActivity}
          </div>
          <span className="text-[10px] text-slate-400">Foraging rate</span>
        </div>
      </div>

      {/* Smart Alerts & Early Warning System Section (Additive Feature) */}
      <SmartAlertsSection
        alerts={alerts}
        loading={alertsLoading}
        error={alertsError}
        onRefresh={loadAlerts}
      />

      {/* Hive Health Score System Section (Additive Feature) */}
      <HiveHealthScoreSection
        scores={healthScores}
        loading={healthLoading}
        error={healthError}
        onRefresh={loadHealthScores}
      />

      {/* Hive Health Trends & Analytics Section (Additive Feature) */}
      <HiveTrendsAnalyticsSection hives={hives} />

      {/* Main Content Grid: Weather Context & Hives List (Left 1 col, Right 2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Weather and System Health */}
        <div className="space-y-6">
          <WeatherCard onRefresh={loadData} />
          <WeatherAdvisoryCard onRefresh={loadData} />

          {/* System Status Panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-600" />
              <span>Foundation System Status</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Express Backend:</span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                  {systemStatus?.backend || 'online'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">PostgreSQL Database:</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded border text-[11px] ${
                    systemStatus?.database === 'connected'
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : 'text-slate-600 bg-slate-100 border-slate-200'
                  }`}
                >
                  {systemStatus?.database === 'connected' ? 'Connected (Port 5432)' : 'In-Memory Fallback'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-600">Local Ollama LLM:</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded border text-[11px] ${
                    systemStatus?.ollama === 'available'
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : 'text-amber-800 bg-amber-50 border-amber-200'
                  }`}
                >
                  {systemStatus?.ollama === 'available' ? 'Available (Port 11434)' : 'Offline / Standby'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Managed Hives & Recent Telemetry */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hives Quick Access Cards */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Managed Apiary Hives</h3>
                <p className="text-xs text-slate-500">Colonies enrolled in sensor telemetry monitoring</p>
              </div>
              <span className="text-xs text-slate-500">{hives.length} units</span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <RefreshCw className="w-4 h-4 animate-spin inline-block mr-1 text-emerald-600" />
                Loading hives...
              </div>
            ) : hives.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No hives registered yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {hives.map((hive) => {
                  const s = hive.latestSensor;
                  const isAttention = hive.status === 'Attention';

                  return (
                    <div
                      key={hive.id}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between hover:border-emerald-300 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900 text-sm">
                            {hive.hive_code}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              isAttention
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {hive.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mb-2">
                          {hive.location}
                        </p>

                        <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-700 bg-white p-2 rounded border border-slate-200">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Temp</span>
                            <span className="font-semibold">
                              {s ? `${parseFloat(s.temperature).toFixed(1)}°C` : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Weight</span>
                            <span className="font-semibold">
                              {s ? `${parseFloat(s.weight).toFixed(1)} kg` : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200 text-right">
                        <Link
                          to={`/hives/${hive.id}`}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
                        >
                          <span>Inspect Details</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Sensor Telemetry Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Recent Sensor Readings</h3>
                <p className="text-xs text-slate-500">Live PostgreSQL ingested telemetry logs</p>
              </div>
              <span className="text-xs text-slate-400 font-mono">ORDER BY recorded_at DESC</span>
            </div>

            {readings.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No telemetry recorded. Click "Simulate Reading" above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-y border-slate-200 uppercase font-semibold text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Hive</th>
                      <th className="py-2.5 px-3">Core Temp</th>
                      <th className="py-2.5 px-3">Humidity</th>
                      <th className="py-2.5 px-3">Weight</th>
                      <th className="py-2.5 px-3">Bee Activity</th>
                      <th className="py-2.5 px-3 text-right">Recorded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {readings.map((reading) => (
                      <tr key={reading.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {reading.hive_code || `HIVE-${reading.hive_id}`}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {parseFloat(reading.temperature).toFixed(1)}°C
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {parseFloat(reading.humidity).toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {parseFloat(reading.weight).toFixed(1)} kg
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              reading.bee_activity === 'High'
                                ? 'bg-emerald-100 text-emerald-800'
                                : reading.bee_activity === 'Low'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {reading.bee_activity}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-500 font-mono text-[11px]">
                          {new Date(reading.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
