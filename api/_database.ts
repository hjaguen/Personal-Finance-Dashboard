import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';

let db: SqlJsDatabase | null = null;
let dbInitPromise: Promise<SqlJsDatabase> | null = null;

export async function initDatabase(): Promise<SqlJsDatabase> {
  if (db) return db;
  
  if (dbInitPromise) return dbInitPromise;
  
  dbInitPromise = (async () => {
    const SQL = await initSqlJs();
    db = new SQL.Database();
    
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
        type TEXT NOT NULL,
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
  })();
  
  return dbInitPromise;
}

export function getDb(): SqlJsDatabase {
  if (!db) throw new Error('Database not initialized - call initDatabase first');
  return db;
}