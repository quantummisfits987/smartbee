import React, { useState, useEffect } from 'react';
import { 
  CloudSun, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle, 
  Thermometer, 
  Droplets, 
  Wind,
  ShieldAlert
} from 'lucide-react';
import { getWeatherAdvisory, WeatherAdvisoryResponse } from '../services/api';

export default function WeatherAdvisoryCard({ onRefresh }: { onRefresh?: () => void }) {
  const [data, setData] = useState<WeatherAdvisoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAdvisory() {
    setLoading(true);
    setError(null);
    try {
      const res = await getWeatherAdvisory();
      setData(res);
    } catch (err: any) {
      console.error('Weather advisory load error:', err);
      setError('Weather advisory unavailable. Weather service is currently unavailable.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdvisory();
  }, []);

  const handleRefresh = () => {
    loadAdvisory();
    if (onRefresh) onRefresh();
  };

  const getRiskBadge = (risk: 'LOW' | 'MODERATE' | 'HIGH' | string) => {
    switch (risk) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            Weather Risk: HIGH
          </span>
        );
      case 'MODERATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Weather Risk: MODERATE
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Weather Risk: LOW
          </span>
        );
    }
  };

  const w = data?.weather;
  const advisories = data?.advisories || [];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-sky-50 text-sky-700 rounded-lg">
            <CloudSun className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <span>🌦️ Weather-Based Hive Advisory</span>
            </h3>
            <p className="text-[11px] text-slate-500">Live environmental risk & apiary recommendations</p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
          title="Refresh Weather Advisory"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && !data && !error && (
        <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
          <span>Evaluating ambient weather advisories...</span>
        </div>
      )}

      {/* Content */}
      {!error && data && (
        <div className="space-y-3">
          {/* Ambient Conditions Snapshot Strip */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs">
            <div className="flex items-center gap-1.5 text-slate-700">
              <Thermometer className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px] text-slate-500">Temp:</span>
              <span className="font-bold">{w?.temperature !== null ? `${w?.temperature}°C` : '--'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <Droplets className="w-3.5 h-3.5 text-sky-500" />
              <span className="text-[11px] text-slate-500">Humidity:</span>
              <span className="font-bold">{w?.humidity !== null ? `${w?.humidity}%` : '--'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <Wind className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-[11px] text-slate-500">Wind:</span>
              <span className="font-bold">{w?.wind_speed !== null ? `${w?.wind_speed} km/h` : '--'}</span>
            </div>
          </div>

          {/* Risk Level Badge */}
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-xs font-semibold text-slate-700">Assessed Environment Risk:</span>
            {getRiskBadge(data.risk)}
          </div>

          {/* Advisories list */}
          {advisories.length > 0 ? (
            <div className="space-y-2 pt-1">
              {advisories.map((advisory, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                    advisory.severity === 'HIGH'
                      ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                      : 'bg-amber-50/70 border-amber-200 text-amber-900'
                  }`}
                >
                  <AlertTriangle
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      advisory.severity === 'HIGH' ? 'text-rose-600' : 'text-amber-600'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="font-semibold leading-tight">{advisory.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Low risk / zero advisories */
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900">
                  Weather conditions are currently suitable for normal hive monitoring.
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Optimal ambient temperature and moderate humidity support normal brood thermal stability and foraging flight.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
