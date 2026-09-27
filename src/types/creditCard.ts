export type CardNetwork = 'visa' | 'mastercard' | 'amex' | 'other';

export type CardTheme = 
  | 'obsidian' 
  | 'emerald' 
  | 'sapphire' 
  | 'amethyst' 
  | 'titanium' 
  | 'copper'
  | 'liquid'
  | 'aurora';

export interface CreditCard {
  id: string;
  name: string;           // e.g. "BBVA Oro", "Nu Mastercard"
  bank: string;           // e.g. "BBVA", "Nubank", "Santander", "American Express"
  network: CardNetwork;
  lastFourDigits: string; // e.g. "4590"
  creditLimit: number;    // e.g. 45000
  cutOffDay: number;      // Day of month: 1 - 31 (e.g. 18)
  paymentDueDays: number; // Days after cutoff (e.g. 20) OR specific payment day of month
  paymentDueDayOfMonth?: number; // Optional specific fixed day (e.g. 8)
  annualRate: number;     // Annual interest rate (Tasa de interés ordinaria anual, e.g. 48%)
  theme: CardTheme;
  notes?: string;
  createdAt: string;
}

export type TransactionCategory = 
  | 'Supermercado'
  | 'Restaurantes'
  | 'Servicios'
  | 'Entretenimiento'
  | 'Viajes'
  | 'Salud'
  | 'Ropa'
  | 'Hogar'
  | 'Tecnología'
  | 'Transporte'
  | 'Educación'
  | 'Otro';

export type TransactionType = 'expense' | 'msi_first_quota' | 'payment';

export interface Transaction {
  id: string;
  cardId: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: TransactionCategory;
  type: TransactionType;
  installmentPlanId?: string; // If part of an MSI plan
  cycleCutoffDate?: string;   // Associated cycle cutoff
  notes?: string;
}

export interface InstallmentPlan {
  id: string;
  cardId: string;
  description: string;
  totalAmount: number;
  totalMonths: number;        // e.g. 12
  paidMonths: number;         // e.g. 4
  monthlyAmount: number;      // e.g. totalAmount / totalMonths
  startDate: string;          // YYYY-MM-DD
  category: TransactionCategory;
  notes?: string;
}

export interface CardCycleInfo {
  cardId: string;
  currentCycleCutoff: Date;
  nextCycleCutoff: Date;
  paymentDueDate: Date;
  daysToCutoff: number;
  daysToPayment: number;
  isAfterCutoffBeforePayment: boolean; // Between cutoff and payment date (statement is ready to pay)
  isBestToBuyToday: boolean;
  scoreBestCardToUse: number; // higher = more days until cutoff
  currentCycleCharges: number;
  msiMonthlyCommitment: number;
  totalStatementToPay: number; // Pago para no generar intereses
  suggestedMinimumPayment: number; // Pago mínimo
  totalUsedBalance: number;
  availableCredit: number;
  utilizationRate: number; // 0 - 100%
}

export interface ReservedFundItem {
  id: string;
  amount: number;
  description: string;
  targetCardId?: string; // Optional: card earmarked for, or general app reserve
  date: string;          // YYYY-MM-DD
  notes?: string;
}
