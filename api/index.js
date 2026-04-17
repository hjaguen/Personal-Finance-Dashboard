import { createServer } from 'http';
import { getDb, initDatabase } from './_database.js';

// Initialize database
initDatabase();

const server = createServer((req, res) => {
  const url = req.url || '';
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse request body
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      req.body = body ? JSON.parse(body) : {};
    } catch {
      req.body = {};
    }
    handleRequest(req, res);
  });
});

function handleRequest(req, res) {
  const url = req.url || '';
  const db = getDb();
  
  // Helper for JSON responses
  const json = (data, status = 200) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  // Route: /api/health
  if (url === '/api/health') {
    return json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  // Route: /api/categories
  if (url === '/api/categories') {
    if (req.method === 'GET') {
      const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
      return json(categories);
    }
    if (req.method === 'POST') {
      const { name, icon, color } = req.body;
      if (!name) return json({ error: 'Name is required' }, 400);
      const result = db.prepare('INSERT INTO categories (name, icon, color) VALUES (?, ?, ?)').run(name, icon || '📦', color || '#6b7280');
      const newCat = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
      return json(newCat, 201);
    }
  }

  // Route: /api/transactions
  if (url === '/api/transactions') {
    if (req.method === 'GET') {
      const transactions = db.prepare(`
        SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        ORDER BY t.date DESC
      `).all();
      return json(transactions);
    }
    if (req.method === 'POST') {
      const { amount, description, type, category_id, date } = req.body;
      if (!amount || !type || !date) return json({ error: 'Missing required fields' }, 400);
      const result = db.prepare('INSERT INTO transactions (user_id, amount, description, type, category_id, date) VALUES (?, ?, ?, ?, ?, ?)').run(1, amount, description || '', type, category_id || null, date);
      const newTx = db.prepare('SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE t.id = ?').get(result.lastInsertRowid);
      return json(newTx, 201);
    }
  }

  // Route: /api/summary
  if (url === '/api/summary') {
    const income = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'income'").get();
    const expense = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense'").get();
    const byCategory = db.prepare(`
      SELECT c.name, c.icon, c.color, COALESCE(SUM(t.amount), 0) as total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.type = 'expense'
      GROUP BY c.id
      ORDER BY total DESC
    `).all();
    const monthlyTrend = db.prepare(`
      SELECT strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions
      WHERE date >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month
    `).all();
    return json({
      income: income.total,
      expense: expense.total,
      balance: income.total - expense.total,
      byCategory,
      monthlyTrend
    });
  }

  // 404
  json({ error: 'Not found' }, 404);
}

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`API running on port ${port}`);
});

export default server;