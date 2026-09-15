// db/database.js
// SQLite database setup using better-sqlite3 (fast, synchronous, zero-config).
// The database file is created automatically on first run at db/ads.db.

const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'ads.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    property_type TEXT,
    project_type TEXT,
    timeline TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    source TEXT DEFAULT 'website',
    ip_address TEXT
  );
`);

module.exports = db;
