import { useState, useEffect } from 'react';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface Transaction {
  id: number;
  amount: number;
  description: string;
  type: 'income' | 'expense';
  date: string;
  category_name: string;
  category_icon: string;
  category_color: string;
}

interface Summary {
  income: number;
  expense: number;
  balance: number;
  byCategory: { name: string; icon: string; color: string; total: number }[];
  monthlyTrend: { month: string; income: number; expense: number }[];
  transactionCount: number;
}

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    description: '',
    type: 'expense' as 'income' | 'expense',
    category_id: 1,
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transRes, summaryRes] = await Promise.all([
        axios.get(`${API_URL}/transactions`),
        axios.get(`${API_URL}/summary`)
      ]);
      setTransactions(transRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/transactions`, newTransaction);
      setShowForm(false);
      setNewTransaction({
        amount: '',
        description: '',
        type: 'expense',
        category_id: 1,
        date: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${API_URL}/transactions/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">💰 Personal Finance</h1>
        
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-500 text-white p-6 rounded-lg shadow">
              <p className="text-sm opacity-80">Income</p>
              <p className="text-2xl font-bold">${summary.income.toFixed(2)}</p>
            </div>
            <div className="bg-red-500 text-white p-6 rounded-lg shadow">
              <p className="text-sm opacity-80">Expenses</p>
              <p className="text-2xl font-bold">${summary.expense.toFixed(2)}</p>
            </div>
            <div className={`${summary.balance >= 0 ? 'bg-blue-500' : 'bg-orange-500'} text-white p-6 rounded-lg shadow`}>
              <p className="text-sm opacity-80">Balance</p>
              <p className="text-2xl font-bold">${summary.balance.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Charts */}
        {summary && summary.byCategory.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Expenses by Category</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={summary.byCategory}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {summary.byCategory.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Monthly Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={summary.monthlyTrend}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="income" fill="#22c55e" name="Income" />
                  <Bar dataKey="expense" fill="#ef4444" name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Add Transaction Button */}
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg shadow hover:bg-indigo-700 mb-6"
        >
          {showForm ? 'Cancel' : '+ Add Transaction'}
        </button>

        {/* Add Transaction Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Amount"
                value={newTransaction.amount}
                onChange={e => setNewTransaction({...newTransaction, amount: e.target.value})}
                className="border p-2 rounded"
                required
              />
              <input
                type="text"
                placeholder="Description"
                value={newTransaction.description}
                onChange={e => setNewTransaction({...newTransaction, description: e.target.value})}
                className="border p-2 rounded"
              />
              <select
                value={newTransaction.type}
                onChange={e => setNewTransaction({...newTransaction, type: e.target.value as 'income' | 'expense'})}
                className="border p-2 rounded"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <input
                type="date"
                value={newTransaction.date}
                onChange={e => setNewTransaction({...newTransaction, date: e.target.value})}
                className="border p-2 rounded"
                required
              />
            </div>
            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded mt-4 hover:bg-green-700">
              Save
            </button>
          </form>
        )}

        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
          <div className="space-y-2">
            {transactions.slice(0, 10).map(t => (
              <div key={t.id} className="flex justify-between items-center p-3 border-b">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{t.category_icon || '📦'}</span>
                  <div>
                    <p className="font-medium">{t.description || t.category_name}</p>
                    <p className="text-sm text-gray-500">{t.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'}${Number(t.amount).toFixed(2)}
                  </span>
                  <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700">×</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;