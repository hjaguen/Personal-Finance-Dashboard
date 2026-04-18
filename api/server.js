// Simple in-memory API for Render (no database for demo)
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

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Categories
app.get('/api/categories', (req, res) => {
  res.json(categories);
});

// Transactions
app.get('/api/transactions', (req, res) => {
  const result = transactions.map(t => {
    const cat = categories.find(c => c.id === t.category_id);
    return { ...t, category_name: cat?.name, category_icon: cat?.icon, category_color: cat?.color };
  });
  res.json(result);
});

app.post('/api/transactions', (req, res) => {
  const { amount, description, type, category_id, date } = req.body;
  if (!amount || !type || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const newTx = { id: nextId++, user_id: 1, amount, description: description || '', type, category_id: category_id || 8, date };
  transactions.push(newTx);
  const cat = categories.find(c => c.id === newTx.category_id);
  res.status(201).json({ ...newTx, category_name: cat?.name, category_icon: cat?.icon, category_color: cat?.color });
});

app.delete('/api/transactions/:id', (req, res) => {
  const id = parseInt(req.params.id);
  transactions = transactions.filter(t => t.id !== id);
  res.json({ message: 'Deleted' });
});

// Summary
app.get('/api/summary', (req, res) => {
  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  
  const catTotals = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const cat = categories.find(c => c.id === t.category_id);
    if (cat) {
      catTotals[cat.name] = (catTotals[cat.name] || 0) + t.amount;
    }
  });
  
  const byCategory = Object.entries(catTotals).map(([name, total]) => {
    const cat = categories.find(c => c.name === name);
    return { name, icon: cat?.icon, color: cat?.color, total };
  });

  res.json({
    income,
    expense,
    balance: income - expense,
    byCategory,
    monthlyTrend: [],
    transactionCount: transactions.length
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});