import { createBalanceCard } from '../components/balance-card';
import { createButton } from '../components/button';
import { createSpendingCard, SpendingCardComponent } from '../components/spending-card';
import { createTransactionItem } from '../components/transaction-item';
import { calculateMetrics } from '../services/budget-calculator';
import { addTransaction, getBudget, getAllTransactions, saveBudget } from '../utils/db';
import { el } from '../utils/dom';
import { formatMoney } from '../utils/format';
import { budgetStore, transactionsStore } from '../utils/state';

import type { Budget } from '../models/schemas';

export interface MainPageOptions {
  onOpenHistory: () => void;
}

export interface MainPageComponent {
  root: HTMLElement;
}

const RECENT_LIMIT = 3;
const TABLET_BREAKPOINT = 1024;

export function createMainPage(options: MainPageOptions): MainPageComponent {
  const { onOpenHistory } = options;
  const root = el('div', { class: 'page' });
  const container = el('div', { class: 'page__content' });

  let spendingCardRef: SpendingCardComponent | null = null;
  let recentBlockRef: HTMLElement | null = null;
  let isEditModeActive = false;

  function updateRecentBlockVisibility(): void {
    if (!recentBlockRef) {
      return;
    }
    if (isEditModeActive) {
      recentBlockRef.style.display = 'none';
      return;
    }
    const isTablet = window.innerWidth >= TABLET_BREAKPOINT;
    recentBlockRef.style.display = isTablet ? 'flex' : 'none';
  }

  const balanceCard = createBalanceCard({
    onOpenHistory,
    onSave: async ({ income, endDate }) => {
      const budget = budgetStore.getState().budget;
      if (!budget) {
        return;
      }

      if (income > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await addTransaction({
          amount: income,
          type: 'income',
          date: today,
        });
      }

      const updatedBudget: Budget = {
        initialBalance: budget.initialBalance,
        startDate: budget.startDate,
        endDate,
      };
      await saveBudget(updatedBudget);

      await refreshFromDb();
    },
    onModeChange: isEdit => {
      isEditModeActive = isEdit;
      if (spendingCardRef) {
        spendingCardRef.root.classList.toggle('hidden', isEdit);
      }
      updateRecentBlockVisibility();
    },
  });

  const spendingCard = createSpendingCard({
    onSave: async amount => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await addTransaction({
        amount,
        type: 'expense',
        date: today,
      });

      await refreshFromDb();
    },
  });

  spendingCardRef = spendingCard;

  const recentBlock = el('section', { class: 'recent-block' });
  recentBlockRef = recentBlock;

  const recentHeader = el('div', { class: 'recent-block__header' });
  const recentTitle = el('h2', { class: 'recent-block__title' }, ['История расходов']);
  const recentAverage = el('p', { class: 'recent-block__average' });
  recentHeader.append(recentTitle, recentAverage);

  const recentList = el('div', { class: 'recent-block__list' });

  const seeAllBtn = createButton({
    text: 'Смотреть всю историю',
    variant: 'secondary',
    onClick: onOpenHistory,
  });

  recentBlock.append(recentHeader, recentList, seeAllBtn.root);

  window.addEventListener('resize', updateRecentBlockVisibility);
  updateRecentBlockVisibility();

  container.append(balanceCard.root, spendingCard.root, recentBlock);
  root.append(container);

  function render(): void {
    const { budget } = budgetStore.getState();
    const { transactions } = transactionsStore.getState();

    if (!budget) {
      return;
    }

    const metrics = calculateMetrics(budget, transactions);

    balanceCard.update(metrics, budget);
    spendingCard.update(metrics);

    recentAverage.textContent = `Средние траты в день: ${formatMoney(metrics.averageDaily)}`;

    const expenses = transactions.filter(tx => tx.type === 'expense').slice(0, RECENT_LIMIT);

    recentList.innerHTML = '';
    if (expenses.length === 0) {
      recentList.append(el('p', { class: 'recent-block__empty' }, ['Расходов пока нет']));
    } else {
      for (const tx of expenses) {
        recentList.append(createTransactionItem({ transaction: tx }));
      }
    }
  }

  async function refreshFromDb(): Promise<void> {
    const budget = await getBudget();
    const transactions = await getAllTransactions();
    budgetStore.setState({ budget, loading: false });
    transactionsStore.setState({ transactions, loading: false });
    render();
  }

  budgetStore.subscribe(() => render());
  transactionsStore.subscribe(() => render());

  void refreshFromDb();
  return { root };
}
