import { BudgetSchema, TransactionSchema, type Budget, type Transaction } from '../models/schemas';

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> };

function formatErrors(
  issues: { path: (string | number | symbol)[]; message: string }[]
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? '_');
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export function validateBudget(data: unknown): ValidationResult<Budget> {
  const result = BudgetSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: formatErrors(result.error.issues) };
}

export function validateTransaction(data: unknown): ValidationResult<Transaction> {
  const result = TransactionSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: formatErrors(result.error.issues) };
}
