import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';

let db: SqlJsDatabase | null = null;

export async function initDatabase() {
  if (db) return db;

  const SQL = await initSqlJs();
  
  // Try to load existing database from /tmp (Vercel)
  try {
    const savedDb = await fetch('/api/db').then(r => r.arrayBuffer()).catch(() => null);
    if (savedDb) {
      db = new SQL.Database(new Uint8Array(savedDb));
    } else {
      db = new SQL.Database();
    }
  } catch {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      icon TEXT,
      color TEXT,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category_id INTEGER,
      date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Default categories
  const defaultCategories = [
    { name: 'Salary', icon: '💰', color: '#22c55e' },
    { name: 'Food', icon: '🍔', color: '#f97316' },
    { name: 'Transport', icon: '🚗', color: '#3b82f6' },
    { name: 'Entertainment', icon: '🎬', color: '#8b5cf6' },
    { name: 'Utilities', icon: '💡', color: '#eab308' },
    { name: 'Shopping', icon: '🛒', color: '#ec4899' },
    { name: 'Health', icon: '🏥', color: '#ef4444' },
    { name: 'Other', icon: '📦', color: '#6b7280' },
  ];

  for (const cat of defaultCategories) {
    try {
      db.run('INSERT INTO categories (name, icon, color) VALUES (?, ?, ?)', [cat.name, cat.icon, cat.color]);
    } catch {
      // Ignore duplicates
    }
  }

  console.log('✅ Database initialized (sql.js)');
  return db;
}

export function getDb() {
  if (!db) throw new Error('Database not initialized');
  return db;
}

// Helper to convert sql.js result to array of objects
export function queryAll(sql: string, params: any[] = []): any[] {
  const stmt = getDb().prepare(sql);
  stmt.bind(params);
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

export function queryOne(sql: string, params: any[] = []): any {
  const results = queryAll(sql, params);
  return results[0] || null;
}

export function run(sql: string, params: any[] = []): { lastInsertRowid: number; changes: number } {
  getDb().run(sql, params);
  const lastId = queryOne('SELECT last_insert_rowid() as id');
  const changes = getDb().getRowsModified();
  return { lastInsertRowid: lastId?.id || 0, changes };
}