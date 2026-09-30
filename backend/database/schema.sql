-- ============================================================
-- SmartBee – Smart Beekeeping & Honey Traceability System
-- Database Schema for PostgreSQL
-- ============================================================

-- Drop tables if they already exist (in reverse dependency order)
DROP TABLE IF EXISTS ai_advisories CASCADE;
DROP TABLE IF EXISTS honey_batches CASCADE;
DROP TABLE IF EXISTS symptoms CASCADE;
DROP TABLE IF EXISTS sensor_readings CASCADE;
DROP TABLE IF EXISTS hives CASCADE;

-- 1. Hives Table
CREATE TABLE hives (
    id SERIAL PRIMARY KEY,
    hive_code VARCHAR(50) UNIQUE NOT NULL,
    location VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active', -- 'Active', 'Attention', 'Critical', 'Dormant'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Sensor Readings Table
CREATE TABLE sensor_readings (
    id SERIAL PRIMARY KEY,
    hive_id INTEGER NOT NULL REFERENCES hives(id) ON DELETE CASCADE,
    temperature NUMERIC(5, 2) NOT NULL,   -- Celsius, e.g. 35.20
    humidity NUMERIC(5, 2) NOT NULL,      -- Percentage, e.g. 58.50
    weight NUMERIC(6, 2) NOT NULL,        -- kg, e.g. 42.80
    bee_activity VARCHAR(50) NOT NULL,    -- 'High', 'Normal', 'Low', 'Very Low'
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Symptoms Table
CREATE TABLE symptoms (
    id SERIAL PRIMARY KEY,
    hive_id INTEGER NOT NULL REFERENCES hives(id) ON DELETE CASCADE,
    mite_count VARCHAR(50) NOT NULL,      -- 'Low', 'Medium', 'High'
    bee_activity VARCHAR(50) NOT NULL,    -- 'Normal', 'Low'
    brood_pattern VARCHAR(50) NOT NULL,   -- 'Normal', 'Irregular'
    dead_bees INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Honey Batches Table (Hash-Linked Traceability Ledger)
CREATE TABLE honey_batches (
    id SERIAL PRIMARY KEY,
    batch_code VARCHAR(50) UNIQUE NOT NULL,
    hive_id INTEGER NOT NULL REFERENCES hives(id) ON DELETE RESTRICT,
    harvest_date DATE NOT NULL,
    quantity NUMERIC(6, 2) NOT NULL,      -- kg, e.g. 15.50
    location VARCHAR(255) NOT NULL,
    previous_hash VARCHAR(64) NOT NULL,   -- SHA-256 of previous batch (or 'GENESIS_HASH')
    current_hash VARCHAR(64) NOT NULL,    -- SHA-256 of current batch payload
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. AI Advisories Table
CREATE TABLE ai_advisories (
    id SERIAL PRIMARY KEY,
    hive_id INTEGER NOT NULL REFERENCES hives(id) ON DELETE CASCADE,
    risk_level VARCHAR(50) NOT NULL,      -- 'Low', 'Moderate', 'High', 'Critical'
    analysis TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for frequent lookups
CREATE INDEX idx_sensor_readings_hive_id ON sensor_readings(hive_id);
CREATE INDEX idx_sensor_readings_recorded_at ON sensor_readings(recorded_at DESC);
CREATE INDEX idx_honey_batches_batch_code ON honey_batches(batch_code);
CREATE INDEX idx_symptoms_hive_id ON symptoms(hive_id);
CREATE INDEX idx_ai_advisories_hive_id ON ai_advisories(hive_id);

-- 6. Users Table (Authentication Module)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

