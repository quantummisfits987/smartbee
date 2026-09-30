-- ============================================================
-- SmartBee – Seed Data for PostgreSQL
-- ============================================================

-- 1. Insert 3 Sample Hives
INSERT INTO hives (id, hive_code, location, status, created_at)
VALUES 
  (1, 'HIVE-001', 'North Apiary - Sector A', 'Active', CURRENT_TIMESTAMP - INTERVAL '30 days'),
  (2, 'HIVE-002', 'Meadow Apiary - Sector B', 'Active', CURRENT_TIMESTAMP - INTERVAL '25 days'),
  (3, 'HIVE-003', 'Hillside Apiary - Sector C', 'Attention', CURRENT_TIMESTAMP - INTERVAL '15 days')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence if needed
SELECT setval('hives_id_seq', (SELECT MAX(id) FROM hives));

-- 2. Insert Sensor Readings
INSERT INTO sensor_readings (hive_id, temperature, humidity, weight, bee_activity, recorded_at)
VALUES
  (1, 35.1, 56.4, 44.5, 'Normal', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
  (1, 35.3, 55.8, 44.8, 'High', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
  (1, 35.4, 55.2, 45.0, 'Normal', CURRENT_TIMESTAMP),

  (2, 34.8, 58.2, 39.2, 'Normal', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
  (2, 35.0, 57.9, 39.4, 'Normal', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
  (2, 35.1, 57.5, 39.6, 'High', CURRENT_TIMESTAMP),

  (3, 32.4, 68.5, 31.0, 'Low', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
  (3, 32.1, 70.1, 30.8, 'Low', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
  (3, 31.8, 71.5, 30.5, 'Low', CURRENT_TIMESTAMP);

-- 3. Insert Symptoms
INSERT INTO symptoms (hive_id, mite_count, bee_activity, brood_pattern, dead_bees, created_at)
VALUES
  (1, 'Low', 'Normal', 'Normal', 8, CURRENT_TIMESTAMP - INTERVAL '5 days'),
  (2, 'Low', 'Normal', 'Normal', 12, CURRENT_TIMESTAMP - INTERVAL '3 days'),
  (3, 'High', 'Low', 'Irregular', 45, CURRENT_TIMESTAMP - INTERVAL '1 day');

-- 4. Insert Honey Batches (with valid cryptographic SHA-256 chain)
-- Genesis Batch:
-- Payload: "BATCH-2026-001|1|2026-08-15|18.50|North Apiary - Sector A|0000000000000000000000000000000000000000000000000000000000000000"
-- SHA-256: d9f8d1ce399df899120612662c9693158cceac52c1e8d98d49f6a7d55f44da60
-- Second Batch:
-- Payload: "BATCH-2026-002|2|2026-09-01|14.20|Meadow Apiary - Sector B|d9f8d1ce399df899120612662c9693158cceac52c1e8d98d49f6a7d55f44da60"
-- SHA-256: 34ef32238411b4028b320d3674d8120fa2e3c0490b7931f6dbe627b08dd661ff

INSERT INTO honey_batches (id, batch_code, hive_id, harvest_date, quantity, location, previous_hash, current_hash, created_at)
VALUES
  (1, 'BATCH-2026-001', 1, '2026-08-15', 18.50, 'North Apiary - Sector A', 
   '0000000000000000000000000000000000000000000000000000000000000000',
   '62539c428ca3f0b82ffc7d298b6ef9b57c8f2f821065d507e32532b41da44042',
   CURRENT_TIMESTAMP - INTERVAL '40 days'),
  (2, 'BATCH-2026-002', 2, '2026-09-01', 14.20, 'Meadow Apiary - Sector B',
   '62539c428ca3f0b82ffc7d298b6ef9b57c8f2f821065d507e32532b41da44042',
   '3a0e39969dda521cede3651542a1752bd6da0e478be7abb8f0dab91c6cb50363',
   CURRENT_TIMESTAMP - INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;

SELECT setval('honey_batches_id_seq', (SELECT MAX(id) FROM honey_batches));

-- 5. Insert AI Advisories
INSERT INTO ai_advisories (hive_id, risk_level, analysis, recommendation, created_at)
VALUES
  (1, 'Low', 'Temperature (35.4°C) and humidity (55.2%) are within optimal brood maintenance ranges. Mite count is low and bee foraging activity is robust.', 'Continue regular bi-weekly monitoring. Inspect supers for honey surplus in 10 days.', CURRENT_TIMESTAMP - INTERVAL '5 days'),
  (3, 'High', 'Elevated mite infestation observed alongside spotty brood pattern and reduced core temperature (31.8°C). Increased dead bees at hive entrance indicate active Varroa pressure or secondary virus progression.', 'Perform immediate Varroa threshold alcohol wash or sugar shake. Consider approved organic formic acid or thymol treatment. Reduce entrance to prevent robbing.', CURRENT_TIMESTAMP - INTERVAL '1 day');
