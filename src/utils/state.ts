import type { Budget, Transaction } from '../models/schemas';

export interface Store<T> {
  getState: () => T;
  setState: (partial: Partial<T> | ((prev: T) => Partial<T>), replace?: boolean) => void;
  subscribe: (listener: (state: T) => void) => () => void;
}

export function createStore<T extends object>(initialState: T): Store<T> {
  let state = initialState;
  const listeners = new Set<(state: T) => void>();

  const getState = (): T => state;

  const setState = (partial: Partial<T> | ((prev: T) => Partial<T>), replace = false): void => {
    const next = typeof partial === 'function' ? partial(state) : partial;
    state = replace ? (next as T) : { ...state, ...next };
    listeners.forEach(listener => listener(state));
  };

  const subscribe = (listener: (state: T) => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return { getState, setState, subscribe };
}

interface BudgetState {
  budget: Budget | null;
  loading: boolean;
}

interface TransactionsState {
  transactions: Transaction[];
  loading: boolean;
}

export const budgetStore = createStore<BudgetState>({
  budget: null,
  loading: true,
});

export const transactionsStore = createStore<TransactionsState>({
  transactions: [],
  loading: true,
});
