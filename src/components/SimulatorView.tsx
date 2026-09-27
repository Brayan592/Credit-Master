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
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 mb-2 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Simulador Financiero Liquid Glass</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Simulador de Pagos e Intereses Bancarios
        </h1>
        <p className="text-xs text-slate-600">
          Descubre el impacto real entre pagar el mínimo vs pagar para no generar intereses o abonar una cantidad estratégica.
        </p>
      </div>

      {/* Simulator Inputs Card */}
      <div className="liquid-glass-card p-6 sm:p-7 rounded-3xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
          <Calculator className="w-4 h-4 text-emerald-600" />
          <span>Parámetros de Simulación</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card Select or Custom */}
          <div>
            <label className="block text-xs text-slate-700 mb-1.5 font-semibold uppercase tracking-wider">Tarjeta Base</label>
            <select
              value={selectedCardId}
              onChange={(e) => {
                setSelectedCardId(e.target.value);
                setCustomBalance('');
                setCustomRate('');
              }}
              className="w-full liquid-glass-input rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none"
            >
              {cards.length === 0 ? (
                <option value="" className="bg-white text-slate-900">Simulación Libre (Ingresa monto y tasa)</option>
              ) : (
                <>
                  <option value="" className="bg-white text-slate-900">Simulación Libre Personalizada</option>
                  {cards.map((c) => (
                    <option key={c.id} value={c.id} className="bg-white text-slate-900">
                      {c.bank} {c.name} (Tasa {c.annualRate}%)
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Balance */}
          <div>
            <label className="block text-xs text-slate-700 mb-1.5 font-semibold uppercase tracking-wider">Deuda o Saldo a Simular (MXN)</label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                placeholder={balance.toString()}
                value={customBalance}
                onChange={(e) => setCustomBalance(e.target.value)}
                className="w-full liquid-glass-input rounded-xl pl-8 pr-3 py-2 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none"
              />
              <DollarSign className="absolute left-2.5 top-2.5 w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Saldo actual tarjeta: {formatCurrency(cycleInfo?.totalStatementToPay || 0)}
            </div>
          </div>

          {/* Annual rate */}
          <div>
            <label className="block text-xs text-slate-700 mb-1.5 font-semibold uppercase tracking-wider">Tasa Anual CAT (%)</label>
            <div className="relative">
              <input
                type="number"
                step="1"
                placeholder={rate.toString()}
                value={customRate}
                onChange={(e) => setCustomRate(e.target.value)}
                className="w-full liquid-glass-input rounded-xl pl-8 pr-3 py-2 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none"
              />
              <Percent className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Promedio en México: 45% - 70% anual
            </div>
          </div>
        </div>
      </div>

      {/* 3 Strategies Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Strategy 1: Totalero */}
        <div className="liquid-glass-card p-6 rounded-3xl border border-emerald-300/80 space-y-4 relative shadow-[0_12px_40px_rgba(16,185,129,0.08)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Pago Totalero</h3>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Ideal
            </span>
          </div>

          <p className="text-xs text-slate-600">
            Pagas el total de tu estado de cuenta antes de la fecha límite.
          </p>

          <div className="space-y-3 py-3 border-y border-slate-200/80 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Intereses pagados:</span>
              <span className="font-mono font-bold text-emerald-700 text-sm">$0.00 MXN</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tiempo de liquidación:</span>
              <span className="font-mono font-bold text-slate-900">1 mes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Desembolso total:</span>
              <span className="font-mono font-bold text-slate-900">{formatCurrency(balance)}</span>
            </div>
          </div>

          <div className="text-[11px] text-emerald-800 bg-emerald-50 p-3 rounded-2xl border border-emerald-200 backdrop-blur-md">
            ✓ Tu historial crediticio se mantiene impecable y disfrutas financiamiento sin costo bancario.
          </div>
        </div>

        {/* Strategy 2: Pago Mínimo */}
        <div className="liquid-glass-card p-6 rounded-3xl border border-rose-300/80 space-y-4 relative shadow-[0_12px_40px_rgba(244,63,94,0.08)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Solo Pago Mínimo</h3>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
              Peligro
            </span>
          </div>

          <p className="text-xs text-slate-600">
            Cubres únicamente el mínimo mensual exigido por el banco.
          </p>

          <div className="space-y-3 py-3 border-y border-slate-200/80 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Intereses estimados:</span>
              <span className="font-mono font-bold text-rose-700 text-sm">
                {formatCurrency(minimumSim.totalInterestPaid)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tiempo de liquidación:</span>
              <span className="font-mono font-bold text-rose-700">
                {minimumSim.monthsToPayOff} meses ({(minimumSim.monthsToPayOff / 12).toFixed(1)} años)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Costo total pagado:</span>
              <span className="font-mono font-bold text-slate-900">
                {formatCurrency(minimumSim.totalPaid)}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-rose-800 bg-rose-50 p-3 rounded-2xl border border-rose-200 backdrop-blur-md">
            ⚠️ Terminarías pagando {Math.round((minimumSim.totalPaid / (balance || 1)) * 10) / 10}x veces el valor original de tu compra por el efecto bola de nieve.
          </div>
        </div>

        {/* Strategy 3: Abono Fijo Estratégico */}
        <div className="liquid-glass-card p-6 rounded-3xl border border-cyan-300/80 space-y-4 relative shadow-[0_12px_40px_rgba(6,182,212,0.08)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-cyan-600" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Abono Estratégico</h3>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-900 border border-cyan-300">
              Recomendado
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Abono mensual sugerido:</label>
            <div className="relative">
              <input
                type="number"
                step="100"
                min="100"
                value={customPaymentAmount}
                onChange={(e) => setCustomPaymentAmount(e.target.value)}
                className="w-full liquid-glass-input rounded-xl pl-7 pr-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-none"
              />
              <DollarSign className="absolute left-2 top-2 w-3.5 h-3.5 text-cyan-600" />
            </div>
          </div>

          <div className="space-y-3 py-3 border-y border-slate-200/80 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Intereses estimados:</span>
              <span className="font-mono font-bold text-cyan-800 text-sm">
                {formatCurrency(customSim.totalInterestPaid)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tiempo de liquidación:</span>
              <span className="font-mono font-bold text-slate-900">
                {customSim.monthsToPayOff} meses
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total a desembolsar:</span>
              <span className="font-mono font-bold text-slate-900">
                {formatCurrency(customSim.totalPaid)}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-cyan-900 bg-cyan-50 p-3 rounded-2xl border border-cyan-200 backdrop-blur-md">
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
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Tabla de Amortización: Abono Estratégico vs Mínimo
              </h3>
              <p className="text-xs text-slate-500">
                Primeros 6 meses simulados con un abono mensual de {formatCurrency(customPayment)}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 border-b border-slate-200/80 text-slate-600 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-bold">Mes</th>
                  <th className="py-3 px-4 text-right font-bold">Saldo Inicial</th>
                  <th className="py-3 px-4 text-right font-bold">Interés Generado</th>
                  <th className="py-3 px-4 text-right font-bold">Tu Abono</th>
                  <th className="py-3 px-4 text-right font-bold">Saldo Restante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 text-slate-700 font-mono">
                {customSim.amortization.slice(0, 6).map((item) => (
                  <tr key={item.month} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Mes {item.month}</td>
                    <td className="py-2.5 px-4 text-right">{formatCurrency(item.balance + item.principal)}</td>
                    <td className="py-2.5 px-4 text-right text-rose-700">
                      +{formatCurrency(item.interest)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-emerald-700 font-bold">
                      -{formatCurrency(item.payment)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-900 font-bold">
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
