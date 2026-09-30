import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  RefreshCw, 
  MapPin, 
  Calendar, 
  Scale, 
  Layers, 
  Hash, 
  ArrowLeft,
  Link as LinkIcon
} from 'lucide-react';
import QRCode from 'qrcode';
import { verifyBatch } from '../services/api';
import AdvancedTraceabilitySection from '../components/AdvancedTraceabilitySection';

export default function ConsumerVerification() {
  const { batchCode } = useParams<{ batchCode: string }>();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    runVerification();
  }, [batchCode]);

  async function runVerification() {
    if (!batchCode) return;
    setLoading(true);
    setError(null);
    try {
      const res = await verifyBatch(batchCode);
      setResult(res);

      const targetUrl = `${window.location.origin}/verify/${encodeURIComponent(batchCode)}`;
      const qr = await QRCode.toDataURL(targetUrl, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 180,
      });
      setQrUrl(qr);
    } catch (err: any) {
      console.warn('Verification request failed:', err);
      setError(err.response?.data?.error || 'Verification check failed');
      setResult({
        verified: false,
        message: 'Verification Failed',
        data: {
          hash_valid: false,
          chain_valid: false,
        },
      });
    } finally {
      setLoading(false);
    }
  }

  const isVerified = result?.verified === true;
  const batch = result?.data || result?.batch;
  const isGenesis = batch?.previous_hash?.startsWith('000000000000');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between py-8 px-4 sm:px-6">
      <div className="max-w-md w-full mx-auto space-y-5">
        {/* Brand header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
            <span>🐝</span>
            <span>SmartBee Authenticity Ledger</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Honey Batch Verification
          </h1>
          <p className="text-xs text-slate-500">
            Batch Code: <span className="font-mono text-slate-900 font-bold">{batchCode}</span>
          </p>
        </div>

        {/* Verification Result Card */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3 shadow-xs">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <h3 className="font-bold text-slate-900 text-sm">Verifying SHA-256 Ledger...</h3>
            <p className="text-xs text-slate-500">Recalculating cryptographic hash and chain continuity.</p>
          </div>
        ) : isVerified ? (
          /* SUCCESS STATE */
          <div className="bg-white border-2 border-emerald-500 rounded-xl p-6 shadow-md space-y-5">
            {/* Success Badge */}
            <div className="text-center space-y-2 pb-4 border-b border-slate-100">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="inline-block px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 font-extrabold text-sm uppercase tracking-wide">
                ✓ Honey Batch Verified
              </div>

              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                This honey batch is certified authentic. Its harvest record matches the cryptographic ledger with zero tampering.
              </p>
            </div>

            {/* Batch Attributes */}
            <div className="space-y-2.5 text-xs">
              {/* Batch Code */}
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  <span>Batch Code</span>
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {batch?.batch_code || batchCode}
                </span>
              </div>

              {/* Hive */}
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Origin Hive</span>
                </span>
                <span className="font-bold text-slate-900">
                  {batch?.hive_code || 'HIVE-001'}
                </span>
              </div>

              {/* Harvest Date */}
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Harvest Date</span>
                </span>
                <span className="font-semibold text-slate-900">
                  {batch?.harvest_date}
                </span>
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-slate-400" />
                  <span>Quantity</span>
                </span>
                <span className="font-semibold text-emerald-800">
                  {parseFloat(batch?.quantity || 0).toFixed(2)} kg
                </span>
              </div>

              {/* Location */}
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Location</span>
                </span>
                <span className="font-semibold text-slate-900 truncate max-w-[180px]">
                  {batch?.location}
                </span>
              </div>

              {/* Hash Validation */}
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Hash Validation</span>
                </span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ✓ Valid (SHA-256 Match)
                </span>
              </div>

              {/* Chain Validation */}
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Chain Validation</span>
                </span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ✓ Valid ({isGenesis ? 'Genesis Block' : 'Linked to Preceding Block'})
                </span>
              </div>

              {/* Current SHA-256 Hash */}
              <div className="pt-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                  Current SHA-256 Hash:
                </span>
                <div className="font-mono text-[10px] text-emerald-900 bg-emerald-50/50 p-2 rounded border border-emerald-200 break-all select-all font-semibold">
                  {batch?.current_hash}
                </div>
              </div>

              {/* Previous Hash */}
              <div className="pt-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                  Previous Hash:
                </span>
                <div className="font-mono text-[10px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200 break-all select-all">
                  {batch?.previous_hash}
                </div>
              </div>
            </div>

            {/* Verification QR Code */}
            {qrUrl && (
              <div className="pt-3 border-t border-slate-100 text-center space-y-2">
                <span className="text-[11px] text-slate-500 block font-medium">Verification QR Code:</span>
                <div className="inline-block p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <img src={qrUrl} alt="Verification QR" className="w-32 h-32 mx-auto" />
                </div>
                <div className="text-[10px] text-slate-400 font-mono break-all">
                  {`${window.location.origin}/verify/${batchCode}`}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* FAILURE STATE */
          <div className="bg-white border-2 border-rose-400 rounded-xl p-6 shadow-md space-y-4">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8" />
              </div>

              <div className="inline-block px-3.5 py-1 rounded-full bg-rose-50 border border-rose-300 text-rose-800 font-extrabold text-sm uppercase tracking-wide">
                ✗ Verification Failed
              </div>

              <p className="text-xs text-rose-700 max-w-xs mx-auto">
                The batch could not be validated. Cryptographic signature does not match stored payload or chain linkage has been broken.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500">Requested Batch:</span>
                <span className="font-mono font-bold text-slate-900">{batchCode}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500">Hash Validation:</span>
                <span className={`font-semibold ${batch?.hash_valid ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {batch?.hash_valid ? '✓ Passed' : '✗ Failed (Data Modified)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Chain Validation:</span>
                <span className={`font-semibold ${batch?.chain_valid ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {batch?.chain_valid ? '✓ Passed' : '✗ Failed (Previous Hash Broken)'}
                </span>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={runVerification}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Verification</span>
              </button>
            </div>
          </div>
        )}

        {/* Advanced QR Traceability Section (Additive Feature) */}
        {!loading && (
          <AdvancedTraceabilitySection
            batch={batch}
            isVerified={isVerified}
            batchCode={batchCode}
          />
        )}

        <div className="text-center pt-2">
          <Link
            to="/"
            className="text-xs text-emerald-700 hover:text-emerald-800 underline font-medium inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Return to SmartBee Apiary Dashboard</span>
          </Link>
        </div>
      </div>

      <footer className="text-center text-[11px] text-slate-400 mt-8">
        SmartBee SIH Prototype • Tamper-evident hash-linked traceability ledger
      </footer>
    </div>
  );
}
