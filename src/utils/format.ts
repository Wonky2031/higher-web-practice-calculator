export function roundMoney(n: number): number {
  return Math.round(n);
}

export function formatMoney(n: number): string {
  const rounded = roundMoney(n);
  return `${rounded.toLocaleString('ru-RU')} ₽`;
}

export function formatMoneyPlain(n: number): string {
  const rounded = roundMoney(n);
  return rounded.toLocaleString('ru-RU');
}

export function parseMoney(input: string): number {
  const cleaned = input.replace(/\s/g, '').replace('₽', '').replace(',', '.');
  if (cleaned === '') {
    return NaN;
  }
  return Number(cleaned);
}

export function formatSpendingFeedback(todayRemaining: number): {
  text: string;
  isOver: boolean;
} {
  if (todayRemaining < 0) {
    const over = Math.abs(roundMoney(todayRemaining));
    return {
      text: `Вы превысили дневной лимит на ${over.toLocaleString('ru-RU')} ₽`,
      isOver: true,
    };
  }
  return {
    text: '🎉 Отлично справились — сегодня вы в пределах лимита!',
    isOver: false,
  };
}
