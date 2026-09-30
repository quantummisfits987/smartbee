import QRCode from 'qrcode';
import { query } from '../db/index.js';
import {
  calculateBatchHash,
  verifyBatchHash,
  formatHarvestDate,
  GENESIS_HASH,
} from '../services/hashService.js';

/**
 * Honey Batch & Traceability Controller
 * Implements SHA-256 hash-linked traceability ledger with QR codes
 */

export async function getBatches(req, res, next) {
  try {
    const result = await query(
      `SELECT hb.*, h.hive_code 
       FROM honey_batches hb 
       JOIN hives h ON hb.hive_id = h.id 
       ORDER BY hb.id DESC`
    );

    res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      batches: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

export async function getBatchByCode(req, res, next) {
  try {
    const { batchCode } = req.params;

    if (!batchCode || !batchCode.trim()) {
      return res.status(400).json({
        success: false,
        error: 'batchCode parameter is required',
        message: 'batchCode parameter is required',
      });
    }

    const result = await query(
      `SELECT hb.*, h.hive_code, h.location as hive_location 
       FROM honey_batches hb 
       JOIN hives h ON hb.hive_id = h.id 
       WHERE hb.batch_code = $1`,
      [batchCode.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Honey batch '${batchCode}' not found`,
        message: `Honey batch '${batchCode}' not found`,
      });
    }

    const batch = result.rows[0];
    const verification = verifyBatchHash(batch);

    // Generate QR code data URL pointing solely to consumer verification URL
    const appOrigin = process.env.APP_URL || process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const verifyUrl = `${appOrigin}/verify/${encodeURIComponent(batch.batch_code)}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
    });

    const payload = {
      ...batch,
      verification,
      verifyUrl,
      qrCodeUrl: qrDataUrl,
    };

    res.status(200).json({
      success: true,
      data: payload,
      batch: payload,
    });
  } catch (error) {
    next(error);
  }
}

export async function createBatch(req, res, next) {
  try {
    const { batch_code, hive_id, harvest_date, quantity, location } = req.body;

    // 1. Validation of required batch fields
    if (!batch_code || typeof batch_code !== 'string' || !batch_code.trim()) {
      return res.status(400).json({
        success: false,
        error: 'batch_code is required and must be a non-empty string',
        message: 'batch_code is required and must be a non-empty string',
      });
    }

    if (!hive_id || isNaN(Number(hive_id))) {
      return res.status(400).json({
        success: false,
        error: 'Valid numeric hive_id is required',
        message: 'Valid numeric hive_id is required',
      });
    }

    if (!harvest_date || typeof harvest_date !== 'string' || !harvest_date.trim()) {
      return res.status(400).json({
        success: false,
        error: 'harvest_date is required (YYYY-MM-DD)',
        message: 'harvest_date is required (YYYY-MM-DD)',
      });
    }

    const parsedQty = parseFloat(quantity);
    if (quantity === undefined || isNaN(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid numeric quantity greater than 0 is required',
        message: 'Valid numeric quantity greater than 0 is required',
      });
    }

    if (!location || typeof location !== 'string' || !location.trim()) {
      return res.status(400).json({
        success: false,
        error: 'location is required and must be a non-empty string',
        message: 'location is required and must be a non-empty string',
      });
    }

    const cleanBatchCode = batch_code.trim().toUpperCase();
    const parsedHiveId = parseInt(hive_id, 10);
    const cleanLocation = location.trim();
    const cleanHarvestDate = String(harvest_date).split('T')[0];

    // Verify hive exists
    const hiveRes = await query('SELECT * FROM hives WHERE id = $1', [parsedHiveId]);
    if (hiveRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Specified hive with ID ${parsedHiveId} does not exist`,
        message: `Specified hive with ID ${parsedHiveId} does not exist`,
      });
    }

    // Verify uniqueness of batch_code
    const existing = await query('SELECT * FROM honey_batches WHERE batch_code = $1', [cleanBatchCode]);
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Batch code '${cleanBatchCode}' already exists`,
        message: `Batch code '${cleanBatchCode}' already exists`,
      });
    }

    // 2. Obtain previous batch in ledger to chain previous_hash
    const latestBatchRes = await query('SELECT * FROM honey_batches ORDER BY id DESC LIMIT 1');
    const previousBatch = latestBatchRes.rows[0] || null;
    const previousHash = previousBatch ? previousBatch.current_hash : GENESIS_HASH;

    // 3. Deterministic payload creation & SHA-256 calculation (Backend is sole authority)
    const draftBatch = {
      batch_code: cleanBatchCode,
      hive_id: parsedHiveId,
      harvest_date: cleanHarvestDate,
      quantity: parsedQty,
      location: cleanLocation,
      previous_hash: previousHash,
    };

    const currentHash = calculateBatchHash(draftBatch);

    // 4. Store in PostgreSQL
    const insertRes = await query(
      `INSERT INTO honey_batches (batch_code, hive_id, harvest_date, quantity, location, previous_hash, current_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        draftBatch.batch_code,
        draftBatch.hive_id,
        draftBatch.harvest_date,
        draftBatch.quantity,
        draftBatch.location,
        draftBatch.previous_hash,
        currentHash,
      ]
    );

    const savedBatch = insertRes.rows[0];

    // Generate QR code for immediate return (pointing to /verify/:batchCode)
    const appOrigin = process.env.APP_URL || process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const verifyUrl = `${appOrigin}/verify/${encodeURIComponent(savedBatch.batch_code)}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
    });

    const payload = {
      ...savedBatch,
      verifyUrl,
      qrCodeUrl: qrDataUrl,
    };

    res.status(201).json({
      success: true,
      data: payload,
      batch: payload,
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyBatch(req, res, next) {
  try {
    const { batchCode } = req.params;

    if (!batchCode || !batchCode.trim()) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: 'Verification Failed',
        error: 'batchCode parameter is required',
        data: {
          hash_valid: false,
          chain_valid: false,
        },
      });
    }

    // 1. Fetch batch by code
    const result = await query(
      `SELECT hb.*, h.hive_code, h.location as hive_location 
       FROM honey_batches hb 
       JOIN hives h ON hb.hive_id = h.id 
       WHERE hb.batch_code = $1`,
      [batchCode.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        verified: false,
        message: 'Verification Failed',
        error: `Batch '${batchCode}' not found in SmartBee traceability ledger`,
        data: {
          hash_valid: false,
          chain_valid: false,
        },
      });
    }

    const batch = result.rows[0];

    // 2. Independently recalculate expected hash from stored batch data
    const expectedHash = calculateBatchHash(batch);
    const hashValid = expectedHash.toLowerCase() === (batch.current_hash || '').toLowerCase();

    // 3. Find preceding batch in the ledger sequence (by id)
    const prevRes = await query(
      'SELECT * FROM honey_batches WHERE id < $1 ORDER BY id DESC LIMIT 1',
      [batch.id]
    );
    const precedingBatch = prevRes.rows[0] || null;

    let chainValid = false;
    let chainReason = '';

    if (!precedingBatch) {
      // Genesis batch: previous_hash must equal GENESIS_HASH
      chainValid = (batch.previous_hash || '').toLowerCase() === GENESIS_HASH.toLowerCase();
      chainReason = chainValid
        ? 'Valid Genesis batch link'
        : 'Broken chain linkage: Genesis batch previous_hash does not match GENESIS_HASH';
    } else {
      // Non-genesis batch: previous_hash must equal preceding batch's current_hash
      chainValid = (batch.previous_hash || '').toLowerCase() === (precedingBatch.current_hash || '').toLowerCase();
      chainReason = chainValid
        ? `Valid chain linkage to previous batch ${precedingBatch.batch_code}`
        : `Broken chain linkage: previous_hash does not match previous batch ${precedingBatch.batch_code} current_hash`;
    }

    // Both self-hash integrity AND chain linkage must pass
    const isOverallVerified = hashValid && chainValid;

    const dataPayload = {
      batch_code: batch.batch_code,
      hive_code: batch.hive_code,
      location: batch.location,
      harvest_date: formatHarvestDate(batch.harvest_date),
      quantity: parseFloat(batch.quantity),
      current_hash: batch.current_hash,
      previous_hash: batch.previous_hash,
      expected_hash: expectedHash,
      hash_valid: hashValid,
      chain_valid: chainValid,
      chain_reason: chainReason,
    };

    res.status(200).json({
      success: true,
      verified: isOverallVerified,
      message: isOverallVerified ? 'Honey Batch Verified' : 'Verification Failed',
      data: dataPayload,
      batch: dataPayload,
      cryptographicProof: {
        algorithm: 'SHA-256',
        computedHash: expectedHash,
        storedHash: batch.current_hash,
        hashMatch: hashValid,
        chainLinkValid: chainValid,
        chainReason: chainReason,
      },
    });
  } catch (error) {
    next(error);
  }
}
