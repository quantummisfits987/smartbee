import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Layers, 
  Plus, 
  MapPin, 
  Thermometer, 
  Droplets, 
  Scale, 
  Activity, 
  ArrowRight, 
  Cpu, 
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { fetchHives, createHive, recordSensorReading } from '../services/api';
import SimulateIoTBanner from '../components/SimulateIoTBanner';

export default function Hives() {
  const [hives, setHives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHiveCode, setNewHiveCode] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newStatus, setNewStatus] = useState('Active');
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  async function loadHives() {
    setLoading(true);
    try {
      const data = await fetchHives();
      setHives(data);
    } catch (err) {
      console.error('Error fetching hives:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHives();
  }, []);

  async function handleCreateHive(e: React.FormEvent) {
    e.preventDefault();
    if (!newHiveCode || !newLocation) return;
    setSubmitting(true);
    try {
      await createHive({
        hive_code: newHiveCode,
        location: newLocation,
        status: newStatus,
      });
      setShowAddModal(false);
      setNewHiveCode('');
      setNewLocation('');
      setActionMessage(`Hive ${newHiveCode} created successfully!`);
      loadHives();
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create hive');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSimulateForHive(hiveId: number) {
    try {
      await recordSensorReading({
        hive_id: hiveId,
        is_simulation: true,
      });
      setActionMessage('New simulated sensor telemetry ingested!');
      loadHives();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to simulate reading');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Colony & Hive Management
          </h1>
          <p className="text-stone-400 text-sm mt-1">
            Monitor apiary units, live environmental sensor telemetry, and colony health states.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Hive</span>
        </button>
      </div>

      <SimulateIoTBanner hives={hives} onReadingAdded={loadHives} />

      {actionMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Hive Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-stone-400 text-sm flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin mr-2 text-amber-400" /> Loading apiary hives...
        </div>
      ) : hives.length === 0 ? (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-12 text-center">
          <Layers className="w-12 h-12 text-stone-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white">No Hives Registered</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto mt-1 mb-4">
            Get started by adding your first colony or apiary hive unit to begin logging telemetry.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-stone-950"
          >
            Create Hive
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hives.map((hive) => {
            const sensor = hive.latestSensor;
            const temp = sensor ? parseFloat(sensor.temperature) : null;
            const humidity = sensor ? parseFloat(sensor.humidity) : null;
            const weight = sensor ? parseFloat(sensor.weight) : null;
            const activity = sensor ? sensor.bee_activity : 'Unknown';

            const isStatusAttention = hive.status === 'Attention' || hive.status === 'Critical';

            return (
              <div
                key={hive.id}
                className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-amber-500/40 transition-all"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white tracking-tight">
                          {hive.hive_code}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            isStatusAttention
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {hive.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-stone-400 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{hive.location}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSimulateForHive(hive.id)}
                      title="Simulate telemetry reading for this hive"
                      className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 hover:text-amber-300 border border-stone-700 text-xs transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Telemetry Metrics */}
                  <div className="grid grid-cols-2 gap-2.5 my-4">
                    <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-3">
                      <div className="flex items-center gap-1 text-[11px] text-stone-400 mb-1">
                        <Thermometer className="w-3 h-3 text-amber-400" />
                        <span>Core Temp</span>
                      </div>
                      <div className="text-base font-bold text-stone-100">
                        {temp !== null ? `${temp.toFixed(1)}°C` : 'N/A'}
                      </div>
                      <span className="text-[10px] text-stone-500">Brood zone</span>
                    </div>

                    <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-3">
                      <div className="flex items-center gap-1 text-[11px] text-stone-400 mb-1">
                        <Droplets className="w-3 h-3 text-sky-400" />
                        <span>Humidity</span>
                      </div>
                      <div className="text-base font-bold text-stone-100">
                        {humidity !== null ? `${humidity.toFixed(1)}%` : 'N/A'}
                      </div>
                      <span className="text-[10px] text-stone-500">Relative RH</span>
                    </div>

                    <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-3">
                      <div className="flex items-center gap-1 text-[11px] text-stone-400 mb-1">
                        <Scale className="w-3 h-3 text-amber-400" />
                        <span>Weight</span>
                      </div>
                      <div className="text-base font-bold text-stone-100">
                        {weight !== null ? `${weight.toFixed(1)} kg` : 'N/A'}
                      </div>
                      <span className="text-[10px] text-stone-500">Hive mass</span>
                    </div>

                    <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-3">
                      <div className="flex items-center gap-1 text-[11px] text-stone-400 mb-1">
                        <Activity className="w-3 h-3 text-emerald-400" />
                        <span>Activity</span>
                      </div>
                      <div className="text-base font-bold text-stone-100 truncate">
                        {activity}
                      </div>
                      <span className="text-[10px] text-stone-500">Foraging rate</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-2">
                  <Link
                    to={`/ai-health?hiveId=${hive.id}`}
                    className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-400 transition-colors"
                  >
                    <Cpu className="w-3.5 h-3.5 text-amber-400" />
                    <span>Run AI Check</span>
                  </Link>

                  <Link
                    to={`/hives/${hive.id}`}
                    className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 group"
                  >
                    <span>Inspect Details</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Hive Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Register New Hive</h2>
            <p className="text-xs text-stone-400 mb-4">
              Enter the unique hive code and apiary location to begin telemetry tracking.
            </p>

            <form onSubmit={handleCreateHive} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Hive Code (e.g. HIVE-004)
                </label>
                <input
                  type="text"
                  required
                  value={newHiveCode}
                  onChange={(e) => setNewHiveCode(e.target.value)}
                  placeholder="HIVE-004"
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Apiary Location
                </label>
                <input
                  type="text"
                  required
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="South Meadow - Sector D"
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Initial Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-400"
                >
                  <option value="Active">Active</option>
                  <option value="Attention">Attention Needed</option>
                  <option value="Dormant">Dormant</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Save Hive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
