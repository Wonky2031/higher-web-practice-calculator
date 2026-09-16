export type ElProps<K extends keyof HTMLElementTagNameMap> = Partial<
  Omit<HTMLElementTagNameMap[K], 'style' | 'dataset' | 'classList'>
> & {
  class?: string;
  dataset?: Record<string, string>;
};

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: ElProps<K>,
  children?: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null) {
        continue;
      }
      if (key === 'class') {
        element.className = String(value);
      } else if (key === 'dataset') {
        Object.assign(element.dataset, value);
      } else {
        (element as Record<string, unknown>)[key] = value;
      }
    }
  }

  if (children) {
    for (const child of children) {
      if (typeof child === 'string') {
        element.append(document.createTextNode(child));
      } else {
        element.append(child);
      }
    }
  }

  return element;
}

export function clear(el: HTMLElement): void {
  el.innerHTML = '';
}

export function mount(parent: HTMLElement, children: (Node | string)[]): void {
  clear(parent);
  for (const child of children) {
    parent.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
}
