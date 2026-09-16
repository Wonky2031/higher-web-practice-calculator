import { formatDays } from '../utils/dates';
import { el } from '../utils/dom';
import { formatMoney, formatMoneyPlain, parseMoney } from '../utils/format';

import { createButton } from './button';
import { createInput } from './input';
import { createPeriodSelect, type PeriodSelectComponent } from './period-select';

import type { Budget } from '../models/schemas';
import type { BudgetMetrics } from '../services/budget-calculator';

export interface BalanceCardOptions {
  onOpenHistory: () => void;
  onSave: (data: { income: number; endDate: Date }) => Promise<void>;
  onModeChange?: (isEdit: boolean) => void;
}

export interface BalanceCardComponent {
  root: HTMLElement;
  update: (metrics: BudgetMetrics, budget: Budget) => void;
}

export function createBalanceCard(options: BalanceCardOptions): BalanceCardComponent {
  const { onOpenHistory, onSave, onModeChange } = options;

  let isEditMode = false;
  let metrics: BudgetMetrics | null = null;
  let budget: Budget | null = null;

  const root = el('section', { class: 'balance-card' });

  const header = el('div', { class: 'balance-card__header' });
  const title = el('h2', { class: 'balance-card__title' }, ['Общий баланс']);
  const corner = el('span', { class: 'balance-card__corner' });
  header.append(title, corner);

  const viewMode = el('div', { class: 'balance-card__view' });
  const editMode = el('div', { class: 'balance-card__edit balance-card__edit--hidden' });

  root.append(header, viewMode, editMode);

  const viewAmountRow = el('div', { class: 'balance-card__amount-row' });
  const viewAmount = el('span', { class: 'balance-card__amount' });
  const viewDays = el('span', { class: 'balance-card__days' });
  viewAmountRow.append(viewAmount, viewDays);

  const viewButtons = el('div', { class: 'balance-card__buttons' });
  const editBtn = createButton({
    text: 'Изменить',
    variant: 'secondary',
    class: 'flex-1',
    onClick: () => enterEditMode(),
  });
  const historyBtn = createButton({
    text: 'История расходов',
    variant: 'secondary',
    class: 'flex-1 lg:hidden',
    onClick: onOpenHistory,
  });
  viewButtons.append(editBtn.root, historyBtn.root);

  viewMode.append(viewAmountRow, viewButtons);

  const yourBalanceInput = createInput({
    label: 'Ваш баланс',
    placeholder: '0 ₽',
  });
  yourBalanceInput.input.readOnly = true;
  yourBalanceInput.input.classList.add('input-field--readonly');
  yourBalanceInput.root.classList.add('input-wrapper--hide-tablet');

  const yourBalanceView = el('div', {
    class: 'balance-card__amount-row balance-card__amount-row--edit',
  });
  const yourBalanceViewAmount = el('span', { class: 'balance-card__amount' });
  const yourBalanceViewDays = el('span', { class: 'balance-card__days' });
  yourBalanceView.append(yourBalanceViewAmount, yourBalanceViewDays);

  const topUpInput = createInput({
    label: 'Пополнить',
    placeholder: '+0 ₽',
    inputMode: 'decimal',
    onInput: () => updateSaveVisibility(),
  });

  const periodLabel = el('label', { class: 'input-label' }, ['На срок']);
  const periodSelect: PeriodSelectComponent = createPeriodSelect({
    onChange: () => updateSaveVisibility(),
  });
  const periodWrapper = el('div', { class: 'input-wrapper' });
  periodWrapper.append(periodLabel, periodSelect.root);

  const saveBtn = createButton({
    text: 'Сохранить',
    variant: 'primary',
    onClick: () => {
      void handleSave();
    },
  });
  saveBtn.root.classList.add('hidden');

  const backBtn = createButton({
    text: 'Вернуться',
    variant: 'secondary',
    onClick: () => exitEditMode(),
  });

  const editButtons = el('div', { class: 'balance-card__edit-buttons' });
  editButtons.append(saveBtn.root, backBtn.root);

  editMode.append(
    yourBalanceInput.root,
    yourBalanceView,
    topUpInput.root,
    periodWrapper,
    editButtons
  );

  function enterEditMode(): void {
    isEditMode = true;
    root.classList.add('balance-card--editing');

    if (budget && metrics) {
      yourBalanceInput.setValue(formatMoney(metrics.totalBalance));
      periodSelect.setValue(budget.endDate);
    }
    topUpInput.clear();

    viewMode.classList.add('hidden');
    editMode.classList.remove('balance-card__edit--hidden');
    updateSaveVisibility();

    onModeChange?.(true);
  }

  function exitEditMode(): void {
    isEditMode = false;
    root.classList.remove('balance-card--editing');

    topUpInput.clear();
    saveBtn.root.classList.add('hidden');
    editMode.classList.add('balance-card__edit--hidden');
    viewMode.classList.remove('hidden');
    onModeChange?.(false);
  }

  function updateSaveVisibility(): void {
    const raw = topUpInput.getValue().trim();
    const income = raw === '' ? 0 : parseMoney(raw);
    const endDate = periodSelect.getValue();

    const hasTopUp = raw !== '' && !Number.isNaN(income) && income > 0;
    const hasPeriodChange =
      endDate !== null && budget !== null && endDate.getTime() !== budget.endDate.getTime();

    if (hasTopUp || hasPeriodChange) {
      saveBtn.root.classList.remove('hidden');
    } else {
      saveBtn.root.classList.add('hidden');
    }
  }

  async function handleSave(): Promise<void> {
    if (!budget) {
      return;
    }

    const raw = topUpInput.getValue().trim();
    const income = raw === '' ? 0 : parseMoney(raw);
    const endDate = periodSelect.getValue();

    if (Number.isNaN(income)) {
      topUpInput.setError('Некорректная сумма');
      return;
    }

    if (!endDate) {
      periodSelect.root.classList.add('period-select--error');
      return;
    }

    topUpInput.setError(null);
    periodSelect.root.classList.remove('period-select--error');

    await onSave({ income, endDate });
    exitEditMode();
  }

  function update(nextMetrics: BudgetMetrics, nextBudget: Budget): void {
    metrics = nextMetrics;
    budget = nextBudget;

    corner.textContent = `${formatMoneyPlain(nextMetrics.dailyLimitToday)} ₽ в день`;

    viewAmount.textContent = formatMoney(nextMetrics.totalBalance);
    viewDays.textContent = `на ${formatDays(nextMetrics.daysLeft)}`;

    yourBalanceViewAmount.textContent = formatMoney(nextMetrics.totalBalance);
    yourBalanceViewDays.textContent = `на ${formatDays(nextMetrics.daysLeft)}`;

    if (isEditMode) {
      yourBalanceInput.setValue(formatMoney(nextMetrics.totalBalance));
    }
  }

  return { root, update };
}
