import { CreditCard, Transaction, InstallmentPlan, ReservedFundItem } from '../types/creditCard';

const STORAGE_KEYS = {
  CARDS: 'credimaster_cards_v2',
  TRANSACTIONS: 'credimaster_transactions_v2',
  INSTALLMENTS: 'credimaster_installments_v2',
  RESERVED_FUNDS: 'credimaster_reserved_funds_v2',
};

// Optional sample data available on request via "Cargar datos demo"
export const DEMO_CARDS: CreditCard[] = [
  {
    id: 'card-bbva-1',
    name: 'BBVA Platinum',
    bank: 'BBVA',
    network: 'visa',
    lastFourDigits: '7412',
    creditLimit: 65000,
    cutOffDay: 18,
    paymentDueDays: 20,
    paymentDueDayOfMonth: 8,
    annualRate: 42.5,
    theme: 'obsidian',
    notes: 'Tarjeta principal para compras grandes y puntos BBVA.',
    createdAt: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'card-nu-2',
    name: 'Nu Moradita',
    bank: 'Nubank',
    network: 'mastercard',
    lastFourDigits: '3908',
    creditLimit: 30000,
    cutOffDay: 28,
    paymentDueDays: 20,
    paymentDueDayOfMonth: 18,
    annualRate: 58.0,
    theme: 'amethyst',
    notes: 'Sin anualidad. Usada para suscripciones digitales y gastos diarios.',
    createdAt: '2026-02-15T12:00:00.000Z',
  },
];

export const DEMO_INSTALLMENTS: InstallmentPlan[] = [
  {
    id: 'msi-1',
    cardId: 'card-bbva-1',
    description: 'Laptop MacBook Pro M3',
    totalAmount: 24999,
    totalMonths: 12,
    paidMonths: 4,
    monthlyAmount: 2083.25,
    startDate: '2026-05-15',
    category: 'Tecnología',
    notes: 'Comprado en Hot Sale a 12 MSI',
  },
  {
    id: 'msi-2',
    cardId: 'card-nu-2',
    description: 'Vuelos Aeroméxico Cancún',
    totalAmount: 7800,
    totalMonths: 6,
    paidMonths: 2,
    monthlyAmount: 1300,
    startDate: '2026-07-20',
    category: 'Viajes',
    notes: 'Vacaciones de verano',
  },
];

export const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    cardId: 'card-bbva-1',
    description: 'Supermercado Costco',
    amount: 3420.50,
    date: '2026-09-22',
    category: 'Supermercado',
    type: 'expense',
  },
  {
    id: 'tx-2',
    cardId: 'card-nu-2',
    description: 'Netflix & Spotify Familiar',
    amount: 479.00,
    date: '2026-09-20',
    category: 'Servicios',
    type: 'expense',
  },
  {
    id: 'tx-3',
    cardId: 'card-bbva-1',
    description: 'Cena Restaurante Sonora Grill',
    amount: 1850.00,
    date: '2026-09-19',
    category: 'Restaurantes',
    type: 'expense',
  },
  {
    id: 'tx-4',
    cardId: 'card-nu-2',
    description: 'Uber y Gasolina Shell',
    amount: 980.00,
    date: '2026-09-17',
    category: 'Transporte',
    type: 'expense',
  },
  {
    id: 'tx-5',
    cardId: 'card-bbva-1',
    description: 'Abono realizado desde nómina',
    amount: 5000.00,
    date: '2026-09-10',
    category: 'Otro',
    type: 'payment',
  },
];

// Starts in completely clean state (zeros) so the user can fill with their real data
export function getStoredCards(): CreditCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CARDS);
    if (!raw) {
      saveStoredCards([]);
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading cards from localStorage:', e);
    return [];
  }
}

export function saveStoredCards(cards: CreditCard[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  } catch (e) {
    console.error('Failed saving cards to localStorage:', e);
  }
}

export function getStoredTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      saveStoredTransactions([]);
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading transactions from localStorage:', e);
    return [];
  }
}

export function saveStoredTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (e) {
    console.error('Failed saving transactions to localStorage:', e);
  }
}

export function getStoredInstallments(): InstallmentPlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INSTALLMENTS);
    if (!raw) {
      saveStoredInstallments([]);
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading installments from localStorage:', e);
    return [];
  }
}

export function saveStoredInstallments(plans: InstallmentPlan[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INSTALLMENTS, JSON.stringify(plans));
  } catch (e) {
    console.error('Failed saving installments to localStorage:', e);
  }
}

export function getStoredReservedFunds(): ReservedFundItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESERVED_FUNDS);
    if (!raw) {
      saveStoredReservedFunds([]);
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading reserved funds from localStorage:', e);
    return [];
  }
}

export function saveStoredReservedFunds(funds: ReservedFundItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RESERVED_FUNDS, JSON.stringify(funds));
  } catch (e) {
    console.error('Failed saving reserved funds to localStorage:', e);
  }
}

export function resetToCleanState(): {
  cards: CreditCard[];
  transactions: Transaction[];
  installments: InstallmentPlan[];
  reservedFunds: ReservedFundItem[];
} {
  saveStoredCards([]);
  saveStoredTransactions([]);
  saveStoredInstallments([]);
  saveStoredReservedFunds([]);
  return {
    cards: [],
    transactions: [],
    installments: [],
    reservedFunds: [],
  };
}

export function resetToDemoData(): {
  cards: CreditCard[];
  transactions: Transaction[];
  installments: InstallmentPlan[];
  reservedFunds: ReservedFundItem[];
} {
  const demoReserved: ReservedFundItem[] = [
    {
      id: 'res-demo-1',
      amount: 4500,
      description: 'Apartado de nómina para corte BBVA',
      targetCardId: 'card-bbva-1',
      date: new Date().toISOString().split('T')[0],
      notes: 'Listo en cajita Nu con rendimiento 13.5%',
    },
  ];

  saveStoredCards(DEMO_CARDS);
  saveStoredTransactions(DEMO_TRANSACTIONS);
  saveStoredInstallments(DEMO_INSTALLMENTS);
  saveStoredReservedFunds(demoReserved);
  return {
    cards: DEMO_CARDS,
    transactions: DEMO_TRANSACTIONS,
    installments: DEMO_INSTALLMENTS,
    reservedFunds: demoReserved,
  };
}

export function exportAllDataJSON(): string {
  const data = {
    version: '2.0',
    exportDate: new Date().toISOString(),
    cards: getStoredCards(),
    transactions: getStoredTransactions(),
    installments: getStoredInstallments(),
    reservedFunds: getStoredReservedFunds(),
  };
  return JSON.stringify(data, null, 2);
}

export function importAllDataJSON(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed.cards) && Array.isArray(parsed.transactions)) {
      saveStoredCards(parsed.cards);
      saveStoredTransactions(parsed.transactions);
      if (Array.isArray(parsed.installments)) {
        saveStoredInstallments(parsed.installments);
      }
      if (Array.isArray(parsed.reservedFunds)) {
        saveStoredReservedFunds(parsed.reservedFunds);
      }
      return true;
    }
    return false;
  } catch (e) {
    console.error('Failed parsing imported JSON:', e);
    return false;
  }
}
