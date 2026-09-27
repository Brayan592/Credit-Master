import React, { useState, useEffect } from 'react';
import { CreditCard, Transaction, TransactionCategory, InstallmentPlan } from '../../types/creditCard';
import { X, Calendar, DollarSign, Tag, CreditCard as CardIcon, Split, PlusCircle, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../utils/creditMath';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cards: CreditCard[];
  onAddTransaction: (transaction: Transaction, newPlan?: InstallmentPlan) => void;
  onOpenNewCard?: () => void;
  defaultCardId?: string;
}

const CATEGORIES: TransactionCategory[] = [
  'Supermercado',
  'Restaurantes',
  'Servicios',
  'Entretenimiento',
  'Viajes',
  'Salud',
  'Ropa',
  'Hogar',
  'Tecnología',
  'Transporte',
  'Educación',
  'Otro',
];

export const NewTransactionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  cards,
  onAddTransaction,
  onOpenNewCard,
  defaultCardId,
}) => {
  const [cardId, setCardId] = useState<string>(defaultCardId || cards[0]?.id || '');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<TransactionCategory>('Supermercado');
  const [isMSI, setIsMSI] = useState(false);
  const [totalMonths, setTotalMonths] = useState<number>(12);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (cards.length > 0) {
      if (!cardId || !cards.some((c) => c.id === cardId)) {
        setCardId(defaultCardId || cards[0].id);
      }
    }
  }, [cards, defaultCardId, isOpen]);

  if (!isOpen) return null;

  // Empty state if user has no cards yet
  if (cards.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xl">
        <div className="relative w-full max-w-md liquid-glass rounded-3xl p-6 sm:p-7 text-center space-y-4 shadow-[0_20px_60px_rgba(15,23,42,0.15)] border border-slate-200/90">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto backdrop-blur-md shadow-sm">
            <CardIcon className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Primero registra una tarjeta</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Para registrar gastos o compras a Meses Sin Intereses, necesitas al menos una tarjeta de crédito registrada en tu gestor.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenNewCard?.();
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white transition-all shadow-[0_4px_16px_rgba(16,185,129,0.3)] active:scale-95 hover:from-emerald-600"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Registrar Tarjeta Ahora</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const numAmount = parseFloat(amount.replace(/[^0-9.]/g, '')) || 0;
  const monthlyMSI = isMSI && totalMonths > 0 ? numAmount / totalMonths : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || numAmount <= 0 || !cardId) return;

    const txId = `tx-${Date.now()}`;
    let newPlan: InstallmentPlan | undefined;

    if (isMSI && totalMonths > 1) {
      const planId = `msi-${Date.now()}`;
      newPlan = {
        id: planId,
        cardId,
        description: description.trim(),
        totalAmount: numAmount,
        totalMonths,
        paidMonths: 0,
        monthlyAmount: monthlyMSI,
        startDate: date,
        category,
        notes: notes.trim() || undefined,
      };

      const newTx: Transaction = {
        id: txId,
        cardId,
        description: `${description.trim()} (Compra a ${totalMonths} MSI)`,
        amount: monthlyMSI,
        date,
        category,
        type: 'msi_first_quota',
        installmentPlanId: planId,
        notes: notes.trim() || undefined,
      };

      onAddTransaction(newTx, newPlan);
    } else {
      const newTx: Transaction = {
        id: txId,
        cardId,
        description: description.trim(),
        amount: numAmount,
        date,
        category,
        type: 'expense',
        notes: notes.trim() || undefined,
      };

      onAddTransaction(newTx);
    }

    setDescription('');
    setAmount('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-lg liquid-glass rounded-3xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(15,23,42,0.15)] border border-slate-200/90 my-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800 mb-1 backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Gasto Liquid Glass</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight drop-shadow-sm">Registrar Nuevo Gasto</h2>
            <p className="text-xs text-slate-600">Registra compras corrientes o a Meses Sin Intereses (MSI)</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 backdrop-blur-md transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Card selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Tarjeta Utilizada
            </label>
            <div className="relative">
              <select
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
                required
                className="w-full liquid-glass-input rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none appearance-none"
              >
                {cards.map((card) => (
                  <option key={card.id} value={card.id} className="bg-white text-slate-800">
                    {card.bank} - {card.name} (•••• {card.lastFourDigits})
                  </option>
                ))}
              </select>
              <CardIcon className="absolute right-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Description & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Comercio / Concepto
              </label>
              <input
                type="text"
                placeholder="Ej. Super Chedraui, Gasolina, Cena"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full liquid-glass-input rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Monto Total (MXN)
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full liquid-glass-input rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-mono font-medium text-slate-900 placeholder-slate-400 focus:outline-none"
                />
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Date & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Fecha del Movimiento
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full liquid-glass-input rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-800 focus:outline-none"
                />
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Categoría
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                  className="w-full liquid-glass-input rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none appearance-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-white text-slate-800">
                      {cat}
                    </option>
                  ))}
                </select>
                <Tag className="absolute right-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* MSI Toggle Section */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-white/60 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Split className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-slate-800">¿Compra a Meses Sin Intereses?</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMSI}
                  onChange={(e) => setIsMSI(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {isMSI && (
              <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Plazo en Meses</label>
                  <div className="grid grid-cols-6 gap-2">
                    {[3, 6, 9, 12, 18, 24].map((m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setTotalMonths(m)}
                        className={`py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                          totalMonths === m
                            ? 'bg-emerald-500 text-white border-emerald-600 font-bold shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>

                {numAmount > 0 && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs backdrop-blur-md">
                    <span className="text-emerald-800 font-medium">Mensualidad estimada:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {formatCurrency(monthlyMSI)} / mes
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 rounded-xl shadow-[0_4px_16px_rgba(16,185,129,0.3)] transition-all active:scale-95"
            >
              Guardar Gasto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
