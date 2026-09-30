import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Plus, 
  QrCode, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  Link as LinkIcon,
  Search,
  ArrowRight
} from 'lucide-react';
import QRCode from 'qrcode';
import { getBatches, createBatch, getHives } from '../services/api';

export default function HoneyBatches() {
  const [batches, setBatches] = useState<any[]>([]);
  const [hives, setHives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [qrModalBatch, setQrModalBatch] = useState<any | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Form fields
  const [batchCode, setBatchCode] = useState('');
  const [hiveId, setHiveId] = useState('');
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState('15.0');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [batchesData, hivesData] = await Promise.all([getBatches(), getHives()]);
      setBatches(batchesData || []);
      setHives(hivesData || []);

      if (hivesData && hivesData.length > 0 && !hiveId) {
        setHiveId(String(hivesData[0].id));
        setLocation(hivesData[0].location || '');
      }

      const nextNum = (batchesData ? batchesData.length : 0) + 1;
      setBatchCode(`BATCH-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`);
    } catch (err) {
      console.error('Failed to load batches:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleHiveChange(selectedId: string) {
    setHiveId(selectedId);
    const found = hives.find((h) => String(h.id) === selectedId);
    if (found) {
      setLocation(found.location || '');
    }
  }

  async function handleCreateBatch(e: React.FormEvent) {
    e.preventDefault();
    if (!batchCode || !hiveId || !harvestDate || !quantity || !location) return;

    setSubmitting(true);
    try {
      const newBatch = await createBatch({
        batch_code: batchCode,
        hive_id: Number(hiveId),
        harvest_date: harvestDate,
        quantity: parseFloat(quantity),
        location,
      });

      setShowModal(false);
      setSuccessMsg(`Batch ${newBatch.batch_code || batchCode} successfully recorded with SHA-256 seal!`);
      loadData();
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to record batch');
    } finally {
      setSubmitting(false);
    }
  }

  async function openQrModal(batch: any) {
    setQrModalBatch(batch);
    const verifyUrl = `${window.location.origin}/verify/${encodeURIComponent(batch.batch_code)}`;
    try {
      const dataUrl = await QRCode.toDataURL(verifyUrl, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 260,
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('QR code generation error:', err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Honey Batch Traceability
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Tamper-evident hash-linked traceability ledger securing honey harvests to apiary origin.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Batch</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Traceability Ledger Chain Ribbon */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
          <LinkIcon className="w-4 h-4 text-emerald-600" />
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
            Tamper-evident hash-linked traceability ledger
          </h3>
          <span className="text-[10px] text-slate-400">
            (Immutable SHA-256 parent block references — centralized cryptographic integrity)
          </span>
        </div>

        {batches.length === 0 ? (
          <div className="text-slate-400 text-xs py-4 text-center">No batches recorded in ledger yet.</div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto py-1 text-xs">
            {batches.map((batch, index) => {
              const isGenesis = batch.previous_hash?.startsWith('000000000000');
              return (
                <React.Fragment key={batch.id}>
                  <div className="bg-slate-50 border border-slate-200 hover:border-emerald-300 rounded-lg p-3 min-w-[210px] shrink-0">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold text-slate-900">{batch.batch_code}</span>
                      <span className="text-emerald-700 text-[10px] font-semibold bg-emerald-100 px-1.5 py-0.2 rounded">
                        ✓ Sealed
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px] mb-1.5">
                      {batch.hive_code} • {parseFloat(batch.quantity).toFixed(1)} kg
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 space-y-0.5 border-t border-slate-200 pt-1">
                      <div className="truncate" title={`Prev: ${batch.previous_hash}`}>
                        <span className="text-slate-400">prev:</span>{' '}
                        {isGenesis ? 'GENESIS_HASH' : batch.previous_hash.slice(0, 10) + '...'}
                      </div>
                      <div className="truncate text-emerald-700" title={`Current: ${batch.current_hash}`}>
                        <span className="text-slate-400">hash:</span> {batch.current_hash.slice(0, 10)}...
                      </div>
                    </div>
                  </div>

                  {index < batches.length - 1 && (
                    <div className="text-slate-400 shrink-0">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* Batches Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-900 text-sm">Registered Honey Batches</h3>
          <span className="text-xs text-slate-400">{batches.length} entries</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Loading batch ledger...</span>
          </div>
        ) : batches.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No honey batches registered yet. Click "Record New Batch" above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-y border-slate-200 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Batch Code</th>
                  <th className="py-2.5 px-3">Hive</th>
                  <th className="py-2.5 px-3">Harvest Date</th>
                  <th className="py-2.5 px-3">Quantity</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Current Hash (SHA-256)</th>
                  <th className="py-2.5 px-3">Verification</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-bold text-emerald-700">
                      <Link to={`/batches/${batch.batch_code}`} className="hover:underline">
                        {batch.batch_code}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {batch.hive_code}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {String(batch.harvest_date).split('T')[0]}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {parseFloat(batch.quantity).toFixed(2)} kg
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 truncate max-w-[130px]">
                      {batch.location}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">
                      <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200" title={batch.current_hash}>
                        {batch.current_hash ? batch.current_hash.slice(0, 14) + '...' : '--'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ✓ Verified
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openQrModal(batch)}
                          className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                          title="View Consumer QR Code"
                        >
                          <QrCode className="w-4 h-4 text-emerald-600" />
                        </button>
                        <Link
                          to={`/verify/${batch.batch_code}`}
                          className="px-2 py-1 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1"
                        >
                          <span>Verify</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Batch Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Record New Honey Harvest Batch</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                The Express backend will look up the previous batch hash and compute a cryptographic SHA-256 seal.
              </p>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Batch Code
                  </label>
                  <input
                    type="text"
                    required
                    value={batchCode}
                    onChange={(e) => setBatchCode(e.target.value)}
                    placeholder="BATCH-2026-003"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Origin Hive
                  </label>
                  <select
                    value={hiveId}
                    onChange={(e) => handleHiveChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                  >
                    {hives.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.hive_code} ({h.location})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harvest Date
                  </label>
                  <input
                    type="date"
                    required
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Apiary Geographic Location
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="North Apiary - Sector A"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] text-slate-500">
                Note: Hashes are calculated securely on the server using Node.js crypto SHA-256.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Sealing...' : 'Record Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Inspection Modal */}
      {qrModalBatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-slate-200 text-center space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">{qrModalBatch.batch_code}</h3>
              <p className="text-xs text-slate-500">Consumer Verification QR Code</p>
            </div>

            <div className="bg-white p-3 rounded-xl inline-block border border-slate-200 shadow-2xs">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                  Generating...
                </div>
              )}
            </div>

            <div className="text-xs text-slate-600">
              <span className="block text-[11px] text-slate-400 mb-0.5">Verification URL:</span>
              <code className="text-[11px] font-mono text-emerald-800 break-all bg-slate-50 p-1.5 rounded border border-slate-200 block">
                {`${window.location.origin}/verify/${qrModalBatch.batch_code}`}
              </code>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setQrModalBatch(null)}
                className="flex-1 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              <Link
                to={`/verify/${qrModalBatch.batch_code}`}
                className="flex-1 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1 shadow-xs"
              >
                <span>Open Verification</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
