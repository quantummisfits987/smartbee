import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Thermometer, 
  Droplets, 
  Scale, 
  Activity, 
  Cpu, 
  Zap, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle2,
  Calendar,
  BarChart2
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { getHive, createSensorReading } from '../services/api';

export default function HiveDetails() {
  const { id } = useParams<{ id: string }>();
  const [hive, setHive] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  async function loadDetails() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getHive(id);
      setHive(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load hive details');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetails();
  }, [id]);

  async function handleSimulate() {
    if (!id) return;
    setSimulating(true);
    setActionSuccess(null);

    const temp = parseFloat((25 + Math.random() * 13).toFixed(1));
    const hum = parseFloat((40 + Math.random() * 45).toFixed(1));
    const wt = parseFloat((20 + Math.random() * 40).toFixed(1));
    const activities = ['High', 'Normal', 'Normal', 'Low'] as const;
    const act = activities[Math.floor(Math.random() * activities.length)];

    try {
      await createSensorReading({
        hive_id: Number(id),
        temperature: temp,
        humidity: hum,
        weight: wt,
        bee_activity: act,
        is_simulation: true,
      });

      setActionSuccess(`New reading recorded: ${temp}°C, ${hum}% RH, ${wt} kg, Activity: ${act}`);
      await loadDetails();
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Simulation failed');
    } finally {
      setSimulating(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
        <span>Loading hive telemetry and statistics...</span>
      </div>
    );
  }

  if (error || !hive) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-md mx-auto space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
        <h3 className="font-bold text-slate-900 text-base">Hive Not Found</h3>
        <p className="text-xs text-slate-500">
          {error || `Hive with ID ${id} does not exist in the database.`}
        </p>
        <Link
          to="/"
          className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const latest = hive.latestSensor;
  const stats = hive.statistics || {};
  const sensors = hive.sensors || [];

  // Format telemetry for Recharts
  const chartData = [...sensors]
    .slice(0, 15)
    .reverse()
    .map((s: any) => ({
      time: new Date(s.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temp: parseFloat(s.temperature),
      humidity: parseFloat(s.humidity),
    }));

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {hive.hive_code}
              </h1>
              <span
                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  hive.status === 'Attention'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {hive.status}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>{hive.location}</span>
              <span>•</span>
              <Calendar className="w-3.5 h-3.5" />
              <span>Registered {new Date(hive.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {simulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-emerald-600" />}
            <span>Simulate Reading</span>
          </button>

          <Link
            to={`/ai-health?hiveId=${hive.id}`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Run AI Health Advisory</span>
          </Link>
        </div>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 4 Cards: Latest Temperature, Latest Humidity, Weight, Bee Activity */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Latest Temp</span>
            <Thermometer className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {latest ? `${parseFloat(latest.temperature).toFixed(1)}°C` : '--'}
          </div>
          <span className="text-[10px] text-slate-400">Target brood: 34.5–36.0°C</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Latest Humidity</span>
            <Droplets className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {latest ? `${parseFloat(latest.humidity).toFixed(1)}%` : '--'}
          </div>
          <span className="text-[10px] text-slate-400">Target RH: 50–65%</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Hive Weight</span>
            <Scale className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {latest ? `${parseFloat(latest.weight).toFixed(1)} kg` : '--'}
          </div>
          <span className="text-[10px] text-slate-400">Colony & honey mass</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Bee Activity</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 truncate">
            {latest?.bee_activity || 'Normal'}
          </div>
          <span className="text-[10px] text-slate-400">Flight activity index</span>
        </div>
      </div>

      {/* Basic Statistics Strip */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700">
        <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider">
          <BarChart2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Telemetry Statistical Summary</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-left">
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-slate-400 block text-[10px]">Total Logged Readings</span>
            <span className="font-bold text-slate-900 text-sm">{stats.total_readings ?? sensors.length}</span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-slate-400 block text-[10px]">Average Temperature</span>
            <span className="font-bold text-slate-900 text-sm">
              {stats.avg_temperature !== null ? `${stats.avg_temperature}°C` : '--'}
            </span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-slate-400 block text-[10px]">Average Humidity</span>
            <span className="font-bold text-slate-900 text-sm">
              {stats.avg_humidity !== null ? `${stats.avg_humidity}%` : '--'}
            </span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-slate-400 block text-[10px]">Latest Logged Mass</span>
            <span className="font-bold text-slate-900 text-sm">
              {stats.latest_weight !== null ? `${stats.latest_weight} kg` : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* Simple Telemetry Trend Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Temperature & Humidity Dynamics</h3>
            <p className="text-xs text-slate-500">Recent telemetry records</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-amber-600">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Temp (°C)</span>
            </span>
            <span className="flex items-center gap-1 text-sky-600">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span>Humidity (%)</span>
            </span>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No sensor readings available to plot. Click "Simulate Reading" to populate.
          </div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 8, fontSize: 12 }}
                />
                <Line type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Temp (°C)" />
                <Line type="monotone" dataKey="humidity" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 2 }} name="Humidity (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Bottom Grid: Recent Sensor Readings Table & Latest AI Advisory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sensor Readings Table */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 text-sm">Recent Sensor Readings</h3>
            <span className="text-xs text-slate-400">{sensors.length} logged entries</span>
          </div>

          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-y border-slate-200 uppercase font-semibold text-[10px] sticky top-0">
                <tr>
                  <th className="py-2 px-2.5">Recorded Time</th>
                  <th className="py-2 px-2.5">Temp</th>
                  <th className="py-2 px-2.5">Humidity</th>
                  <th className="py-2 px-2.5">Weight</th>
                  <th className="py-2 px-2.5">Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sensors.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50/80">
                    <td className="py-2 px-2.5 text-slate-500 font-mono text-[11px]">
                      {new Date(s.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2 px-2.5 font-medium text-slate-900">
                      {parseFloat(s.temperature).toFixed(1)}°C
                    </td>
                    <td className="py-2 px-2.5 text-slate-700">
                      {parseFloat(s.humidity).toFixed(1)}%
                    </td>
                    <td className="py-2 px-2.5 font-semibold text-slate-900">
                      {parseFloat(s.weight).toFixed(1)} kg
                    </td>
                    <td className="py-2 px-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                        {s.bee_activity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Latest AI Advisory Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Latest AI Health Advisory</h3>
              </div>
              {hive.latestAdvisory && (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    hive.latestAdvisory.risk_level === 'High' || hive.latestAdvisory.risk_level === 'Critical'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : hive.latestAdvisory.risk_level === 'Moderate'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {hive.latestAdvisory.risk_level} Risk
                </span>
              )}
            </div>

            {!hive.latestAdvisory ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No AI health analysis has been conducted for this hive yet.
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">AI Evaluation Analysis:</span>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                    {hive.latestAdvisory.analysis}
                  </p>
                </div>

                {hive.latestAdvisory.recommendation && (
                  <div>
                    <span className="font-semibold text-emerald-800 block mb-1">Recommended Beekeeper Action:</span>
                    <p className="text-slate-700 bg-emerald-50/60 p-3 rounded-lg border border-emerald-200 leading-relaxed">
                      {hive.latestAdvisory.recommendation}
                    </p>
                  </div>
                )}

                <div className="text-[10px] text-slate-400 italic">
                  Advisory recorded at: {new Date(hive.latestAdvisory.created_at).toLocaleString()}
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <Link
              to={`/ai-health?hiveId=${hive.id}`}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Evaluate Symptoms for {hive.hive_code}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
