import React, { useState } from 'react';
import { CreditCard, Transaction, InstallmentPlan, CardCycleInfo, ReservedFundItem } from '../types/creditCard';
import { formatCurrency, formatDateShort, getUtilizationStatus } from '../utils/creditMath';
import { CreditCardVisual } from './CreditCardVisual';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Percent, 
  ShieldCheck, 
  AlertTriangle,
  ArrowDownRight,
  Clock,
  Sparkles,
  Sliders,
  Check,
  X,
  PiggyBank
} from 'lucide-react';

interface Props {
  cards: CreditCard[];
  transactions: Transaction[];
  installmentPlans: InstallmentPlan[];
  cycleInfos: Record<string, CardCycleInfo>;
  selectedCardId?: string;
  onSelectCard: (cardId: string) => void;
  onOpenNewCard: () => void;
  onEditCard: (card: CreditCard) => void;
  onDeleteCard: (cardId: string) => void;
  onOpenNewPayment: (cardId: string) => void;
  onOpenNewExpense: (cardId: string) => void;
  onSaveCard?: (card: CreditCard) => void;
  reservedFunds?: ReservedFundItem[];
  onOpenReservedFunds?: (initialTab?: 'overview' | 'add' | 'pay', targetCardId?: string) => void;
}

export const CardsView: React.FC<Props> = ({
  cards,
  transactions,
  installmentPlans,
  cycleInfos,
  selectedCardId,
  onSelectCard,
  onOpenNewCard,
  onEditCard,
  onDeleteCard,
  onOpenNewPayment,
  onOpenNewExpense,
  onSaveCard,
  reservedFunds = [],
  onOpenReservedFunds,
}) => {
  const [isAdjustLimitOpen, setIsAdjustLimitOpen] = useState(false);
  const [quickLimitInput, setQuickLimitInput] = useState('');

  const activeCard = cards.find(c => c.id === selectedCardId) || cards[0];
  const activeCycle = activeCard ? cycleInfos[activeCard.id] : undefined;

  const cardTransactions = activeCard
    ? transactions.filter(t => t.cardId === activeCard.id)
    : [];

  const cardInstallments = activeCard
    ? installmentPlans.filter(p => p.cardId === activeCard.id)
    : [];

  const utilization = activeCycle?.utilizationRate || 0;
  const status = getUtilizationStatus(utilization, Boolean(activeCard));

  const handleOpenQuickLimit = () => {
    if (activeCard) {
      setQuickLimitInput(activeCard.creditLimit.toString());
      setIsAdjustLimitOpen(true);
    }
  };

  const handleSaveQuickLimit = () => {
    if (!activeCard || !onSaveCard) return;
    const clean = quickLimitInput.replace(/[^0-9.]/g, '');
    const newLimit = parseFloat(clean);
    const validLimit = isNaN(newLimit) ? 0 : Math.max(0, newLimit);

    onSaveCard({
      ...activeCard,
      creditLimit: validLimit,
    });
    setIsAdjustLimitOpen(false);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 mb-2 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Gestión Liquid Glass de Tarjetas</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Tus Tarjetas de Crédito
          </h1>
          <p className="text-xs text-slate-600">
            Ajusta límites a cualquier cantidad, fechas de corte y consulta estados de cuenta en tiempo real.
          </p>
        </div>
        <button
          onClick={onOpenNewCard}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white transition-all shadow-[0_4px_16px_rgba(16,185,129,0.35)] border border-emerald-400/40 active:scale-95"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Agregar Nueva Tarjeta</span>
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="liquid-glass-card p-12 text-center rounded-3xl border border-slate-200 space-y-4 max-w-lg mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto backdrop-blur-md shadow-sm">
            <Plus className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Comienza registrando tu primera tarjeta</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Agrega los datos de tu tarjeta de crédito (BBVA, Nu, Santander, Citibanamex, etc.) con cualquier límite que desees y tu día de corte para calcular tus fechas límites y mantener tus finanzas al día.
            </p>
          </div>
          <button
            onClick={onOpenNewCard}
            className="px-6 py-3 text-xs font-bold rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white transition-all shadow-[0_4px_16px_rgba(16,185,129,0.35)] border border-emerald-400/40 active:scale-95"
          >
            + Registrar Mi Primera Tarjeta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cards Carousel / List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Selecciona una tarjeta ({cards.length})
              </h3>
              <span className="text-[11px] text-slate-500">Clic para ver desglose</span>
            </div>
            <div className="space-y-4">
              {cards.map((card) => {
                const info = cycleInfos[card.id];
                const isSelected = activeCard?.id === card.id;
                return (
                  <div key={card.id} className="relative">
                    <CreditCardVisual
                      card={card}
                      usedBalance={info?.totalUsedBalance || 0}
                      availableCredit={info?.availableCredit || card.creditLimit}
                      utilizationRate={info?.utilizationRate || 0}
                      daysToCutoff={info?.daysToCutoff}
                      daysToPayment={info?.daysToPayment}
                      isSelected={isSelected}
                      onSelect={() => onSelectCard(card.id)}
                      onPay={() => onOpenNewPayment(card.id)}
                      onEdit={() => onEditCard(card)}
                      showActions={true}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Deep Details of Selected Card */}
          {activeCard && activeCycle && (
            <div className="lg:col-span-7 space-y-6">
              {/* Card Meta & Action Bar */}
              <div className="liquid-glass-card p-6 sm:p-7 rounded-3xl space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                      Detalle Liquid Glass
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      {activeCard.bank} {activeCard.name}
                    </h2>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Terminación •••• {activeCard.lastFourDigits} · Red {activeCard.network.toUpperCase()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenNewExpense(activeCard.id)}
                      className="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md active:scale-95 whitespace-nowrap"
                    >
                      + Registrar Gasto
                    </button>
                    <button
                      onClick={() => onOpenNewPayment(activeCard.id)}
                      className="px-3 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 backdrop-blur-md transition-all shadow-sm whitespace-nowrap"
                    >
                      Abonar
                    </button>
                    <button
                      onClick={() => onEditCard(activeCard)}
                      title="Editar configuración completa"
                      className="p-2 text-slate-600 hover:text-slate-900 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 backdrop-blur-md transition-all shadow-sm"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteCard(activeCard.id)}
                      title="Eliminar tarjeta"
                      className="p-2 text-rose-500 hover:text-rose-700 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 backdrop-blur-md transition-all shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Key Cycle Dates Display */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Cutoff Date Box */}
                  <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200/80 backdrop-blur-md">
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Próximo Día de Corte</span>
                      </div>
                      <span className="font-mono text-emerald-800 font-bold">
                        en {activeCycle.daysToCutoff} días
                      </span>
                    </div>
                    <div className="font-mono text-lg font-bold text-slate-900">
                      {formatDateShort(activeCycle.nextCycleCutoff)}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Día {activeCard.cutOffDay} de cada mes. Las compras cierran este día.
                    </div>
                  </div>

                  {/* Payment Due Date Box */}
                  <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200/80 backdrop-blur-md">
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Fecha Límite de Pago</span>
                      </div>
                      <span
                        className={`font-mono font-bold ${
                          activeCycle.daysToPayment <= 3 ? 'text-rose-600' : 'text-slate-700'
                        }`}
                      >
                        en {activeCycle.daysToPayment} días
                      </span>
                    </div>
                    <div className="font-mono text-lg font-bold text-slate-900">
                      {formatDateShort(activeCycle.paymentDueDate)}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {activeCard.paymentDueDayOfMonth
                        ? `Día fijo ${activeCard.paymentDueDayOfMonth} del mes siguiente`
                        : '20 días posteriores a la fecha de corte'}
                    </div>
                  </div>
                </div>

                {/* Financial Statement Amounts Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 backdrop-blur-md shadow-sm">
                    <div className="text-[11px] font-bold text-emerald-800 mb-1">
                      Para No Generar Intereses
                    </div>
                    <div className="font-mono text-xl font-bold text-slate-900">
                      {formatCurrency(activeCycle.totalStatementToPay)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Saldo del corte + mensualidades MSI
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 backdrop-blur-md shadow-sm">
                    <div className="text-[11px] font-bold text-amber-800 mb-1">
                      Pago Mínimo Sugerido
                    </div>
                    <div className="font-mono text-xl font-bold text-slate-900">
                      {formatCurrency(activeCycle.suggestedMinimumPayment)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Genera altos intereses sobre saldo
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200/80 backdrop-blur-md">
                    <div className="text-[11px] font-bold text-slate-700 mb-1">
                      Tasa de Interés CAT
                    </div>
                    <div className="font-mono text-xl font-bold text-slate-900">
                      {activeCard.annualRate}% <span className="text-xs text-slate-500 font-normal">anual</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      ~{(activeCard.annualRate / 12).toFixed(2)}% mensual aprox.
                    </div>
                  </div>
                </div>

                {/* Credit Limit & Utilization details with QUICK ADJUST BUTTON */}
                <div className="p-5 rounded-2xl bg-slate-100/70 border border-slate-200/80 backdrop-blur-md space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-700 font-semibold">Estado de Línea de Crédito</span>
                      <button
                        onClick={handleOpenQuickLimit}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 transition-all shadow-sm"
                        title="Modificar o ajustar cualquier cantidad en el límite"
                      >
                        <Sliders className="w-3 h-3 text-emerald-600" />
                        <span>Ajustar Límite</span>
                      </button>
                    </div>
                    <span className={`font-bold ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center py-2.5 border-y border-slate-200/80">
                    <div className="group relative">
                      <div className="text-[10px] uppercase text-slate-500 flex items-center justify-center gap-1">
                        <span>Límite Total</span>
                      </div>
                      <div className="font-mono text-base font-bold text-slate-900 mt-0.5">
                        {formatCurrency(activeCard.creditLimit)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-500">Saldo Utilizado</div>
                      <div className="font-mono text-base font-bold text-slate-800 mt-0.5">
                        {formatCurrency(activeCycle.totalUsedBalance)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-500">Disponible</div>
                      <div className="font-mono text-base font-bold text-emerald-700 mt-0.5">
                        {formatCurrency(activeCycle.availableCredit)}
                      </div>
                    </div>
                  </div>

                  {/* Quick Limit Adjustment Drawer/Popover */}
                  {isAdjustLimitOpen && (
                    <div className="p-4 rounded-2xl bg-white border border-emerald-300/80 space-y-3 shadow-md animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          Ajustar límite de crédito a cualquier cantidad:
                        </span>
                        <button
                          onClick={() => setIsAdjustLimitOpen(false)}
                          className="p-1 text-slate-400 hover:text-slate-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={quickLimitInput}
                          onChange={(e) => setQuickLimitInput(e.target.value)}
                          placeholder="Ingresa cualquier monto (ej. 15000, 50000, 1000000)"
                          className="w-full liquid-glass-input rounded-xl pl-8 pr-3 py-2 text-sm font-mono text-slate-900 focus:outline-none"
                        />
                        <DollarSign className="absolute left-2.5 top-2.5 w-4 h-4 text-emerald-600" />
                      </div>

                      {/* Quick preset chips */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-slate-500">Montos rápidos:</span>
                        {[
                          { label: '$0', val: 0 },
                          { label: '$15,000', val: 15000 },
                          { label: '$35,000', val: 35000 },
                          { label: '$60,000', val: 60000 },
                          { label: '$120,000', val: 120000 },
                          { label: '$250,000', val: 250000 },
                          { label: '+$10k', add: 10000 },
                          { label: '+$50k', add: 50000 },
                        ].map((chip, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              if (chip.add !== undefined) {
                                const current = parseFloat(quickLimitInput.replace(/[^0-9.]/g, '')) || 0;
                                setQuickLimitInput((current + chip.add).toString());
                              } else if (chip.val !== undefined) {
                                setQuickLimitInput(chip.val.toString());
                              }
                            }}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-mono text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => setIsAdjustLimitOpen(false)}
                          className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveQuickLimit}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-sm hover:from-emerald-600 transition-all flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Guardar Nuevo Límite</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden p-0.5 border border-slate-300/60">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${status.bgLight}`}
                      style={{ width: `${Math.min(100, utilization)}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-600 italic">
                    💡 {status.advice}
                  </p>
                </div>

                {/* Dinero adentro de la app pero no abonado for this card */}
                {(() => {
                  const cardReservedFunds = (reservedFunds || []).filter(
                    (f) => f.targetCardId === activeCard.id || !f.targetCardId
                  );
                  const cardReservedAmount = cardReservedFunds.reduce((sum, f) => sum + f.amount, 0);
                  const cardStatement = activeCycle?.totalStatementToPay || 0;
                  const cardCoveragePct = cardStatement > 0 
                    ? Math.min(100, Math.round((cardReservedAmount / cardStatement) * 100))
                    : (cardReservedAmount > 0 ? 100 : 0);

                  return (
                    <div className="liquid-glass-card p-5 rounded-2xl border border-cyan-300/80 bg-gradient-to-br from-cyan-50/50 via-white/80 to-white/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                      <div className="space-y-1.5 max-w-md">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-100 border border-cyan-300 text-[11px] font-semibold text-cyan-900">
                          <PiggyBank className="w-3.5 h-3.5 text-cyan-700" />
                          <span>Dinero adentro de la app pero no abonado</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-2xl font-bold text-cyan-800">
                            {formatCurrency(cardReservedAmount)}
                          </span>
                          <span className="text-xs text-slate-500">
                            {cardStatement > 0 ? `(${cardCoveragePct}% del corte cubierto)` : 'disponible en app'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Fondos apartados listos para liquidar {activeCard.bank} en su fecha de pago sin pagar intereses.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => onOpenReservedFunds?.('add', activeCard.id)}
                          className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 text-white transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Apartar Dinero</span>
                        </button>
                        {cardReservedAmount > 0 && (
                          <button
                            onClick={() => onOpenReservedFunds?.('pay', activeCard.id)}
                            className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
                          >
                            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Abonar desde App</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* MSI on this card */}
              <div className="liquid-glass-card p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Meses Sin Intereses en esta Tarjeta
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    {cardInstallments.length} plan(es)
                  </span>
                </div>

                {cardInstallments.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">
                    No tienes planes a Meses Sin Intereses en esta tarjeta.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {cardInstallments.map((plan) => {
                      const pct = Math.round((plan.paidMonths / plan.totalMonths) * 100);
                      return (
                        <div key={plan.id} className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 backdrop-blur-sm space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-900">{plan.description}</span>
                            <span className="font-mono font-bold text-emerald-700">
                              {formatCurrency(plan.monthlyAmount)} / mes
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>Cuota {plan.paidMonths} de {plan.totalMonths}</span>
                            <span>Restan: {formatCurrency(plan.totalAmount - (plan.paidMonths * plan.monthlyAmount))}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden p-0.5 border border-slate-300/60">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-sm" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Transactions on this card */}
              <div className="liquid-glass-card p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Movimientos de esta Tarjeta
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    {cardTransactions.length} registros
                  </span>
                </div>

                {cardTransactions.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">
                    No hay movimientos registrados para esta tarjeta.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200/80">
                    {cardTransactions.slice(0, 8).map((tx) => {
                      const isPayment = tx.type === 'payment';
                      return (
                        <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-semibold text-slate-800">{tx.description}</div>
                            <div className="text-[11px] text-slate-500">
                              {formatDateShort(tx.date)} · {tx.category}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-mono font-bold ${isPayment ? 'text-emerald-700' : 'text-slate-900'}`}>
                              {isPayment ? '-' : '+'}{formatCurrency(tx.amount)}
                            </div>
                            <div className="text-[10px] text-slate-400 uppercase">{tx.type}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
