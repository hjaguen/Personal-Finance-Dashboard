import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_database';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;
  const db = getDb();

  if (method === 'GET') {
    const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
    return res.json(categories);
  }

  if (method === 'POST') {
    const { name, icon, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const stmt = db.prepare('INSERT INTO categories (name, icon, color) VALUES (?, ?, ?)');
    const result = stmt.run(name, icon || '📦', color || '#6b7280');

    const newCategory = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json(newCategory);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${method} Not Allowed`);
}