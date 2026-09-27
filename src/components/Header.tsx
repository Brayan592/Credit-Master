import React from 'react';
import { PlusCircle, Wallet, ArrowDownRight, Database, PiggyBank } from 'lucide-react';
import { formatCurrency } from '../utils/creditMath';

export type ActiveTab = 'dashboard' | 'cards' | 'msi' | 'transactions' | 'simulator' | 'calendar';

interface Props {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewExpense: () => void;
  onOpenNewPayment: () => void;
  onOpenBackup: () => void;
  onOpenReservedFunds?: () => void;
  totalReservedAmount?: number;
}

export const Header: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  onOpenNewExpense,
  onOpenNewPayment,
  onOpenBackup,
  onOpenReservedFunds,
  totalReservedAmount = 0,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/10 bg-slate-950/40 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="text-left group flex items-center gap-2.5 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 group-hover:border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.25)] backdrop-blur-md transition-all">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white group-hover:text-emerald-300 drop-shadow-sm transition-colors">
                CrediMaster
              </span>
            </button>
          </div>

          {/* Zone 2: 4-6 clean text navigation links with liquid glass pills */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
            {[
              { id: 'dashboard', label: 'Resumen' },
              { id: 'cards', label: 'Mis Tarjetas' },
              { id: 'msi', label: 'Meses Sin Intereses' },
              { id: 'transactions', label: 'Movimientos' },
              { id: 'simulator', label: 'Simulador' },
              { id: 'calendar', label: 'Cortes & Pagos' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="flex items-center gap-2.5">
            {onOpenReservedFunds && (
              <button
                onClick={onOpenReservedFunds}
                title="Dinero adentro de la app pero no abonado"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 backdrop-blur-md transition-all shadow-sm group"
              >
                <PiggyBank className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Dinero en App (No abonado):</span>
                <span className="font-mono font-bold text-cyan-200">{formatCurrency(totalReservedAmount)}</span>
              </button>
            )}

            <button
              onClick={onOpenBackup}
              title="Copia de seguridad y datos"
              className="p-2 text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-xl border border-white/10 backdrop-blur-md transition-all shadow-sm"
            >
              <Database className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenNewPayment}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 rounded-xl backdrop-blur-md transition-all whitespace-nowrap shadow-sm hover:border-white/25"
            >
              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
              <span>Abonar</span>
            </button>

            <button
              onClick={onOpenNewExpense}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.35)] border border-emerald-300/40 transition-all whitespace-nowrap active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>Registrar Gasto</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary navigation scroller */}
        <div className="flex md:hidden items-center gap-2 py-2 border-t border-white/10 overflow-x-auto text-xs whitespace-nowrap">
          {[
            { id: 'dashboard', label: 'Resumen' },
            { id: 'cards', label: 'Tarjetas' },
            { id: 'msi', label: 'MSI' },
            { id: 'transactions', label: 'Movimientos' },
            { id: 'simulator', label: 'Simulador' },
            { id: 'calendar', label: 'Cortes' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
