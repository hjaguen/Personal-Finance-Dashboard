// Simple in-memory API for Vercel (no database for demo)
const categories = [
  { id: 1, name: 'Salary', icon: '💰', color: '#22c55e' },
  { id: 2, name: 'Food', icon: '🍔', color: '#f97316' },
  { id: 3, name: 'Transport', icon: '🚗', color: '#3b82f6' },
  { id: 4, name: 'Entertainment', icon: '🎬', color: '#8b5cf6' },
  { id: 5, name: 'Utilities', icon: '💡', color: '#eab308' },
  { id: 6, name: 'Shopping', icon: '🛒', color: '#ec4899' },
  { id: 7, name: 'Health', icon: '🏥', color: '#ef4444' },
  { id: 8, name: 'Other', icon: '📦', color: '#6b7280' },
];

let transactions = [
  { id: 1, user_id: 1, amount: 5000, description: 'Salary', type: 'income', category_id: 1, date: '2026-04-01' },
  { id: 2, user_id: 1, amount: 150, description: 'Groceries', type: 'expense', category_id: 2, date: '2026-04-05' },
  { id: 3, user_id: 1, amount: 50, description: 'Gas', type: 'expense', category_id: 3, date: '2026-04-07' },
  { id: 4, user_id: 1, amount: 30, description: 'Netflix', type: 'expense', category_id: 4, date: '2026-04-10' },
];

let nextId = 5;

export default async function handler(req: any, res: any) {
  const url = req.url || '';
  const path = url.replace('/api', '') || '/';
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const json = (data: any, status = 200) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  // Health
  if (path === '/health') {
    return json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  // Categories
  if (path === '/categories') {
    return json(categories);
  }

  // Transactions
  if (path === '/transactions') {
    if (req.method === 'GET') {
      const result = transactions.map((t: any) => {
        const cat = categories.find((c: any) => c.id === t.category_id);
        return { ...t, category_name: cat?.name, category_icon: cat?.icon, category_color: cat?.color };
      });
      return json(result);
    }
    if (req.method === 'POST') {
      const body = req.body || {};
      const { amount, description, type, category_id, date } = body;
      if (!amount || !type || !date) {
        return json({ error: 'Missing required fields' }, 400);
      }
      const newTx = { id: nextId++, user_id: 1, amount, description: description || '', type, category_id: category_id || 8, date };
      transactions.push(newTx);
      const cat = categories.find((c: any) => c.id === newTx.category_id);
      return json({ ...newTx, category_name: cat?.name, category_icon: cat?.icon, category_color: cat?.color }, 201);
    }
    if (req.method === 'DELETE') {
      const id = parseInt(url.split('/transactions/')[1] || '0');
      transactions = transactions.filter((t: any) => t.id !== id);
      return json({ message: 'Deleted' });
    }
  }

  // Summary
  if (path === '/summary') {
    const income = transactions.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + t.amount, 0);
    const expense = transactions.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + t.amount, 0);
    
    const catTotals: any = {};
    transactions.filter((t: any) => t.type === 'expense').forEach((t: any) => {
      const cat = categories.find((c: any) => c.id === t.category_id);
      if (cat) {
        catTotals[cat.name] = (catTotals[cat.name] || 0) + t.amount;
      }
    });
    
    const byCategory = Object.entries(catTotals).map(([name, total]: [string, any]) => {
      const cat = categories.find((c: any) => c.name === name);
      return { name, icon: cat?.icon, color: cat?.color, total };
    });

    return json({
      income,
      expense,
      balance: income - expense,
      byCategory,
      monthlyTrend: [],
      transactionCount: transactions.length
    });
  }

  return json({ error: 'Not found' }, 404);
}