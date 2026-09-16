import { el } from '../utils/dom';

export interface CardOptions {
  title?: string;
  subtitle?: string;
  corner?: HTMLElement;
  children?: (Node | string)[];
  class?: string;
}

export interface CardComponent {
  root: HTMLElement;
  body: HTMLElement;
  setCorner: (node: HTMLElement | null) => void;
}

export function createCard(options: CardOptions): CardComponent {
  const { title, subtitle, corner, children = [], class: extraClass } = options;

  const root = el('div', { class: ['card', extraClass].filter(Boolean).join(' ') });

  const header = el('div', { class: 'card-header' });
  const titles = el('div', { class: 'flex flex-col' });

  if (title) {
    titles.append(el('h3', { class: 'card-title' }, [title]));
  }
  if (subtitle) {
    titles.append(el('p', { class: 'card-subtitle' }, [subtitle]));
  }

  header.append(titles);

  if (corner) {
    header.append(corner);
  }

  const body = el('div', { class: 'card-body' });

  root.append(header, body);

  for (const child of children) {
    body.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }

  function setCorner(node: HTMLElement | null): void {
    const existing = header.querySelector('.card-corner');
    if (existing) {
      existing.remove();
    }
    if (node) {
      node.classList.add('card-corner');
      header.append(node);
    }
  }

  return { root, body, setCorner };
}
