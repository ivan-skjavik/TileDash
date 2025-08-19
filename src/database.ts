import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __dirname = dirname( fileURLToPath( import.meta.url ) );
const dbPath = join( __dirname, '../db' );

// Ensure db directory exists
if ( !existsSync( dbPath ) ) {
  mkdirSync( dbPath, { recursive: true } );
}

const db = new Database( join( dbPath, 'tiledash.db' ) );

// Enable foreign keys
db.pragma( 'foreign_keys = ON' );

// Create tables
db.exec( `
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS dashboard_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    config TEXT NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS device_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    device_name TEXT,
    capability_id TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_device_logs_device_id ON device_logs(device_id);
  CREATE INDEX IF NOT EXISTS idx_device_logs_timestamp ON device_logs(timestamp);
  CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
` );

export default db;

export const queries = {
  // Settings
  getSetting: db.prepare( 'SELECT value FROM settings WHERE key = ?' ),
  setSetting: db.prepare( `
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  ` ),
  
  // Dashboard configs
  getActiveDashboardConfig: db.prepare( 'SELECT * FROM dashboard_configs WHERE is_active = TRUE LIMIT 1' ),
  saveDashboardConfig: db.prepare( `
    INSERT INTO dashboard_configs (name, config, is_active) VALUES (?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET config = excluded.config, updated_at = CURRENT_TIMESTAMP
  ` ),
  setActiveDashboard: db.prepare( `
    UPDATE dashboard_configs SET is_active = CASE WHEN name = ? THEN TRUE ELSE FALSE END
  ` ),
  
  // Device logs
  logDeviceChange: db.prepare( `
    INSERT INTO device_logs (device_id, device_name, capability_id, old_value, new_value)
    VALUES (?, ?, ?, ?, ?)
  ` ),
  getDeviceHistory: db.prepare( `
    SELECT * FROM device_logs 
    WHERE device_id = ? AND capability_id = ? 
    ORDER BY timestamp DESC 
    LIMIT ?
  ` ),
  
  // Cleanup old logs (keep last 1000 entries per device)
  cleanupOldLogs: db.prepare( `
    DELETE FROM device_logs 
    WHERE id NOT IN (
      SELECT id FROM device_logs 
      ORDER BY timestamp DESC 
      LIMIT 1000
    )
  ` )
};
