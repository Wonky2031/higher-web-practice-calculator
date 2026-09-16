import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ru } from 'date-fns/locale';

import { formatDate } from '../utils/dates';
import { el } from '../utils/dom';

export interface DateInputOptions {
  value?: Date | null;
  min?: Date;
  onChange?: (date: Date) => void;
}

export interface DateInputComponent {
  root: HTMLElement;
  getValue: () => Date | null;
  setValue: (date: Date | null) => void;
}

const WEEKDAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

export function createDateInput(options: DateInputOptions = {}): DateInputComponent {
  const { value = null, min = startOfDay(new Date()), onChange } = options;

  let selected: Date | null = value ? startOfDay(value) : null;
  let viewMonth: Date = startOfMonth(selected ?? min);
  const root = el('div', { class: 'date-input' });

  const header = el('div', { class: 'date-input__header' });
  const monthLabel = el('div', { class: 'date-input__month' });
  const yearLabel = el('div', { class: 'date-input__year' });
  header.append(monthLabel, yearLabel);

  const prevBtn = el('button', {
    class: 'date-input__nav date-input__nav--prev',
    type: 'button',
  });
  prevBtn.append(createArrowIcon('left'));

  const nextBtn = el('button', {
    class: 'date-input__nav date-input__nav--next',
    type: 'button',
  });
  nextBtn.append(createArrowIcon('right'));

  const weekdaysRow = el('div', { class: 'date-input__weekdays' });
  for (const day of WEEKDAYS) {
    weekdaysRow.append(el('div', { class: 'date-input__weekday' }, [day]));
  }

  const grid = el('div', { class: 'date-input__grid' });
  const body = el('div', { class: 'date-input__body' });
  body.append(weekdaysRow, grid, prevBtn, nextBtn);

  root.append(header, body);

  function render(): void {
    monthLabel.textContent = format(viewMonth, 'LLLL', { locale: ru });
    yearLabel.textContent = format(viewMonth, 'yyyy');

    // Стрелка «←» заблокирована, если viewMonth == месяц min
    prevBtn.disabled = isSameMonth(viewMonth, min);

    grid.innerHTML = '';

    const first = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
    const last = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: first, end: last });

    for (const day of days) {
      grid.append(createDayCell(day));
    }
  }

  function createDayCell(day: Date): HTMLElement {
    if (!isSameMonth(day, viewMonth)) {
      return el('div', { class: 'date-input__day date-input__day--empty' });
    }

    const isPast = isBefore(day, min);
    const isSelected = selected ? isSameDay(day, selected) : false;

    const cell = el('button', {
      class: 'date-input__day',
      type: 'button',
      dataset: { date: format(day, 'yyyy-MM-dd') },
    });
    cell.textContent = String(day.getDate());

    if (isPast) {
      cell.classList.add('date-input__day--hidden');
      cell.disabled = true;
      return cell;
    }

    if (isSelected) {
      cell.classList.add('date-input__day--selected');
    }

    cell.addEventListener('click', () => {
      selected = startOfDay(day);
      render();
      onChange?.(selected);
    });

    return cell;
  }

  prevBtn.addEventListener('click', () => {
    viewMonth = subMonths(viewMonth, 1);
    render();
  });

  nextBtn.addEventListener('click', () => {
    viewMonth = addMonths(viewMonth, 1);
    render();
  });

  function getValue(): Date | null {
    return selected;
  }

  function setValue(date: Date | null): void {
    selected = date ? startOfDay(date) : null;
    if (selected) {
      viewMonth = startOfMonth(selected);
    }
    render();
  }

  render();

  return { root, getValue, setValue };
}

function createArrowIcon(direction: 'left' | 'right'): SVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('fill', 'none');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  path.setAttribute('d', direction === 'left' ? 'M10 12L6 8L10 4' : 'M6 4L10 8L6 12');

  svg.append(path);
  return svg;
}

export function formatDateWithDays(date: Date, min: Date = startOfDay(new Date())): string {
  const days = Math.max(
    0,
    Math.round((startOfDay(date).getTime() - startOfDay(min).getTime()) / (24 * 60 * 60 * 1000))
  );

  const abs = days % 100;
  const last = abs % 10;
  let word = 'дней';
  if (abs < 10 || abs > 20) {
    if (last === 1) {
      word = 'день';
    } else if (last >= 2 && last <= 4) {
      word = 'дня';
    }
  }

  return `${days} ${word} (до ${formatDate(date)})`;
}
