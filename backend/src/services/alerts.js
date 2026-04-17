export class BudgetAlertService {
  constructor() {
    this.thresholds = {
      daily: 0,
      weekly: 0,
      monthly: 0
    };
  }

  setThresholds(daily, weekly, monthly) {
    this.thresholds = { daily, weekly, monthly };
  }

  checkBudget(transactions, period = 'monthly') {
    const now = new Date();
    let periodStart;

    switch (period) {
      case 'daily':
        periodStart = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'weekly':
        const dayOfWeek = now.getDay();
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - dayOfWeek);
        periodStart.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
      default:
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const periodExpenses = transactions
      .filter(t => 
        t.type === 'expense' && 
        new Date(t.date) >= periodStart
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const periodIncome = transactions
      .filter(t => 
        t.type === 'income' && 
        new Date(t.date) >= periodStart
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const threshold = this.thresholds[period] || 0;
    const percentage = threshold > 0 ? (periodExpenses / threshold) * 100 : 0;

    const alerts = [];

    // Budget exceeded
    if (periodExpenses > threshold && threshold > 0) {
      alerts.push({
        type: 'danger',
        message: `⚠️ Budget exceeded! You've spent $${periodExpenses.toFixed(2)} (${percentage.toFixed(0)}% of $${threshold} budget)`,
        level: 'high'
      });
    }
    // Approaching budget (80%)
    else if (percentage >= 80 && threshold > 0) {
      alerts.push({
        type: 'warning',
        message: `📊 Approaching budget limit: ${percentage.toFixed(0)}% spent ($${periodExpenses.toFixed(2)} / $${threshold})`,
        level: 'medium'
      });
    }

    // Unusual spending pattern (50% more than average)
    const avgDailyExpense = periodIncome > 0 ? (periodExpenses / periodIncome) * 100 : 0;
    if (avgDailyExpense > 90 && periodIncome > 0) {
      alerts.push({
        type: 'info',
        message: `💡 You've spent ${avgDailyExpense.toFixed(0)}% of your income this ${period}`,
        level: 'low'
      });
    }

    // Savings opportunity
    const savings = periodIncome - periodExpenses;
    if (savings > periodIncome * 0.3 && periodIncome > 0) {
      alerts.push({
        type: 'success',
        message: `🎉 Great savings! $${savings.toFixed(2)} remaining (${((savings/periodIncome)*100).toFixed(0)}% of income)`,
        level: 'low'
      });
    }

    return {
      periodExpenses,
      periodIncome,
      savings,
      percentage,
      threshold,
      alerts
    };
  }

  // Check category spending
  checkCategorySpending(transactions) {
    const categoryTotals = {};
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = t.category_name || 'Other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
      });

    const alerts = [];
    const topCategory = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)[0];

    if (topCategory) {
      alerts.push({
        type: 'info',
        message: `🏆 Top spending category: ${topCategory[0]} ($${topCategory[1].toFixed(2)})`,
        level: 'low'
      });
    }

    return { categoryTotals, alerts };
  }
}

export default new BudgetAlertService();