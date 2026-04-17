import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_database';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;
  const db = getDb();

  if (method === 'GET') {
    const { startDate, endDate, type, categoryId } = req.query;
    
    let query = `
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

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
    return res.json(transactions);
  }

  if (method === 'POST') {
    const { amount, description, type, category_id, date } = req.body;

    if (!amount || !type || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // For demo, use user_id = 1 (in production, get from JWT)
    const user_id = 1;

    const stmt = db.prepare(`
      INSERT INTO transactions (user_id, amount, description, type, category_id, date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(user_id, amount, description || '', type, category_id || null, date);

    const newTransaction = db.prepare(`
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json(newTransaction);
  }

  if (method === 'DELETE') {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Transaction ID required' });
    }
    db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
    return res.json({ message: 'Transaction deleted' });
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  res.status(405).end(`Method ${method} Not Allowed`);
}