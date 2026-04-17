# 💰 Personal Finance Dashboard

A personal finance tracking application with dashboard, expense categorization, and analytics.

## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript + Vite |
| Backend | Node.js + Express |
| Database | SQLite (simple, no setup) |
| Charts | Recharts |
| Styling | Tailwind CSS |
| CI/CD | GitHub Actions |

## 📦 Project Structure

```
personal-finance-dashboard/
├── frontend/          # React app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   └── ...
├── backend/           # Express API
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   └── services/
│   └── ...
├── .github/
│   └── workflows/    # CI/CD
└── docker-compose.yml
```

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=3001
NODE_ENV=development
DATABASE_URL=./database.sqlite
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
```

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|-----------|-------------|
| GET | /api/transactions | Get all transactions |
| POST | /api/transactions | Create transaction |
| PUT | /api/transactions/:id | Update transaction |
| DELETE | /api/transactions/:id | Delete transaction |
| GET | /api/categories | Get categories |
| GET | /api/summary | Get financial summary |

## 🎯 Features

- [ ] Add/Edit/Delete transactions
- [ ] Categorize expenses
- [ ] Monthly dashboard with charts
- [ ] Budget alerts
- [ ] Export to CSV/PDF
- [ ] Docker support

## 📝 License

MIT