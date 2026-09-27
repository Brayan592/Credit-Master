import React from 'react';
import { CreditCard, Transaction, InstallmentPlan, CardCycleInfo, ReservedFundItem } from '../types/creditCard';
import { formatCurrency, formatDateShort, getUtilizationStatus } from '../utils/creditMath';
import { CreditCardVisual } from './CreditCardVisual';
import { 
  CreditCard as CardIcon, 
  Sparkles, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Plus,
  PiggyBank
} from 'lucide-react';

interface Props {
  cards: CreditCard[];
  transactions: Transaction[];
  installmentPlans: InstallmentPlan[];
  cycleInfos: Record<string, CardCycleInfo>;
  onNavigateTab: (tab: 'cards' | 'msi' | 'transactions' | 'simulator' | 'calendar') => void;
  onOpenNewExpense: (cardId?: string) => void;
  onOpenNewPayment: (cardId?: string) => void;
  onOpenNewCard: () => void;
  onSelectCard: (cardId: string) => void;
  reservedFunds?: ReservedFundItem[];
  onOpenReservedFunds?: (initialTab?: 'overview' | 'add' | 'pay') => void;
}

export const DashboardView: React.FC<Props> = ({
  cards,
  transactions,
  installmentPlans,
  cycleInfos,
  onNavigateTab,
  onOpenNewExpense,
  onOpenNewPayment,
  onOpenNewCard,
  onSelectCard,
  reservedFunds = [],
  onOpenReservedFunds,
}) => {
  // Aggregate calculations
  const totalCreditLimit = cards.reduce((sum, c) => sum + c.creditLimit, 0);
  const totalUsedBalance = Object.values(cycleInfos).reduce((sum, info) => sum + info.totalUsedBalance, 0);
  const totalAvailableCredit = Math.max(0, totalCreditLimit - totalUsedBalance);
  const overallUtilization = totalCreditLimit > 0 ? (totalUsedBalance / totalCreditLimit) * 100 : 0;
  const utilizationStatus = getUtilizationStatus(overallUtilization, cards.length > 0);

  const totalStatementToPay = Object.values(cycleInfos).reduce((sum, info) => sum + info.totalStatementToPay, 0);
  const totalMsiCommitment = Object.values(cycleInfos).reduce((sum, info) => sum + info.msiMonthlyCommitment, 0);

  const totalReserved = reservedFunds.reduce((sum, item) => sum + item.amount, 0);
  const coveragePct = totalStatementToPay > 0 
    ? Math.min(100, Math.round((totalReserved / totalStatementToPay) * 100))
    : (totalReserved > 0 ? 100 : 0);
  const isFullCovered = totalStatementToPay > 0 && totalReserved >= totalStatementToPay;

  // Find best card to buy today (highest days to cutoff)
  let bestCard: CreditCard | null = null;
  let maxDaysToCutoff = -1;

  cards.forEach(card => {
    const info = cycleInfos[card.id];
    if (info && info.daysToCutoff > maxDaysToCutoff && info.availableCredit > 500) {
      maxDaysToCutoff = info.daysToCutoff;
      bestCard = card;
    }
  });

  // Upcoming payments in <= 7 days
  const urgentPayments = cards
    .map(c => ({ card: c, info: cycleInfos[c.id] }))
    .filter(({ info }) => info && info.daysToPayment <= 7 && info.totalStatementToPay > 0)
    .sort((a, b) => (a.info?.daysToPayment || 0) - (b.info?.daysToPayment || 0));

  // Category breakdown for expenses
  const categoryTotals: Record<string, number> = {};
  transactions
    .filter(t => t.type === 'expense' || t.type === 'msi_first_quota')
    .forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const totalCategorized = sortedCategories.reduce((sum, [, amt]) => sum + amt, 0);

  // Recent 5 transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8 pb-12">
      {/* Zero-state onboarding banner when starting in zeros */}
      {cards.length === 0 && (
        <div className="liquid-glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-emerald-300/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_12px_40px_rgba(16,185,129,0.08)]">
          <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="space-y-2 max-w-xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-sm backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Gestor listo en ceros</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Bienvenido a tu Gestor de Tarjetas de Crédito
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tu aplicación está limpia para que ingreses tus datos reales. Registra tu primera tarjeta indicando tu banco, límite y fecha de corte para monitorear automáticamente tus vencimientos, intereses y compras a MSI.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto relative z-10">
            <button
              onClick={onOpenNewCard}
              className="px-6 py-3.5 text-xs font-bold rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white transition-all shadow-[0_4px_16px_rgba(16,185,129,0.35)] border border-emerald-400/40 text-center whitespace-nowrap active:scale-95"
            >
              + Registrar Mi Primera Tarjeta
            </button>
          </div>
        </div>
      )}

      {/* Top Banner: Urgent Payment Alerts if any */}
      {urgentPayments.length > 0 && (
        <div className="p-5 rounded-3xl bg-rose-50/90 backdrop-blur-2xl border border-rose-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_4px_20px_rgba(244,63,94,0.12)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-600 border border-rose-200 shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900">
                ¡Vencimiento próximo en {urgentPayments[0].info.daysToPayment === 0 ? 'HOY' : `${urgentPayments[0].info.daysToPayment} días`}!
              </h4>
              <p className="text-xs text-rose-800">
                {urgentPayments[0].card.bank} {urgentPayments[0].card.name} requiere pago de{' '}
                <strong className="text-rose-950 font-mono font-bold">
                  {formatCurrency(urgentPayments[0].info.totalStatementToPay)}
                </strong>{' '}
                para no generar intereses.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenNewPayment(urgentPayments[0].card.id)}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all whitespace-nowrap shadow-sm active:scale-95"
          >
            Abonar Ahora
          </button>
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Debt / Used Balance */}
        <div className="liquid-glass-card p-5 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Deuda Total Utilizada</span>
            <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 backdrop-blur-md">
              <CardIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-bold text-slate-900 tracking-tight">
            {formatCurrency(totalUsedBalance)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Línea total combinada:</span>
            <span className="font-mono font-semibold text-slate-700">{formatCurrency(totalCreditLimit)}</span>
          </div>
        </div>

        {/* Metric 2: Available Credit */}
        <div className="liquid-glass-card p-5 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Crédito Disponible Total</span>
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 backdrop-blur-md shadow-sm">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-bold text-emerald-700 tracking-tight">
            {formatCurrency(totalAvailableCredit)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Capacidad libre:</span>
            <span className="font-mono font-semibold text-emerald-700">
              {totalCreditLimit > 0 ? Math.round((totalAvailableCredit / totalCreditLimit) * 100) : 0}% libre
            </span>
          </div>
        </div>

        {/* Metric 3: Total Statement to Pay */}
        <div className="liquid-glass-card p-5 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Para No Generar Intereses</span>
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 backdrop-blur-md shadow-sm">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-bold text-slate-900 tracking-tight">
            {formatCurrency(totalStatementToPay)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Incluye cuotas MSI:</span>
            <span className="font-mono font-semibold text-slate-700">{formatCurrency(totalMsiCommitment)}/mes</span>
          </div>
        </div>

        {/* Metric 4: Utilization Rate Gauge */}
        <div className="liquid-glass-card p-5 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Nivel de Endeudamiento</span>
            <span className={`text-[11px] font-bold ${utilizationStatus.color}`}>
              {utilizationStatus.label}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-slate-900 tracking-tight">
              {Math.round(overallUtilization * 10) / 10}%
            </span>
            <span className="text-xs text-slate-500">de tu capacidad</span>
          </div>

          <div className="mt-3 w-full h-2 bg-slate-200/80 rounded-full overflow-hidden p-0.5 border border-slate-300/60 backdrop-blur-sm">
            <div
              className={`h-full rounded-full transition-all duration-500 ${utilizationStatus.bgLight}`}
              style={{ width: `${Math.min(100, overallUtilization)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Featured Vault: DINERO ADENTRO DE LA APP PERO NO ABONADO */}
      <div className="liquid-glass-card p-6 sm:p-7 rounded-3xl border border-cyan-300/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_12px_40px_rgba(6,182,212,0.08)] relative overflow-hidden bg-gradient-to-br from-cyan-50/50 via-white/80 to-white/70">
        <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-cyan-400/15 blur-3xl" />
        
        <div className="space-y-3 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100/80 border border-cyan-300 text-cyan-900 text-xs font-semibold backdrop-blur-md shadow-sm">
            <PiggyBank className="w-3.5 h-3.5 text-cyan-700" />
            <span>Fondo de Cobertura Inteligente</span>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Dinero adentro de la app pero no abonado
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Dinero que has apartado para liquidar tus tarjetas en la fecha de pago óptima, evitando intereses mientras mantienes liquidez.
            </p>
          </div>

          <div className="flex flex-wrap items-baseline gap-3 pt-1">
            <span className="font-mono text-3xl font-bold text-cyan-800">
              {formatCurrency(totalReserved)}
            </span>
            <span className="text-xs text-slate-500">
              {totalStatementToPay > 0 ? (
                <>
                  vs {formatCurrency(totalStatementToPay)} requerido al corte (
                  <strong className={isFullCovered ? 'text-emerald-700' : 'text-amber-700'}>
                    {coveragePct}% cubierto
                  </strong>)
                </>
              ) : (
                'Sin adeudos pendientes al corte'
              )}
            </span>
          </div>

          {/* Mini progress bar of coverage */}
          <div className="w-full max-w-md h-2 bg-slate-200/80 rounded-full overflow-hidden p-0.5 border border-slate-300/60">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFullCovered
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_8px_rgba(52,211,153,0.4)]'
                  : 'bg-gradient-to-r from-cyan-500 to-amber-500 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
              }`}
              style={{ width: `${Math.min(100, coveragePct)}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto relative z-10 shrink-0">
          <button
            onClick={() => onOpenReservedFunds?.('add')}
            className="px-5 py-2.5 text-xs font-bold rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white transition-all shadow-md active:scale-95 text-center flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Apartar Dinero</span>
          </button>
          {totalReserved > 0 && cards.length > 0 && (
            <button
              onClick={() => onOpenReservedFunds?.('pay')}
              className="px-5 py-2.5 text-xs font-semibold rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 backdrop-blur-md transition-all shadow-sm active:scale-95 text-center flex items-center justify-center gap-1.5"
            >
              <ArrowDownRight className="w-4 h-4 text-emerald-600" />
              <span>Abonar a Tarjeta</span>
            </button>
          )}
        </div>
      </div>

      {/* Smart Financial Strategy Banner: Best card to use today */}
      {bestCard && (
        <div className="liquid-glass-card p-6 rounded-3xl border border-emerald-300/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_12px_40px_rgba(16,185,129,0.08)] relative overflow-hidden bg-gradient-to-br from-emerald-50/50 via-white/80 to-white/70">
          <div className="pointer-events-none absolute -bottom-20 -left-20 w-52 h-52 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="flex items-start gap-4 relative z-10">
            <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Recomendación Inteligente para Compras
                </span>
                <span className="text-xs text-slate-500">· Financiamiento a costo $0</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Usa tu tarjeta {(bestCard as CreditCard).bank} {(bestCard as CreditCard).name}
              </h3>
              <p className="text-xs text-slate-600 max-w-2xl mt-1 leading-relaxed">
                Su fecha de corte es el día {(bestCard as CreditCard).cutOffDay} (faltan {maxDaysToCutoff} días).
                Si compras hoy con esta tarjeta, tu cargo se reflejará hasta el siguiente ciclo,
                otorgándote hasta <strong className="text-emerald-800 font-semibold">{maxDaysToCutoff + 20} días de financiamiento libre de intereses</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenNewExpense((bestCard as CreditCard).id)}
            className="px-5 py-2.5 text-xs font-bold rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white transition-all whitespace-nowrap shadow-md hover:scale-105 active:scale-95 relative z-10"
          >
            Comprar con esta tarjeta
          </button>
        </div>
      )}

      {/* Cards Showcase Header & Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Tus Tarjetas de Crédito</h2>
            <p className="text-xs text-slate-500">Haz clic en una tarjeta para ver sus detalles o registrar pagos</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewCard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Nueva Tarjeta</span>
            </button>
            <button
              onClick={() => onNavigateTab('cards')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1"
            >
              <span>Ver todas ({cards.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="p-8 rounded-3xl border border-dashed border-slate-300 bg-white/60 text-center space-y-3">
            <CardIcon className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-700">No tienes tarjetas registradas aún</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Comienza agregando tu primera tarjeta de crédito para monitorear cortes, límites y meses sin intereses.
            </p>
            <button
              onClick={onOpenNewCard}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
            >
              Registrar Primera Tarjeta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => {
              const info = cycleInfos[card.id];
              return (
                <CreditCardVisual
                  key={card.id}
                  card={card}
                  usedBalance={info?.totalUsedBalance || 0}
                  availableCredit={info?.availableCredit || card.creditLimit}
                  utilizationRate={info?.utilizationRate || 0}
                  daysToCutoff={info?.daysToCutoff}
                  daysToPayment={info?.daysToPayment}
                  isBestOptionToday={bestCard?.id === card.id}
                  onSelect={() => onSelectCard(card.id)}
                  onPay={() => onOpenNewPayment(card.id)}
                  onEdit={() => onSelectCard(card.id)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Two columns: Recent Transactions + MSI Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recent Activity */}
        <div className="liquid-glass-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Movimientos Recientes</h3>
              <p className="text-xs text-slate-500">Últimos cargos y abonos registrados</p>
            </div>
            <button
              onClick={() => onNavigateTab('transactions')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1 transition-colors"
            >
              <span>Ver historial</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No hay movimientos registrados.
            </div>
          ) : (
            <div className="divide-y divide-slate-200/80">
              {recentTransactions.map((tx) => {
                const card = cards.find(c => c.id === tx.cardId);
                const isPayment = tx.type === 'payment';
                return (
                  <div key={tx.id} className="py-3 flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl border backdrop-blur-md ${
                          isPayment 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' 
                            : 'bg-slate-100 border-slate-200 text-slate-600'
                        }`}
                      >
                        {isPayment ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800 tracking-tight group-hover:text-emerald-700 transition-colors">
                          {tx.description}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <span>{card ? `${card.bank} (••${card.lastFourDigits})` : 'Tarjeta'}</span>
                          <span>·</span>
                          <span>{formatDateShort(tx.date)}</span>
                          <span>·</span>
                          <span>{tx.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`font-mono text-sm font-bold ${
                          isPayment ? 'text-emerald-700' : 'text-slate-900'
                        }`}
                      >
                        {isPayment ? '-' : '+'}
                        {formatCurrency(tx.amount)}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {tx.type === 'msi_first_quota' ? 'Cuota MSI' : tx.type}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: MSI Status & Spending Distribution */}
        <div className="space-y-6">
          {/* Active MSI Summary Box */}
          <div className="liquid-glass-card p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Meses Sin Intereses Activos</h3>
                <p className="text-xs text-slate-500">Total diferido comprometido por mes</p>
              </div>
              <button
                onClick={() => onNavigateTab('msi')}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1 transition-colors"
              >
                <span>Administrar</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200/80 backdrop-blur-md flex items-center justify-between shadow-inner">
              <div>
                <div className="text-xs text-slate-500">Mensualidad comprometida actual</div>
                <div className="font-mono text-xl font-bold text-slate-900">
                  {formatCurrency(totalMsiCommitment)} <span className="text-xs text-slate-500 font-normal">/ mes</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Planes activos</div>
                <div className="font-mono text-xl font-bold text-emerald-700">
                  {installmentPlans.filter(p => p.paidMonths < p.totalMonths).length} compras
                </div>
              </div>
            </div>

            {/* Top 2 Active MSI Plans */}
            <div className="space-y-2.5">
              {installmentPlans
                .filter(p => p.paidMonths < p.totalMonths)
                .slice(0, 2)
                .map((plan) => {
                  const card = cards.find(c => c.id === plan.cardId);
                  const progressPct = Math.round((plan.paidMonths / plan.totalMonths) * 100);
                  return (
                    <div key={plan.id} className="p-3.5 rounded-2xl bg-white/80 border border-slate-200/80 backdrop-blur-sm">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-900 truncate max-w-[200px]">{plan.description}</span>
                        <span className="font-mono text-slate-800 font-semibold">{formatCurrency(plan.monthlyAmount)} / m</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                        <span>{card?.bank} · Cuota {plan.paidMonths} de {plan.totalMonths}</span>
                        <span className="text-emerald-700 font-semibold">{progressPct}% pagado</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden p-0.5 border border-slate-300/60">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-sm"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Top Spending Categories */}
          <div className="liquid-glass-card p-6 rounded-3xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Gastos por Categoría</h3>
            
            {sortedCategories.length === 0 ? (
              <div className="text-xs text-slate-400 py-3 text-center">Sin gastos registrados.</div>
            ) : (
              <div className="space-y-3">
                {sortedCategories.map(([category, amount]) => {
                  const pct = totalCategorized > 0 ? Math.round((amount / totalCategorized) * 100) : 0;
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-700 font-medium">{category}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-900 font-semibold">{formatCurrency(amount)}</span>
                          <span className="text-slate-500 font-mono text-[11px]">({pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden p-0.5 border border-slate-300/60">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-sm"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
