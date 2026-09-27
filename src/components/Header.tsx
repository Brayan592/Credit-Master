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
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/75 backdrop-blur-2xl shadow-[0_4px_24px_rgba(15,23,42,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="text-left group flex items-center gap-2.5 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-600 group-hover:scale-105 group-hover:border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.15)] backdrop-blur-md transition-all">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                CrediMaster
              </span>
            </button>
          </div>

          {/* Zone 2: 4-6 clean text navigation links with liquid glass pills */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/70 border border-slate-200/80 backdrop-blur-xl">
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
                      ? 'bg-white text-emerald-800 border border-emerald-400/40 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
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
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-cyan-50/90 hover:bg-cyan-100/80 text-cyan-900 border border-cyan-300/70 backdrop-blur-md transition-all shadow-sm group"
              >
                <PiggyBank className="w-3.5 h-3.5 text-cyan-600 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Dinero en App (No abonado):</span>
                <span className="font-mono font-bold text-cyan-800">{formatCurrency(totalReservedAmount)}</span>
              </button>
            )}

            <button
              onClick={onOpenBackup}
              title="Copia de seguridad y datos"
              className="p-2 text-slate-600 hover:text-slate-900 bg-white/80 hover:bg-white rounded-xl border border-slate-200/80 backdrop-blur-md transition-all shadow-sm"
            >
              <Database className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenNewPayment}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white/80 hover:bg-white border border-slate-200 rounded-xl backdrop-blur-md transition-all whitespace-nowrap shadow-sm hover:border-slate-300"
            >
              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
              <span>Abonar</span>
            </button>

            <button
              onClick={onOpenNewExpense}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 rounded-xl shadow-[0_4px_16px_rgba(16,185,129,0.35)] border border-emerald-400/40 transition-all whitespace-nowrap active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span>Registrar Gasto</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary navigation scroller */}
        <div className="flex md:hidden items-center gap-2 py-2 border-t border-slate-200/80 overflow-x-auto text-xs whitespace-nowrap">
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
                    ? 'bg-white text-emerald-800 font-bold border border-emerald-400/40 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
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
