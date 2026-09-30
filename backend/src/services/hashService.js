import crypto from 'crypto';

/**
 * Hash Service for SmartBee Traceability Ledger
 * Generates and verifies SHA-256 hashes for honey batches.
 */

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export function formatHarvestDate(d) {
  if (!d) return '';
  if (d instanceof Date) {
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(d).split('T')[0].trim();
}

/**
 * Creates a normalized payload string from batch attributes
 */
export function createBatchPayload(batch) {
  const batchCode = String(batch.batch_code || batch.batchCode || '').trim();
  const hiveId = String(batch.hive_id || batch.hiveId || '').trim();
  const rawDate = batch.harvest_date || batch.harvestDate || '';
  const harvestDate = formatHarvestDate(rawDate);
  const quantity = Number(batch.quantity || 0).toFixed(2);
  const location = String(batch.location || '').trim();
  const previousHash = String(batch.previous_hash || batch.previousHash || GENESIS_HASH).trim();

  return `${batchCode}|${hiveId}|${harvestDate}|${quantity}|${location}|${previousHash}`;
}

/**
 * Generates SHA-256 hash for a honey batch payload
 */
export function calculateBatchHash(batch) {
  const payload = createBatchPayload(batch);
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}

/**
 * Verifies if a given batch's current_hash accurately matches its payload
 */
export function verifyBatchHash(batch) {
  if (!batch || !batch.current_hash) {
    return {
      isValid: false,
      reason: 'Batch record or current hash is missing',
    };
  }

  const expectedHash = calculateBatchHash(batch);
  const isValid = expectedHash.toLowerCase() === batch.current_hash.toLowerCase();

  return {
    isValid,
    expectedHash,
    actualHash: batch.current_hash,
    payloadString: createBatchPayload(batch),
    reason: isValid ? 'Hash signature matches payload data exactly.' : 'Tamper detected! Stored hash does not match computed payload.',
  };
}

/**
 * Verifies the blockchain-style ledger relationship with the previous batch
 */
export function verifyLedgerChain(currentBatch, previousBatch) {
  const selfCheck = verifyBatchHash(currentBatch);
  if (!selfCheck.isValid) {
    return {
      isValid: false,
      step: 'self_hash',
      reason: selfCheck.reason,
      details: selfCheck,
    };
  }

  // If there is no previous batch, this should point to GENESIS_HASH
  if (!previousBatch) {
    const isGenesis = !currentBatch.previous_hash || currentBatch.previous_hash === GENESIS_HASH;
    return {
      isValid: isGenesis,
      step: 'genesis_link',
      isGenesis: true,
      reason: isGenesis ? 'Valid Genesis batch link.' : 'Invalid initial batch: previous hash must be genesis zero.',
      details: selfCheck,
    };
  }

  // Otherwise, previous_hash must match the previousBatch's current_hash
  const prevHashValid = (currentBatch.previous_hash || '').toLowerCase() === (previousBatch.current_hash || '').toLowerCase();
  return {
    isValid: prevHashValid,
    step: 'chain_link',
    isGenesis: false,
    reason: prevHashValid ? 'Valid chain linkage to previous batch.' : 'Broken chain linkage: previous_hash does not match previous batch current_hash.',
    previousBatchCode: previousBatch.batch_code,
    details: selfCheck,
  };
}
