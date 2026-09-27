import React, { useState, useEffect } from 'react';
import { CreditCard, CardNetwork, CardTheme } from '../../types/creditCard';
import { X, CreditCard as CardIcon, DollarSign, Calendar, Percent, Sparkles, Check } from 'lucide-react';
import { CreditCardVisual } from '../CreditCardVisual';
import { formatCurrency } from '../../utils/creditMath';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaveCard: (card: CreditCard) => void;
  cardToEdit?: CreditCard | null;
}

const THEMES: { id: CardTheme; label: string; colorClass: string }[] = [
  { id: 'liquid', label: 'Liquid Glass Frost', colorClass: 'bg-white/20 border-white/60' },
  { id: 'aurora', label: 'Aurora Liquid Glass', colorClass: 'bg-teal-500/40 border-teal-300' },
  { id: 'obsidian', label: 'Obsidiana Black', colorClass: 'bg-zinc-900 border-zinc-700' },
  { id: 'emerald', label: 'Verde Esmeralda', colorClass: 'bg-emerald-900 border-emerald-600' },
  { id: 'sapphire', label: 'Azul Zafiro', colorClass: 'bg-blue-900 border-blue-600' },
  { id: 'amethyst', label: 'Morado Amatista', colorClass: 'bg-purple-900 border-purple-600' },
  { id: 'titanium', label: 'Titanio Plata', colorClass: 'bg-slate-700 border-slate-500' },
  { id: 'copper', label: 'Cobre / Rose Gold', colorClass: 'bg-amber-900 border-amber-600' },
];

const NETWORKS: { id: CardNetwork; label: string }[] = [
  { id: 'visa', label: 'Visa' },
  { id: 'mastercard', label: 'Mastercard' },
  { id: 'amex', label: 'American Express' },
  { id: 'other', label: 'Otra red' },
];

export const NewCardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSaveCard,
  cardToEdit,
}) => {
  const [bank, setBank] = useState('');
  const [name, setName] = useState('');
  const [network, setNetwork] = useState<CardNetwork>('visa');
  const [lastFourDigits, setLastFourDigits] = useState('');
  const [creditLimit, setCreditLimit] = useState<string>('');
  const [cutOffDay, setCutOffDay] = useState<number>(15);
  const [paymentDueDayOfMonth, setPaymentDueDayOfMonth] = useState<number>(5);
  const [annualRate, setAnnualRate] = useState<string>('48');
  const [theme, setTheme] = useState<CardTheme>('liquid');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (cardToEdit) {
      setBank(cardToEdit.bank);
      setName(cardToEdit.name);
      setNetwork(cardToEdit.network);
      setLastFourDigits(cardToEdit.lastFourDigits);
      setCreditLimit(cardToEdit.creditLimit.toString());
      setCutOffDay(cardToEdit.cutOffDay);
      setPaymentDueDayOfMonth(cardToEdit.paymentDueDayOfMonth || 5);
      setAnnualRate(cardToEdit.annualRate.toString());
      setTheme(cardToEdit.theme || 'liquid');
      setNotes(cardToEdit.notes || '');
    } else {
      setBank('');
      setName('');
      setNetwork('visa');
      setLastFourDigits('');
      setCreditLimit('');
      setCutOffDay(15);
      setPaymentDueDayOfMonth(5);
      setAnnualRate('48');
      setTheme('liquid');
      setNotes('');
    }
  }, [cardToEdit, isOpen]);

  if (!isOpen) return null;

  // Flexible credit limit parsing: allows typing raw numbers, commas, or decimals
  const parseAmount = (val: string): number => {
    if (!val) return 0;
    const clean = val.replace(/[^0-9.]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const parsedLimit = parseAmount(creditLimit);

  const previewCard: CreditCard = {
    id: cardToEdit?.id || 'preview',
    bank: bank || 'Tu Banco',
    name: name || 'Nombre de Tarjeta',
    network,
    lastFourDigits: lastFourDigits.slice(-4) || '••••',
    creditLimit: parsedLimit,
    cutOffDay,
    paymentDueDays: 20,
    paymentDueDayOfMonth,
    annualRate: parseAmount(annualRate),
    theme,
    notes,
    createdAt: cardToEdit?.createdAt || new Date().toISOString(),
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rateNum = parseAmount(annualRate);

    const savedCard: CreditCard = {
      id: cardToEdit ? cardToEdit.id : `card-${Date.now()}`,
      bank: bank.trim(),
      name: name.trim(),
      network,
      lastFourDigits: (lastFourDigits.replace(/\D/g, '').slice(-4) || '0000'),
      creditLimit: parsedLimit,
      cutOffDay: Number(cutOffDay),
      paymentDueDays: 20,
      paymentDueDayOfMonth: Number(paymentDueDayOfMonth),
      annualRate: rateNum,
      theme,
      notes: notes.trim() || undefined,
      createdAt: cardToEdit ? cardToEdit.createdAt : new Date().toISOString(),
    };

    onSaveCard(savedCard);
    onClose();
  };

  const handleSetQuickLimit = (amount: number) => {
    setCreditLimit(amount.toString());
  };

  const handleAddQuickLimit = (delta: number) => {
    const current = parseAmount(creditLimit);
    setCreditLimit((current + delta).toString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl overflow-y-auto">
      {/* Specular ambient liquid glow */}
      <div className="pointer-events-none fixed top-1/3 left-1/3 w-96 h-96 rounded-full bg-emerald-500/10 blur-[130px]" />
      <div className="pointer-events-none fixed bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-cyan-500/10 blur-[120px]" />

      <div className="relative w-full max-w-2xl liquid-glass rounded-3xl p-6 sm:p-7 my-6 shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-semibold text-emerald-300 mb-1 backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Configuración Liquid Glass</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight drop-shadow-sm">
              {cardToEdit ? 'Editar Tarjeta de Crédito' : 'Registrar Nueva Tarjeta'}
            </h2>
            <p className="text-xs text-slate-400">
              Ingresa cualquier cantidad de límite, tus fechas de corte y personaliza su diseño.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 backdrop-blur-md transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Liquid Glass Card Preview */}
        <div className="my-5 flex justify-center">
          <div className="w-full max-w-sm scale-95 origin-top">
            <CreditCardVisual
              card={previewCard}
              usedBalance={0}
              availableCredit={previewCard.creditLimit}
              utilizationRate={0}
              daysToCutoff={15}
              daysToPayment={5}
              showActions={false}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bank & Nickname */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Institución / Banco
              </label>
              <input
                type="text"
                placeholder="Ej. BBVA, Santander, Nu, AMEX, Banorte"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                required
                className="w-full liquid-glass-input rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Nombre o Tipo de Tarjeta
              </label>
              <input
                type="text"
                placeholder="Ej. Platinum, Oro, Rewards, Moradita"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full liquid-glass-input rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Network, Digits & Unlimited Flexible Credit Limit */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Red de Pago
              </label>
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value as CardNetwork)}
                className="w-full liquid-glass-input rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
              >
                {NETWORKS.map((net) => (
                  <option key={net.id} value={net.id} className="bg-slate-900 text-white">
                    {net.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Últimos 4 Dígitos
              </label>
              <input
                type="text"
                maxLength={4}
                placeholder="4590"
                value={lastFourDigits}
                onChange={(e) => setLastFourDigits(e.target.value.replace(/\D/g, ''))}
                required
                className="w-full liquid-glass-input rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-6">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Límite de Crédito (Cualquier Cantidad)
                </label>
                <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                  {formatCurrency(parsedLimit)}
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Cualquier cantidad (ej. 15000, 50000, 1000000, 0)"
                  value={creditLimit}
                  onChange={(e) => {
                    // Accepts raw numbers, commas, or decimals cleanly
                    const val = e.target.value;
                    setCreditLimit(val);
                  }}
                  className="w-full liquid-glass-input rounded-xl pl-8 pr-3 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:outline-none"
                />
                <DollarSign className="absolute left-2.5 top-3 w-4 h-4 text-emerald-400" />
              </div>

              {/* Quick preset buttons for instant amount entry */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-slate-400 mr-1">Rápido:</span>
                {[
                  { label: '$0', val: 0 },
                  { label: '$10k', val: 10000 },
                  { label: '$25k', val: 25000 },
                  { label: '$50k', val: 50000 },
                  { label: '$100k', val: 100000 },
                  { label: '$250k', val: 250000 },
                  { label: '+$10k', add: 10000 },
                  { label: '+$50k', add: 50000 },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (preset.add !== undefined) {
                        handleAddQuickLimit(preset.add);
                      } else if (preset.val !== undefined) {
                        handleSetQuickLimit(preset.val);
                      }
                    }}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-mono text-slate-300 bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 hover:border-emerald-400/40 transition-all hover:text-white"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dates & Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Día de Corte (del mes)
              </label>
              <select
                value={cutOffDay}
                onChange={(e) => setCutOffDay(Number(e.target.value))}
                className="w-full liquid-glass-input rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d} className="bg-slate-900 text-white">
                    Día {d} de cada mes
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Día Límite de Pago
              </label>
              <select
                value={paymentDueDayOfMonth}
                onChange={(e) => setPaymentDueDayOfMonth(Number(e.target.value))}
                className="w-full liquid-glass-input rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d} className="bg-slate-900 text-white">
                    Día {d} del mes siguiente
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Tasa Anual CAT (%)
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="48"
                  value={annualRate}
                  onChange={(e) => setAnnualRate(e.target.value)}
                  required
                  className="w-full liquid-glass-input rounded-xl pl-8 pr-3 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:outline-none"
                />
                <Percent className="absolute left-2.5 top-3 w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Theme selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Color y Acabado de la Tarjeta
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {THEMES.map((th) => (
                <button
                  type="button"
                  key={th.id}
                  onClick={() => setTheme(th.id)}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 text-left text-xs transition-all ${
                    theme === th.id
                      ? 'border-emerald-400 bg-emerald-500/15 ring-1 ring-emerald-400/50 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                      : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-slate-200'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full border shrink-0 ${th.colorClass}`} />
                  <span className="truncate text-[11px] font-medium">{th.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.35)] border border-emerald-300/40 transition-all active:scale-95"
            >
              {cardToEdit ? 'Guardar Cambios' : 'Crear Tarjeta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
