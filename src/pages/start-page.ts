import { startOfDay } from 'date-fns';

import { createButton } from '../components/button';
import { createInput } from '../components/input';
import { createPeriodSelect } from '../components/period-select';
import { saveBudget } from '../utils/db';
import { el } from '../utils/dom';
import { parseMoney } from '../utils/format';
import { budgetStore } from '../utils/state';
import { validateBudget } from '../utils/validation';

export interface StartPageOptions {
  onComplete?: () => void;
}

export interface StartPageComponent {
  root: HTMLElement;
}

export function createStartPage(options: StartPageOptions = {}): StartPageComponent {
  const { onComplete } = options;
  const root = el('div', { class: 'page page--center' });
  const content = el('div', { class: 'page__content' });
  const card = el('div', {
    class: 'card w-full lg:max-w-md flex flex-col min-h-screen lg:min-h-0',
  });

  const title = el('h1', { class: 'text-[32px] font-bold text-text leading-tight mb-3' }, [
    'Начнём!',
  ]);

  const balanceInput = createInput({
    label: 'Укажите баланс',
    placeholder: 'Стартовый баланс',
    inputMode: 'decimal',
    onInput: () => updateSubmitVisibility(),
    onEnter: () => {
      if (isFormValid()) {
        void handleSubmit();
      }
    },
  });

  const periodSelect = createPeriodSelect({
    onChange: () => updateSubmitVisibility(),
  });

  const periodLabel = el('label', { class: 'input-label' }, ['На срок']);

  const fields = el('div', { class: 'flex flex-col gap-3' });
  fields.append(balanceInput.root, wrapWithLabel(periodLabel, periodSelect.root));

  const submitBtn = createButton({
    text: 'Рассчитать',
    variant: 'primary',
    onClick: () => {
      void handleSubmit();
    },
  });

  submitBtn.root.classList.add('hidden');

  const topBlock = el('div', { class: 'flex flex-col gap-3' });
  topBlock.append(title, fields);

  const bottomBlock = el('div', { class: 'mt-auto pt-6' });
  bottomBlock.append(submitBtn.root);

  card.append(topBlock, bottomBlock);
  content.append(card);
  root.append(content);

  function isFormValid(): boolean {
    const rawBalance = balanceInput.getValue().trim();
    if (rawBalance === '') {
      return false;
    }

    const balance = parseMoney(rawBalance);
    if (Number.isNaN(balance) || balance < 0) {
      return false;
    }

    const endDate = periodSelect.getValue();
    if (!endDate) {
      return false;
    }

    return true;
  }

  function updateSubmitVisibility(): void {
    if (isFormValid()) {
      submitBtn.root.classList.remove('hidden');
    } else {
      submitBtn.root.classList.add('hidden');
    }
  }

  async function handleSubmit(): Promise<void> {
    balanceInput.setError(null);
    periodSelect.root.classList.remove('period-select--error');

    const rawBalance = balanceInput.getValue().trim();
    const balance = parseMoney(rawBalance);
    const endDate = periodSelect.getValue();

    if (rawBalance === '' || Number.isNaN(balance)) {
      balanceInput.setError('Введите корректную сумму');
      return;
    }

    const today = startOfDay(new Date());

    const candidate = {
      initialBalance: balance,
      startDate: today,
      endDate: endDate ?? today,
    };

    const result = validateBudget(candidate);
    if (!result.success) {
      if (result.errors.initialBalance) {
        balanceInput.setError(result.errors.initialBalance);
      }
      if (result.errors.endDate && !endDate) {
        periodSelect.root.classList.add('period-select--error');
      }
      return;
    }

    await saveBudget(result.data);
    budgetStore.setState({ budget: result.data, loading: false });
    onComplete?.();
  }

  updateSubmitVisibility();

  return { root };
}

function wrapWithLabel(label: HTMLElement, field: HTMLElement): HTMLElement {
  const wrapper = el('div', { class: 'input-wrapper' });
  wrapper.append(label, field);
  return wrapper;
}
