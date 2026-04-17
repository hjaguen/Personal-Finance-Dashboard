# Finance Dashboard API

This is a RESTful API for managing personal finances.

## 📚 API Documentation

Base URL: `http://localhost:3001/api`

---

## 🔐 Authentication

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": { "id": 1, "email": "...", "name": "..." },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 📊 Categories

### List Categories
```http
GET /categories
```

### Create Category
```http
POST /categories
Content-Type: application/json

{
  "name": "Groceries",
  "icon": "🛒",
  "color": "#10b981"
}
```

---

## 💰 Transactions

### List Transactions
```http
GET /transactions?startDate=2026-04-01&endDate=2026-04-30&type=expense&categoryId=1
```

### Create Transaction
```http
POST /transactions
Content-Type: application/json

{
  "amount": 150.00,
  "description": "Grocery shopping",
  "type": "expense",
  "category_id": 2,
  "date": "2026-04-15"
}
```

### Update Transaction
```http
PUT /transactions/1
Content-Type: application/json

{
  "amount": 200.00
}
```

### Delete Transaction
```http
DELETE /transactions/1
```

---

## 📈 Summary

### Get Financial Summary
```http
GET /summary?month=04&year=2026
```

---

## 🚨 Budget

### Get Budget Thresholds
```http
GET /budget/thresholds
```

### Set Budget Thresholds
```http
POST /budget/thresholds
Content-Type: application/json

{
  "daily": 50,
  "weekly": 300,
  "monthly": 1000
}
```

### Get Budget Status & Alerts
```http
GET /budget/status?period=monthly
```

---

## 🔢 Versioning

The API uses **semantic versioning** in the URL:
- `v1` - Current stable version
- Format: `http://localhost:3001/v1/...`

Examples:
- `http://localhost:3001/v1/transactions`
- `http://localhost:3001/v1/budget/status`

When making requests, include the version:
```http
GET /v1/transactions
```

---

## 📋 Error Responses

```json
{
  "error": "Error message here"
}
```

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |