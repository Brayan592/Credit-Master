import React, { useState, useMemo } from 'react';
import { Transaction, CreditCard, TransactionCategory, TransactionType } from '../types/creditCard';
import { formatCurrency, formatDateString } from '../utils/creditMath';
import { 
  Search, 
  Filter, 
  ArrowDownRight, 
  ArrowUpRight, 
  Trash2, 
  Plus, 
  Tag, 
  CreditCard as CardIcon,
  Download,
  Sparkles,
  Check,
  X
} from 'lucide-react';

interface Props {
  transactions: Transaction[];
  cards: CreditCard[];
  onDeleteTransaction: (id: string) => void;
  onOpenNewExpense: () => void;
  onOpenNewPayment: () => void;
}

export const TransactionsView: React.FC<Props> = ({
  transactions,
  cards,
  onDeleteTransaction,
  onOpenNewExpense,
  onOpenNewPayment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCardId, setSelectedCardId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (searchTerm.trim() && !t.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (selectedCardId !== 'all' && t.cardId !== selectedCardId) {
        return false;
      }
      if (selectedCategory !== 'all' && t.category !== selectedCategory) {
        return false;
      }
      if (selectedType !== 'all') {
        if (selectedType === 'expense' && t.type !== 'expense' && t.type !== 'msi_first_quota') return false;
        if (selectedType === 'payment' && t.type !== 'payment') return false;
        if (selectedType === 'msi' && t.type !== 'msi_first_quota') return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });
  }, [transactions, searchTerm, selectedCardId, selectedCategory, selectedType, sortBy]);

  const totalSpent = filtered
    .filter((t) => t.type === 'expense' || t.type === 'msi_first_quota')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPaid = filtered
    .filter((t) => t.type === 'payment')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleExportCSV = () => {
    const headers = ['Fecha', 'Tarjeta', 'Concepto', 'Categoría', 'Tipo', 'Monto'];
    const rows = filtered.map((t) => {
      const card = cards.find((c) => c.id === t.cardId);
      return [
        t.date,
        card ? `${card.bank} ${card.name}` : 'Tarjeta',
        `"${t.description.replace(/"/g, '""')}"`,
        t.category,
        t.type,
        t.amount.toFixed(2),
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `movimientos_credimaster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 mb-2 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Libro Diario Liquid Glass</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Historial de Movimientos
          </h1>
          <p className="text-xs text-slate-600">
            Registro detallado de todos los cargos directos, cuotas MSI y abonos realizados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 backdrop-blur-md transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Descargar CSV</span>
          </button>
          <button
            onClick={onOpenNewPayment}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 backdrop-blur-md transition-all shadow-sm"
          >
            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>Abonar</span>
          </button>
          <button
            onClick={onOpenNewExpense}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white transition-all shadow-[0_4px_16px_rgba(16,185,129,0.35)] border border-emerald-400/40 active:scale-95"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Nuevo Gasto</span>
          </button>
        </div>
      </div>

      {/* Filter Bar & Summary */}
      <div className="liquid-glass-card p-5 sm:p-6 rounded-3xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por concepto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full liquid-glass-input rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
            />
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Card filter */}
          <div>
            <select
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
              className="w-full liquid-glass-input rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
            >
              <option value="all" className="bg-white text-slate-900">Todas las tarjetas</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id} className="bg-white text-slate-900">
                  {c.bank} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full liquid-glass-input rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
            >
              <option value="all" className="bg-white text-slate-900">Todos los tipos</option>
              <option value="expense" className="bg-white text-slate-900">Solo Gastos</option>
              <option value="msi" className="bg-white text-slate-900">Solo Cuotas MSI</option>
              <option value="payment" className="bg-white text-slate-900">Solo Pagos / Abonos</option>
            </select>
          </div>

          {/* Category filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full liquid-glass-input rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
            >
              <option value="all" className="bg-white text-slate-900">Todas las categorías</option>
              {[
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
              ].map((cat) => (
                <option key={cat} value={cat} className="bg-white text-slate-900">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Order by */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full liquid-glass-input rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
            >
              <option value="date-desc" className="bg-white text-slate-900">Más recientes primero</option>
              <option value="date-asc" className="bg-white text-slate-900">Más antiguos primero</option>
              <option value="amount-desc" className="bg-white text-slate-900">Mayor monto</option>
              <option value="amount-asc" className="bg-white text-slate-900">Menor monto</option>
            </select>
          </div>
        </div>

        {/* Aggregate sum of filtered results */}
        <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between text-xs text-slate-600">
          <div>
            Mostrando <strong className="text-slate-900">{filtered.length}</strong> de {transactions.length} movimientos
          </div>
          <div className="flex items-center gap-6">
            <div>
              Total cargado: <strong className="text-slate-900 font-mono">{formatCurrency(totalSpent)}</strong>
            </div>
            <div>
              Total abonado: <strong className="text-emerald-700 font-mono">{formatCurrency(totalPaid)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="liquid-glass-card rounded-3xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Tag className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-700">
              {transactions.length === 0 ? 'No hay movimientos registrados' : 'No se encontraron movimientos con los filtros aplicados'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {transactions.length === 0
                ? 'Registra tus gastos o abonos para llevar el control milimétrico de tu saldo y no generar intereses.'
                : 'Intenta limpiar el buscador o seleccionar otra tarjeta/categoría.'}
            </p>
            {transactions.length === 0 && (
              <button
                onClick={onOpenNewExpense}
                className="px-5 py-2.5 text-xs font-bold rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 transition-all shadow-md"
              >
                + Registrar Primer Movimiento
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 border-b border-slate-200/80 text-slate-600 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Fecha</th>
                  <th className="py-3.5 px-4 font-bold">Concepto</th>
                  <th className="py-3.5 px-4 font-bold">Tarjeta</th>
                  <th className="py-3.5 px-4 font-bold">Categoría</th>
                  <th className="py-3.5 px-4 font-bold text-right">Monto</th>
                  <th className="py-3.5 px-4 font-bold text-center w-24">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 text-slate-700">
                {filtered.map((tx) => {
                  const card = cards.find((c) => c.id === tx.cardId);
                  const isPayment = tx.type === 'payment';
                  const isConfirming = deletingId === tx.id;

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-500">
                        {formatDateString(tx.date)}
                      </td>

                      {/* Concept */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`p-1.5 rounded-xl border backdrop-blur-md shrink-0 ${
                              isPayment 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' 
                                : 'bg-slate-100 border-slate-200 text-slate-600'
                            }`}
                          >
                            {isPayment ? (
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">{tx.description}</span>
                            {tx.notes && <span className="text-[10px] text-slate-400">{tx.notes}</span>}
                          </div>
                        </div>
                      </td>

                      {/* Card */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {card ? (
                          <span className="text-slate-800 font-medium">
                            {card.bank} <span className="text-slate-500 text-[11px]">••{card.lastFourDigits}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">Desconocida</span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-slate-600">{tx.category}</span>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-bold">
                        <span className={isPayment ? 'text-emerald-700' : 'text-slate-900'}>
                          {isPayment ? '-' : '+'}
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>

                      {/* Delete with inline safe confirmation without window.confirm */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isConfirming ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => {
                                onDeleteTransaction(tx.id);
                                setDeletingId(null);
                              }}
                              title="Confirmar eliminación"
                              className="p-1 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              title="Cancelar"
                              className="p-1 rounded-lg bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingId(tx.id)}
                            title="Eliminar movimiento"
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
