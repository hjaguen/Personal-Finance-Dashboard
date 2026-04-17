import express from 'express';
import { db } from '../models/database.js';

const router = express.Router();

// Get all transactions
router.get('/', (req, res) => {
  try {
    const { startDate, endDate, type, categoryId } = req.query;
    
    let query = `
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ' AND t.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND t.date <= ?';
      params.push(endDate);
    }
    if (type) {
      query += ' AND t.type = ?';
      params.push(type);
    }
    if (categoryId) {
      query += ' AND t.category_id = ?';
      params.push(categoryId);
    }

    query += ' ORDER BY t.date DESC, t.created_at DESC';

    const transactions = db.prepare(query).all(...params);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create transaction
router.post('/', (req, res) => {
  try {
    const { amount, description, type, category_id, date } = req.body;

    if (!amount || !type || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const stmt = db.prepare(`
      INSERT INTO transactions (amount, description, type, category_id, date)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(amount, description || '', type, category_id || null, date);

    const newTransaction = db.prepare(`
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(newTransaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update transaction
router.put('/:id', (req, res) => {
  try {
    const { amount, description, type, category_id, date } = req.body;
    const { id } = req.params;

    const stmt = db.prepare(`
      UPDATE transactions
      SET amount = COALESCE(?, amount),
          description = COALESCE(?, description),
          type = COALESCE(?, type),
          category_id = COALESCE(?, category_id),
          date = COALESCE(?, date)
      WHERE id = ?
    `);

    stmt.run(amount, description, type, category_id, date, id);

    const updated = db.prepare(`
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `).get(id);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete transaction
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;