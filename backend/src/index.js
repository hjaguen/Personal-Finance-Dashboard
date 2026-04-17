import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initDatabase } from './models/database.js';
import transactionRoutes from './routes/transactions.js';
import categoryRoutes from './routes/categories.js';
import summaryRoutes from './routes/summary.js';
import authRoutes from './routes/auth.js';
import budgetRoutes from './routes/budget.js';
import v1Routes from './routes/v1/info.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_VERSION = 'v1';
const API_VERSION_NUMBER = '1.0.0';

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Initialize database
initDatabase();

// Health check (no version prefix)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: API_VERSION_NUMBER
  });
});

// API Version info
app.get(`/api/${API_VERSION}/info`, v1Routes);

// API Routes with versioning
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/transactions`, transactionRoutes);
app.use(`/api/${API_VERSION}/categories`, categoryRoutes);
app.use(`/api/${API_VERSION}/summary`, summaryRoutes);
app.use(`/api/${API_VERSION}/budget`, budgetRoutes);

// Aliases for backwards compatibility (no version in URL)
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/budget', budgetRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`💰 Finance API running on http://localhost:${PORT}`);
});

export default app;