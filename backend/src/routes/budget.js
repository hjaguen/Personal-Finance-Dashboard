import express from 'express';
import { db } from '../models/database.js';
import budgetService from '../services/alerts.js';

const router = express.Router();

// Get current budget thresholds
router.get('/budget/thresholds', (req, res) => {
  try {
    res.json(budgetService.thresholds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set budget thresholds
router.post('/budget/thresholds', (req, res) => {
  try {
    const { daily, weekly, monthly } = req.body;
    budgetService.setThresholds(daily || 0, weekly || 0, monthly || 0);
    res.json(budgetService.thresholds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get budget status and alerts
router.get('/budget/status', (req, res) => {
  try {
    const { period } = req.query;
    
    const transactions = db.prepare(`
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ORDER BY t.date DESC
    `).all();

    const budgetCheck = budgetService.checkBudget(transactions, period || 'monthly');
    const categoryCheck = budgetService.checkCategorySpending(transactions);

    res.json({
      ...budgetCheck,
      ...categoryCheck,
      thresholds: budgetService.thresholds
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;