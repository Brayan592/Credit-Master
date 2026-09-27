import { CreditCard, Transaction, InstallmentPlan, CardCycleInfo } from '../types/creditCard';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDateString(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date + 'T12:00:00') : date;
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date + 'T12:00:00') : date;
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
  }).format(d);
}

// Calculate the next occurrence of a specific day of month
export function getCycleDates(card: CreditCard, today: Date = new Date()) {
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-11
  const currentDay = today.getDate();

  // Find last cutoff date and next cutoff date
  let lastCutoff: Date;
  let nextCutoff: Date;

  const thisMonthCutoff = new Date(currentYear, currentMonth, Math.min(card.cutOffDay, 28));

  if (currentDay > card.cutOffDay) {
    // Cutoff already passed this month
    lastCutoff = new Date(currentYear, currentMonth, Math.min(card.cutOffDay, 28));
    nextCutoff = new Date(currentYear, currentMonth + 1, Math.min(card.cutOffDay, 28));
  } else {
    // Cutoff is coming up this month
    lastCutoff = new Date(currentYear, currentMonth - 1, Math.min(card.cutOffDay, 28));
    nextCutoff = new Date(currentYear, currentMonth, Math.min(card.cutOffDay, 28));
  }

  // Payment due date is based on the LAST cutoff date
  let paymentDueDate: Date;
  if (card.paymentDueDayOfMonth) {
    // Fixed day of month (e.g. 5th of next month)
    let pMonth = lastCutoff.getMonth() + 1;
    let pYear = lastCutoff.getFullYear();
    if (pMonth > 11) {
      pMonth = 0;
      pYear += 1;
    }
    paymentDueDate = new Date(pYear, pMonth, Math.min(card.paymentDueDayOfMonth, 28));
  } else {
    // Usually 20 days after cutoff
    const daysOffset = card.paymentDueDays || 20;
    paymentDueDate = new Date(lastCutoff.getTime() + daysOffset * 24 * 60 * 60 * 1000);
  }

  // If today is past the paymentDueDate calculated for lastCutoff,
  // user might be looking at the upcoming cutoff's payment date:
  if (today.getTime() > paymentDueDate.getTime() && currentDay > card.cutOffDay) {
    if (card.paymentDueDayOfMonth) {
      let pMonth = nextCutoff.getMonth() + 1;
      let pYear = nextCutoff.getFullYear();
      if (pMonth > 11) {
        pMonth = 0;
        pYear += 1;
      }
      paymentDueDate = new Date(pYear, pMonth, Math.min(card.paymentDueDayOfMonth, 28));
    } else {
      const daysOffset = card.paymentDueDays || 20;
      paymentDueDate = new Date(nextCutoff.getTime() + daysOffset * 24 * 60 * 60 * 1000);
    }
  }

  // Difference in days
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysToCutoff = Math.max(0, Math.ceil((nextCutoff.getTime() - today.getTime()) / msPerDay));
  const daysToPayment = Math.max(0, Math.ceil((paymentDueDate.getTime() - today.getTime()) / msPerDay));

  return {
    lastCutoff,
    nextCutoff,
    paymentDueDate,
    daysToCutoff,
    daysToPayment,
  };
}

// Compute balances and cycle status for a card
export function computeCardCycle(
  card: CreditCard,
  transactions: Transaction[],
  installmentPlans: InstallmentPlan[],
  today: Date = new Date()
): CardCycleInfo {
  const { lastCutoff, nextCutoff, paymentDueDate, daysToCutoff, daysToPayment } = getCycleDates(card, today);

  // Filter transactions for this card
  const cardTxns = transactions.filter(t => t.cardId === card.id);
  const cardPlans = installmentPlans.filter(p => p.cardId === card.id);

  // Sum active MSI monthly quotas
  const activePlans = cardPlans.filter(p => p.paidMonths < p.totalMonths);
  const msiMonthlyCommitment = activePlans.reduce((sum, p) => sum + p.monthlyAmount, 0);

  // Remaining total principal in MSI
  const msiRemainingPrincipal = activePlans.reduce(
    (sum, p) => sum + (p.totalAmount - (p.paidMonths * p.monthlyAmount)), 
    0
  );

  // Sum regular expenses and payments
  let currentCycleCharges = 0;
  let totalExpenses = 0;
  let totalPayments = 0;

  cardTxns.forEach(t => {
    if (t.type === 'expense' || t.type === 'msi_first_quota') {
      totalExpenses += t.amount;
      const tDate = new Date(t.date + 'T12:00:00');
      if (tDate >= lastCutoff && tDate <= nextCutoff) {
        currentCycleCharges += t.amount;
      }
    } else if (t.type === 'payment') {
      totalPayments += t.amount;
    }
  });

  // Used balance = direct unbilled expenses + remaining MSI principal - total payments
  // Can be any amount according to user's real transactions
  const netDirectSpent = Math.max(0, totalExpenses - totalPayments);
  const totalUsedBalance = Math.max(0, netDirectSpent + msiRemainingPrincipal);
  const availableCredit = Math.max(0, card.creditLimit - totalUsedBalance);
  const utilizationRate = card.creditLimit > 0 ? (totalUsedBalance / card.creditLimit) * 100 : (totalUsedBalance > 0 ? 100 : 0);

  // "Pago para no generar intereses" is the statement balance:
  // Charges from the last closed cycle + current MSI monthly quota
  const totalStatementToPay = Math.max(0, currentCycleCharges + msiMonthlyCommitment);

  // Minimum payment: standard Mexican banking formula
  // max(1.5% of balance + interest, 1.25% of balance, or 5% of balance)
  const minimumPercentage = 0.025; // 2.5% - 5% typical
  const suggestedMinimumPayment = Math.min(
    totalStatementToPay,
    Math.max(200, totalStatementToPay * minimumPercentage)
  );

  const isAfterCutoffBeforePayment = today.getTime() >= lastCutoff.getTime() && today.getTime() <= paymentDueDate.getTime();

  return {
    cardId: card.id,
    currentCycleCutoff: lastCutoff,
    nextCycleCutoff: nextCutoff,
    paymentDueDate,
    daysToCutoff,
    daysToPayment,
    isAfterCutoffBeforePayment,
    isBestToBuyToday: false, // Calculated comparatively across all cards
    scoreBestCardToUse: daysToCutoff,
    currentCycleCharges,
    msiMonthlyCommitment,
    totalStatementToPay,
    suggestedMinimumPayment,
    totalUsedBalance,
    availableCredit,
    utilizationRate: Math.min(100, Math.round(utilizationRate * 10) / 10),
  };
}

export function getUtilizationStatus(rate: number, hasCards: boolean = true): {
  label: string;
  color: string;
  bgLight: string;
  badgeBg: string;
  advice: string;
} {
  if (!hasCards) {
    return {
      label: 'Sin tarjetas (0%)',
      color: 'text-slate-400',
      bgLight: 'bg-slate-700',
      badgeBg: 'bg-slate-800 text-slate-400 border-slate-700',
      advice: 'Agrega tu primera tarjeta de crédito para monitorear tu nivel de endeudamiento.',
    };
  }
  if (rate <= 30) {
    return {
      label: 'Excelente (≤30%)',
      color: 'text-emerald-400',
      bgLight: 'bg-emerald-500',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
      advice: 'Tu porcentaje de uso es ideal para maximizar tu score crediticio.',
    };
  } else if (rate <= 50) {
    return {
      label: 'Moderado (31-50%)',
      color: 'text-amber-400',
      bgLight: 'bg-amber-500',
      badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
      advice: 'Uso aceptable, pero considera abonar antes del corte para bajar de 30%.',
    };
  } else {
    return {
      label: 'Elevado (>50%)',
      color: 'text-rose-400',
      bgLight: 'bg-rose-500',
      badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
      advice: 'Alto endeudamiento. Afecta tu calificación de crédito y eleva riesgo de intereses.',
    };
  }
}

// 12-Month projection of upcoming MSI commitment
export function calculate12MonthForecast(installmentPlans: InstallmentPlan[]) {
  const months: { monthIndex: number; monthLabel: string; totalAmount: number; planCount: number }[] = [];
  const now = new Date();
  
  for (let i = 0; i < 12; i++) {
    const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthLabel = new Intl.DateTimeFormat('es-MX', { month: 'short', year: '2-digit' }).format(futureDate);
    
    let totalForMonth = 0;
    let count = 0;

    installmentPlans.forEach(plan => {
      const remainingMonths = plan.totalMonths - plan.paidMonths;
      if (i < remainingMonths) {
        totalForMonth += plan.monthlyAmount;
        count++;
      }
    });

    months.push({
      monthIndex: i,
      monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
      totalAmount: totalForMonth,
      planCount: count,
    });
  }

  return months;
}

// Payment simulator calculation
export interface SimulationResult {
  strategy: 'total' | 'minimum' | 'custom';
  monthlyPayment: number;
  totalPaid: number;
  totalInterestPaid: number;
  monthsToPayOff: number;
  amortization: {
    month: number;
    payment: number;
    interest: number;
    principal: number;
    balance: number;
  }[];
}

export function simulateDebtPayoff(
  balance: number,
  annualRatePercentage: number,
  strategy: 'total' | 'minimum' | 'custom',
  customMonthlyAmount?: number
): SimulationResult {
  const monthlyRate = (annualRatePercentage / 100) / 12;

  if (balance <= 0) {
    return {
      strategy,
      monthlyPayment: 0,
      totalPaid: 0,
      totalInterestPaid: 0,
      monthsToPayOff: 0,
      amortization: [],
    };
  }

  if (strategy === 'total') {
    return {
      strategy: 'total',
      monthlyPayment: balance,
      totalPaid: balance,
      totalInterestPaid: 0,
      monthsToPayOff: 1,
      amortization: [
        {
          month: 1,
          payment: balance,
          interest: 0,
          principal: balance,
          balance: 0,
        },
      ],
    };
  }

  let remaining = balance;
  let totalInterest = 0;
  let totalPaid = 0;
  let month = 0;
  const maxMonths = 360; // 30 years cap
  const schedule: SimulationResult['amortization'] = [];

  while (remaining > 0.5 && month < maxMonths) {
    month++;
    const monthlyInterest = remaining * monthlyRate;

    let payment = 0;
    if (strategy === 'minimum') {
      // Minimum is typically 1.5% of balance + interest, minimum 200 MXN or remaining
      const minPercentagePart = remaining * 0.015;
      payment = Math.max(200, minPercentagePart + monthlyInterest);
    } else {
      // Custom payment
      payment = customMonthlyAmount || (balance * 0.1);
    }

    // Payment cannot exceed remaining + interest
    payment = Math.min(payment, remaining + monthlyInterest);

    // If payment does not even cover interest, the debt is non-converging!
    if (payment <= monthlyInterest && remaining > 100) {
      payment = monthlyInterest + 100; // avoid infinite loop
    }

    const principal = Math.max(0, payment - monthlyInterest);
    remaining = Math.max(0, remaining - principal);

    totalInterest += monthlyInterest;
    totalPaid += payment;

    if (month <= 48 || remaining <= 0) {
      schedule.push({
        month,
        payment: Math.round(payment * 100) / 100,
        interest: Math.round(monthlyInterest * 100) / 100,
        principal: Math.round(principal * 100) / 100,
        balance: Math.round(remaining * 100) / 100,
      });
    }
  }

  return {
    strategy,
    monthlyPayment: strategy === 'custom' ? (customMonthlyAmount || 0) : (schedule[0]?.payment || 0),
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalInterestPaid: Math.round(totalInterest * 100) / 100,
    monthsToPayOff: month,
    amortization: schedule,
  };
}
