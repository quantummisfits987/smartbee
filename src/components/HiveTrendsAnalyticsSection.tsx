import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertCircle, 
  RefreshCw, 
  Calendar, 
  Thermometer, 
  Droplets, 
  Scale, 
  HeartPulse, 
  Activity, 
  Layers
} from 'lucide-react';
import { getHiveAnalytics, HiveAnalyticsResponse, TrendDirection } from '../services/api';

interface HiveTrendsAnalyticsSectionProps {
  hives: any[];
}

export const HiveTrendsAnalyticsSection: React.FC<HiveTrendsAnalyticsSectionProps> = ({ hives }) => {
  const [selectedHiveId, setSelectedHiveId] = useState<number | string>(hives[0]?.id || 1);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [analytics, setAnalytics] = useState<HiveAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hives.length > 0 && !hives.some((h) => h.id === selectedHiveId)) {
      setSelectedHiveId(hives[0].id);
    }
  }, [hives]);

  async function loadAnalytics() {
    if (!selectedHiveId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getHiveAnalytics(selectedHiveId, timeRange);
      setAnalytics(data);
    } catch (err: any) {
      console.error('Analytics load error:', err);
      setError('Unable to load hive analytics. Database unavailable.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, [selectedHiveId, timeRange]);

  const getTrendBadge = (trend: TrendDirection) => {
    switch (trend) {
      case 'increasing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <TrendingUp className="w-3 h-3 text-emerald-700" />
            Increasing
          </span>
        );
      case 'decreasing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <TrendingDown className="w-3 h-3 text-amber-700" />
            Decreasing
          </span>
        );
      case 'stable':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Minus className="w-3 h-3 text-blue-700" />
            Stable
          </span>
        );
      case 'Insufficient data':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Insufficient data
          </span>
        );
    }
  };

  const renderSvgLineChart = (
    data: number[],
    labels: string[],
    color: string,
    unit: string,
    minBound?: number,
    maxBound?: number
  ) => {
    if (data.length < 2) {
      return (
        <div className="h-36 flex items-center justify-center text-xs text-slate-400 bg-slate-50/70 rounded-lg border border-dashed border-slate-200">
          {data.length === 1 ? 'Only 1 historical telemetry point available' : 'No data points recorded'}
        </div>
      );
    }

    const min = minBound !== undefined ? minBound : Math.min(...data);
    const max = maxBound !== undefined ? maxBound : Math.max(...data);
    const rangeVal = max - min || 1;

    const width = 400;
    const height = 130;
    const padX = 25;
    const padY = 18;

    const points = data.map((val, idx) => {
      const x = padX + (idx / (data.length - 1)) * (width - padX * 2);
      const y = height - padY - ((val - min) / rangeVal) * (height - padY * 2);
      return { x, y, val, label: labels[idx] || '' };
    });

    const pathD = points.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
    }, '');

    return (
      <div className="relative w-full overflow-hidden bg-slate-50/50 rounded-lg p-2 border border-slate-100">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36 overflow-visible">
          {/* Subtle grid lines */}
          <line x1={padX} y1={padY} x2={width - padX} y2={padY} stroke="#e2e8f0" strokeDasharray="3 3" />
          <line x1={padX} y1={height / 2} x2={width - padX} y2={height / 2} stroke="#e2e8f0" strokeDasharray="3 3" />
          <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="#e2e8f0" strokeDasharray="3 3" />

          {/* Area fill */}
          <path
            d={`${pathD} L ${points[points.length - 1].x},${height - padY} L ${points[0].x},${height - padY} Z`}
            fill={color}
            fillOpacity="0.08"
          />

          {/* Line stroke */}
          <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle cx={pt.x} cy={pt.y} r="3.5" fill="#ffffff" stroke={color} strokeWidth="2" />
            </g>
          ))}
        </svg>

        {/* Axis Labels */}
        <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-1 px-1">
          <span>{labels[0] || 'Start'}</span>
          <span className="font-semibold text-slate-700">
            Range: {min.toFixed(1)}{unit} – {max.toFixed(1)}{unit}
          </span>
          <span>{labels[labels.length - 1] || 'Latest'}</span>
        </div>
      </div>
    );
  };

  const readings = analytics?.readings || [];
  const trends = analytics?.trends;

  const tempVals = readings.map((r) => r.temperature);
  const humVals = readings.map((r) => r.humidity);
  const weightVals = readings.map((r) => r.weight);
  const scoreVals = readings.map((r) => r.health_score || 0);
  const timeLabels = readings.map((r) =>
    new Date(r.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  const selectedHive = hives.find((h) => String(h.id) === String(selectedHiveId));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-200">
            <TrendingUp className="w-5 h-5 text-indigo-700" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base tracking-tight flex items-center gap-2">
              <span>Health Trends & Analytics</span>
            </h3>
            <p className="text-xs text-slate-500">
              Historical sensor progression and deterministic colony stability metrics
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Hive Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedHiveId}
              onChange={(e) => setSelectedHiveId(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer"
            >
              {hives.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.hive_code} {h.location ? `(${h.location})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            {(['24h', '7d', '30d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  timeRange === r
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === '24h' ? '24 Hours' : r === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>

          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-rose-900 text-sm">Analytics Notice</h4>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && !error && (
        <div className="py-10 text-center text-xs text-slate-500">
          <RefreshCw className="w-4 h-4 animate-spin inline-block mr-1 text-indigo-600" />
          Loading historical telemetry for {selectedHive?.hive_code || `Hive ${selectedHiveId}`}...
        </div>
      )}

      {/* No Data State */}
      {!loading && !error && readings.length === 0 && (
        <div className="py-10 text-center text-xs text-slate-500 bg-slate-50/70 rounded-xl border border-dashed border-slate-200 p-6">
          <Calendar className="w-6 h-6 mx-auto text-slate-400 mb-2" />
          <h4 className="font-semibold text-slate-700 text-sm">No historical sensor data available for this hive.</h4>
          <p className="text-slate-500 text-xs mt-1">
            No sensor readings match the selected "{timeRange === '24h' ? 'Last 24 Hours' : timeRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'}" time range in PostgreSQL.
          </p>
        </div>
      )}

      {/* Data Available: Charts & Trend Cards */}
      {!loading && !error && readings.length > 0 && trends && (
        <div className="space-y-4">
          {/* Top Quick Trend Summary Strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* 1. Temp Trend Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Temp</span>
                <Thermometer className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div className="text-sm font-bold text-slate-900">
                {readings[readings.length - 1].temperature.toFixed(1)}°C
              </div>
              <div className="mt-1">{getTrendBadge(trends.temperature)}</div>
            </div>

            {/* 2. Humidity Trend Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Humidity</span>
                <Droplets className="w-3.5 h-3.5 text-sky-500" />
              </div>
              <div className="text-sm font-bold text-slate-900">
                {readings[readings.length - 1].humidity.toFixed(1)}%
              </div>
              <div className="mt-1">{getTrendBadge(trends.humidity)}</div>
            </div>

            {/* 3. Weight Trend Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Weight</span>
                <Scale className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-sm font-bold text-slate-900">
                {readings[readings.length - 1].weight.toFixed(1)} kg
              </div>
              <div className="mt-1">{getTrendBadge(trends.weight)}</div>
            </div>

            {/* 4. Bee Activity Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Activity</span>
                <Activity className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <div className="text-sm font-bold text-slate-900 truncate">
                {readings[readings.length - 1].bee_activity}
              </div>
              <div className="mt-1">{getTrendBadge(trends.bee_activity)}</div>
            </div>

            {/* 5. Health Score Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 col-span-2 md:col-span-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Health Score</span>
                <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-sm font-bold text-slate-900">
                {readings[readings.length - 1].health_score !== null ? `${readings[readings.length - 1].health_score}/100` : '--'}
              </div>
              <div className="mt-1">{getTrendBadge(trends.health_score)}</div>
            </div>
          </div>

          {/* 4 Detailed Interactive Trend Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Chart 1: Temperature Trend */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-rose-500" />
                  <h4 className="font-bold text-slate-900 text-xs">Temperature Trend</h4>
                </div>
                {getTrendBadge(trends.temperature)}
              </div>
              {renderSvgLineChart(tempVals, timeLabels, '#f43f5e', '°C')}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span>Earliest: {readings[0].temperature}°C</span>
                <span>Latest: {readings[readings.length - 1].temperature}°C</span>
              </div>
            </div>

            {/* Chart 2: Humidity Trend */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-sky-500" />
                  <h4 className="font-bold text-slate-900 text-xs">Humidity Trend</h4>
                </div>
                {getTrendBadge(trends.humidity)}
              </div>
              {renderSvgLineChart(humVals, timeLabels, '#0284c7', '%')}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span>Earliest: {readings[0].humidity}%</span>
                <span>Latest: {readings[readings.length - 1].humidity}%</span>
              </div>
            </div>

            {/* Chart 3: Hive Weight Trend */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-slate-900 text-xs">Hive Weight Trend</h4>
                </div>
                {getTrendBadge(trends.weight)}
              </div>
              {renderSvgLineChart(weightVals, timeLabels, '#10b981', ' kg')}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span>Earliest: {readings[0].weight} kg</span>
                <span>Latest: {readings[readings.length - 1].weight} kg</span>
              </div>
            </div>

            {/* Chart 4: Health Score Trend */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-slate-900 text-xs">Health Score Trend (0–100)</h4>
                </div>
                {getTrendBadge(trends.health_score)}
              </div>
              {renderSvgLineChart(scoreVals, timeLabels, '#059669', '/100', 0, 100)}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span>
                  Earliest: {readings[0].health_score !== null ? `${readings[0].health_score}/100` : '--'}
                </span>
                <span>
                  Latest: {readings[readings.length - 1].health_score !== null ? `${readings[readings.length - 1].health_score}/100` : '--'}
                </span>
              </div>
            </div>
          </div>

          {/* Bee Activity Progression Timeline */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-purple-600" />
                <h4 className="font-bold text-slate-900 text-xs">Bee Activity Progression</h4>
              </div>
              {getTrendBadge(trends.bee_activity)}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto py-2">
              {readings.map((r, idx) => (
                <React.Fragment key={r.id || idx}>
                  <div className="flex flex-col items-center bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-center shrink-0">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        r.bee_activity === 'High'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.bee_activity === 'Low'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {r.bee_activity}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono mt-1">
                      {new Date(r.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {idx < readings.length - 1 && (
                    <span className="text-slate-300 font-bold text-xs shrink-0">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HiveTrendsAnalyticsSection;
