import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight, RefreshCw, Thermometer, Droplets, Scale, Activity } from 'lucide-react';
import { SmartAlert } from '../services/api';

interface SmartAlertsSectionProps {
  alerts: SmartAlert[];
  loading: boolean;
  error: string | null;
  onRefresh?: () => void;
}

export const SmartAlertsSection: React.FC<SmartAlertsSectionProps> = ({
  alerts,
  loading,
  error,
  onRefresh,
}) => {
  const getSeverityBadge = (severity: 'CRITICAL' | 'HIGH' | 'MEDIUM') => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            🔴 HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            🟠 MEDIUM
          </span>
        );
      default:
        return null;
    }
  };

  const getAlertIcon = (type: string) => {
    if (type.includes('TEMPERATURE')) return <Thermometer className="w-4 h-4 text-rose-600" />;
    if (type.includes('HUMIDITY')) return <Droplets className="w-4 h-4 text-sky-600" />;
    if (type.includes('WEIGHT')) return <Scale className="w-4 h-4 text-amber-600" />;
    if (type.includes('ACTIVITY')) return <Activity className="w-4 h-4 text-purple-600" />;
    return <AlertTriangle className="w-4 h-4 text-amber-600" />;
  };

  const formatThreshold = (alert: SmartAlert) => {
    if (alert.type === 'HIGH_TEMPERATURE') return '> 38°C';
    if (alert.type === 'LOW_TEMPERATURE') return '< 25°C';
    if (alert.type === 'HIGH_HUMIDITY') return '> 80%';
    if (alert.type === 'LOW_HUMIDITY') return '< 40%';
    if (alert.type === 'LOW_BEE_ACTIVITY') return 'Normal / High expected';
    if (alert.type === 'LOW_HIVE_WEIGHT') return '< 20 kg';
    return String(alert.threshold);
  };

  const formatValue = (alert: SmartAlert) => {
    if (alert.type === 'HIGH_TEMPERATURE' || alert.type === 'LOW_TEMPERATURE') {
      return `${alert.value}°C`;
    }
    if (alert.type === 'HIGH_HUMIDITY' || alert.type === 'LOW_HUMIDITY') {
      return `${alert.value}%`;
    }
    if (alert.type === 'LOW_HIVE_WEIGHT') {
      return `${alert.value} kg`;
    }
    return String(alert.value);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
            <ShieldAlert className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-base tracking-tight flex items-center gap-1.5">
                <span>🚨 Smart Alerts</span>
              </h3>
              {alerts.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                  {alerts.length} Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Automated rule-based telemetry inspection & early warning detection
            </p>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Refresh Smart Alerts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}
      </div>

      {/* Error state (Database unavailable) */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-rose-900 text-sm">Alert Service Notice</h4>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && !error && (
        <div className="py-6 text-center text-xs text-slate-500">
          <RefreshCw className="w-4 h-4 animate-spin inline-block mr-1 text-amber-600" />
          Evaluating colony sensor thresholds...
        </div>
      )}

      {/* Zero alerts state */}
      {!loading && !error && alerts.length === 0 && (
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex items-start gap-3.5">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-700 font-bold text-sm">🟢 Smart Alerts</span>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                All Optimal
              </span>
            </div>
            <p className="text-emerald-900 font-semibold text-xs mt-1">
              No abnormal hive conditions detected.
            </p>
            <p className="text-emerald-700 text-xs mt-0.5">
              All monitored apiaries are currently operating within safe temperature (25°C–38°C), humidity (40%–80%), weight (&gt;20 kg), and foraging thresholds.
            </p>
          </div>
        </div>
      )}

      {/* Active alerts list */}
      {!loading && !error && alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {alerts.map((alert, idx) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isHigh = alert.severity === 'HIGH';

            return (
              <div
                key={`${alert.hive_id}-${alert.type}-${idx}`}
                className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
                  isCritical
                    ? 'bg-purple-50/70 border-purple-300 shadow-xs'
                    : isHigh
                    ? 'bg-rose-50/60 border-rose-200'
                    : 'bg-amber-50/60 border-amber-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                      {getAlertIcon(alert.type)}
                      <span>Hive {alert.hive_code}</span>
                      <span className="text-xs text-slate-500 font-normal">
                        (ID: {alert.hive_id})
                      </span>
                    </div>
                    {getSeverityBadge(alert.severity)}
                  </div>

                  <p className="text-xs font-semibold text-slate-800 mb-2.5">
                    {alert.message}
                  </p>

                  <div className="bg-white/80 rounded-lg p-2.5 border border-slate-200/80 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Observed Reading:</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {formatValue(alert)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>Safety Threshold:</span>
                      <span className="font-semibold text-slate-700">
                        {formatThreshold(alert)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    Recorded: {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <Link
                    to={`/hives/${alert.hive_id}`}
                    className="font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
                  >
                    <span>View Telemetry</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SmartAlertsSection;
