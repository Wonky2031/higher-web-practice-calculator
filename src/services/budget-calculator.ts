import { daysBetween, startOfToday } from '../utils/dates';

import type { Budget, Transaction } from '../models/schemas';

export interface BudgetMetrics {
  daysLeft: number;
  isExpired: boolean;
  totalBalance: number;
  todayRemaining: number;
  averageDaily: number;
  dailyLimitToday: number;
}

export function calculateMetrics(budget: Budget, transactions: Transaction[]): BudgetMetrics {
  const today = startOfToday();

  const daysLeft = Math.max(daysBetween(today, budget.endDate), 0);
  const isExpired = daysLeft === 0;

  let totalIncome = 0;
  let totalExpense = 0;
  let todaySpent = 0;
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

  const dailyLimitToday = isExpired ? 0 : (totalBalance + todaySpent) / daysLeft;
  const todayRemaining = dailyLimitToday - todaySpent;

  const passedDays = Math.max(daysBetween(budget.startDate, today) + 1, 1);
  const averageDaily = totalExpense / passedDays;

  return {
    daysLeft,
    isExpired,
    totalBalance,
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
