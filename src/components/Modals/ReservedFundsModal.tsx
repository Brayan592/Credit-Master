import React, { useState, useEffect } from 'react';
import { CreditCard, ReservedFundItem, CardCycleInfo } from '../../types/creditCard';
import { formatCurrency } from '../../utils/creditMath';
import { 
  X, 
  PiggyBank, 
  Plus, 
  ShieldCheck, 
  AlertCircle, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  DollarSign,
  ArrowDownRight,
  Wallet,
  Clock,
  Edit2,
  Check
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cards: CreditCard[];
  cycleInfos: Record<string, CardCycleInfo>;
  reservedFunds: ReservedFundItem[];
  onAddReservedFund: (item: ReservedFundItem) => void;
  onUpdateReservedFund?: (item: ReservedFundItem) => void;
  onDeleteReservedFund: (id: string) => void;
  onPayCardFromReserved: (cardId: string, amount: number, fundId?: string) => void;
  initialTab?: 'overview' | 'add' | 'pay';
  defaultCardId?: string;
}

export const ReservedFundsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  cards,
  cycleInfos,
  reservedFunds,
  onAddReservedFund,
  onUpdateReservedFund,
  onDeleteReservedFund,
  onPayCardFromReserved,
  initialTab = 'overview',
  defaultCardId,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'add' | 'pay'>(initialTab);

  // Add form state
  const [addAmount, setAddAmount] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addTargetCardId, setAddTargetCardId] = useState<string>('all');
  const [addNotes, setAddNotes] = useState('');

  // Editing state
  const [editingFundId, setEditingFundId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Pay form state
  const [payCardId, setPayCardId] = useState<string>(defaultCardId || cards[0]?.id || '');
  const [payAmount, setPayAmount] = useState('');
  const [payError, setPayError] = useState<string | null>(null);
  const [paySuccessMessage, setPaySuccessMessage] = useState<string | null>(null);

  // Update activeTab when modal opens with initialTab
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setPayError(null);
      setPaySuccessMessage(null);
      if (defaultCardId && cards.some(c => c.id === defaultCardId)) {
        setPayCardId(defaultCardId);
        setAddTargetCardId(defaultCardId);
      } else if (cards.length > 0 && !cards.some(c => c.id === payCardId)) {
        setPayCardId(cards[0].id);
      }
    }
  }, [isOpen, initialTab, defaultCardId, cards]);

  if (!isOpen) return null;

  const totalReserved = reservedFunds.reduce((sum, item) => sum + item.amount, 0);
  const totalStatementToPay = Object.values(cycleInfos).reduce((sum, info) => sum + info.totalStatementToPay, 0);

  const coveragePct = totalStatementToPay > 0 
    ? Math.min(100, Math.round((totalReserved / totalStatementToPay) * 100))
    : (totalReserved > 0 ? 100 : 0);

  const isFullCovered = totalStatementToPay > 0 && totalReserved >= totalStatementToPay;
  const deficit = Math.max(0, totalStatementToPay - totalReserved);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = addAmount.replace(/[^0-9.]/g, '');
    const num = parseFloat(clean);
    if (isNaN(num) || num <= 0 || !addDescription.trim()) return;

    const newItem: ReservedFundItem = {
      id: `res-${Date.now()}`,
      amount: num,
      description: addDescription.trim(),
      targetCardId: addTargetCardId !== 'all' ? addTargetCardId : undefined,
      date: new Date().toISOString().split('T')[0],
      notes: addNotes.trim() || undefined,
    };

    onAddReservedFund(newItem);
    setAddAmount('');
    setAddDescription('');
    setAddNotes('');
    setActiveTab('overview');
  };

  const handleStartEdit = (item: ReservedFundItem) => {
    setEditingFundId(item.id);
    setEditAmount(item.amount.toString());
    setEditDescription(item.description);
  };

  const handleSaveEdit = (fundId: string) => {
    const clean = editAmount.replace(/[^0-9.]/g, '');
    const num = parseFloat(clean);
    if (isNaN(num) || num <= 0 || !editDescription.trim()) return;

    const existing = reservedFunds.find(f => f.id === fundId);
    if (!existing) return;

    const updated: ReservedFundItem = {
      ...existing,
      amount: num,
      description: editDescription.trim(),
    };

    if (onUpdateReservedFund) {
      onUpdateReservedFund(updated);
    } else {
      // Fallback: delete and add
      onDeleteReservedFund(fundId);
      onAddReservedFund(updated);
    }
    setEditingFundId(null);
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPayError(null);
    const clean = payAmount.replace(/[^0-9.]/g, '');
    const num = parseFloat(clean);

    if (!payCardId) {
      setPayError('Por favor selecciona una tarjeta a la cual abonar.');
      return;
    }
    if (isNaN(num) || num <= 0) {
      setPayError('Por favor ingresa un monto válido mayor a 0.');
      return;
    }
    if (num > totalReserved) {
      setPayError(`El monto a abonar (${formatCurrency(num)}) excede el dinero apartado adentro de la app (${formatCurrency(totalReserved)}).`);
      return;
    }

    onPayCardFromReserved(payCardId, num);
    setPayAmount('');
    const targetCard = cards.find(c => c.id === payCardId);
    setPaySuccessMessage(`¡Abono de ${formatCurrency(num)} aplicado con éxito a ${targetCard?.bank || 'la tarjeta'} y descontado del dinero en la app!`);
    setTimeout(() => {
      setPaySuccessMessage(null);
      setActiveTab('overview');
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl overflow-y-auto">
      {/* Specular ambient fluid background glow */}
      <div className="pointer-events-none fixed top-1/4 left-1/3 w-96 h-96 rounded-full bg-cyan-500/10 blur-[130px]" />
      <div className="pointer-events-none fixed bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-emerald-500/10 blur-[120px]" />

      <div className="relative w-full max-w-2xl liquid-glass rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-white/20 my-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-[11px] font-semibold text-cyan-300 mb-1 backdrop-blur-md">
              <PiggyBank className="w-3.5 h-3.5 text-cyan-400" />
              <span>Control de Fondos y Reservas</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight drop-shadow-sm flex items-center gap-2">
              <span>Dinero adentro de la app pero no abonado</span>
            </h2>
            <p className="text-xs text-slate-300">
              Dinero que guardas o apartas para cubrir tus tarjetas en la fecha ideal de pago sin pagar intereses.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 backdrop-blur-md transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Metric Summary */}
        <div className="my-5 p-5 rounded-3xl bg-gradient-to-br from-cyan-950/40 via-slate-900/60 to-slate-950/80 border border-cyan-400/30 backdrop-blur-xl space-y-4 shadow-[0_12px_30px_rgba(6,182,212,0.15)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-cyan-300 font-semibold">
                Dinero adentro de la app pero no abonado
              </span>
              <div className="font-mono text-3xl font-bold text-cyan-300 mt-0.5 tracking-tight drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                {formatCurrency(totalReserved)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setPayError(null);
                  setActiveTab('add');
                }}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-400 to-teal-300 text-slate-950 hover:from-cyan-300 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-1.5 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Apartar Dinero</span>
              </button>
              {totalReserved > 0 && cards.length > 0 && (
                <button
                  onClick={() => {
                    setPayError(null);
                    setPayCardId(cards[0].id);
                    const st = cycleInfos[cards[0].id]?.totalStatementToPay || 0;
                    setPayAmount(Math.min(totalReserved, st > 0 ? st : totalReserved).toString());
                    setActiveTab('pay');
                  }}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 hover:from-emerald-300 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-1.5 active:scale-95"
                >
                  <ArrowDownRight className="w-4 h-4" />
                  <span>Abonar a Tarjeta</span>
                </button>
              )}
            </div>
          </div>

          {/* Coverage Bar vs Total to Pay */}
          <div className="pt-3 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">
                Total para no generar intereses al corte: <strong className="text-white font-mono">{formatCurrency(totalStatementToPay)}</strong>
              </span>
              <span className={`font-semibold ${isFullCovered ? 'text-emerald-300' : 'text-amber-300'}`}>
                {isFullCovered ? '✓ 100% Cubierto' : `${coveragePct}% cubierto`}
              </span>
            </div>

            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isFullCovered
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-300 shadow-[0_0_10px_rgba(52,211,153,0.5)]'
                    : 'bg-gradient-to-r from-cyan-400 to-amber-300 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                }`}
                style={{ width: `${Math.min(100, coveragePct)}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-300 italic">
              {isFullCovered
                ? '💡 ¡Excelente cobertura! Tienes suficiente dinero adentro de la app para liquidar tus tarjetas en la fecha de pago sin pagar un solo peso de interés.'
                : totalStatementToPay > 0
                ? `💡 Tienes apartado parte de tu saldo. Te faltan ${formatCurrency(deficit)} para tener el 100% cubierto antes del límite.`
                : '💡 No tienes saldo pendiente al corte. El dinero adentro de la app está disponible para tus futuros gastos o compras.'}
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/10 mb-4">
          <button
            onClick={() => {
              setPayError(null);
              setActiveTab('overview');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'overview'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Apartados Registrados ({reservedFunds.length})
          </button>
          <button
            onClick={() => {
              setPayError(null);
              setActiveTab('add');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'add'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            + Apartar Más Dinero
          </button>
          {totalReserved > 0 && cards.length > 0 && (
            <button
              onClick={() => {
                setPayError(null);
                setActiveTab('pay');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'pay'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Abonar a Tarjeta
            </button>
          )}
        </div>

        {/* Success Message Banner */}
        {paySuccessMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{paySuccessMessage}</span>
          </div>
        )}

        {/* Content based on Active Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-3">
            {reservedFunds.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-white/10 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 flex items-center justify-center mx-auto">
                  <PiggyBank className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    No hay dinero apartado en la app actualmente
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                    Aparta dinero de tu nómina, ahorros o rendimientos dentro de la app para asegurar el pago puntual de tus tarjetas sin descapitalizarte.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('add')}
                  className="mt-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-400 to-teal-300 text-slate-950 hover:from-cyan-300 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] inline-flex items-center gap-1.5 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Apartar mi primer monto</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {reservedFunds.map((item) => {
                  const targetCard = cards.find((c) => c.id === item.targetCardId);
                  const isEditing = editingFundId === item.id;

                  if (isEditing) {
                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl bg-white/[0.06] border border-cyan-400/40 space-y-2 backdrop-blur-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Descripción"
                            className="flex-1 liquid-glass-input rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                          <input
                            type="text"
                            inputMode="decimal"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            placeholder="Monto"
                            className="w-28 liquid-glass-input rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-300"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingFundId(null)}
                            className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-white"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(item.id)}
                            className="px-3 py-1 text-[11px] font-bold rounded-lg bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3 hover:border-white/20 transition-all backdrop-blur-sm group"
                    >
                      <div className="space-y-0.5">
                        <div className="text-sm font-semibold text-white">{item.description}</div>
                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                          <span className="text-slate-300">
                            {targetCard ? `Para: ${targetCard.bank} (${targetCard.name})` : 'Fondo General'}
                          </span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {item.date}
                          </span>
                          {item.notes && (
                            <>
                              <span>·</span>
                              <span className="italic text-slate-400">{item.notes}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-cyan-300">
                          {formatCurrency(item.amount)}
                        </span>
                        <button
                          onClick={() => handleStartEdit(item)}
                          title="Editar monto o descripción"
                          className="p-1.5 text-slate-500 hover:text-cyan-300 rounded-xl hover:bg-white/[0.05] transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteReservedFund(item.id)}
                          title="Eliminar apartado"
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Add Tab */}
        {activeTab === 'add' && (
          <form onSubmit={handleAddSubmit} className="space-y-4 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Concepto / Origen del Dinero
              </label>
              <input
                type="text"
                placeholder="Ej. Quincena apartada para pago, Rendimiento cajita Nu, Ahorro quincenal"
                value={addDescription}
                onChange={(e) => setAddDescription(e.target.value)}
                required
                className="w-full liquid-glass-input rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Monto a Apartar (Cualquier cantidad)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    required
                    className="w-full liquid-glass-input rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:outline-none"
                  />
                  <DollarSign className="absolute left-3 top-3 w-4 h-4 text-cyan-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Tarjeta Destino (Opcional)
                </label>
                <select
                  value={addTargetCardId}
                  onChange={(e) => setAddTargetCardId(e.target.value)}
                  className="w-full liquid-glass-input rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                >
                  <option value="all" className="bg-slate-900 text-white">Fondo General (Cualquier tarjeta)</option>
                  {cards.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                      {c.bank} {c.name} (•••• {c.lastFourDigits})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick amount presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400">Montos sugeridos:</span>
              {[500, 1000, 2500, 5000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAddAmount(val.toString())}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/10 transition-colors"
                >
                  +{formatCurrency(val)}
                </button>
              ))}
              {deficit > 0 && (
                <button
                  type="button"
                  onClick={() => setAddAmount(deficit.toFixed(2))}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/30 transition-colors"
                >
                  Completar corte ({formatCurrency(deficit)})
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Nota o Ubicación Real (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. Guardado en Cajita Nu al 13.5% / Cuenta de nómina / CETES"
                value={addNotes}
                onChange={(e) => setAddNotes(e.target.value)}
                className="w-full liquid-glass-input rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl bg-white/[0.04] transition-colors"
              >
                Volver
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-400 to-teal-300 text-slate-950 hover:from-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all active:scale-95"
              >
                Guardar Dinero en la App
              </button>
            </div>
          </form>
        )}

        {/* Pay Tab */}
        {activeTab === 'pay' && (
          <form onSubmit={handlePaySubmit} className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 text-xs text-emerald-200 space-y-1">
              <span className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Abonar con dinero apartado adentro de la app
              </span>
              <p className="text-[11px] text-emerald-300/80">
                Al confirmar, se registrará el pago oficial en la tarjeta seleccionada y se descontará del dinero que tienes en la app.
              </p>
            </div>

            {payError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{payError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Tarjeta a la que vas a abonar
              </label>
              <select
                value={payCardId}
                onChange={(e) => {
                  setPayCardId(e.target.value);
                  const st = cycleInfos[e.target.value]?.totalStatementToPay || 0;
                  setPayAmount(Math.min(totalReserved, st > 0 ? st : totalReserved).toString());
                }}
                className="w-full liquid-glass-input rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
              >
                {cards.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    {c.bank} {c.name} (Saldo corte: {formatCurrency(cycleInfos[c.id]?.totalStatementToPay || 0)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Monto a Abonar (MXN)
                </label>
                <span className="text-[11px] font-mono text-cyan-300">
                  Disponible en app: {formatCurrency(totalReserved)}
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={payAmount}
                  onChange={(e) => {
                    setPayAmount(e.target.value);
                    setPayError(null);
                  }}
                  required
                  className="w-full liquid-glass-input rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:outline-none"
                />
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-emerald-400" />
              </div>
            </div>

            {/* Quick payment options for this card */}
            {payCardId && cycleInfos[payCardId] && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] text-slate-400">Atajos:</span>
                <button
                  type="button"
                  onClick={() => {
                    const st = cycleInfos[payCardId].totalStatementToPay;
                    setPayAmount(Math.min(totalReserved, st).toString());
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-400/30 transition-colors"
                >
                  Saldo para no generar intereses ({formatCurrency(cycleInfos[payCardId].totalStatementToPay)})
                </button>
                <button
                  type="button"
                  onClick={() => setPayAmount(totalReserved.toString())}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/10 transition-colors"
                >
                  Abonar todo lo apartado ({formatCurrency(totalReserved)})
                </button>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setPayError(null);
                  setActiveTab('overview');
                }}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl bg-white/[0.04] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 hover:from-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all active:scale-95"
              >
                Confirmar Abono y Descontar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
