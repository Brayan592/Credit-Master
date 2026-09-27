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
        <div className="liquid-glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-emerald-400/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_12px_40px_rgba(16,185,129,0.15)]">
          <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="space-y-2 max-w-xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs font-semibold shadow-[0_0_15px_rgba(16,185,129,0.25)] backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gestor listo en ceros</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight drop-shadow-sm">
              Bienvenido a tu Gestor de Tarjetas de Crédito
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tu aplicación está limpia para que ingreses tus datos reales. Registra tu primera tarjeta indicando tu banco, límite y fecha de corte para monitorear automáticamente tus vencimientos, intereses y compras a MSI.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto relative z-10">
            <button
              onClick={onOpenNewCard}
              className="px-6 py-3.5 text-xs font-bold rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 text-slate-950 transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)] border border-emerald-300/50 text-center whitespace-nowrap active:scale-95"
            >
              + Registrar Mi Primera Tarjeta
            </button>
          </div>
        </div>
      )}

      {/* Top Banner: Urgent Payment Alerts if any */}
      {urgentPayments.length > 0 && (
        <div className="p-5 rounded-3xl bg-rose-500/10 backdrop-blur-2xl border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_8px_32px_rgba(244,63,94,0.2)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-rose-200">
                ¡Vencimiento próximo en {urgentPayments[0].info.daysToPayment === 0 ? 'HOY' : `${urgentPayments[0].info.daysToPayment} días`}!
              </h4>
              <p className="text-xs text-rose-300/80">
                {urgentPayments[0].card.bank} {urgentPayments[0].card.name} requiere pago de{' '}
                <strong className="text-white font-mono font-bold">
                  {formatCurrency(urgentPayments[0].info.totalStatementToPay)}
                </strong>{' '}
                para no generar intereses.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenNewPayment(urgentPayments[0].card.id)}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 transition-all whitespace-nowrap shadow-[0_0_15px_rgba(244,63,94,0.4)]"
          >
            Abonar Ahora
          </button>
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Debt / Used Balance */}
        <div className="liquid-glass-card p-5 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
            <span>Deuda Total Utilizada</span>
            <div className="p-2 rounded-xl bg-white/[0.06] border border-white/10 text-slate-300 backdrop-blur-md">
              <CardIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-bold text-white tracking-tight drop-shadow-sm">
            {formatCurrency(totalUsedBalance)}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Línea total combinada:</span>
            <span className="font-mono text-slate-200">{formatCurrency(totalCreditLimit)}</span>
          </div>
        </div>

        {/* Metric 2: Available Credit */}
        <div className="liquid-glass-card p-5 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
            <span>Crédito Disponible Total</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-bold text-emerald-300 tracking-tight drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]">
            {formatCurrency(totalAvailableCredit)}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Capacidad libre:</span>
            <span className="font-mono text-emerald-300">
              {totalCreditLimit > 0 ? Math.round((totalAvailableCredit / totalCreditLimit) * 100) : 0}% libre
            </span>
          </div>
        </div>

        {/* Metric 3: Total Statement to Pay */}
        <div className="liquid-glass-card p-5 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
            <span>Para No Generar Intereses</span>
            <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-400/30 text-blue-300 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-bold text-white tracking-tight drop-shadow-sm">
            {formatCurrency(totalStatementToPay)}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Incluye cuotas MSI:</span>
            <span className="font-mono text-slate-200">{formatCurrency(totalMsiCommitment)}/mes</span>
          </div>
        </div>

        {/* Metric 4: Utilization Rate Gauge */}
        <div className="liquid-glass-card p-5 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
            <span>Nivel de Endeudamiento</span>
            <span className={`text-[11px] font-semibold ${utilizationStatus.color}`}>
              {utilizationStatus.label}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-white tracking-tight drop-shadow-sm">
              {Math.round(overallUtilization * 10) / 10}%
            </span>
            <span className="text-xs text-slate-400">de tu capacidad</span>
          </div>

          <div className="mt-3 w-full h-2 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10 backdrop-blur-sm">
            <div
              className={`h-full rounded-full transition-all duration-500 ${utilizationStatus.bgLight}`}
              style={{ width: `${Math.min(100, overallUtilization)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Featured Vault: DINERO ADENTRO DE LA APP PERO NO ABONADO */}
      <div className="liquid-glass-card p-6 sm:p-7 rounded-3xl border border-cyan-400/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_12px_40px_rgba(6,182,212,0.15)] relative overflow-hidden">
        <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl" />
        
        <div className="space-y-3 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-semibold backdrop-blur-md shadow-sm">
            <PiggyBank className="w-3.5 h-3.5 text-cyan-400" />
            <span>Fondo de Cobertura Inteligente</span>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight drop-shadow-sm">
              Dinero adentro de la app pero no abonado
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              Dinero que has apartado para liquidar tus tarjetas en la fecha de pago óptima, evitando intereses mientras mantienes liquidez.
            </p>
          </div>

          <div className="flex flex-wrap items-baseline gap-3 pt-1">
            <span className="font-mono text-3xl font-bold text-cyan-300 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              {formatCurrency(totalReserved)}
            </span>
            <span className="text-xs text-slate-400">
              {totalStatementToPay > 0 ? (
                <>
                  vs {formatCurrency(totalStatementToPay)} requerido al corte (
                  <strong className={isFullCovered ? 'text-emerald-300' : 'text-amber-300'}>
                    {coveragePct}% cubierto
                  </strong>)
                </>
              ) : (
                'Sin adeudos pendientes al corte'
              )}
            </span>
          </div>

          {/* Mini progress bar of coverage */}
          <div className="w-full max-w-md h-2 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFullCovered
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-300 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                  : 'bg-gradient-to-r from-cyan-400 to-amber-300 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
              }`}
              style={{ width: `${Math.min(100, coveragePct)}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto relative z-10 shrink-0">
          <button
            onClick={() => onOpenReservedFunds?.('add')}
            className="px-5 py-2.5 text-xs font-bold rounded-2xl bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 text-slate-950 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 text-center flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Apartar Dinero</span>
          </button>
          {totalReserved > 0 && cards.length > 0 && (
            <button
              onClick={() => onOpenReservedFunds?.('pay')}
              className="px-5 py-2.5 text-xs font-bold rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/15 backdrop-blur-md transition-all shadow-sm active:scale-95 text-center flex items-center justify-center gap-1.5"
            >
              <ArrowDownRight className="w-4 h-4 text-emerald-400" />
              <span>Abonar a Tarjeta</span>
            </button>
          )}
        </div>
      </div>

      {/* Smart Financial Strategy Banner: Best card to use today */}
      {bestCard && (
        <div className="liquid-glass-card p-6 rounded-3xl border border-emerald-400/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_12px_40px_rgba(16,185,129,0.15)] relative overflow-hidden">
          <div className="pointer-events-none absolute -bottom-20 -left-20 w-52 h-52 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="flex items-start gap-4 relative z-10">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Recomendación Inteligente para Compras
                </span>
                <span className="text-xs text-slate-400">· Financiamiento a costo $0</span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5 drop-shadow-sm">
                Usa tu tarjeta {(bestCard as CreditCard).bank} {(bestCard as CreditCard).name}
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
                Su fecha de corte es el día {(bestCard as CreditCard).cutOffDay} (faltan {maxDaysToCutoff} días).
                Si compras hoy con esta tarjeta, tu cargo se reflejará hasta el siguiente ciclo,
                otorgándote hasta <strong className="text-emerald-300 font-semibold">{maxDaysToCutoff + 20} días de financiamiento libre de intereses</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenNewExpense((bestCard as CreditCard).id)}
            className="px-5 py-2.5 text-xs font-bold rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 transition-all whitespace-nowrap shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:scale-105 active:scale-95 relative z-10"
          >
            Comprar con esta tarjeta
          </button>
        </div>
      )}

      {/* Cards Showcase Header & Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Tus Tarjetas de Crédito</h2>
            <p className="text-xs text-slate-400">Haz clic en una tarjeta para ver sus detalles o registrar pagos</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewCard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Nueva Tarjeta</span>
            </button>
            <button
              onClick={() => onNavigateTab('cards')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1"
            >
              <span>Ver todas ({cards.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-slate-800 text-center space-y-3">
            <CardIcon className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-300">No tienes tarjetas registradas aún</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Comienza agregando tu primera tarjeta de crédito para monitorear cortes, límites y meses sin intereses.
            </p>
            <button
              onClick={onOpenNewCard}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-400 text-slate-950 hover:bg-emerald-300"
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
              <h3 className="text-base font-bold text-white tracking-tight drop-shadow-sm">Movimientos Recientes</h3>
              <p className="text-xs text-slate-400">Últimos cargos y abonos registrados</p>
            </div>
            <button
              onClick={() => onNavigateTab('transactions')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 transition-colors"
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
            <div className="divide-y divide-white/[0.08]">
              {recentTransactions.map((tx) => {
                const card = cards.find(c => c.id === tx.cardId);
                const isPayment = tx.type === 'payment';
                return (
                  <div key={tx.id} className="py-3 flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl border backdrop-blur-md ${
                          isPayment 
                            ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                            : 'bg-white/[0.05] border-white/10 text-slate-300'
                        }`}
                      >
                        {isPayment ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                          {tx.description}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
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
                          isPayment ? 'text-emerald-400' : 'text-slate-100'
                        }`}
                      >
                        {isPayment ? '-' : '+'}
                        {formatCurrency(tx.amount)}
                      </div>
                      <div className="text-[10px] text-slate-500 capitalize">
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
                <h3 className="text-base font-bold text-white tracking-tight drop-shadow-sm">Meses Sin Intereses Activos</h3>
                <p className="text-xs text-slate-400">Total diferido comprometido por mes</p>
              </div>
              <button
                onClick={() => onNavigateTab('msi')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 transition-colors"
              >
                <span>Administrar</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md flex items-center justify-between shadow-inner">
              <div>
                <div className="text-xs text-slate-400">Mensualidad comprometida actual</div>
                <div className="font-mono text-xl font-bold text-white">
                  {formatCurrency(totalMsiCommitment)} <span className="text-xs text-slate-400 font-normal">/ mes</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Planes activos</div>
                <div className="font-mono text-xl font-bold text-emerald-300">
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
                    <div key={plan.id} className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-white truncate max-w-[200px]">{plan.description}</span>
                        <span className="font-mono text-slate-200">{formatCurrency(plan.monthlyAmount)} / m</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                        <span>{card?.bank} · Cuota {plan.paidMonths} de {plan.totalMonths}</span>
                        <span className="text-emerald-300 font-semibold">{progressPct}% pagado</span>
                      </div>
                      <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-300 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"
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
            <h3 className="text-base font-bold text-white tracking-tight drop-shadow-sm">Gastos por Categoría</h3>
            
            {sortedCategories.length === 0 ? (
              <div className="text-xs text-slate-400 py-3 text-center">Sin gastos registrados.</div>
            ) : (
              <div className="space-y-3">
                {sortedCategories.map(([category, amount]) => {
                  const pct = totalCategorized > 0 ? Math.round((amount / totalCategorized) * 100) : 0;
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">{category}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white font-semibold">{formatCurrency(amount)}</span>
                          <span className="text-slate-400 font-mono text-[11px]">({pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.4)]"
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
