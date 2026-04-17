import request from 'supertest';
import app from '../src/index.js';

describe('API Tests', () => {
  const baseURL = '/api';

  describe('Health Check', () => {
    it('should return ok status', async () => {
      const res = await request(app).get(`${baseURL}/health`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('Categories', () => {
    it('GET /categories - should return categories', async () => {
      const res = await request(app).get(`${baseURL}/categories`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('POST /categories - should create new category', async () => {
      const res = await request(app)
        .post(`${baseURL}/categories`)
        .send({ name: 'Test Category', icon: '🧪', color: '#ff0000' });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Test Category');
    });
  });

  describe('Transactions', () => {
    let createdTransactionId;

    it('GET /transactions - should return transactions', async () => {
      const res = await request(app).get(`${baseURL}/transactions`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /transactions - should create expense transaction', async () => {
      const res = await request(app)
        .post(`${baseURL}/transactions`)
        .send({
          amount: 100.50,
          description: 'Test expense',
          type: 'expense',
          category_id: 1,
          date: '2026-04-17'
        });
      expect(res.status).toBe(201);
      expect(res.body.amount).toBe(100.50);
      expect(res.body.type).toBe('expense');
      createdTransactionId = res.body.id;
    });

    it('POST /transactions - should create income transaction', async () => {
      const res = await request(app)
        .post(`${baseURL}/transactions`)
        .send({
          amount: 5000,
          description: 'Salary',
          type: 'income',
          category_id: 1,
          date: '2026-04-01'
        });
      expect(res.status).toBe(201);
      expect(res.body.type).toBe('income');
    });

    it('DELETE /transactions/:id - should delete transaction', async () => {
      const res = await request(app).delete(`${baseURL}/transactions/999999`);
      expect(res.status).toBe(200);
    });

    afterAll(async () => {
      if (createdTransactionId) {
        await request(app).delete(`${baseURL}/transactions/${createdTransactionId}`);
      }
    });
  });

  describe('Summary', () => {
    it('GET /summary - should return financial summary', async () => {
      const res = await request(app).get(`${baseURL}/summary`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('income');
      expect(res.body).toHaveProperty('expense');
      expect(res.body).toHaveProperty('balance');
      expect(res.body).toHaveProperty('byCategory');
      expect(res.body).toHaveProperty('monthlyTrend');
    });

    it('GET /summary?month=04&year=2026 - should filter by month', async () => {
      const res = await request(app).get(`${baseURL}/summary?month=04&year=2026`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('income');
    });
  });

  describe('Validation', () => {
    it('POST /transactions - should reject without amount', async () => {
      const res = await request(app)
        .post(`${baseURL}/transactions`)
        .send({ description: 'Test', type: 'expense', date: '2026-04-17' });
      expect(res.status).toBe(400);
    });

    it('POST /transactions - should reject without type', async () => {
      const res = await request(app)
        .post(`${baseURL}/transactions`)
        .send({ amount: 100, date: '2026-04-17' });
      expect(res.status).toBe(400);
    });

    it('POST /transactions - should reject invalid type', async () => {
      const res = await request(app)
        .post(`${baseURL}/transactions`)
        .send({ amount: 100, type: 'invalid', date: '2026-04-17' });
      expect(res.status).toBe(500);
    });
  });
});