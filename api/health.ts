import { VercelRequest, VercelResponse } from '@vercel/node';
import { initDatabase, db } from './_database';

export default function handler(req: VercelRequest, res: VercelResponse) {
  initDatabase();
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}