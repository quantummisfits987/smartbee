import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Hash, 
  ExternalLink, 
  RefreshCw 
} from 'lucide-react';
import QRCode from 'qrcode';
import { getBatch } from '../services/api';

export default function BatchDetails() {
  const { batchCode } = useParams<{ batchCode: string }>();
  const [batch, setBatch] = useState<any>(null);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    loadDetails();
  }, [batchCode]);

  async function loadDetails() {
    if (!batchCode) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getBatch(batchCode);
      setBatch(data);

      const verifyUrl = `${window.location.origin}/verify/${encodeURIComponent(batchCode)}`;
      const qr = await QRCode.toDataURL(verifyUrl, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 240,
      });
      setQrUrl(qr);
    } catch (err: any) {
      setError(err.response?.data?.error || `Batch '${batchCode}' not found`);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
        <span>Loading batch cryptographic record...</span>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-md mx-auto space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
        <h3 className="font-bold text-slate-900 text-base">Batch Not Found</h3>
        <p className="text-xs text-slate-500">{error || `Batch ${batchCode} does not exist in the ledger.`}</p>
        <Link to="/batches" className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold">
          Return to Batches
        </Link>
      </div>
    );
  }

  const verifyUrl = `${window.location.origin}/verify/${encodeURIComponent(batch.batch_code)}`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/batches"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {batch.batch_code}
              </h1>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ✓ Cryptographically Sealed
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              SmartBee Traceability Ledger Record
            </p>
          </div>
        </div>

        {/* Action button: Verify Batch which opens /verify/:batchCode */}
        <Link
          to={`/verify/${batch.batch_code}`}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <span>Verify Batch</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Harvest & Hash Details (2 cols) */}
        <div className="md:col-span-2 space-y-4">
          {/* Harvest Attributes */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Harvest Specifications</h3>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] mb-0.5">Origin Colony Hive</span>
                <span className="font-bold text-slate-900 text-sm">{batch.hive_code}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] mb-0.5">Harvest Date</span>
                <span className="font-bold text-slate-900 text-sm">
                  {String(batch.harvest_date).split('T')[0]}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] mb-0.5">Quantity (kg)</span>
                <span className="font-bold text-emerald-800 text-sm">
                  {parseFloat(batch.quantity).toFixed(2)} kg
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] mb-0.5">Apiary Location</span>
                <span className="font-bold text-slate-900 text-sm truncate block">{batch.location}</span>
              </div>
            </div>
          </div>

          {/* Cryptographic SHA-256 Signatures */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-emerald-600" />
                <span>SHA-256 Ledger Hashes</span>
              </h3>
              {copied && <span className="text-[11px] text-emerald-700 font-semibold">{copied} copied!</span>}
            </div>

            {/* Current Hash */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-semibold text-slate-600">Current Hash (SHA-256)</span>
                <button
                  onClick={() => handleCopy(batch.current_hash, 'Current hash')}
                  className="text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
              <div className="font-mono text-xs text-emerald-900 break-all select-all font-semibold">
                {batch.current_hash}
              </div>
            </div>

            {/* Previous Hash */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-semibold text-slate-600">Previous Hash</span>
                <button
                  onClick={() => handleCopy(batch.previous_hash, 'Previous hash')}
                  className="text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
              <div className="font-mono text-xs text-slate-600 break-all select-all">
                {batch.previous_hash}
              </div>
            </div>

            {/* Verification URL */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-600 block text-[11px] mb-1">Verification URL</span>
              <div className="font-mono text-xs text-slate-700 break-all select-all">
                {verifyUrl}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: QR Code Card (1 col) */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs text-center space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Consumer QR Code</h3>
            
            <div className="bg-white p-3 rounded-xl border border-slate-200 inline-block shadow-2xs">
              {qrUrl ? (
                <img src={qrUrl} alt="QR Code" className="w-44 h-44 mx-auto" />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400">
                  Generating...
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Scan with a smartphone camera to access public verification.
            </p>

            <Link
              to={`/verify/${batch.batch_code}`}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <span>Verify Batch</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
