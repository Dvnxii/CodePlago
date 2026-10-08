const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DB_DIR, 'codeplago.db');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

let _db = null;

function persist() {
  if (!_db) return;
  try {
    const data = _db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (e) {
    console.error('DB persist error:', e.message);
  }
}

function wrapDb(raw) {
  return {
    prepare: (sql) => ({
      run: (...params) => {
        raw.run(sql, params.flat());
        persist();
        return { changes: 1 };
      },
      get: (...params) => {
        const stmt = raw.prepare(sql);
        stmt.bind(params.flat());
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        }
        stmt.free();
        return undefined;
      },
      all: (...params) => {
        const results = [];
        const stmt = raw.prepare(sql);
        stmt.bind(params.flat());
        while (stmt.step()) results.push(stmt.getAsObject());
        stmt.free();
        return results;
      }
    })
  };
}

async function initDb() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(buf);
  } else {
    _db = new SQL.Database();
  }

  _db.run(`
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, language TEXT,
      code TEXT NOT NULL, lines INTEGER, created_at DATETIME DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS checks (
      id TEXT PRIMARY KEY, name TEXT NOT NULL,
      created_at DATETIME DEFAULT (datetime('now')), status TEXT DEFAULT 'pending'
    );
    CREATE TABLE IF NOT EXISTS check_files (
      id TEXT PRIMARY KEY, check_id TEXT NOT NULL, submission_id TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS results (
      id TEXT PRIMARY KEY, check_id TEXT NOT NULL, file_a_id TEXT NOT NULL,
      file_b_id TEXT NOT NULL, similarity REAL NOT NULL,
      matched_lines INTEGER DEFAULT 0, details TEXT
    );
  `);
  persist();
  return wrapDb(_db);
}

module.exports = { initDb };
