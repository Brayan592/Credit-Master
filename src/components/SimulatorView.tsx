import React, { useState } from 'react';
import { CreditCard, CardCycleInfo } from '../types/creditCard';
import { formatCurrency, simulateDebtPayoff, SimulationResult } from '../utils/creditMath';
import { 
  Calculator, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  Sparkles, 
  DollarSign, 
  Percent, 
  ArrowRight,
  PiggyBank
} from 'lucide-react';

interface Props {
  cards: CreditCard[];
  cycleInfos: Record<string, CardCycleInfo>;
}

export const SimulatorView: React.FC<Props> = ({ cards, cycleInfos }) => {
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || '');
  const [customBalance, setCustomBalance] = useState<string>('');
  const [customRate, setCustomRate] = useState<string>('');
  const [customPaymentAmount, setCustomPaymentAmount] = useState<string>('2000');

  const selectedCard = cards.find((c) => c.id === selectedCardId) || cards[0];
  const cycleInfo = selectedCard ? cycleInfos[selectedCard.id] : undefined;

  // Balance and rate to simulate: clean 0 if no cards and no custom entry
  const defaultBaseBalance = cycleInfo?.totalStatementToPay || (selectedCard ? selectedCard.creditLimit * 0.3 : 0);
  const balance = customBalance !== '' 
    ? (parseFloat(customBalance) || 0)
    : defaultBaseBalance;

  const rate = customRate !== ''
    ? (parseFloat(customRate) || 0)
    : (selectedCard?.annualRate || 48);

  const customPayment = parseFloat(customPaymentAmount) || (balance > 0 ? balance * 0.15 : 500);

  // Simulations
  const totalSim = simulateDebtPayoff(balance, rate, 'total');
  const minimumSim = simulateDebtPayoff(balance, rate, 'minimum');
  const customSim = simulateDebtPayoff(balance, rate, 'custom', customPayment);

  // Savings comparison: custom vs minimum
  const interestSaved = Math.max(0, minimumSim.totalInterestPaid - customSim.totalInterestPaid);
  const monthsSaved = Math.max(0, minimumSim.monthsToPayOff - customSim.monthsToPayOff);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-semibold text-emerald-300 mb-2 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Simulador Financiero Liquid Glass</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight drop-shadow-sm">
          Simulador de Pagos e Intereses Bancarios
        </h1>
        <p className="text-xs text-slate-300">
          Descubre el impacto real entre pagar el mínimo vs pagar para no generar intereses o abonar una cantidad estratégica.
        </p>
      </div>

      {/* Simulator Inputs Card */}
      <div className="liquid-glass-card p-6 sm:p-7 rounded-3xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
          <Calculator className="w-4 h-4 text-emerald-400" />
          <span>Parámetros de Simulación</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card Select or Custom */}
          <div>
            <label className="block text-xs text-slate-300 mb-1.5 font-semibold uppercase tracking-wider">Tarjeta Base</label>
            <select
              value={selectedCardId}
              onChange={(e) => {
                setSelectedCardId(e.target.value);
                setCustomBalance('');
                setCustomRate('');
              }}
              className="w-full liquid-glass-input rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
            >
              {cards.length === 0 ? (
                <option value="" className="bg-slate-900 text-white">Simulación Libre (Ingresa monto y tasa)</option>
              ) : (
                <>
                  <option value="" className="bg-slate-900 text-white">Simulación Libre Personalizada</option>
                  {cards.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                      {c.bank} {c.name} (Tasa {c.annualRate}%)
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Balance */}
          <div>
            <label className="block text-xs text-slate-300 mb-1.5 font-semibold uppercase tracking-wider">Deuda o Saldo a Simular (MXN)</label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                placeholder={balance.toString()}
                value={customBalance}
                onChange={(e) => setCustomBalance(e.target.value)}
                className="w-full liquid-glass-input rounded-xl pl-8 pr-3 py-2 text-sm font-mono text-white placeholder-slate-500 focus:outline-none"
              />
              <DollarSign className="absolute left-2.5 top-2.5 w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Saldo actual tarjeta: {formatCurrency(cycleInfo?.totalStatementToPay || 0)}
            </div>
          </div>

          {/* Annual rate */}
          <div>
            <label className="block text-xs text-slate-300 mb-1.5 font-semibold uppercase tracking-wider">Tasa Anual CAT (%)</label>
            <div className="relative">
              <input
                type="number"
                step="1"
                placeholder={rate.toString()}
                value={customRate}
                onChange={(e) => setCustomRate(e.target.value)}
                className="w-full liquid-glass-input rounded-xl pl-8 pr-3 py-2 text-sm font-mono text-white placeholder-slate-500 focus:outline-none"
              />
              <Percent className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Promedio en México: 45% - 70% anual
            </div>
          </div>
        </div>
      </div>

      {/* 3 Strategies Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Strategy 1: Totalero */}
        <div className="liquid-glass-card p-6 rounded-3xl border border-emerald-400/40 space-y-4 relative shadow-[0_12px_40px_rgba(16,185,129,0.15)]">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white tracking-tight drop-shadow-sm">Pago Totalero</h3>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
              Ideal
            </span>
          </div>

          <p className="text-xs text-slate-300">
            Pagas el total de tu estado de cuenta antes de la fecha límite.
          </p>

          <div className="space-y-3 py-3 border-y border-white/10 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Intereses pagados:</span>
              <span className="font-mono font-bold text-emerald-300 text-sm">$0.00 MXN</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tiempo de liquidación:</span>
              <span className="font-mono font-bold text-white">1 mes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Desembolso total:</span>
              <span className="font-mono font-bold text-white">{formatCurrency(balance)}</span>
            </div>
          </div>

          <div className="text-[11px] text-emerald-300 bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 backdrop-blur-md">
            ✓ Tu historial crediticio se mantiene impecable y disfrutas financiamiento sin costo bancario.
          </div>
        </div>

        {/* Strategy 2: Pago Mínimo */}
        <div className="liquid-glass-card p-6 rounded-3xl border border-rose-500/40 space-y-4 relative shadow-[0_12px_40px_rgba(244,63,94,0.15)]">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <h3 className="text-base font-bold text-white tracking-tight drop-shadow-sm">Solo Pago Mínimo</h3>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
              Peligro
            </span>
          </div>

          <p className="text-xs text-slate-300">
            Cubres únicamente el mínimo mensual exigido por el banco.
          </p>

          <div className="space-y-3 py-3 border-y border-white/10 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Intereses estimados:</span>
              <span className="font-mono font-bold text-rose-400 text-sm">
                {formatCurrency(minimumSim.totalInterestPaid)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tiempo de liquidación:</span>
              <span className="font-mono font-bold text-rose-300">
                {minimumSim.monthsToPayOff} meses ({(minimumSim.monthsToPayOff / 12).toFixed(1)} años)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Costo total pagado:</span>
              <span className="font-mono font-bold text-white">
                {formatCurrency(minimumSim.totalPaid)}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-rose-300 bg-rose-500/10 p-3 rounded-2xl border border-rose-500/20 backdrop-blur-md">
            ⚠️ Terminarías pagando {Math.round((minimumSim.totalPaid / (balance || 1)) * 10) / 10}x veces el valor original de tu compra por el efecto bola de nieve.
          </div>
        </div>

        {/* Strategy 3: Abono Fijo Estratégico */}
        <div className="liquid-glass-card p-6 rounded-3xl border border-cyan-400/40 space-y-4 relative shadow-[0_12px_40px_rgba(6,182,212,0.15)]">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white tracking-tight drop-shadow-sm">Abono Estratégico</h3>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
              Recomendado
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Abono mensual sugerido:</label>
            <div className="relative">
              <input
                type="number"
                step="100"
                min="100"
                value={customPaymentAmount}
                onChange={(e) => setCustomPaymentAmount(e.target.value)}
                className="w-full liquid-glass-input rounded-xl pl-7 pr-3 py-1.5 text-xs font-mono text-white focus:outline-none"
              />
              <DollarSign className="absolute left-2 top-2 w-3.5 h-3.5 text-cyan-400" />
            </div>
          </div>

          <div className="space-y-3 py-3 border-y border-white/10 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Intereses estimados:</span>
              <span className="font-mono font-bold text-cyan-300 text-sm">
                {formatCurrency(customSim.totalInterestPaid)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tiempo de liquidación:</span>
              <span className="font-mono font-bold text-white">
                {customSim.monthsToPayOff} meses
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total a desembolsar:</span>
              <span className="font-mono font-bold text-white">
                {formatCurrency(customSim.totalPaid)}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-cyan-300 bg-cyan-500/10 p-3 rounded-2xl border border-cyan-500/20 backdrop-blur-md">
            💡 Te ahorras <strong>{formatCurrency(interestSaved)}</strong> en puros intereses y reduces{' '}
            <strong>{monthsSaved} meses</strong> de deuda bancaria comparado con el mínimo.
          </div>
        </div>
      </div>

      {/* Payoff Schedule Table preview */}
      {balance > 0 && (
        <div className="liquid-glass-card p-6 sm:p-7 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight drop-shadow-sm">
                Tabla de Amortización: Abono Estratégico vs Mínimo
              </h3>
              <p className="text-xs text-slate-400">
                Primeros 6 meses simulados con un abono mensual de {formatCurrency(customPayment)}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/10 text-slate-400 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Mes</th>
                  <th className="py-3 px-4 text-right">Saldo Inicial</th>
                  <th className="py-3 px-4 text-right">Interés Generado</th>
                  <th className="py-3 px-4 text-right">Tu Abono</th>
                  <th className="py-3 px-4 text-right">Saldo Restante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-slate-300 font-mono">
                {customSim.amortization.slice(0, 6).map((item) => (
                  <tr key={item.month} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-2.5 px-4 font-sans font-medium text-white">Mes {item.month}</td>
                    <td className="py-2.5 px-4 text-right">{formatCurrency(item.balance + item.principal)}</td>
                    <td className="py-2.5 px-4 text-right text-rose-300">
                      +{formatCurrency(item.interest)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-emerald-300 font-bold">
                      -{formatCurrency(item.payment)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-white font-bold">
                      {formatCurrency(item.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
