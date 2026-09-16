import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

import type { Budget, Transaction } from '../models/schemas';

export const budgetStore = 'budget';
export const transactionStore = 'transactions';
export const BUDGET_ID = 'current';

interface BudgetDB extends DBSchema {
  [budgetStore]: {
    key: string;
    value: BudgetRecord;
  };
  [transactionStore]: {
    key: number;
    value: TransactionRecord;
    indexes: { date: string };
  };
}

interface BudgetRecord {
  id: string;
  initialBalance: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

interface TransactionRecord {
  id?: number;
  amount: number;
  type: 'expense' | 'income';
  date: string;
}

export const dbPromise: Promise<IDBPDatabase<BudgetDB>> = openDB<BudgetDB>('BudgetDB', 1, {
  upgrade(db) {
    db.createObjectStore(budgetStore, { keyPath: 'id' });
    const store = db.createObjectStore(transactionStore, {
      keyPath: 'id',
      autoIncrement: true,
    });
    store.createIndex('date', 'date');
  },
});

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function budgetToRecord(budget: Budget, id: string, createdAt: string): BudgetRecord {
  return {
    id,
    initialBalance: budget.initialBalance,
    startDate: toISO(budget.startDate),
    endDate: toISO(budget.endDate),
    createdAt,
  };
}

function budgetFromRecord(record: BudgetRecord): Budget {
  return {
    initialBalance: record.initialBalance,
    startDate: fromISO(record.startDate),
    endDate: fromISO(record.endDate),
  };
}

function transactionToRecord(tx: Transaction): TransactionRecord {
  return {
    id: tx.id,
    amount: tx.amount,
    type: tx.type,
    date: toISO(tx.date),
  };
}

function transactionFromRecord(record: TransactionRecord): Transaction {
  return {
    id: record.id,
    amount: record.amount,
    type: record.type,
    date: fromISO(record.date),
  };
}

export async function saveBudget(budget: Budget): Promise<void> {
  const db = await dbPromise;
  const existing = await db.get(budgetStore, BUDGET_ID);
  const createdAt = existing?.createdAt ?? toISO(new Date());
  await db.put(budgetStore, budgetToRecord(budget, BUDGET_ID, createdAt));
}

export async function getBudget(): Promise<Budget | null> {
  const db = await dbPromise;
  const record = await db.get(budgetStore, BUDGET_ID);
  return record ? budgetFromRecord(record) : null;
}

export async function addTransaction(tx: Transaction): Promise<number> {
  const db = await dbPromise;
  const record = transactionToRecord(tx);
  delete record.id; // IndexedDB autoIncrement сам назначит id
  const id = await db.add(transactionStore, record);
  return id as number;
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await dbPromise;
  const records = await db.getAll(transactionStore);
  return records.map(transactionFromRecord).sort((a, b) => {
    const dateDiff = b.date.getTime() - a.date.getTime();
    if (dateDiff !== 0) {
      return dateDiff;
    }
    return (b.id ?? 0) - (a.id ?? 0);
  });
}

export async function deleteTransaction(id: number): Promise<void> {
  const db = await dbPromise;
  await db.delete(transactionStore, id);
}
