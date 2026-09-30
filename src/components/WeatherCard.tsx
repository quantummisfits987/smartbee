import React, { useState, useEffect } from 'react';
import { CloudSun, Droplets, Wind, CloudRain, RefreshCw } from 'lucide-react';
import { getWeather } from '../services/api';

export default function WeatherCard({ onRefresh }: { onRefresh?: () => void }) {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadWeather() {
    setLoading(true);
    setError(null);
    try {
      const data = await getWeather();
      setWeather(data);
    } catch (err: any) {
      setError('Weather context currently unavailable');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWeather();
  }, []);

  const handleRefresh = () => {
    loadWeather();
    if (onRefresh) onRefresh();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <CloudSun className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Weather Context</h3>
            <p className="text-[11px] text-slate-500">Open-Meteo Apiary Ambient Data</p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
          title="Refresh Weather"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && !weather ? (
        <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
          <span>Fetching weather context...</span>
        </div>
      ) : error && !weather ? (
        <div className="py-4 text-center text-xs text-slate-500">
          {error}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-900">
                {weather?.temperature?.toFixed(1) ?? '--'}°C
              </span>
              <span className="text-xs text-slate-500">ambient</span>
            </div>

            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              {weather?.flightCondition || 'Ideal Foraging'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 mb-0.5">
                <Droplets className="w-3 h-3 text-sky-500" />
                <span>Humidity</span>
              </div>
              <div className="font-bold text-slate-800 text-sm">
                {weather?.humidity ?? '--'}%
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 mb-0.5">
                <CloudRain className="w-3 h-3 text-blue-500" />
                <span>Precipitation</span>
              </div>
              <div className="font-bold text-slate-800 text-sm">
                {weather?.rain ?? '0.0'} mm
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 mb-0.5">
                <Wind className="w-3 h-3 text-teal-500" />
                <span>Wind Speed</span>
              </div>
              <div className="font-bold text-slate-800 text-sm">
                {weather?.windSpeed ?? '--'} km/h
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 text-center italic">
            Note: Weather metrics provide environmental context only and do not replace physical apiary inspections.
          </p>
        </div>
      )}
    </div>
  );
}
