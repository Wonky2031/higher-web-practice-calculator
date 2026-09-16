import { daysBetween, startOfToday } from '../utils/dates';

import type { Budget, Transaction } from '../models/schemas';

export interface BudgetMetrics {
  totalDays: number;
  daysLeft: number;
  dailyLimit: number;
  totalBalance: number;
  remainingDaily: number;
  todaySpent: number;
  todayRemaining: number;
  averageDaily: number;
  dailyLimitToday: number;
}

export function calculateMetrics(budget: Budget, transactions: Transaction[]): BudgetMetrics {
  const today = startOfToday();

  const totalDays = Math.max(daysBetween(budget.startDate, budget.endDate), 1);
  const daysLeft = Math.max(daysBetween(today, budget.endDate), 1);

  const dailyLimit = budget.initialBalance / totalDays;

  let totalIncome = 0;
  let totalExpense = 0;
  let todaySpent = 0;

  // Расходы по дням (для averageDaily)
  const expenseDays = new Set<string>();

  for (const tx of transactions) {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
    } else {
      totalExpense += tx.amount;
      const dayKey = toDayKey(tx.date);
      expenseDays.add(dayKey);
      if (isSameDayKey(tx.date, today)) {
        todaySpent += tx.amount;
      }
    }
  }

  const totalBalance = budget.initialBalance + totalIncome - totalExpense;
  const balanceAtStartOfToday = totalBalance + todaySpent;
  const dailyLimitToday = balanceAtStartOfToday / daysLeft;
  const remainingDaily = totalBalance / daysLeft;
  const todayRemaining = dailyLimitToday - todaySpent;

  const averageDaily = expenseDays.size > 0 ? totalExpense / expenseDays.size : 0;

  return {
    totalDays,
    daysLeft,
    dailyLimit,
    totalBalance,
    remainingDaily,
    todaySpent,
    todayRemaining,
    averageDaily,
    dailyLimitToday,
  };
}

function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isSameDayKey(date: Date, other: Date): boolean {
  return toDayKey(date) === toDayKey(other);
}
