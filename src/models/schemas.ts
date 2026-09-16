import { z } from 'zod';

export const BudgetSchema = z
  .object({
    initialBalance: z.number().positive('Баланс должен быть положительным'),
    startDate: z.date(),
    endDate: z.date(),
  })
  .refine(data => data.endDate > data.startDate, {
    message: 'Дата окончания должна быть позже даты начала',
    path: ['endDate'],
  });

export type Budget = z.infer<typeof BudgetSchema>;

export const TransactionSchema = z.object({
  id: z.number().optional(),
  amount: z.number().positive('Сумма должна быть положительной'),
  type: z.enum(['expense', 'income']),
  date: z.date(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

export type TransactionType = Transaction['type'];
