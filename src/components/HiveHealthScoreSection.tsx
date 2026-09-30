import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertCircle, ArrowRight, CheckCircle2, HeartPulse, RefreshCw, Thermometer, Droplets, Scale, ShieldAlert } from 'lucide-react';
import { HiveHealthScore } from '../services/api';

interface HiveHealthScoreSectionProps {
  scores: HiveHealthScore[];
  loading: boolean;
  error: string | null;
  onRefresh?: () => void;
}

export const HiveHealthScoreSection: React.FC<HiveHealthScoreSectionProps> = ({
  scores,
  loading,
  error,
  onRefresh,
}) => {
  const getStatusBadge = (status: HiveHealthScore['status']) => {
    switch (status) {
      case 'Healthy':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Healthy
          </span>
        );
      case 'Needs Attention':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Needs Attention
          </span>
        );
      case 'At Risk':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">
            <span className="w-2 h-2 rounded-full bg-orange-600" />
            At Risk
          </span>
        );
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            Critical
          </span>
        );
      case 'No Data':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            No Data
          </span>
        );
    }
  };

  const getScoreBarColor = (score: number | null) => {
    if (score === null) return 'bg-slate-300';
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-rose-600';
  };

  const getScoreTextColor = (score: number | null) => {
    if (score === null) return 'text-slate-400';
    if (score >= 80) return 'text-emerald-700';
    if (score >= 60) return 'text-amber-700';
    if (score >= 40) return 'text-orange-700';
    return 'text-rose-700';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
            <HeartPulse className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-base tracking-tight flex items-center gap-1.5">
                <span>🐝 Hive Health Score</span>
              </h3>
              {scores.length > 0 && (
                <span className="text-xs text-slate-500 font-normal">
                  ({scores.length} colonies evaluated)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Deterministic 0–100 vitality index derived from core telemetry and Smart Alert rules
            </p>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Refresh Health Scores"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-rose-900 text-sm">Health Score Notice</h4>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && !error && (
        <div className="py-6 text-center text-xs text-slate-500">
          <RefreshCw className="w-4 h-4 animate-spin inline-block mr-1 text-emerald-600" />
          Computing hive health scores from PostgreSQL sensor readings...
        </div>
      )}

      {/* Hives list */}
      {!loading && !error && scores.length === 0 && (
        <div className="py-6 text-center text-xs text-slate-500">
          No apiary hives available for health score evaluation.
        </div>
      )}

      {!loading && !error && scores.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {scores.map((hive) => {
            const hasData = hive.health_score !== null;

            return (
              <div
                key={hive.hive_id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-emerald-300 transition-all shadow-2xs"
              >
                <div>
                  {/* Hive Top Bar */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">
                        {hive.hive_code}
                      </span>
                      {hive.location && (
                        <p className="text-[11px] text-slate-500 truncate max-w-[150px]">
                          {hive.location}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(hive.status)}
                  </div>

                  {/* Score Number and Progress Bar */}
                  <div className="bg-white rounded-lg p-3 border border-slate-200 my-2">
                    {hasData ? (
                      <>
                        <div className="flex items-baseline justify-between mb-1.5">
                          <div className="flex items-baseline gap-1">
                            <span className={`text-2xl font-black ${getScoreTextColor(hive.health_score)}`}>
                              {hive.health_score}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">/ 100</span>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-600">
                            {hive.status}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getScoreBarColor(hive.health_score)}`}
                            style={{ width: `${Math.max(4, hive.health_score || 0)}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="py-2 text-center text-xs text-slate-500 font-medium">
                        Health score unavailable — no sensor data.
                      </div>
                    )}
                  </div>

                  {/* Telemetry Snapshot */}
                  {hasData && (
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-700 bg-white/70 p-2 rounded-lg border border-slate-200/80 mb-2">
                      <div className="flex items-center gap-1">
                        <Thermometer className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="text-slate-500">Temp:</span>
                        <span className="font-semibold text-slate-800 ml-auto">
                          {hive.temperature !== null ? `${hive.temperature}°C` : '--'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span className="text-slate-500">Humidity:</span>
                        <span className="font-semibold text-slate-800 ml-auto">
                          {hive.humidity !== null ? `${hive.humidity}%` : '--'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Scale className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-slate-500">Weight:</span>
                        <span className="font-semibold text-slate-800 ml-auto">
                          {hive.weight !== null ? `${hive.weight} kg` : '--'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span className="text-slate-500">Activity:</span>
                        <span className="font-semibold text-slate-800 ml-auto">
                          {hive.bee_activity || '--'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Deductions breakdown if any points were lost */}
                  {hasData && hive.deductions && hive.deductions.length > 0 && (
                    <div className="text-[10px] text-slate-500 space-y-0.5 pt-1">
                      <span className="font-semibold text-slate-600 block">Deductions:</span>
                      {hive.deductions.map((d, i) => (
                        <div key={i} className="flex items-center justify-between text-rose-700">
                          <span className="truncate">• {d.rule}</span>
                          <span className="font-bold shrink-0">{d.points}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {hasData && (!hive.deductions || hive.deductions.length === 0) && (
                    <div className="text-[10px] text-emerald-700 flex items-center gap-1 pt-1 font-medium">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Zero deductions — all parameters optimal</span>
                    </div>
                  )}
                </div>

                {/* Inspect Link */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/80 text-right">
                  <Link
                    to={`/hives/${hive.hive_id}`}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
                  >
                    <span>Inspect Hive</span>
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

export default HiveHealthScoreSection;
