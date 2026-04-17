import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn()
  }
}));

import axios from 'axios';

const mockAxios = axios as any;

// Mock API responses
const mockTransactions = [
  { id: 1, amount: 100, description: 'Test expense', type: 'expense', date: '2026-04-17', category_name: 'Food', category_icon: '🍔', category_color: '#f97316' }
];

const mockSummary = {
  income: 5000,
  expense: 1500,
  balance: 3500,
  byCategory: [
    { name: 'Food', icon: '🍔', color: '#f97316', total: 500 },
    { name: 'Transport', icon: '🚗', color: '#3b82f6', total: 300 }
  ],
  monthlyTrend: [
    { month: '2026-01', income: 4000, expense: 1200 },
    { month: '2026-02', income: 4500, expense: 1400 },
    { month: '2026-03', income: 5000, expense: 1500 }
  ],
  transactionCount: 15
};

describe('Finance Dashboard App', () => {
  beforeEach(() => {
    mockAxios.get.mockReset();
    mockAxios.post.mockReset();
    mockAxios.delete.mockReset();
  });

  describe('Initial Load', () => {
    it('should show loading state initially', async () => {
      mockAxios.get.mockImplementation(() => new Promise(() => {}));
      
      render(<App />);
      
      expect(screen.getByText(/loading/i)).toBeDefined();
    });

    it('should render dashboard when data loads', async () => {
      mockAxios.get
        .mockResolvedValueOnce({ data: mockTransactions })
        .mockResolvedValueOnce({ data: mockSummary });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/personal finance/i)).toBeDefined();
      });
    });
  });

  describe('Summary Cards', () => {
    it('should display income, expense, and balance', async () => {
      mockAxios.get
        .mockResolvedValueOnce({ data: mockTransactions })
        .mockResolvedValueOnce({ data: mockSummary });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/5000/i)).toBeDefined(); // Income
        expect(screen.getByText(/1500/i)).toBeDefined(); // Expense
        expect(screen.getByText(/3500/i)).toBeDefined(); // Balance
      });
    });
  });

  describe('Transaction Management', () => {
    it('should add transaction form when button clicked', async () => {
      mockAxios.get
        .mockResolvedValueOnce({ data: mockTransactions })
        .mockResolvedValueOnce({ data: mockSummary });

      render(<App />);

      await waitFor(() => {
        const button = screen.getByText(/add transaction/i);
        userEvent.click(button);
      });

      expect(screen.getByText(/cancel/i)).toBeDefined();
    });

    it('should create transaction', async () => {
      const newTransaction = { id: 2, amount: 200, type: 'expense' };
      
      mockAxios.get
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: { ...mockSummary, income: 5000, expense: 1700, balance: 3300 } });
      
      mockAxios.post.mockResolvedValueOnce({ data: newTransaction });

      render(<App />);

      await waitFor(() => {
        const button = screen.getByText(/add transaction/i);
        userEvent.click(button);
      });

      expect(screen.getByDisplayValue('200')).toBeDefined();
    });
  });

  describe('Version Display', () => {
    it('should render without errors', async () => {
      mockAxios.get
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: mockSummary });

      const { container } = render(<App />);
      
      await waitFor(() => {
        expect(container.querySelector('div')).toBeDefined();
      });
    });
  });
});

describe('Version Module', () => {
  it('should export correct version', async () => {
    const { FRONTEND_VERSION, versionInfo } = await import('../src/version');
    
    expect(FRONTEND_VERSION).toBe('1.0.0');
    expect(versionInfo.frontend.major).toBe(1);
    expect(versionInfo.frontend.minor).toBe(0);
    expect(versionInfo.frontend.patch).toBe(0);
  });
});