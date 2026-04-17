import { initDatabase, getDb, queryAll, queryOne, run } from './_database';

await initDatabase();

const server = Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.replace('/api', '');
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  // Parse body
  let body = {};
  try {
    body = await req.json().catch(() => ({}));
  } catch {}

  const json = (data: any, status = 200) => 
    new Response(JSON.stringify(data), { status, headers: { ...headers, 'Content-Type': 'application/json' } });

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
});