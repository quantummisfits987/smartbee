import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  ShieldAlert, 
  Layers, 
  Calendar, 
  Scale, 
  MapPin, 
  Hash, 
  Link as LinkIcon, 
  Lock, 
  QrCode,
  Sparkles
} from 'lucide-react';

interface AdvancedTraceabilityProps {
  batch: {
    batch_code?: string;
    hive_code?: string;
    hive_id?: number | string;
    harvest_date?: string;
    quantity?: number | string;
    location?: string;
    current_hash?: string;
    previous_hash?: string;
    hash_valid?: boolean;
    chain_valid?: boolean;
    chain_reason?: string;
  } | null;
  isVerified: boolean;
  batchCode?: string;
}

export const AdvancedTraceabilitySection: React.FC<AdvancedTraceabilityProps> = ({
  batch,
  isVerified,
  batchCode,
}) => {
  const hashValid = batch?.hash_valid === true;
  const chainValid = batch?.chain_valid === true;
  const tamperDetected = !hashValid || !chainValid;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Information not available';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Cryptographic Ledger Verification Status Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
              Cryptographic Verification Status
            </h3>
          </div>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
              isVerified
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}
          >
            {isVerified ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Verified Honey Batch
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3 text-rose-600" />
                Unverified / Tampered
              </>
            )}
          </span>
        </div>

        {/* Verification Status Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
          {/* Hash Validation */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">
              Hash Validation
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              {hashValid ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-bold text-emerald-800">VALID</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="font-bold text-rose-800">INVALID</span>
                </>
              )}
            </div>
          </div>

          {/* Chain Validation */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">
              Chain Validation
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              {chainValid ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-bold text-emerald-800">VALID</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="font-bold text-rose-800">INVALID</span>
                </>
              )}
            </div>
          </div>

          {/* Tamper Status */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">
              Tamper Status
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              {!tamperDetected ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-bold text-emerald-800">NOT DETECTED</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="font-bold text-rose-800">DETECTED</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Advanced Traceability Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3.5">
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
          <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
              🔎 Advanced Traceability
            </h3>
            <p className="text-[11px] text-slate-500">
              Verified origin and harvest metadata linked to SHA-256 hash
            </p>
          </div>
        </div>

        {/* Detailed Attributes */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              <span>Batch Code:</span>
            </span>
            <span className="font-mono font-bold text-slate-900">
              {batch?.batch_code || batchCode || 'Information not available'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Hive:</span>
            </span>
            <span className="font-bold text-slate-900">
              {batch?.hive_code || (batch?.hive_id ? `HIVE-00${batch.hive_id}` : 'Information not available')}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Harvest Date:</span>
            </span>
            <span className="font-semibold text-slate-900">
              {formatDate(batch?.harvest_date)}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-slate-400" />
              <span>Quantity:</span>
            </span>
            <span className="font-bold text-emerald-800">
              {batch?.quantity !== undefined && batch?.quantity !== null
                ? `${parseFloat(String(batch.quantity)).toFixed(2)} kg`
                : 'Information not available'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Location:</span>
            </span>
            <span className="font-semibold text-slate-900 truncate max-w-[200px] text-right">
              {batch?.location || 'Information not available'}
            </span>
          </div>

          {/* Cryptographic Hash Pair */}
          <div className="pt-2 space-y-2">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                Previous Hash (Parent Block):
              </span>
              <div className="font-mono text-[10px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 break-all select-all">
                {batch?.previous_hash || 'Information not available'}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                Current SHA-256 Hash:
              </span>
              <div
                className={`font-mono text-[10px] p-2 rounded-lg border break-all select-all font-semibold ${
                  hashValid
                    ? 'text-emerald-900 bg-emerald-50/50 border-emerald-200'
                    : 'text-rose-900 bg-rose-50 border-rose-200'
                }`}
              >
                {batch?.current_hash || 'Information not available'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Honey Production Traceability Timeline Journey */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3.5">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <div className="p-1.5 bg-sky-50 text-sky-700 rounded-lg">
            <LinkIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
              🔗 Traceability Journey
            </h3>
            <p className="text-[11px] text-slate-500">
              Honey production lifecycle from apiary to verified jar
            </p>
          </div>
        </div>

        {/* Visual Timeline Steps */}
        <div className="relative pl-6 space-y-3.5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200">
          {/* Step 1: Hive Origin */}
          <div className="relative">
            <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center text-[10px]">
              🐝
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                1. Apiary Colony Source
              </span>
              <p className="text-[11px] text-slate-500">
                Harvested from <strong className="text-slate-700">{batch?.hive_code || 'HIVE-001'}</strong> in {batch?.location || 'Certified Apiary'}.
              </p>
            </div>
          </div>

          {/* Step 2: Harvest */}
          <div className="relative">
            <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center text-[10px]">
              🌼
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                2. Honey Harvest Event
              </span>
              <p className="text-[11px] text-slate-500">
                Extracted on <strong className="text-slate-700">{formatDate(batch?.harvest_date)}</strong> • Yield: {parseFloat(String(batch?.quantity || 0)).toFixed(2)} kg raw honey.
              </p>
            </div>
          </div>

          {/* Step 3: Honey Batch Created */}
          <div className="relative">
            <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center text-[10px]">
              🍯
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                3. Honey Batch Packaging
              </span>
              <p className="text-[11px] text-slate-500">
                Assigned batch code <strong className="text-slate-700 font-mono">{batch?.batch_code || batchCode}</strong> and cataloged in the apiary inventory.
              </p>
            </div>
          </div>

          {/* Step 4: SHA-256 Hash Chain Verification */}
          <div className="relative">
            <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center text-[10px]">
              🔐
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                <span>4. SHA-256 Hash Chain Integrity</span>
                {hashValid && chainValid ? (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold border border-emerald-200">
                    Verified
                  </span>
                ) : (
                  <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded font-semibold border border-rose-200">
                    Failed
                  </span>
                )}
              </span>
              <p className="text-[11px] text-slate-500">
                Immutable SHA-256 fingerprint chained to preceding block. {batch?.chain_reason || 'Verified ledger link.'}
              </p>
            </div>
          </div>

          {/* Step 5: Consumer QR Verification */}
          <div className="relative">
            <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center text-[10px]">
              📱
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                5. Consumer QR Scan
              </span>
              <p className="text-[11px] text-slate-500">
                Public digital verification authenticates origin, harvest purity, and zero tamper events.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedTraceabilitySection;
