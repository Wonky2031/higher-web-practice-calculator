import { startOfDay } from 'date-fns';

import selectChevron from '../../assets/icons/selector_arrow.svg?url';
import {
  presetDay,
  presetEndOfMonth,
  presetMonth,
  presetTwoWeeks,
  presetWeek,
} from '../utils/dates';
import { el } from '../utils/dom';

import { formatDateWithDays, createDateInput, type DateInputComponent } from './date-input';

export interface PeriodSelectOptions {
  value?: Date | null;
  onChange?: (date: Date) => void;
}

export interface PeriodSelectComponent {
  root: HTMLElement;
  getValue: () => Date | null;
  setValue: (date: Date | null) => void;
  close: () => void;
}

interface PresetOption {
  label: string;
  getDate: () => Date;
}

const PLACEHOLDER = 'Выберите срок';

export function createPeriodSelect(options: PeriodSelectOptions = {}): PeriodSelectComponent {
  const { value = null, onChange } = options;

  const today = startOfDay(new Date());

  let selected: Date | null = value ? startOfDay(value) : null;
  let isOpen = false;
  const presets: PresetOption[] = [
    { label: 'День', getDate: () => presetDay(today) },
    { label: 'Неделя', getDate: () => presetWeek(today) },
    { label: '2 недели', getDate: () => presetTwoWeeks(today) },
    { label: 'Месяц', getDate: () => presetMonth(today) },
    { label: 'До конца месяца', getDate: () => presetEndOfMonth(today) },
  ];

  const root = el('div', { class: 'period-select' });
  const trigger = el('button', {
    class: 'period-select__trigger',
    type: 'button',
  });

  const valueLabel = el('span', { class: 'period-select__value' }, [PLACEHOLDER]);
  const chevron = createChevron();
  trigger.append(valueLabel, chevron);

  const dropdown = el('div', { class: 'period-select__dropdown hidden' });
  const optionsList = el('div', { class: 'period-select__options' });
  for (const preset of presets) {
    optionsList.append(createPresetItem(preset));
  }
  optionsList.append(createCustomDateItem());

  const calendarWrapper = el('div', { class: 'period-select__calendar hidden' });
  dropdown.append(optionsList, calendarWrapper);
  root.append(trigger, dropdown);

  const dateInput: DateInputComponent = createDateInput({
    min: today,
    onChange: date => {
      selected = date;
      updateLabel();
      closeDropdown();
      onChange?.(date);
    },
  });
  calendarWrapper.append(dateInput.root);

  function createPresetItem(preset: PresetOption): HTMLElement {
    const item = el('button', {
      class: 'period-select__option',
      type: 'button',
    });

    const left = el('span', { class: 'period-select__option-label' }, [preset.label]);
    const right = el('span', { class: 'period-select__option-date' });

    const date = preset.getDate();
    right.textContent = `до ${formatDayMonth(date)}`;

    item.append(left, right);

    item.addEventListener('click', () => {
      selected = startOfDay(date);
      updateLabel();
      closeDropdown();
      onChange?.(selected);
    });

    return item;
  }

  function createCustomDateItem(): HTMLElement {
    const item = el('button', {
      class: 'period-select__option',
      type: 'button',
    });

    const label = el('span', { class: 'period-select__option-label' }, ['Своя дата']);
    item.append(label);

    item.addEventListener('click', () => {
      optionsList.classList.add('hidden');
      calendarWrapper.classList.remove('hidden');
      if (selected) {
        dateInput.setValue(selected);
      }
    });

    return item;
  }

  function openDropdown(): void {
    isOpen = true;
    dropdown.classList.remove('hidden');
    trigger.classList.add('period-select__trigger--open');
  }

  function closeDropdown(): void {
    isOpen = false;
    dropdown.classList.add('hidden');
    trigger.classList.remove('period-select__trigger--open');
    optionsList.classList.remove('hidden');
    calendarWrapper.classList.add('hidden');
  }

  function toggleDropdown(): void {
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }

  trigger.addEventListener('click', event => {
    event.stopPropagation();
    toggleDropdown();
  });

  document.addEventListener('click', event => {
    if (!isOpen) {
      return;
    }
    const target = event.target as Node;
    if (!root.contains(target)) {
      closeDropdown();
    }
  });

  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && isOpen) {
      closeDropdown();
      trigger.focus();
    }
  });

  function updateLabel(): void {
    if (selected) {
      valueLabel.textContent = formatDateWithDays(selected, today);
      valueLabel.classList.remove('period-select__value--placeholder');
    } else {
      valueLabel.textContent = PLACEHOLDER;
      valueLabel.classList.add('period-select__value--placeholder');
    }
  }

  function getValue(): Date | null {
    return selected;
  }

  function setValue(date: Date | null): void {
    selected = date ? startOfDay(date) : null;
    if (selected) {
      dateInput.setValue(selected);
    }
    updateLabel();
  }

  if (selected) {
    dateInput.setValue(selected);
  } else {
    valueLabel.classList.add('period-select__value--placeholder');
  }
  updateLabel();

  return { root, getValue, setValue, close: closeDropdown };
}

function formatDayMonth(date: Date): string {
  const months = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
  ];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

function createChevron(): HTMLImageElement {
  const img = el('img', {
    class: 'period-select__chevron',
    src: selectChevron,
    alt: '',
    width: 16,
    height: 20,
  });
  return img;
}
