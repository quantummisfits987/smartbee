import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  RefreshCw, 
  Thermometer, 
  Droplets,
  Server
} from 'lucide-react';
import { getHives, generateHealthAnalysis, getAIStatus } from '../services/api';

export default function AiHealthAnalysis() {
  const [searchParams] = useSearchParams();
  const initialHiveId = searchParams.get('hiveId');

  const [hives, setHives] = useState<any[]>([]);
  const [selectedHiveId, setSelectedHiveId] = useState<string>(initialHiveId || '');
  const [miteCount, setMiteCount] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [beeActivity, setBeeActivity] = useState<'Normal' | 'Low'>('Normal');
  const [broodPattern, setBroodPattern] = useState<'Normal' | 'Irregular'>('Normal');
  const [deadBees, setDeadBees] = useState<number>(5);

  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [checkingAi, setCheckingAi] = useState(true);
  const [advisoryResult, setAdvisoryResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadHivesAndStatus();
  }, []);

  async function loadHivesAndStatus() {
    try {
      const hiveList = await getHives();
      setHives(hiveList || []);
      if (!selectedHiveId && hiveList && hiveList.length > 0) {
        setSelectedHiveId(String(hiveList[0].id));
      }
    } catch (err) {
      console.error('Failed to load hives:', err);
    }

    try {
      setCheckingAi(true);
      const status = await getAIStatus();
      setAiStatus(status);
    } catch {
      setAiStatus({ available: false });
    } finally {
      setCheckingAi(false);
    }
  }

  const selectedHive = hives.find((h) => String(h.id) === String(selectedHiveId));

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedHiveId) return;

    setLoading(true);
    setErrorMessage(null);
    setAdvisoryResult(null);

    try {
      const res = await generateHealthAnalysis({
        hive_id: selectedHiveId,
        mite_count: miteCount,
        bee_activity: beeActivity,
        brood_pattern: broodPattern,
        dead_bees: Number(deadBees),
      });

      // Handle both structured res or nested data
      setAdvisoryResult(res?.data || res?.advisory || res);
    } catch (err: any) {
      console.warn('AI Analysis error:', err);
      const backendErr = err.response?.data?.error || err.message;
      if (
        err.response?.status === 503 ||
        backendErr?.includes('Ollama is not available') ||
        err.response?.data?.code === 'OLLAMA_UNAVAILABLE'
      ) {
        setErrorMessage('Ollama is not available. Please start the local Ollama service.');
      } else {
        setErrorMessage(backendErr || 'An error occurred during AI health evaluation.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-1">
          <Cpu className="w-4 h-4" />
          <span>Local Ollama LLM Reasoning</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Hive Health Risk Advisory
        </h1>
        <p className="text-slate-600 text-xs mt-0.5">
          Correlate apiary symptom observations with environmental telemetry through the local Ollama AI model.
        </p>
      </div>

      {/* Mandatory Regulatory / Veterinary Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold block mb-0.5">
            AI-powered advisory — not a definitive veterinary diagnosis.
          </strong>
          <span className="text-amber-800 text-[11px] leading-relaxed">
            This advisory evaluates symptom risk indicators to alert beekeepers to potential colony stress (such as Varroa destructor infestation, chilled brood, or queen failure). It is designed to assist apiculture decision-making and does not substitute for laboratory testing or accredited veterinary inspection.
          </span>
        </div>
      </div>

      {/* Local Ollama Status Ribbon */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${aiStatus?.available ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span className="text-slate-700 font-medium">Local Ollama LLM Status:</span>
          <span className={`font-semibold ${aiStatus?.available ? 'text-emerald-700' : 'text-amber-800'}`}>
            {checkingAi ? 'Checking...' : aiStatus?.available ? 'Active (Port 11434)' : 'Offline / Standby'}
          </span>
        </div>

        <button
          onClick={loadHivesAndStatus}
          disabled={checkingAi}
          className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-[11px] hover:underline"
        >
          <RefreshCw className={`w-3 h-3 ${checkingAi ? 'animate-spin' : ''}`} />
          <span>Check Service</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Form Column (7 cols) */}
        <div className="md:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <h2 className="font-bold text-slate-900 text-sm">Symptom Observation Input</h2>

          <form onSubmit={handleAnalyze} className="space-y-4">
            {/* Hive Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Hive Unit
              </label>
              <select
                value={selectedHiveId}
                onChange={(e) => setSelectedHiveId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-600 focus:bg-white"
              >
                {hives.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.hive_code} — {h.location} ({h.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Mite Count: Low / Medium / High */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Varroa Mite Count
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Low', 'Medium', 'High'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setMiteCount(level)}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                      miteCount === level
                        ? level === 'High'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : level === 'Medium'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Bee Activity: Normal / Low */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bee Entrance / Foraging Activity
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Normal', 'Low'] as const).map((act) => (
                  <button
                    key={act}
                    type="button"
                    onClick={() => setBeeActivity(act)}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                      beeActivity === act
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {act}
                  </button>
                ))}
              </div>
            </div>

            {/* Brood Pattern: Normal / Irregular */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Brood Pattern Quality
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Normal', 'Irregular'] as const).map((pat) => (
                  <button
                    key={pat}
                    type="button"
                    onClick={() => setBroodPattern(pat)}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                      broodPattern === pat
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {pat}
                  </button>
                ))}
              </div>
            </div>

            {/* Dead Bees: number */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Dead Bees (Entrance Bottom Board)
                </label>
                <span className="text-xs font-bold text-slate-900">{deadBees} bees</span>
              </div>
              <input
                type="number"
                min="0"
                max="250"
                value={deadBees}
                onChange={(e) => setDeadBees(Math.max(0, parseInt(e.target.value || '0', 10)))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !selectedHiveId}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing with Ollama LLM...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Analyze Hive Health</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Column (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          {/* Active Context */}
          {selectedHive && (
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                Current Hive Telemetry Context
              </div>
              <div className="font-semibold text-slate-900 mb-1">
                {selectedHive.hive_code} — {selectedHive.location}
              </div>
              <div className="flex items-center gap-4 text-slate-600 text-[11px]">
                <span className="flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                  <span>{selectedHive.latestSensor ? `${selectedHive.latestSensor.temperature}°C` : '35.0°C'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-sky-500" />
                  <span>{selectedHive.latestSensor ? `${selectedHive.latestSensor.humidity}%` : '56.0%'}</span>
                </span>
              </div>
            </div>
          )}

          {/* Error Message when Ollama is unavailable */}
          {errorMessage && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <h4 className="font-bold">Ollama Service Notice</h4>
              </div>
              <p className="font-medium text-amber-800">
                {errorMessage}
              </p>
              <div className="bg-white p-2.5 rounded border border-amber-200 text-[11px] font-mono text-slate-700">
                Start local Ollama: <span className="font-bold text-emerald-700">ollama run llama3</span>
              </div>
            </div>
          )}

          {/* AI Advisory Result */}
          {advisoryResult && !errorMessage && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-500">Risk Assessment:</span>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                    advisoryResult.risk_level === 'High' || advisoryResult.risk_level === 'Critical'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : advisoryResult.risk_level === 'Moderate'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {advisoryResult.risk_level} Risk
                </span>
              </div>

              {advisoryResult.possible_concern && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-0.5">
                    Possible Concern:
                  </span>
                  <p className="text-xs font-bold text-slate-900">
                    {advisoryResult.possible_concern}
                  </p>
                </div>
              )}

              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                  Observations:
                </span>
                {Array.isArray(advisoryResult.observations) ? (
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {advisoryResult.observations.map((obs: string, idx: number) => (
                      <li key={idx}>{obs}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                    {advisoryResult.observations || advisoryResult.analysis}
                  </p>
                )}
              </div>

              <div>
                <span className="text-[11px] font-semibold text-emerald-800 uppercase block mb-1">
                  Recommendations:
                </span>
                {Array.isArray(advisoryResult.recommendation) ? (
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-800 bg-emerald-50/60 p-3 rounded-lg border border-emerald-200 font-medium">
                    {advisoryResult.recommendation.map((rec: string, idx: number) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-800 bg-emerald-50/60 p-3 rounded-lg border border-emerald-200 leading-relaxed font-medium">
                    {advisoryResult.recommendation}
                  </p>
                )}
              </div>

              <p className="text-[10px] text-slate-400 italic pt-1">
                AI-powered advisory — not a definitive veterinary diagnosis.
              </p>
            </div>
          )}

          {/* Idle state */}
          {!advisoryResult && !errorMessage && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400">
              <Cpu className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p>Configure symptom observations on the left and submit to view AI reasoning.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
