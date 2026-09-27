import React, { useState, useMemo, useEffect } from 'react';
import { CreditCard, Transaction, InstallmentPlan, CardCycleInfo, ReservedFundItem } from './types/creditCard';
import { 
  getStoredCards, 
  saveStoredCards, 
  getStoredTransactions, 
  saveStoredTransactions, 
  getStoredInstallments, 
  saveStoredInstallments,
  getStoredReservedFunds,
  saveStoredReservedFunds
} from './utils/storage';
import { computeCardCycle } from './utils/creditMath';

import { Header, ActiveTab } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { CardsView } from './components/CardsView';
import { InstallmentsView } from './components/InstallmentsView';
import { TransactionsView } from './components/TransactionsView';
import { SimulatorView } from './components/SimulatorView';
import { CalendarCycleView } from './components/CalendarCycleView';

import { NewTransactionModal } from './components/Modals/NewTransactionModal';
import { RecordPaymentModal } from './components/Modals/RecordPaymentModal';
import { NewCardModal } from './components/Modals/NewCardModal';
import { ImportExportModal } from './components/Modals/ImportExportModal';
import { ReservedFundsModal } from './components/Modals/ReservedFundsModal';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmState {
  type: 'card' | 'plan';
  id: string;
  name: string;
}

export default function App() {
  const [cards, setCards] = useState<CreditCard[]>(() => getStoredCards());
  const [transactions, setTransactions] = useState<Transaction[]>(() => getStoredTransactions());
  const [installmentPlans, setInstallmentPlans] = useState<InstallmentPlan[]>(() => getStoredInstallments());
  const [reservedFunds, setReservedFunds] = useState<ReservedFundItem[]>(() => getStoredReservedFunds());

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || '');

  // Modal open states
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const [isNewCardOpen, setIsNewCardOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isReservedFundsOpen, setIsReservedFundsOpen] = useState(false);
  const [reservedFundsInitialTab, setReservedFundsInitialTab] = useState<'overview' | 'add' | 'pay'>('overview');
  const [reservedFundsTargetCardId, setReservedFundsTargetCardId] = useState<string | undefined>(undefined);

  const [cardToEdit, setCardToEdit] = useState<CreditCard | null>(null);
  const [targetCardId, setTargetCardId] = useState<string | undefined>(undefined);

  // Safe deletion dialog state (No window.confirm!)
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);

  // Sync to localStorage
  useEffect(() => {
    saveStoredCards(cards);
  }, [cards]);

  useEffect(() => {
    saveStoredTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveStoredInstallments(installmentPlans);
  }, [installmentPlans]);

  useEffect(() => {
    saveStoredReservedFunds(reservedFunds);
  }, [reservedFunds]);

  // If selected card was deleted or missing, fallback to first
  useEffect(() => {
    if (cards.length > 0 && !cards.some((c) => c.id === selectedCardId)) {
      setSelectedCardId(cards[0].id);
    }
  }, [cards, selectedCardId]);

  // Compute cycle infos for each card
  const cycleInfos = useMemo<Record<string, CardCycleInfo>>(() => {
    const infos: Record<string, CardCycleInfo> = {};
    const today = new Date();

    cards.forEach((card) => {
      infos[card.id] = computeCardCycle(card, transactions, installmentPlans, today);
    });

    return infos;
  }, [cards, transactions, installmentPlans]);

  // Total reserved in app
  const totalReservedAmount = useMemo(
    () => reservedFunds.reduce((sum, item) => sum + item.amount, 0),
    [reservedFunds]
  );

  // Reload data from storage (after backup restore or demo reset)
  const handleReloadFromStorage = () => {
    setCards(getStoredCards());
    setTransactions(getStoredTransactions());
    setInstallmentPlans(getStoredInstallments());
    setReservedFunds(getStoredReservedFunds());
  };

  // Handlers for Transactions
  const handleAddTransaction = (newTx: Transaction, newPlan?: InstallmentPlan) => {
    setTransactions((prev) => [newTx, ...prev]);
    if (newPlan) {
      setInstallmentPlans((prev) => [newPlan, ...prev]);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Deduct from in-app reserved funds helper
  const deductFromReservedFunds = (amountToDeduct: number, preferredTargetCardId?: string) => {
    setReservedFunds((prev) => {
      let remaining = amountToDeduct;
      const result: ReservedFundItem[] = [];

      // Give priority to funds earmarked for this card
      const targeted = prev.filter(f => f.targetCardId && f.targetCardId === preferredTargetCardId);
      const untargetedOrOther = prev.filter(f => !f.targetCardId || f.targetCardId !== preferredTargetCardId);
      const sortedPool = [...targeted, ...untargetedOrOther];

      for (const item of sortedPool) {
        if (remaining <= 0) {
          result.push(item);
        } else if (item.amount > remaining) {
          result.push({ ...item, amount: item.amount - remaining });
          remaining = 0;
        } else {
          remaining -= item.amount;
          // Item completely consumed
        }
      }

      return result;
    });
  };

  // Handlers for Dinero adentro de la app (no abonado)
  const handleOpenReservedFunds = (initialTab: 'overview' | 'add' | 'pay' = 'overview', targetCardId?: string) => {
    setReservedFundsInitialTab(initialTab);
    setReservedFundsTargetCardId(targetCardId);
    setIsReservedFundsOpen(true);
  };

  const handleAddReservedFund = (item: ReservedFundItem) => {
    setReservedFunds((prev) => [item, ...prev]);
  };

  const handleUpdateReservedFund = (item: ReservedFundItem) => {
    setReservedFunds((prev) => prev.map((f) => (f.id === item.id ? item : f)));
  };

  const handleDeleteReservedFund = (id: string) => {
    setReservedFunds((prev) => prev.filter((f) => f.id !== id));
  };

  const handlePayCardFromReserved = (cardId: string, amount: number) => {
    const card = cards.find((c) => c.id === cardId);
    const paymentTx: Transaction = {
      id: `tx-pay-res-${Date.now()}`,
      cardId,
      description: `Abono desde dinero apartado en la app a ${card?.bank || 'tarjeta'}`,
      amount,
      date: new Date().toISOString().split('T')[0],
      category: 'Otro',
      type: 'payment',
      notes: 'Descontado del dinero adentro de la app (no abonado)',
    };

    setTransactions((prev) => [paymentTx, ...prev]);
    deductFromReservedFunds(amount, cardId);
  };

  const handleRecordPayment = (paymentTx: Transaction, deductFromReserved?: boolean) => {
    setTransactions((prev) => [paymentTx, ...prev]);
    if (deductFromReserved) {
      deductFromReservedFunds(paymentTx.amount, paymentTx.cardId);
    }
  };

  // Handlers for Cards
  const handleSaveCard = (savedCard: CreditCard) => {
    setCards((prev) => {
      const exists = prev.some((c) => c.id === savedCard.id);
      if (exists) {
        return prev.map((c) => (c.id === savedCard.id ? savedCard : c));
      }
      return [...prev, savedCard];
    });
    setSelectedCardId(savedCard.id);
    setCardToEdit(null);
  };

  const promptDeleteCard = (cardId: string) => {
    const cardToDelete = cards.find((c) => c.id === cardId);
    if (!cardToDelete) return;
    setDeleteConfirm({
      type: 'card',
      id: cardId,
      name: `${cardToDelete.bank} ${cardToDelete.name} (•••• ${cardToDelete.lastFourDigits})`,
    });
  };

  const promptDeletePlan = (planId: string) => {
    const plan = installmentPlans.find((p) => p.id === planId);
    setDeleteConfirm({
      type: 'plan',
      id: planId,
      name: plan?.description || 'Plan MSI',
    });
  };

  const executeConfirmedDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'card') {
      const cardId = deleteConfirm.id;
      setCards((prev) => prev.filter((c) => c.id !== cardId));
      setTransactions((prev) => prev.filter((t) => t.cardId !== cardId));
      setInstallmentPlans((prev) => prev.filter((p) => p.cardId !== cardId));
    } else if (deleteConfirm.type === 'plan') {
      setInstallmentPlans((prev) => prev.filter((p) => p.id !== deleteConfirm.id));
    }
    setDeleteConfirm(null);
  };

  const handleEditCardClick = (card: CreditCard) => {
    setCardToEdit(card);
    setIsNewCardOpen(true);
  };

  // Handlers for MSI Plans
  const handleAddPlan = (newPlan: InstallmentPlan) => {
    setInstallmentPlans((prev) => [newPlan, ...prev]);
  };

  const handleUpdatePlan = (updatedPlan: InstallmentPlan) => {
    setInstallmentPlans((prev) =>
      prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p))
    );
  };

  // Modal openers with optional target card
  const handleOpenExpense = (cardId?: string) => {
    setTargetCardId(cardId || selectedCardId || cards[0]?.id);
    setIsNewExpenseOpen(true);
  };

  const handleOpenPayment = (cardId?: string) => {
    setTargetCardId(cardId || selectedCardId || cards[0]?.id);
    setIsNewPaymentOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 flex flex-col overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Liquid Ambient Fluid Light Orbs that shine through frosted glass panels */}
      <div className="fixed -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-emerald-500/12 blur-[150px] pointer-events-none z-0 animate-liquid-1" />
      <div className="fixed top-1/4 -right-48 w-[680px] h-[680px] rounded-full bg-cyan-500/12 blur-[170px] pointer-events-none z-0 animate-liquid-2" />
      <div className="fixed bottom-10 left-1/4 w-[550px] h-[550px] rounded-full bg-indigo-500/10 blur-[160px] pointer-events-none z-0 animate-liquid-3" />
      <div className="fixed -bottom-48 right-16 w-[500px] h-[500px] rounded-full bg-teal-500/12 blur-[150px] pointer-events-none z-0 animate-liquid-1" />

      {/* Top Bar Contract (Wordmark, Nav links, Actions) */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewExpense={() => handleOpenExpense()}
        onOpenNewPayment={() => handleOpenPayment()}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenReservedFunds={() => handleOpenReservedFunds('overview')}
        totalReservedAmount={totalReservedAmount}
      />

      {/* Main Viewport Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">
        {activeTab === 'dashboard' && (
          <DashboardView
            cards={cards}
            transactions={transactions}
            installmentPlans={installmentPlans}
            cycleInfos={cycleInfos}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenNewExpense={handleOpenExpense}
            onOpenNewPayment={handleOpenPayment}
            onOpenNewCard={() => {
              setCardToEdit(null);
              setIsNewCardOpen(true);
            }}
            onSelectCard={(id) => {
              setSelectedCardId(id);
              setActiveTab('cards');
            }}
            reservedFunds={reservedFunds}
            onOpenReservedFunds={handleOpenReservedFunds}
          />
        )}

        {activeTab === 'cards' && (
          <CardsView
            cards={cards}
            transactions={transactions}
            installmentPlans={installmentPlans}
            cycleInfos={cycleInfos}
            selectedCardId={selectedCardId}
            onSelectCard={setSelectedCardId}
            onOpenNewCard={() => {
              setCardToEdit(null);
              setIsNewCardOpen(true);
            }}
            onEditCard={handleEditCardClick}
            onDeleteCard={promptDeleteCard}
            onOpenNewPayment={handleOpenPayment}
            onOpenNewExpense={handleOpenExpense}
            onSaveCard={handleSaveCard}
            reservedFunds={reservedFunds}
            onOpenReservedFunds={handleOpenReservedFunds}
          />
        )}

        {activeTab === 'msi' && (
          <InstallmentsView
            installmentPlans={installmentPlans}
            cards={cards}
            onAddPlan={handleAddPlan}
            onUpdatePlan={handleUpdatePlan}
            onDeletePlan={promptDeletePlan}
            onOpenNewCard={() => {
              setCardToEdit(null);
              setIsNewCardOpen(true);
            }}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            cards={cards}
            onDeleteTransaction={handleDeleteTransaction}
            onOpenNewExpense={() => handleOpenExpense()}
            onOpenNewPayment={() => handleOpenPayment()}
          />
        )}

        {activeTab === 'simulator' && (
          <SimulatorView cards={cards} cycleInfos={cycleInfos} />
        )}

        {activeTab === 'calendar' && (
          <CalendarCycleView
            cards={cards}
            cycleInfos={cycleInfos}
            onOpenNewPayment={handleOpenPayment}
            onOpenNewExpense={handleOpenExpense}
            onOpenNewCard={() => {
              setCardToEdit(null);
              setIsNewCardOpen(true);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 bg-slate-950/70 backdrop-blur-2xl py-6 text-center text-xs text-slate-400 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CrediMaster Liquid Glass © {new Date().getFullYear()} · Gestión inteligente de crédito</span>
          <span className="text-[11px] text-slate-400">
            Datos guardados localmente en tu navegador. Tus finanzas son 100% privadas.
          </span>
        </div>
      </footer>

      {/* Global Modals */}
      <NewTransactionModal
        isOpen={isNewExpenseOpen}
        onClose={() => setIsNewExpenseOpen(false)}
        cards={cards}
        onAddTransaction={handleAddTransaction}
        onOpenNewCard={() => {
          setIsNewExpenseOpen(false);
          setCardToEdit(null);
          setIsNewCardOpen(true);
        }}
        defaultCardId={targetCardId}
      />

      <RecordPaymentModal
        isOpen={isNewPaymentOpen}
        onClose={() => setIsNewPaymentOpen(false)}
        cards={cards}
        cycleInfos={cycleInfos}
        onRecordPayment={handleRecordPayment}
        onOpenNewCard={() => {
          setIsNewPaymentOpen(false);
          setCardToEdit(null);
          setIsNewCardOpen(true);
        }}
        defaultCardId={targetCardId}
        reservedFunds={reservedFunds}
      />

      <NewCardModal
        isOpen={isNewCardOpen}
        onClose={() => {
          setIsNewCardOpen(false);
          setCardToEdit(null);
        }}
        onSaveCard={handleSaveCard}
        cardToEdit={cardToEdit}
      />

      <ImportExportModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        onDataChanged={handleReloadFromStorage}
      />

      <ReservedFundsModal
        isOpen={isReservedFundsOpen}
        onClose={() => setIsReservedFundsOpen(false)}
        cards={cards}
        cycleInfos={cycleInfos}
        reservedFunds={reservedFunds}
        onAddReservedFund={handleAddReservedFund}
        onUpdateReservedFund={handleUpdateReservedFund}
        onDeleteReservedFund={handleDeleteReservedFund}
        onPayCardFromReserved={handlePayCardFromReserved}
        initialTab={reservedFundsInitialTab}
        defaultCardId={reservedFundsTargetCardId}
      />

      {/* Safe Liquid Glass Confirmation Dialog (Replaces window.confirm) */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl">
          <div className="relative w-full max-w-md liquid-glass rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-rose-500/40 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-white tracking-tight">
                {deleteConfirm.type === 'card' ? '¿Eliminar esta tarjeta?' : '¿Eliminar este plan MSI?'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Estás a punto de eliminar <strong className="text-white">{deleteConfirm.name}</strong>.
                {deleteConfirm.type === 'card' && ' Esta acción desvinculará sus movimientos y compras a plazos asociados.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-xl bg-white/[0.04] border border-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeConfirmedDelete}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-500 hover:bg-rose-400 rounded-xl shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmar y Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
