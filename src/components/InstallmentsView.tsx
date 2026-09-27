import React, { useState } from 'react';
import { InstallmentPlan, CreditCard, TransactionCategory } from '../types/creditCard';
import { formatCurrency, calculate12MonthForecast } from '../utils/creditMath';
import { 
  Split, 
  Calendar, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  TrendingDown, 
  ChevronRight, 
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface Props {
  installmentPlans: InstallmentPlan[];
  cards: CreditCard[];
  onAddPlan: (plan: InstallmentPlan) => void;
  onUpdatePlan: (plan: InstallmentPlan) => void;
  onDeletePlan: (planId: string) => void;
  onOpenNewCard?: () => void;
}

export const InstallmentsView: React.FC<Props> = ({
  installmentPlans,
  cards,
  onAddPlan,
  onUpdatePlan,
  onDeletePlan,
  onOpenNewCard,
}) => {
  const [filterCardId, setFilterCardId] = useState<string>('all');
  const [showFinished, setShowFinished] = useState<boolean>(false);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form state for creating a standalone MSI plan
  const [newDesc, setNewDesc] = useState('');
  const [newCardId, setNewCardId] = useState(cards[0]?.id || '');
  const [newAmount, setNewAmount] = useState('');
  const [newMonths, setNewMonths] = useState(12);
  const [newCategory, setNewCategory] = useState<TransactionCategory>('Tecnología');

  const filteredPlans = installmentPlans.filter((p) => {
    if (filterCardId !== 'all' && p.cardId !== filterCardId) return false;
    if (!showFinished && p.paidMonths >= p.totalMonths) return false;
    return true;
  });

  const activePlans = installmentPlans.filter((p) => p.paidMonths < p.totalMonths);
  const totalMonthlyCommitment = activePlans.reduce((sum, p) => sum + p.monthlyAmount, 0);
  const totalRemainingDebt = activePlans.reduce(
    (sum, p) => sum + (p.totalAmount - p.paidMonths * p.monthlyAmount),
    0
  );

  const forecast = calculate12MonthForecast(installmentPlans);
  const maxForecastVal = Math.max(...forecast.map((f) => f.totalAmount), 1);

  const handleAdvanceMonth = (plan: InstallmentPlan) => {
    if (plan.paidMonths < plan.totalMonths) {
      onUpdatePlan({
        ...plan,
        paidMonths: plan.paidMonths + 1,
      });
    }
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newAmount);
    if (!newDesc.trim() || isNaN(amountNum) || amountNum <= 0 || !newCardId) return;

    const newPlan: InstallmentPlan = {
      id: `msi-${Date.now()}`,
      cardId: newCardId,
      description: newDesc.trim(),
      totalAmount: amountNum,
      totalMonths: newMonths,
      paidMonths: 0,
      monthlyAmount: amountNum / newMonths,
      startDate: new Date().toISOString().split('T')[0],
      category: newCategory,
    };

    onAddPlan(newPlan);
    setNewDesc('');
    setNewAmount('');
    setIsAddingNew(false);
  };

  const handleOpenAdd = () => {
    if (cards.length === 0) {
      onOpenNewCard?.();
    } else {
      setIsAddingNew(true);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Control de Meses Sin Intereses (MSI)
          </h1>
          <p className="text-xs text-slate-600">
            Monitorea el total comprometido de tu sueldo mensual y proyecta cuándo terminarás de pagar.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white transition-all shadow-[0_4px_16px_rgba(16,185,129,0.35)] border border-emerald-400/40 active:scale-95"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>{cards.length === 0 ? 'Registrar Tarjeta Primero' : 'Agregar Plan MSI'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="liquid-glass-card p-5 rounded-3xl relative overflow-hidden group">
          <div className="text-xs text-slate-500 mb-1">Mensualidad Total Comprometida</div>
          <div className="font-mono text-2xl font-bold text-slate-900 tracking-tight">
            {formatCurrency(totalMonthlyCommitment)} <span className="text-xs text-slate-500 font-normal">/ mes</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Monto fijo que debes cubrir cada mes por diferidos.
          </div>
        </div>

        <div className="liquid-glass-card p-5 rounded-3xl relative overflow-hidden group">
          <div className="text-xs text-slate-500 mb-1">Deuda Pendiente en MSI</div>
          <div className="font-mono text-2xl font-bold text-amber-700 tracking-tight">
            {formatCurrency(totalRemainingDebt)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Saldo que aún retiene la línea de tus tarjetas.
          </div>
        </div>

        <div className="liquid-glass-card p-5 rounded-3xl relative overflow-hidden group">
          <div className="text-xs text-slate-500 mb-1">Planes MSI Activos</div>
          <div className="font-mono text-2xl font-bold text-emerald-700 tracking-tight">
            {activePlans.length} compras
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Divididas entre tus tarjetas bancarias.
          </div>
        </div>
      </div>

      {/* 12-Month Projection Visualizer */}
      <div className="liquid-glass-card p-6 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Proyección de Compromiso a 12 Meses
            </h3>
            <p className="text-xs text-slate-500">
              Observa cómo se liberará tu flujo de efectivo a medida que termines de pagar cada plan
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 backdrop-blur-md shadow-sm">
            <TrendingDown className="w-4 h-4 text-emerald-600" />
            <span>Liberación progresiva</span>
          </div>
        </div>

        {/* Projection bar chart */}
        <div className="pt-6 pb-2">
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 h-40 items-end">
            {forecast.map((f, i) => {
              const heightPct = Math.max(12, Math.round((f.totalAmount / maxForecastVal) * 100));
              return (
                <div key={i} className="flex flex-col items-center h-full justify-end group">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-1 pointer-events-none text-center">
                    <span className="font-mono text-[10px] font-bold text-white bg-slate-900 px-2 py-0.5 rounded-lg shadow-lg">
                      {formatCurrency(f.totalAmount)}
                    </span>
                  </div>

                  <div
                    className={`w-full rounded-t-xl transition-all duration-300 ${
                      i === 0
                        ? 'bg-gradient-to-t from-emerald-500 to-teal-500 shadow-sm'
                        : f.totalAmount > 0
                        ? 'bg-slate-200 group-hover:bg-emerald-300'
                        : 'bg-slate-100'
                    }`}
                    style={{ height: `${f.totalAmount > 0 ? heightPct : 6}%` }}
                  />

                  <div className="mt-2 text-[10px] font-medium text-slate-600 group-hover:text-slate-900 truncate">
                    {f.monthLabel}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add New Plan Inline Form if open */}
      {isAddingNew && (
        <form
          onSubmit={handleCreatePlan}
          className="liquid-glass-card p-6 sm:p-7 rounded-3xl border border-emerald-300/80 space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Nuevo Plan a Meses Sin Intereses</h3>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Descripción / Producto</label>
              <input
                type="text"
                placeholder="Ej. iPhone 16 Pro, Vuelo París"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                required
                className="w-full liquid-glass-input rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Tarjeta</label>
              <select
                value={newCardId}
                onChange={(e) => setNewCardId(e.target.value)}
                className="w-full liquid-glass-input rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none"
              >
                {cards.map((c) => (
                  <option key={c.id} value={c.id} className="bg-white text-slate-900">
                    {c.bank} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Monto Total</label>
              <input
                type="number"
                step="0.01"
                placeholder="12000"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                required
                className="w-full liquid-glass-input rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Meses (Plazo)</label>
              <select
                value={newMonths}
                onChange={(e) => setNewMonths(Number(e.target.value))}
                className="w-full liquid-glass-input rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none"
              >
                {[3, 6, 9, 12, 18, 24].map((m) => (
                  <option key={m} value={m} className="bg-white text-slate-900">
                    {m} meses ({formatCurrency(parseFloat(newAmount) ? parseFloat(newAmount) / m : 0)}/m)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/80">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 rounded-xl bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 shadow-md transition-all"
            >
              Guardar Plan
            </button>
          </div>
        </form>
      )}

      {/* Plans List Table / Cards */}
      <div className="liquid-glass-card p-6 sm:p-7 rounded-3xl space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Filtrar por tarjeta:</span>
            <select
              value={filterCardId}
              onChange={(e) => setFilterCardId(e.target.value)}
              className="liquid-glass-input rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
            >
              <option value="all" className="bg-white text-slate-900">Todas las tarjetas</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id} className="bg-white text-slate-900">
                  {c.bank} {c.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showFinished}
              onChange={(e) => setShowFinished(e.target.checked)}
              className="rounded bg-white border-slate-300 text-emerald-600 focus:ring-0"
            />
            <span>Mostrar compras ya liquidadas (100% pagadas)</span>
          </label>
        </div>

        {filteredPlans.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Split className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-700">
              {cards.length === 0 ? 'No hay tarjetas registradas' : 'No tienes compras a Meses Sin Intereses registradas'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {cards.length === 0
                ? 'Primero registra una tarjeta de crédito para poder asignar tus compras a plazos sin intereses.'
                : 'Registra tus compras diferidas (a 3, 6, 12, 18 o 24 meses) para dar seguimiento a cada mensualidad.'}
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-5 py-2.5 text-xs font-bold rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 transition-all shadow-md"
            >
              {cards.length === 0 ? 'Registrar Primera Tarjeta' : 'Agregar Primera Compra a MSI'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPlans.map((plan) => {
              const card = cards.find((c) => c.id === plan.cardId);
              const progressPct = Math.round((plan.paidMonths / plan.totalMonths) * 100);
              const isFinished = plan.paidMonths >= plan.totalMonths;
              const remainingAmount = plan.totalAmount - plan.paidMonths * plan.monthlyAmount;

              return (
                <div
                  key={plan.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isFinished
                      ? 'bg-slate-50/70 border-slate-200 opacity-70'
                      : 'bg-white/80 border-slate-200/80 hover:border-slate-300 backdrop-blur-sm'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{plan.description}</span>
                        {isFinished && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300">
                            Completado
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span>{card ? `${card.bank} (••${card.lastFourDigits})` : 'Tarjeta'}</span>
                        <span>·</span>
                        <span>{plan.category}</span>
                        <span>·</span>
                        <span>Total: {formatCurrency(plan.totalAmount)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-mono text-base font-bold text-slate-900">
                          {formatCurrency(plan.monthlyAmount)}{' '}
                          <span className="text-xs text-slate-500 font-normal">/ mes</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {isFinished
                            ? 'Liquidado'
                            : `Resta: ${formatCurrency(remainingAmount)}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isFinished && (
                          <button
                            onClick={() => handleAdvanceMonth(plan)}
                            title="Registrar una cuota pagada (+1 mes)"
                            className="p-2 text-slate-600 hover:text-emerald-700 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 backdrop-blur-md transition-all shadow-sm"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </button>
                        )}
                        <button
                          onClick={() => onDeletePlan(plan.id)}
                          title="Eliminar plan"
                          className="p-2 text-rose-500 hover:text-rose-700 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 backdrop-blur-md transition-all shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        Cuota {plan.paidMonths} de {plan.totalMonths} meses
                      </span>
                      <span className="font-mono font-bold text-emerald-700">{progressPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden p-0.5 border border-slate-300/60">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isFinished ? 'bg-slate-400' : 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
