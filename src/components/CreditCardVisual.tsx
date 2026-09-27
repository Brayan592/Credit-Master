import React from 'react';
import { CreditCard, CardNetwork } from '../types/creditCard';
import { formatCurrency } from '../utils/creditMath';
import { Wifi, Sparkles } from 'lucide-react';

interface Props {
  card: CreditCard;
  usedBalance?: number;
  availableCredit?: number;
  utilizationRate?: number;
  daysToCutoff?: number;
  daysToPayment?: number;
  isBestOptionToday?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onPay?: () => void;
  onEdit?: () => void;
  showActions?: boolean;
}

const THEME_STYLES: Record<string, { 
  glassBg: string; 
  border: string; 
  glow: string; 
  accentGlow: string;
  chipBg: string;
}> = {
  obsidian: {
    glassBg: 'from-slate-900/80 via-zinc-950/70 to-slate-950/90',
    border: 'border-white/20',
    glow: 'shadow-[0_20px_50px_rgba(0,0,0,0.6)]',
    accentGlow: 'bg-white/10',
    chipBg: 'from-amber-200 via-yellow-400 to-amber-600',
  },
  emerald: {
    glassBg: 'from-emerald-900/60 via-teal-950/70 to-slate-950/90',
    border: 'border-emerald-400/30',
    glow: 'shadow-[0_20px_50px_rgba(6,78,59,0.4)]',
    accentGlow: 'bg-emerald-500/20',
    chipBg: 'from-amber-200 via-emerald-300 to-amber-500',
  },
  sapphire: {
    glassBg: 'from-blue-900/60 via-indigo-950/70 to-slate-950/90',
    border: 'border-blue-400/30',
    glow: 'shadow-[0_20px_50px_rgba(30,58,138,0.4)]',
    accentGlow: 'bg-blue-500/20',
    chipBg: 'from-amber-100 via-cyan-300 to-amber-500',
  },
  amethyst: {
    glassBg: 'from-purple-900/60 via-fuchsia-950/70 to-slate-950/90',
    border: 'border-purple-400/30',
    glow: 'shadow-[0_20px_50px_rgba(88,28,135,0.4)]',
    accentGlow: 'bg-purple-500/20',
    chipBg: 'from-amber-200 via-pink-300 to-amber-500',
  },
  titanium: {
    glassBg: 'from-slate-700/60 via-zinc-800/70 to-neutral-950/90',
    border: 'border-slate-300/30',
    glow: 'shadow-[0_20px_50px_rgba(71,85,105,0.4)]',
    accentGlow: 'bg-slate-300/15',
    chipBg: 'from-neutral-100 via-slate-300 to-neutral-400',
  },
  copper: {
    glassBg: 'from-amber-900/60 via-orange-950/70 to-zinc-950/90',
    border: 'border-amber-400/30',
    glow: 'shadow-[0_20px_50px_rgba(120,53,15,0.4)]',
    accentGlow: 'bg-amber-500/20',
    chipBg: 'from-yellow-100 via-amber-400 to-amber-600',
  },
  liquid: {
    glassBg: 'from-white/[0.12] via-slate-900/70 to-slate-950/90',
    border: 'border-white/30',
    glow: 'shadow-[0_20px_50px_rgba(255,255,255,0.12)]',
    accentGlow: 'bg-cyan-400/25',
    chipBg: 'from-slate-100 via-cyan-200 to-slate-300',
  },
  aurora: {
    glassBg: 'from-emerald-950/60 via-teal-900/50 to-indigo-950/80',
    border: 'border-teal-300/40',
    glow: 'shadow-[0_20px_50px_rgba(20,184,166,0.3)]',
    accentGlow: 'bg-teal-400/30',
    chipBg: 'from-teal-100 via-emerald-300 to-amber-300',
  },
};

function NetworkLogo({ network }: { network: CardNetwork }) {
  if (network === 'visa') {
    return (
      <span className="font-extrabold italic text-xl tracking-tighter text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
        VISA
      </span>
    );
  }
  if (network === 'mastercard') {
    return (
      <div className="flex items-center -space-x-2.5 drop-shadow">
        <div className="w-6 h-6 rounded-full bg-rose-500/90 shadow-sm" />
        <div className="w-6 h-6 rounded-full bg-amber-400/90 shadow-sm" />
      </div>
    );
  }
  if (network === 'amex') {
    return (
      <div className="px-2 py-0.5 border border-cyan-400/60 rounded-lg bg-cyan-950/80 backdrop-blur-md shadow-sm">
        <span className="text-xs font-black tracking-widest text-cyan-300">AMEX</span>
      </div>
    );
  }
  return <span className="text-xs font-semibold uppercase text-slate-300">Crédito</span>;
}

export const CreditCardVisual: React.FC<Props> = ({
  card,
  usedBalance = 0,
  availableCredit = 0,
  utilizationRate = 0,
  daysToCutoff,
  daysToPayment,
  isBestOptionToday = false,
  isSelected = false,
  onSelect,
  onPay,
  onEdit,
  showActions = true,
}) => {
  const theme = THEME_STYLES[card.theme] || THEME_STYLES.obsidian;

  return (
    <div
      onClick={onSelect}
      className={`group relative flex flex-col justify-between p-6 rounded-3xl border transition-all duration-300 select-none backdrop-blur-2xl bg-gradient-to-br ${theme.glassBg} ${theme.border} ${theme.glow} ${
        onSelect ? 'cursor-pointer hover:-translate-y-1.5 hover:shadow-2xl' : ''
      } ${isSelected ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-[#f6f8fb] shadow-[0_12px_35px_rgba(16,185,129,0.35)]' : ''}`}
      style={{
        minHeight: '235px',
        boxShadow: `
          0 18px 40px -10px rgba(15, 23, 42, 0.25),
          0 4px 12px -2px rgba(15, 23, 42, 0.1),
          inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.4),
          inset 0 -1px 1px 0 rgba(0, 0, 0, 0.3)
        `,
      }}
    >
      {/* Liquid Glass Internal Specular Refraction */}
      <div className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-80" />
      <div className="pointer-events-none absolute top-0 right-0 w-44 h-44 rounded-full bg-white/[0.07] blur-2xl" />
      <div className={`pointer-events-none absolute bottom-0 left-0 w-36 h-36 rounded-full ${theme.accentGlow} blur-2xl`} />

      {/* Best card to use badge */}
      {isBestOptionToday && (
        <div className="absolute -top-3 right-5 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 text-xs font-bold tracking-tight shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-white/40 animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-slate-950" />
          <span>Mejor opción hoy ({daysToCutoff}d para corte)</span>
        </div>
      )}

      {/* Top row: Bank, Name, Chip & Contactless */}
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <span className="text-[11px] font-bold tracking-widest uppercase text-slate-400/90 drop-shadow-sm">
            {card.bank || 'Tu Banco'}
          </span>
          <h3 className="text-base font-bold text-white tracking-tight drop-shadow-md">
            {card.name || 'Tarjeta de Crédito'}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <Wifi className="w-5 h-5 text-white/70 rotate-90 drop-shadow" />
          <NetworkLogo network={card.network} />
        </div>
      </div>

      {/* Middle row: Metallic Liquid Chip & Card Mask */}
      <div className="relative z-10 my-3 flex items-center justify-between">
        {/* Prismatic Metallic Chip */}
        <div
          className={`w-11 h-8 rounded-lg bg-gradient-to-tr ${theme.chipBg} shadow-[0_2px_8px_rgba(0,0,0,0.4)] border border-white/40 relative overflow-hidden`}
        >
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-amber-950/40" />
          <div className="absolute inset-y-0 left-1/3 w-px bg-amber-950/40" />
          <div className="absolute inset-y-0 right-1/3 w-px bg-amber-950/40" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
        </div>

        <div className="font-mono text-sm tracking-widest text-slate-200 font-semibold drop-shadow">
          •••• •••• •••• {card.lastFourDigits || '••••'}
        </div>
      </div>

      {/* Bottom info: Balances & Deadlines */}
      <div className="relative z-10 space-y-2.5">
        <div className="flex items-end justify-between text-xs">
          <div>
            <div className="text-[10px] uppercase font-medium tracking-wider text-slate-400">Saldo utilizado</div>
            <div className="font-mono font-bold text-white text-base drop-shadow-sm">
              {formatCurrency(usedBalance)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-medium tracking-wider text-slate-400">Disponible</div>
            <div className="font-mono font-bold text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
              {formatCurrency(availableCredit)}
            </div>
          </div>
        </div>

        {/* Liquid Utilization meter */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
            <span>Línea utilizada</span>
            <span
              className={`font-mono font-semibold ${
                utilizationRate > 50 ? 'text-rose-300' : utilizationRate > 30 ? 'text-amber-300' : 'text-emerald-300'
              }`}
            >
              {utilizationRate}%
            </span>
          </div>
          <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10 backdrop-blur-sm">
            <div
              className={`h-full rounded-full transition-all duration-500 shadow-sm ${
                utilizationRate > 50 
                  ? 'bg-gradient-to-r from-rose-500 to-red-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]' 
                  : utilizationRate > 30 
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]' 
                  : 'bg-gradient-to-r from-emerald-500 to-teal-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
              }`}
              style={{ width: `${Math.min(100, Math.max(2, utilizationRate))}%` }}
            />
          </div>
        </div>

        {/* Cycle & Payment timing */}
        <div className="pt-2 flex items-center justify-between text-[11px] text-slate-300 border-t border-white/10">
          <div>
            <span>Corte: día {card.cutOffDay}</span>
            {daysToCutoff !== undefined && (
              <span className="ml-1 text-slate-200">({daysToCutoff}d)</span>
            )}
          </div>
          <div>
            <span>Límite pago: día {card.paymentDueDayOfMonth || '20d'}</span>
            {daysToPayment !== undefined && (
              <span className={`ml-1 font-bold ${daysToPayment <= 3 ? 'text-rose-400' : 'text-slate-200'}`}>
                ({daysToPayment}d)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hover action overlay */}
      {showActions && (
        <div className="relative z-10 pt-3 flex items-center justify-end gap-2 border-t border-white/10 mt-1">
          {onPay && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPay();
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-200 border border-emerald-400/40 backdrop-blur-md transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)]"
            >
              Abonar / Pagar
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-xl bg-white/[0.08] hover:bg-white/[0.18] text-slate-200 border border-white/20 backdrop-blur-md transition-all"
            >
              Configurar
            </button>
          )}
        </div>
      )}
    </div>
  );
};
