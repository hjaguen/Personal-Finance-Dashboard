import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../database.sqlite');

export const db = new Database(dbPath);

export function initDatabase() {
  // Users table (for authentication)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      icon TEXT,
      color TEXT,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category_id INTEGER,
      date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  // Insert default categories for new users (if no user_id)
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

  const insertCategory = db.prepare(
    'INSERT OR IGNORE INTO categories (name, icon, color) VALUES (?, ?, ?)'
  );

  for (const cat of defaultCategories) {
    insertCategory.run(cat.name, cat.icon, cat.color);
  }

  console.log('✅ Database initialized with auth');
}