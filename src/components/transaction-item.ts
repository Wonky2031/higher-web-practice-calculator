import deleteIconUrl from '../../assets/icons/delete.svg?url';
import { formatDate } from '../utils/dates';
import { el } from '../utils/dom';
import { formatMoney } from '../utils/format';

import type { Transaction } from '../models/schemas';

export interface TransactionItemOptions {
  transaction: Transaction;
  deletable?: boolean;
  onDelete?: (id: number) => void;
}

export function createTransactionItem(options: TransactionItemOptions): HTMLElement {
  const { transaction, deletable = false, onDelete } = options;
  const root = el('div', { class: 'transaction-item' });
  const amount = el('span', { class: 'transaction-item__amount' }, [
    formatMoney(transaction.amount),
  ]);
  const date = el('span', { class: 'transaction-item__date' }, [formatDate(transaction.date)]);
  const right = el('div', { class: 'transaction-item__right' });
  right.append(date);

  if (deletable && transaction.id !== undefined) {
    const deleteBtn = el('button', {
      class: 'transaction-item__delete',
      type: 'button',
    });

    const img = el('img', {
      src: deleteIconUrl,
      alt: '',
      width: 16,
      height: 16,
    });
    deleteBtn.append(img);

    deleteBtn.addEventListener('click', () => {
      if (transaction.id !== undefined) {
        onDelete?.(transaction.id);
      }
    });

    right.append(deleteBtn);
  }

  root.append(amount, right);
  return root;
}
