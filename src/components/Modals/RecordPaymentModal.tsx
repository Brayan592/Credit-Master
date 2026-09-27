import React, { useState, useEffect } from 'react';
import { CreditCard, Transaction, CardCycleInfo, ReservedFundItem } from '../../types/creditCard';
import { X, DollarSign, Calendar, ShieldCheck, AlertTriangle, PlusCircle, CreditCard as CardIcon, Sparkles, PiggyBank, Check } from 'lucide-react';
import { formatCurrency } from '../../utils/creditMath';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cards: CreditCard[];
  cycleInfos: Record<string, CardCycleInfo>;
  onRecordPayment: (transaction: Transaction, deductFromReserved?: boolean) => void;
  onOpenNewCard?: () => void;
  defaultCardId?: string;
  reservedFunds?: ReservedFundItem[];
}

export const RecordPaymentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  cards,
  cycleInfos,
  onRecordPayment,
  onOpenNewCard,
  defaultCardId,
  reservedFunds = [],
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string>(defaultCardId || cards[0]?.id || '');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [useReservedFunds, setUseReservedFunds] = useState<boolean>(false);

  const totalReserved = reservedFunds.reduce((sum, item) => sum + item.amount, 0);

  useEffect(() => {
    if (cards.length > 0) {
      if (!selectedCardId || !cards.some((c) => c.id === selectedCardId)) {
        setSelectedCardId(defaultCardId || cards[0].id);
      }
    }
  }, [cards, defaultCardId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      // If user has reserved funds, offer default toggle if appropriate
      if (totalReserved > 0) {
        setUseReservedFunds(true);
      } else {
        setUseReservedFunds(false);
      }
    }
  }, [isOpen, totalReserved]);

  if (!isOpen) return null;

  // Empty state if user has no cards yet
  if (cards.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl">
        <div className="relative w-full max-w-md liquid-glass rounded-3xl p-6 sm:p-7 text-center space-y-4 shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-white/20">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto backdrop-blur-md shadow-inner">
            <CardIcon className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Primero registra una tarjeta</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              No tienes tarjetas de crédito registradas a las cuales abonar. Registra una para comenzar.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl bg-white/[0.04] transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenNewCard?.();
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Registrar Tarjeta Ahora</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = cards.find((c) => c.id === selectedCardId) || cards[0];
  const cycleInfo = currentCard ? cycleInfos[currentCard.id] : undefined;

  const handleSelectPredefined = (val: number) => {
    setAmount(val > 0 ? val.toFixed(2) : '');
  };

  const handleUseAllReserved = () => {
    if (totalReserved > 0) {
      setAmount(totalReserved.toFixed(2));
      setUseReservedFunds(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = amount.replace(/[^0-9.]/g, '');
    const numAmount = parseFloat(clean);
    if (!currentCard || isNaN(numAmount) || numAmount <= 0) return;

    const newTx: Transaction = {
      id: `tx-pay-${Date.now()}`,
      cardId: currentCard.id,
      description: useReservedFunds 
        ? `Abono desde dinero apartado en la app a ${currentCard.bank}`
        : `Abono a tarjeta ${currentCard.bank}`,
      amount: numAmount,
      date,
      category: 'Otro',
      type: 'payment',
      notes: notes.trim() 
        ? (useReservedFunds ? `${notes.trim()} (Descontado de dinero en app)` : notes.trim())
        : (useReservedFunds ? 'Descontado de dinero en app no abonado' : undefined),
    };

    onRecordPayment(newTx, useReservedFunds);
    setAmount('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl overflow-y-auto">
      <div className="relative w-full max-w-lg liquid-glass rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-white/20 my-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-[11px] font-semibold text-emerald-300 mb-1 backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Abono Liquid Glass</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight drop-shadow-sm">Registrar Abono / Pago</h2>
            <p className="text-xs text-slate-300">Paga tu estado de cuenta y libera tu línea de crédito</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 backdrop-blur-md transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feature Banner: Dinero adentro de la app pero no abonado */}
        {totalReserved > 0 && (
          <div className="mt-4 p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                <PiggyBank className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-300 block">Dinero adentro de la app (no abonado):</span>
                <span className="font-mono font-bold text-cyan-300 text-sm">{formatCurrency(totalReserved)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleUseAllReserved}
              className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition-colors shadow-sm whitespace-nowrap"
            >
              Usar saldo en app
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Card selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Tarjeta a Pagar
            </label>
            <select
              value={selectedCardId}
              onChange={(e) => {
                setSelectedCardId(e.target.value);
                setAmount('');
              }}
              required
              className="w-full liquid-glass-input rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
            >
              {cards.map((card) => (
                <option key={card.id} value={card.id} className="bg-slate-900 text-white">
                  {card.bank} - {card.name} (•••• {card.lastFourDigits})
                </option>
              ))}
            </select>
          </div>

          {/* Recommended amounts cards */}
          {cycleInfo && (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSelectPredefined(cycleInfo.totalStatementToPay)}
                className="p-3 text-left rounded-2xl border border-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/20 backdrop-blur-md transition-all group shadow-sm"
              >
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Para No Generar Intereses</span>
                </div>
                <div className="font-mono text-base font-bold text-white group-hover:text-emerald-300">
                  {formatCurrency(cycleInfo.totalStatementToPay)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Recomendado al 100%</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPredefined(cycleInfo.suggestedMinimumPayment)}
                className="p-3 text-left rounded-2xl border border-amber-400/30 bg-amber-500/10 hover:bg-amber-500/20 backdrop-blur-md transition-all group shadow-sm"
              >
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pago Mínimo</span>
                </div>
                <div className="font-mono text-base font-bold text-white group-hover:text-amber-300">
                  {formatCurrency(cycleInfo.suggestedMinimumPayment)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Generará intereses altos</div>
              </button>
            </div>
          )}

          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Monto a Abonar (MXN)
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full liquid-glass-input rounded-xl pl-9 pr-3.5 py-2.5 text-base font-mono font-medium text-white placeholder-slate-500 focus:outline-none"
              />
              <DollarSign className="absolute left-3 top-3 w-4 h-4 text-emerald-400" />
            </div>
          </div>

          {/* Dinero adentro de la app checkbox toggle if available */}
          {totalReserved > 0 && (
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3">
              <label htmlFor="useReserved" className="cursor-pointer text-xs text-slate-200 flex items-center gap-2">
                <input
                  id="useReserved"
                  type="checkbox"
                  checked={useReservedFunds}
                  onChange={(e) => setUseReservedFunds(e.target.checked)}
                  className="rounded border-white/20 text-cyan-400 focus:ring-cyan-400/40 w-4 h-4 bg-slate-900"
                />
                <span>Descontar del <strong>dinero adentro de la app</strong></span>
              </label>
              <span className="text-[11px] font-mono text-cyan-300">
                Disp: {formatCurrency(totalReserved)}
              </span>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Fecha de Pago
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full liquid-glass-input rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none"
              />
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Nota o referencia (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Transferencia SPEI desde cuenta nómina"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full liquid-glass-input rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl bg-white/[0.04] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all active:scale-95"
            >
              Confirmar Abono
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
