import { el } from '../utils/dom';
import { formatMoneyPlain, formatSpendingFeedback, parseMoney } from '../utils/format';

import { createButton } from './button';
import { createInput } from './input';

import type { BudgetMetrics } from '../services/budget-calculator';

export interface SpendingCardOptions {
  onSave: (amount: number) => Promise<void>;
}

export interface SpendingCardComponent {
  root: HTMLElement;
  update: (metrics: BudgetMetrics) => void;
}

export function createSpendingCard(options: SpendingCardOptions): SpendingCardComponent {
  const { onSave } = options;
  const root = el('section', { class: 'spending-card' });
  const title = el('h2', { class: 'spending-card__title' }, ['На сегодня доступно']);
  const amountRow = el('div', { class: 'spending-card__amount-row' });
  const todayRemainingEl = el('span', { class: 'spending-card__today' });
  const separator = el('span', { class: 'spending-card__separator' }, ['/']);
  const dailyLimitEl = el('span', { class: 'spending-card__limit' });
  const saveWrapper = el('div', { class: 'spending-card__save-wrapper' });
  amountRow.append(todayRemainingEl, separator, dailyLimitEl);

  const feedback = el('p', { class: 'spending-card__feedback' });
  const amountInput = createInput({
    label: 'Введите трату',
    placeholder: '0 ₽',
    inputMode: 'decimal',
    onInput: () => updateSaveVisibility(),
    onEnter: () => {
      if (isAmountValid()) {
        void handleSave();
      }
    },
  });

  const saveBtn = createButton({
    text: 'Сохранить',
    variant: 'primary',
    onClick: () => {
      void handleSave();
    },
  });
  saveBtn.root.classList.add('hidden');
  saveWrapper.classList.add('hidden');
  saveWrapper.append(saveBtn.root);

  root.append(title, amountRow, feedback, amountInput.root, saveWrapper);

  function isAmountValid(): boolean {
    const raw = amountInput.getValue().trim();
    if (raw === '') {
      return false;
    }
    const amount = parseMoney(raw);
    return !Number.isNaN(amount) && amount > 0;
  }

  function updateSaveVisibility(): void {
    if (isAmountValid()) {
      saveBtn.root.classList.remove('hidden');
      saveWrapper.classList.remove('hidden');
    } else {
      saveBtn.root.classList.add('hidden');
      saveWrapper.classList.add('hidden');
    }
  }

  async function handleSave(): Promise<void> {
    const raw = amountInput.getValue().trim();
    const amount = parseMoney(raw);

    if (Number.isNaN(amount) || amount <= 0) {
      amountInput.setError('Введите положительную сумму');
      return;
    }

    amountInput.setError(null);
    await onSave(amount);
    amountInput.clear();
    saveBtn.root.classList.add('hidden');
    saveWrapper.classList.add('hidden');
  }

  function update(nextMetrics: BudgetMetrics): void {
    todayRemainingEl.textContent = `${formatMoneyPlain(nextMetrics.todayRemaining)}\u2009₽`;
    dailyLimitEl.textContent = formatMoneyPlain(nextMetrics.dailyLimitToday);

    const isOver = nextMetrics.todayRemaining < 0;
    todayRemainingEl.classList.toggle('spending-card__today--over', isOver);

    const feedbackData = formatSpendingFeedback(nextMetrics.todayRemaining);
    feedback.textContent = feedbackData.text;
    feedback.classList.toggle('spending-card__feedback--over', feedbackData.isOver);
  }

  return { root, update };
}
