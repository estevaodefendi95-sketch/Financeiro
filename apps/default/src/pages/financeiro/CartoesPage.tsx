import React, { useMemo, useState } from 'react';
import { CreditCard as CreditCardIcon, ChevronLeft, Upload, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../../store/useStore';
import { cn, formatCurrency, formatDate, getMonthFullName } from '../../lib/utils';
import { computeInvoiceDueDate, getCardParentCategory } from '../../lib/creditCardUtils';
import InlineCategoryEditor from '../../components/ui/InlineCategoryEditor';
import CreditCardInvoiceImport from './CreditCardInvoiceImport';

function monthLabel(invoiceMonth: string): string {
  const [y, m] = invoiceMonth.split('-');
  return `${getMonthFullName(parseInt(m, 10) - 1)}/${y}`;
}

function currentMonthStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export default function CartoesPage() {
  const { creditCards, creditCardItems, transactions, categories, company, updateCreditCardItem, updateTransaction } = useAppStore();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const selectedCard = creditCards.find(c => c.id === selectedCardId) || null;
  const despesaCategories = useMemo(() => categories.filter(c => c.type === 'despesa' || c.type === 'both'), [categories]);
  const cartaoCreditoCategoryId = useMemo(() => getCardParentCategory(categories, company.id)?.id, [categories, company.id]);

  const allGroups = useMemo(() => {
    if (!selectedCard) return [];
    const items = creditCardItems.filter(i => i.creditCardId === selectedCard.id);
    const map = new Map<string, typeof items>();
    items.forEach(i => {
      if (!map.has(i.invoiceMonth)) map.set(i.invoiceMonth, []);
      map.get(i.invoiceMonth)!.push(i);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([invoiceMonth, its]) => {
        const dueDate = computeInvoiceDueDate(selectedCard, invoiceMonth);
        const invoiceTx = transactions.find(t => t.creditCardId === selectedCard.id && t.dueDate === dueDate);
        return {
          invoiceMonth,
          items: its,
          subtotal: its.reduce((s, i) => s + i.amount, 0),
          dueDate,
          paid: invoiceTx?.status === 'pago',
          invoiceTxId: invoiceTx?.id,
        };
      });
  }, [selectedCard, creditCardItems, transactions]);

  const thisMonth = currentMonthStr();
  const groups = allGroups.filter(g => g.invoiceMonth <= thisMonth);
  const futureGroups = allGroups.filter(g => g.invoiceMonth > thisMonth);

  const handlePayInvoice = (invoiceTxId?: string) => {
    if (!invoiceTxId) { toast.error('Fatura sem transaction associada.'); return; }
    updateTransaction(invoiceTxId, { status: 'pago', paymentDate: new Date().toISOString().split('T')[0] });
    toast.success('Fatura marcada como paga');
  };

  if (!selectedCard) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><CreditCardIcon className="w-6 h-6 text-primary" />Cartões de Crédito</h1>
            <p className="text-muted-foreground text-sm">{creditCards.length} cartão{creditCards.length !== 1 ? 'ões' : ''}</p>
          </div>
        </div>
        {creditCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <CreditCardIcon className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">Nenhum cartão cadastrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {creditCards.map(card => (
              <button
                key={card.id}
                onClick={() => setSelectedCardId(card.id)}
                className="text-left bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow border-t-4"
                style={{ borderTopColor: card.color || '#6366f1' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-foreground">{card.name}</span>
                  <CreditCardIcon className="w-5 h-5" style={{ color: card.color || '#6366f1' }} />
                </div>
                {card.lastFourDigits && <p className="text-xs text-muted-foreground mb-2">•••• {card.lastFourDigits}</p>}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Fecha dia {card.closingDay}</span>
                  <span>Vence dia {card.dueDay}</span>
                </div>
                {card.creditLimit != null && <p className="text-sm font-semibold text-foreground mt-3">{formatCurrency(card.creditLimit)}</p>}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedCardId(null)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"><ChevronLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{selectedCard.name}</h1>
            <p className="text-muted-foreground text-sm">Fecha dia {selectedCard.closingDay} · Vence dia {selectedCard.dueDay}</p>
          </div>
        </div>
        <button onClick={() => setImportOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold transition-colors shadow-sm">
          <Upload className="w-4 h-4" />Importar Fatura
        </button>
      </div>

      {allGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <p className="font-medium">Nenhuma fatura importada ainda</p>
          <p className="text-sm mt-1">Clique em "Importar Fatura" para começar</p>
        </div>
      ) : groups.length === 0 ? null : (
        <div className="space-y-4">
          {groups.map(g => (
            <div key={g.invoiceMonth} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40 flex-wrap gap-2">
                <div>
                  <p className="font-semibold text-foreground capitalize">{monthLabel(g.invoiceMonth)}</p>
                  <p className="text-xs text-muted-foreground">Vencimento {formatDate(g.dueDate)} · {g.items.length} item{g.items.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', g.paid ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300')}>
                    {g.paid ? 'Paga' : 'Em aberto'}
                  </span>
                  {!g.paid && (
                    <button
                      onClick={() => handlePayInvoice(g.invoiceTxId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />Pagar fatura
                    </button>
                  )}
                </div>
              </div>
              <div className="divide-y divide-border">
                {g.items.map(item => (
                  <div key={item.id} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground w-20 flex-shrink-0">{formatDate(item.purchaseDate)}</span>
                    <span className="flex-1 min-w-0 truncate text-foreground" title={item.description}>{item.description}</span>
                    {item.installmentNumber && <span className="text-xs text-muted-foreground flex-shrink-0">Parcela {item.installmentNumber}/{item.totalInstallments}</span>}
                    <InlineCategoryEditor
                      value={item.categoryId || cartaoCreditoCategoryId}
                      categories={despesaCategories}
                      lockedParentId={cartaoCreditoCategoryId}
                      onChange={categoryId => updateCreditCardItem(item.id, { categoryId })}
                    />
                    <span className="font-semibold text-foreground w-24 text-right flex-shrink-0">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 bg-muted/40 border-t border-border flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Total da fatura</span>
                <span className="font-bold text-red-600">{formatCurrency(g.subtotal)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {futureGroups.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Parcelas futuras</h2>
          <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
            {futureGroups.map(g => (
              <div key={g.invoiceMonth} className="px-4 py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-foreground capitalize">{monthLabel(g.invoiceMonth)}</p>
                  <p className="text-xs text-muted-foreground">Vencimento {formatDate(g.dueDate)} · {g.items.length} item{g.items.length !== 1 ? 's' : ''}</p>
                </div>
                <span className="font-semibold text-foreground">{formatCurrency(g.subtotal)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {importOpen && (
        <CreditCardInvoiceImport creditCardId={selectedCard.id} onDone={() => setImportOpen(false)} onClose={() => setImportOpen(false)} />
      )}
    </div>
  );
}
