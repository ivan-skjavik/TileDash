// Server-side database and utilities (Node.js environment)
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
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS dashboard_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    config TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS device_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    capability_id TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_device_logs_device_capability 
  ON device_logs(device_id, capability_id);
  
  CREATE INDEX IF NOT EXISTS idx_device_logs_timestamp 
  ON device_logs(timestamp);
` );

// Database query functions
export const queries = {
  // Settings
  getSetting: db.prepare( 'SELECT value FROM settings WHERE key = ?' ),
  setSetting: db.prepare( 'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)' ),
  deleteSetting: db.prepare( 'DELETE FROM settings WHERE key = ?' ),
  getAllSettings: db.prepare( 'SELECT key, value FROM settings' ),

  // Dashboard configs
  getDashboardConfig: db.prepare( 'SELECT config FROM dashboard_configs WHERE name = ?' ),
  saveDashboardConfig: db.prepare( 'INSERT OR REPLACE INTO dashboard_configs (name, config, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)' ),
  getAllDashboardConfigs: db.prepare( 'SELECT name, config, created_at, updated_at FROM dashboard_configs' ),
  deleteDashboardConfig: db.prepare( 'DELETE FROM dashboard_configs WHERE name = ?' ),

  // Device logs
  logDeviceChange: db.prepare( 'INSERT INTO device_logs (device_id, capability_id, old_value, new_value) VALUES (?, ?, ?, ?)' ),
  getDeviceLogs: db.prepare( 'SELECT * FROM device_logs WHERE device_id = ? ORDER BY timestamp DESC LIMIT ?' ),
  getAllRecentLogs: db.prepare( 'SELECT * FROM device_logs ORDER BY timestamp DESC LIMIT ?' ),
  cleanOldLogs: db.prepare( 'DELETE FROM device_logs WHERE timestamp < datetime(\'now\', \'-30 days\')' )
};

export default db;
