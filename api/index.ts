import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';

let db: SqlJsDatabase | null = null;
let dbInitPromise: Promise<SqlJsDatabase> | null = null;

async function getDb() {
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

// Helper to convert sql.js result to array of objects
function queryAll(sql: string, params: any[] = []): any[] {
  if (!db) return [];
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql: string, params: any[] = []): any {
  const results = queryAll(sql, params);
  return results[0] || null;
}

function run(sql: string, params: any[] = []): { lastInsertRowid: number; changes: number } {
  if (!db) return { lastInsertRowid: 0, changes: 0 };
  db.run(sql, params);
  const lastId = queryOne('SELECT last_insert_rowid() as id');
  const changes = db.getRowsModified();
  return { lastInsertRowid: lastId?.id || 0, changes };
}

// Vercel Serverless Handler
export default async function handler(req: any, res: any) {
  await getDb();
  
  const url = req.url || '';
  const path = url.replace('/api', '') || '/';
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const body = req.body || {};

  const json = (data: any, status = 200) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  // Route: /health
  if (path === '/health') {
    return json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  // Route: /categories
  if (path === '/categories') {
    if (req.method === 'GET') {
      const categories = queryAll('SELECT * FROM categories ORDER BY name');
      return json(categories);
    }
    if (req.method === 'POST') {
      const { name, icon, color } = body;
      if (!name) return json({ error: 'Name is required' }, 400);
      const result = run('INSERT INTO categories (name, icon, color) VALUES (?, ?, ?)', [name, icon || '📦', color || '#6b7280']);
      const newCat = queryOne('SELECT * FROM categories WHERE id = ?', [result.lastInsertRowid]);
      return json(newCat, 201);
    }
  }

  // Route: /transactions
  if (path === '/transactions') {
    if (req.method === 'GET') {
      const transactions = queryAll(`
        SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        ORDER BY t.date DESC
      `);
      return json(transactions);
    }
    if (req.method === 'POST') {
      const { amount, description, type, category_id, date } = body;
      if (!amount || !type || !date) return json({ error: 'Missing required fields' }, 400);
      const result = run(
        'INSERT INTO transactions (user_id, amount, description, type, category_id, date) VALUES (?, ?, ?, ?, ?, ?)',
        [1, amount, description || '', type, category_id || null, date]
      );
      const newTx = queryOne(`
        SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color 
        FROM transactions t 
        LEFT JOIN categories c ON t.category_id = c.id 
        WHERE t.id = ?
      `, [result.lastInsertRowid]);
      return json(newTx, 201);
    }
  }

  // Route: /summary
  if (path === '/summary') {
    const income = queryOne("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'income'");
    const expense = queryOne("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense'");
    const byCategory = queryAll(`
      SELECT c.name, c.icon, c.color, COALESCE(SUM(t.amount), 0) as total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.type = 'expense'
      GROUP BY c.id
      ORDER BY total DESC
    `);
    const monthlyTrend = queryAll(`
      SELECT strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions
      WHERE date >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month
    `);
    return json({
      income: income?.total || 0,
      expense: expense?.total || 0,
      balance: (income?.total || 0) - (expense?.total || 0),
      byCategory,
      monthlyTrend
    });
  }

  // 404
  return json({ error: 'Not found' }, 404);
}