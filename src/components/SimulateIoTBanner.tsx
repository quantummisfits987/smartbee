import React, { useState } from 'react';
import { Radio, RefreshCw, Zap, CheckCircle2 } from 'lucide-react';
import { createSensorReading } from '../services/api';

interface SimulateIoTBannerProps {
  hives: Array<{ id: number; hive_code: string }>;
  onReadingAdded?: () => void;
  selectedHiveId?: number;
}

export default function SimulateIoTBanner({
  hives,
  onReadingAdded,
  selectedHiveId,
}: SimulateIoTBannerProps) {
  const [targetHiveId, setTargetHiveId] = useState<number>(
    selectedHiveId || (hives.length > 0 ? hives[0].id : 1)
  );
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (selectedHiveId) {
      setTargetHiveId(selectedHiveId);
    } else if (hives.length > 0 && !targetHiveId) {
      setTargetHiveId(hives[0].id);
    }
  }, [selectedHiveId, hives]);

  async function handleSimulate() {
    if (!targetHiveId) return;
    setLoading(true);
    setSuccessMsg(null);

    // Generate realistic values in exact specified ranges:
    // Temperature: 25–38 °C
    const temp = parseFloat((25 + Math.random() * 13).toFixed(1));
    // Humidity: 40–85 %
    const hum = parseFloat((40 + Math.random() * 45).toFixed(1));
    // Weight: 20–60 kg
    const wt = parseFloat((20 + Math.random() * 40).toFixed(1));
    // Bee Activity: High / Normal / Low
    const activities: ('High' | 'Normal' | 'Low')[] = ['High', 'Normal', 'Normal', 'Low'];
    const act = activities[Math.floor(Math.random() * activities.length)];

    try {
      const res = await createSensorReading({
        hive_id: targetHiveId,
        temperature: temp,
        humidity: hum,
        weight: wt,
        bee_activity: act,
        is_simulation: true,
      });

      const hiveObj = hives.find((h) => h.id === Number(targetHiveId));
      const code = hiveObj ? hiveObj.hive_code : `Hive #${targetHiveId}`;

      setSuccessMsg(
        `Generated reading for ${code}: ${temp}°C, ${hum}% RH, ${wt} kg, Activity: ${act}`
      );

      if (onReadingAdded) {
        onReadingAdded();
      }

      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to simulate sensor reading');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 sm:p-5 text-slate-800">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Banner Label & Description */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-emerald-900 text-xs uppercase tracking-wider">
                Simulated IoT — Demo Mode
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                PostgreSQL Ingested
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Simulates realistic brood telemetry (25–38°C, 40–85% RH, 20–60 kg, High/Normal/Low activity) for prototype testing.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {hives.length > 0 && !selectedHiveId && (
            <select
              value={targetHiveId}
              onChange={(e) => setTargetHiveId(Number(e.target.value))}
              className="bg-white border border-slate-300 text-slate-800 text-xs rounded-lg px-3 py-2 font-medium focus:outline-none focus:border-emerald-600"
            >
              {hives.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.hive_code}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleSimulate}
            disabled={loading || hives.length === 0}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
            <span>Simulate Reading</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="mt-3 pt-3 border-t border-emerald-200/80 flex items-center gap-2 text-xs text-emerald-900 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
}
