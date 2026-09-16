import { el } from '../utils/dom';

export type ButtonVariant = 'primary' | 'secondary';

export interface ButtonOptions {
  text: string;
  variant?: ButtonVariant;
  type?: 'button' | 'submit';
  onClick?: () => void;
  class?: string;
}

export interface ButtonComponent {
  root: HTMLButtonElement;
  setText: (text: string) => void;
  setDisabled: (disabled: boolean) => void;
}

export function createButton(options: ButtonOptions): ButtonComponent {
  const { text, variant = 'primary', type = 'button', onClick, class: extraClass } = options;

  const classNames = ['btn', `btn-${variant}`, extraClass].filter(Boolean).join(' ');

  const button = el(
    'button',
    {
      class: classNames,
      type,
    },
    [text]
  );

  if (onClick) {
    button.addEventListener('click', onClick);
  }

  function setText(next: string): void {
    button.textContent = next;
  }

  function setDisabled(disabled: boolean): void {
    button.disabled = disabled;
  }

  return { root: button, setText, setDisabled };
}
