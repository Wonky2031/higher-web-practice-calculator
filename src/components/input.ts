import { el } from '../utils/dom';

export interface InputOptions {
  label?: string;
  placeholder?: string;
  value?: string;
  inputMode?: 'decimal' | 'numeric' | 'text';
  type?: string;
  name?: string;
  onInput?: (value: string) => void;
  onEnter?: () => void;
}

export interface InputComponent {
  root: HTMLElement;
  input: HTMLInputElement;
  setValue: (value: string) => void;
  getValue: () => string;
  setError: (message: string | null) => void;
  clear: () => void;
  focus: () => void;
}

export function createInput(options: InputOptions): InputComponent {
  const {
    label,
    placeholder,
    value = '',
    inputMode = 'text',
    type = 'text',
    name,
    onInput,
    onEnter,
  } = options;

  const labelEl = label ? el('label', { class: 'input-label' }, [label]) : null;

  const input = el('input', {
    class: 'input-field',
    type,
    inputMode,
    placeholder,
    value,
  });
  if (name) {
    input.name = name;
  }

  const error = el('div', { class: 'input-error hidden' });

  const root = el('div', { class: 'input-wrapper' });
  if (labelEl) {
    root.append(labelEl);
  }
  root.append(input, error);

  input.addEventListener('input', () => {
    setError(null);
    onInput?.(input.value);
  });

  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      onEnter?.();
    }
  });

  function setValue(v: string): void {
    input.value = v;
  }

  function getValue(): string {
    return input.value;
  }

  function setError(message: string | null): void {
    if (message) {
      error.textContent = message;
      error.classList.remove('hidden');
      input.classList.add('input-field--error');
    } else {
      error.textContent = '';
      error.classList.add('hidden');
      input.classList.remove('input-field--error');
    }
  }

  function clear(): void {
    setValue('');
    setError(null);
  }

  function focus(): void {
    input.focus();
  }

  return { root, input, setValue, getValue, setError, clear, focus };
}
