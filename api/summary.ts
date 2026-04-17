import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_database';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;
  const db = getDb();

  if (method === 'GET') {
    const { month, year } = req.query;
    
    let dateFilter = '';
    if (month && year) {
      dateFilter = `WHERE strftime('%m', date) = '${month}' AND strftime('%Y', date) = '${year}'`;
    } else if (year) {
      dateFilter = `WHERE strftime('%Y', date) = '${year}'`;
    }

    // Total income
    const incomeResult = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
      ${dateFilter ? dateFilter + ' AND' : 'WHERE'} type = 'income'
    `).get();
    
    // Total expenses
    const expenseResult = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
      ${dateFilter ? dateFilter + ' AND' : 'WHERE'} type = 'expense'
    `).get();

    // Balance
    const balance = incomeResult.total - expenseResult.total;

    // Expenses by category
    const byCategory = db.prepare(`
      SELECT c.name, c.icon, c.color, COALESCE(SUM(t.amount), 0) as total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      ${dateFilter ? dateFilter + ' AND' : 'WHERE'} t.type = 'expense'
      GROUP BY c.id
      ORDER BY total DESC
    `).all();

    // Monthly trend (last 6 months)
    const monthlyTrend = db.prepare(`
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions
      WHERE date >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month
    `).all();

    // Transaction count
    const countResult = db.prepare(`
      SELECT COUNT(*) as count FROM transactions ${dateFilter || 'WHERE 1=1'}
    `).get();

    return res.json({
      income: incomeResult.total,
      expense: expenseResult.total,
      balance,
      byCategory,
      monthlyTrend,
      transactionCount: countResult.count
    });
  }

  res.setHeader('Allow', ['GET']);
  res.status(405).end(`Method ${method} Not Allowed`);
}