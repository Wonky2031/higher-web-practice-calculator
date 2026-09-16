import deleteIconUrl from '../../assets/icons/delete.svg?url';
import { createButton } from '../components/button';
import { calculateMetrics } from '../services/budget-calculator';
import { formatDate } from '../utils/dates';
import { deleteTransaction, getBudget, getAllTransactions } from '../utils/db';
import { el } from '../utils/dom';
import { formatMoney } from '../utils/format';
import { budgetStore, transactionsStore } from '../utils/state';

import type { Transaction } from '../models/schemas';

export interface HistoryPageOptions {
  onBack: () => void;
}

export interface HistoryPageComponent {
  root: HTMLElement;
}

export function createHistoryPage(options: HistoryPageOptions): HistoryPageComponent {
  const { onBack } = options;
  const root = el('div', { class: 'page' });
  const content = el('div', { class: 'page__content' });
  const card = el('div', { class: 'history-page' });
  const header = el('div', { class: 'history-page__header' });
  const title = el('h1', { class: 'history-page__title' }, ['История расходов']);
  const average = el('p', { class: 'history-page__average' });
  header.append(title, average);

  const list = el('div', { class: 'history-page__list' });
  const backWrapper = el('div', { class: 'history-page__back-wrapper' });
  const backBtn = createButton({
    text: 'Вернуться',
    variant: 'secondary',
    onClick: onBack,
  });
  backWrapper.append(backBtn.root);

  card.append(header, list, backWrapper);
  content.append(card);
  root.append(content);

  function render(): void {
    const { budget } = budgetStore.getState();
    const { transactions } = transactionsStore.getState();

    if (budget) {
      const metrics = calculateMetrics(budget, transactions);
      average.textContent = `Средние траты в день: ${formatMoney(metrics.averageDaily)}`;
    } else {
      average.textContent = '';
    }

    const expenses = transactions.filter(tx => tx.type === 'expense');

    list.innerHTML = '';

    if (expenses.length === 0) {
      list.append(el('p', { class: 'history-page__empty' }, ['Расходов пока нет']));
      return;
    }

    for (const tx of expenses) {
      list.append(createItem(tx));
    }
  }

  function createItem(tx: Transaction): HTMLElement {
    const item = el('div', { class: 'history-page__item' });
    const amount = el('span', { class: 'history-page__amount' }, [formatMoney(tx.amount)]);
    const right = el('div', { class: 'history-page__item-right' });
    const date = el('span', { class: 'history-page__date' }, [formatDate(tx.date)]);
    const deleteBtn = el('button', {
      class: 'history-page__delete',
      type: 'button',
    });
    const deleteIcon = el('img', {
      src: deleteIconUrl,
      alt: '',
      width: 16,
      height: 16,
    });
    deleteBtn.append(deleteIcon);

    deleteBtn.addEventListener('click', () => {
      void handleDelete(tx, item);
    });

    right.append(date, deleteBtn);
    item.append(amount, right);

    return item;
  }

  async function handleDelete(tx: Transaction, item: HTMLElement): Promise<void> {
    if (tx.id === undefined) {
      return;
    }

    await deleteTransaction(tx.id);

    item.remove();

    const { transactions } = transactionsStore.getState();
    const next = transactions.filter(t => t.id !== tx.id);
    transactionsStore.setState({ transactions: next });

    const { budget } = budgetStore.getState();
    if (budget) {
      const metrics = calculateMetrics(budget, next);
      average.textContent = `Средние траты в день: ${formatMoney(metrics.averageDaily)}`;
    }

    const remaining = next.filter(t => t.type === 'expense');
    if (remaining.length === 0) {
      list.innerHTML = '';
      list.append(el('p', { class: 'history-page__empty' }, ['Расходов пока нет']));
    }
  }

  budgetStore.subscribe(() => render());
  transactionsStore.subscribe(() => {});

  void (async () => {
    const budget = await getBudget();
    const transactions = await getAllTransactions();
    budgetStore.setState({ budget, loading: false });
    transactionsStore.setState({ transactions, loading: false });
    render();
  })();

  return { root };
}
