import React from 'react';
import { CreditCard, CardCycleInfo } from '../types/creditCard';
import { formatDateShort, formatCurrency } from '../utils/creditMath';
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  CreditCard as CardIcon,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

interface Props {
  cards: CreditCard[];
  cycleInfos: Record<string, CardCycleInfo>;
  onOpenNewPayment: (cardId: string) => void;
  onOpenNewExpense: (cardId: string) => void;
  onOpenNewCard?: () => void;
}

export const CalendarCycleView: React.FC<Props> = ({
  cards,
  cycleInfos,
  onOpenNewPayment,
  onOpenNewExpense,
  onOpenNewCard,
}) => {
  // Sort cards by urgency of payment date
  const sortedByPayment = [...cards].sort((a, b) => {
    const daysA = cycleInfos[a.id]?.daysToPayment ?? 999;
    const daysB = cycleInfos[b.id]?.daysToPayment ?? 999;
    return daysA - daysB;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 mb-2 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Línea de Tiempo Liquid Glass</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight drop-shadow-sm">
          Calendario de Cortes y Fechas de Pago
        </h1>
        <p className="text-xs text-slate-600">
          Planifica tus compras y pagos para no pagar un solo peso de interés bancario y aprovechar hasta 50 días de financiamiento gratuito.
        </p>
      </div>

      {/* Cards Cycle Status Timeline */}
      {cards.length === 0 ? (
        <div className="liquid-glass-card p-12 rounded-3xl border border-slate-200/80 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center mx-auto backdrop-blur-md shadow-sm">
            <Calendar className="w-7 h-7 text-emerald-600" />
          </div>
          <h4 className="text-base font-bold text-slate-900">No hay tarjetas registradas en el calendario</h4>
          <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
            Registra tu primera tarjeta indicando tu día de corte y día de pago para visualizar tus períodos de gracia y cuentas regresivas.
          </p>
          <button
            onClick={onOpenNewCard}
            className="px-6 py-3 text-xs font-bold rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 text-white shadow-[0_4px_16px_rgba(16,185,129,0.3)] transition-all active:scale-95"
          >
            Registrar Primera Tarjeta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedByPayment.map((card) => {
            const info = cycleInfos[card.id];
            if (!info) return null;

            const isPaymentUrgent = info.daysToPayment <= 5;
            const isGoldenWindow = info.daysToCutoff >= 25; // Just cut off recently!

            return (
              <div
                key={card.id}
                className={`liquid-glass-card p-6 sm:p-7 rounded-3xl space-y-5 transition-all ${
                  isPaymentUrgent && info.totalStatementToPay > 0
                    ? 'border-rose-400/80 shadow-[0_4px_24px_rgba(244,63,94,0.15)] bg-rose-50/30'
                    : isGoldenWindow
                    ? 'border-emerald-400/80 shadow-[0_4px_24px_rgba(16,185,129,0.15)] bg-emerald-50/20'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Card Title & Network */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 backdrop-blur-md shadow-sm">
                      <CardIcon className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                        {card.bank} {card.name}
                      </h3>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Terminación •••• {card.lastFourDigits}
                      </div>
                    </div>
                  </div>

                  {isGoldenWindow ? (
                    <span className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 border border-emerald-300 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Ventana Óptima</span>
                    </span>
                  ) : isPaymentUrgent && info.totalStatementToPay > 0 ? (
                    <span className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 animate-pulse shadow-sm">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>¡Pagar Pronto!</span>
                    </span>
                  ) : null}
                </div>

                {/* Cycle timeline */}
                <div className="py-2 space-y-4">
                  {/* Cutoff Date */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <div>
                        <div className="text-slate-800 font-medium">Día de Corte</div>
                        <div className="text-[11px] text-slate-500">
                          {formatDateShort(info.nextCycleCutoff)} (día {card.cutOffDay} de cada mes)
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-semibold text-emerald-700">
                        en {info.daysToCutoff} días
                      </span>
                    </div>
                  </div>

                  {/* Progress bar between cycles */}
                  <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden p-0.5 border border-slate-300/60 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full shadow-sm"
                      style={{ width: `${Math.max(5, ((30 - info.daysToCutoff) / 30) * 100)}%` }}
                    />
                  </div>

                  {/* Payment Due Date */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <div>
                        <div className="text-slate-800 font-medium">Fecha Límite de Pago</div>
                        <div className="text-[11px] text-slate-500">
                          {formatDateShort(info.paymentDueDate)} ({card.paymentDueDayOfMonth ? `día ${card.paymentDueDayOfMonth}` : '20 días post-corte'})
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-mono text-xs font-bold ${
                          isPaymentUrgent ? 'text-rose-600' : 'text-slate-700'
                        }`}
                      >
                        en {info.daysToPayment} días
                      </span>
                    </div>
                  </div>
                </div>

                {/* Statement Due Amount & Quick Action */}
                <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total a pagar ciclo:</div>
                    <div className="font-mono text-base font-bold text-slate-900">
                      {formatCurrency(info.totalStatementToPay)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenNewExpense(card.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-sm"
                    >
                      Comprar
                    </button>
                    <button
                      onClick={() => onOpenNewPayment(card.id)}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 rounded-xl shadow-[0_2px_10px_rgba(16,185,129,0.3)] transition-all"
                    >
                      Abonar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Financial Masterclass Guide: How Credit Card Cycles Work */}
      <div className="liquid-glass-card p-6 sm:p-7 rounded-3xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
          <HelpCircle className="w-4 h-4 text-emerald-600" />
          <span>Estrategia Maestra: Cómo Financiarte 50 Días Gratis</span>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight drop-shadow-sm">
          La Regla de Oro del Día Después del Corte
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 backdrop-blur-md space-y-1.5 shadow-sm">
            <div className="text-xs font-bold text-emerald-800">Paso 1: Fecha de Corte</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Es el día en que el banco emite tu estado de cuenta y suma todos los consumos de los últimos 30 días.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 backdrop-blur-md space-y-1.5 shadow-sm">
            <div className="text-xs font-bold text-cyan-800">Paso 2: Compra Estratégica</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Si compras al día siguiente de tu corte, esa compra entrará en el estado de cuenta del <em>siguiente</em> mes (~30 días después).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 backdrop-blur-md space-y-1.5 shadow-sm">
            <div className="text-xs font-bold text-indigo-800">Paso 3: Periodo de Gracia</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tras el corte tienes otros 20 días para pagar. En total disfrutas de hasta <strong>50 días de crédito a costo cero</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
