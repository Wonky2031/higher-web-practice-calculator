import { createHistoryPage } from './pages/history-page';
import { createMainPage } from './pages/main-page';
import { createStartPage } from './pages/start-page';
import { getBudget, getAllTransactions } from './utils/db';
import { clear } from './utils/dom';
import { budgetStore, transactionsStore } from './utils/state';

type Route = 'start' | 'main' | 'history';

let currentRoute: Route = 'start';
let app: HTMLElement | null = null;

export async function initApp(): Promise<void> {
  app = document.querySelector<HTMLDivElement>('#app');
  if (!app) {
    return;
  }

  const budget = await getBudget();
  const transactions = await getAllTransactions();
  budgetStore.setState({ budget, loading: false });
  transactionsStore.setState({ transactions, loading: false });

  currentRoute = budget ? 'main' : 'start';
  render();
}

function navigate(route: Route): void {
  currentRoute = route;
  render();
}

function render(): void {
  if (!app) {
    return;
  }
  clear(app);

  const { budget } = budgetStore.getState();

  if (!budget) {
    currentRoute = 'start';
  }

  switch (currentRoute) {
    case 'start': {
      const page = createStartPage({
        onComplete: () => navigate('main'),
      });
      app.append(page.root);
      break;
    }
    case 'main': {
      const page = createMainPage({
        onOpenHistory: () => navigate('history'),
      });
      app.append(page.root);
      break;
    }
    case 'history': {
      const page = createHistoryPage({
        onBack: () => navigate('main'),
      });
      app.append(page.root);
      break;
    }
  }
}
