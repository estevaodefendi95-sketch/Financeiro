import React, { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus, Search, Filter, ArrowUpRight, ArrowDownRight, X,
  Trash2, CheckSquare, MoreHorizontal, AlertCircle, Loader2,
  Paperclip, RefreshCw, Edit2, ChevronDown
} from 'lucide-react';
import { useAppStore } from '../../store/useStore';
import { cn, formatCurrency, formatDate, fromISODate, getStatusColor, getStatusLabel, getPaymentMethodLabel, toISODate } from '../../lib/utils';
import { computeStatus, daysOverdue } from '../../types';
import type { Transaction, TransactionStatus, TransactionType, RecurrenceType } from '../../types';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

const STATUS_OPTIONS: { value: TransactionStatus | ''; label: string }[] = [
  { value: '', label: 'Todos os Status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'atrasado', label: 'Atrasado' },
  { value: 'pago', label: 'Pago' },
  { value: 'recebido', label: 'Recebido' },
  { value: 'agendado', label: 'Agendado' },
  { value: 'cancelado', label: 'Cancelado' },
];

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: 'unico', label: 'Único' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'bimestral', label: 'Bimestral' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
];

function TransactionForm({ initial, onSave, onClose }: { initial?: Partial<Transaction>; onSave: (t: Transaction) => void; onClose: () => void }) {
  const { categories, bankAccounts, customers, costCenters } = useAppStore();
  const [form, setForm] = useState({
    type: (initial?.type || 'despesa') as TransactionType,
    description: initial?.description || '',
    amount: initial?.amount ? String(initial.amount) : '',
    dueDate: initial?.dueDate ? fromISODate(initial.dueDate) : fromISODate(new Date().toISOString().split('T')[0]),
    status: (initial?.status || 'pendente') as TransactionStatus,
    categoryId: initial?.categoryId || '',
    bankAccountId: initial?.bankAccountId || '',
    paymentMethod: initial?.paymentMethod || '',
    recurrence: (initial?.recurrence || 'unico') as RecurrenceType,
    costCenterId: initial?.costCenterId || '',
    customerId: initial?.customerId || '',
    notes: initial?.notes || '',
  });
  const [semVencimento, setSemVencimento] = useState(!!initial?.isUndated);
  const isUndatedActive = semVencimento && form.type === 'despesa';

  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const filteredCats = categories.filter(c => c.type === form.type || c.type === 'both');

  const handleSave = () => {
    if (!form.description.trim()) { toast.error('Informe a descrição'); return; }
    const amount = parseFloat(form.amount.replace(/\./g, '').replace(',', '.'));
    if (!amount || amount <= 0) { toast.error('Informe um valor válido'); return; }
    const cat = categories.find(c => c.id === form.categoryId);
    const cust = customers.find(c => c.id === form.customerId);
    const isUndated = isUndatedActive;
    const tx: Transaction = {
      id: initial?.id || uuidv4(),
      type: form.type,
      description: form.description,
      amount,
      dueDate: isUndated ? null : toISODate(form.dueDate),
      isUndated,
      status: form.status,
      categoryId: form.categoryId || undefined,
      categoryName: cat?.name,
      bankAccountId: form.bankAccountId || undefined,
      paymentMethod: form.paymentMethod as Transaction['paymentMethod'] || undefined,
      recurrence: form.recurrence,
      costCenterId: form.costCenterId || undefined,
      customerId: form.customerId || undefined,
      customerName: cust?.name,
      notes: form.notes || undefined,
      companyId: 'company-001',
      createdAt: initial?.createdAt || new Date().toISOString(),
    };
    onSave(tx);
  };

  const amountFmt = (v: string) => {
    const digits = v.replace(/\D/g, '');
    if (!digits) return '';
    const n = parseInt(digits) / 100;
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-5 border-b border-border">
        <h3 className="font-bold text-foreground text-lg">{initial?.id ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
        <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Type toggle */}
        <div className="flex rounded-xl border border-border overflow-hidden">
          <button onClick={() => upd('type', 'receita')} className={cn('flex-1 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2', form.type === 'receita' ? 'bg-green-600 text-white' : 'hover:bg-muted text-muted-foreground')}>
            <ArrowUpRight className="w-4 h-4" /> Receita
          </button>
          <button onClick={() => upd('type', 'despesa')} className={cn('flex-1 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2', form.type === 'despesa' ? 'bg-red-600 text-white' : 'hover:bg-muted text-muted-foreground')}>
            <ArrowDownRight className="w-4 h-4" /> Despesa
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Descrição *</label>
          <input className="w-full border border-border rounded-xl px-4 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" placeholder="Ex: Venda para Cliente X" value={form.description} onChange={e => upd('description', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Valor (R$) *</label>
            <input className="w-full border border-border rounded-xl px-4 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" placeholder="0,00" value={form.amount} onChange={e => upd('amount', amountFmt(e.target.value))} inputMode="numeric" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Vencimento {isUndatedActive ? '' : '*'}</label>
            <input type="date" disabled={isUndatedActive} className={cn('w-full border border-border rounded-xl px-4 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm', isUndatedActive && 'opacity-50 cursor-not-allowed bg-muted')} value={toISODate(form.dueDate)} onChange={e => upd('dueDate', fromISODate(e.target.value))} />
          </div>
        </div>

        {form.type === 'despesa' && (
          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 cursor-pointer select-none">
            <input type="checkbox" className="rounded mt-0.5" checked={semVencimento} onChange={e => setSemVencimento(e.target.checked)} />
            <span className="text-sm">
              <span className="font-medium text-foreground">Sem data de vencimento</span>
              <span className="block text-xs text-muted-foreground mt-0.5">Pendência bancária sem previsão de pagamento. Fica fora do Calendário e do Fluxo de Caixa, mas aparece em destaque em "Pendências sem previsão" e entra na DRE.</span>
            </span>
          </label>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Status</label>
            <select className="w-full border border-border rounded-xl px-4 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" value={form.status} onChange={e => upd('status', e.target.value)}>
              {STATUS_OPTIONS.filter(s => s.value).map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Recorrência</label>
            <select className="w-full border border-border rounded-xl px-4 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" value={form.recurrence} onChange={e => upd('recurrence', e.target.value)}>
              {RECURRENCE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Categoria</label>
          <select className="w-full border border-border rounded-xl px-4 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" value={form.categoryId} onChange={e => upd('categoryId', e.target.value)}>
            <option value="">Sem categoria</option>
            {filteredCats.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Conta Bancária</label>
          <select className="w-full border border-border rounded-xl px-4 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" value={form.bankAccountId} onChange={e => upd('bankAccountId', e.target.value)}>
            <option value="">Sem conta</option>
            {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.name} — {b.bank}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Forma de Pagamento</label>
          <select className="w-full border border-border rounded-xl px-4 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" value={form.paymentMethod} onChange={e => upd('paymentMethod', e.target.value)}>
            <option value="">Não informado</option>
            {[['pix','PIX'],['boleto','Boleto'],['cartao_credito','Cartão Crédito'],['cartao_debito','Cartão Débito'],['transferencia','Transferência'],['dinheiro','Dinheiro'],['cheque','Cheque'],['ted','TED'],['doc','DOC']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        {form.type === 'receita' && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Cliente</label>
            <select className="w-full border border-border rounded-xl px-4 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" value={form.customerId} onChange={e => upd('customerId', e.target.value)}>
              <option value="">Sem cliente</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Observações</label>
          <textarea className="w-full border border-border rounded-xl px-4 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none" rows={3} placeholder="Notas adicionais..." value={form.notes} onChange={e => upd('notes', e.target.value)} />
        </div>
      </div>
      <div className="p-5 border-t border-border flex gap-3">
        <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">Cancelar</button>
        <button onClick={handleSave} className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold transition-colors shadow-sm">
          {initial?.id ? 'Salvar Alterações' : 'Criar Lançamento'}
        </button>
      </div>
    </div>
  );
}

export default function TransacoesPage() {
  const [searchParams] = useSearchParams();
  const { transactions, addTransaction, updateTransaction, deleteTransaction, bulkUpdateStatus } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '');
  const [filterType, setFilterType] = useState(searchParams.get('tipo') || '');
  const [selected, setSelected] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(searchParams.get('new') === 'true');
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [detailTx, setDetailTx] = useState<(Transaction & { computedStatus: string }) | null>(null);
  const [showBulkMenu, setShowBulkMenu] = useState(false);

  const txWithStatus = useMemo(() => transactions.map(t => ({ ...t, computedStatus: computeStatus(t) })), [transactions]);

  const filtered = useMemo(() => {
    return txWithStatus.filter(tx => {
      if (search && !tx.description.toLowerCase().includes(search.toLowerCase()) && !tx.categoryName?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus && tx.computedStatus !== filterStatus) return false;
      if (filterType && tx.type !== filterType) return false;
      return true;
    }).sort((a, b) => (b.dueDate ? new Date(b.dueDate).getTime() : 0) - (a.dueDate ? new Date(a.dueDate).getTime() : 0));
  }, [txWithStatus, search, filterStatus, filterType]);

  const totals = useMemo(() => ({
    receitas: filtered.filter(t => t.type === 'receita').reduce((s, t) => s + t.amount, 0),
    despesas: filtered.filter(t => t.type === 'despesa').reduce((s, t) => s + t.amount, 0),
  }), [filtered]);

  const handleSave = useCallback((tx: Transaction) => {
    if (editTx) { updateTransaction(tx.id, tx); toast.success('Lançamento atualizado!'); }
    else { addTransaction(tx); toast.success('Lançamento criado!'); }
    setShowForm(false); setEditTx(null);
  }, [editTx, addTransaction, updateTransaction]);

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    toast.success('Lançamento excluído', { action: { label: 'Desfazer', onClick: () => {} } });
    setDetailTx(null);
  };

  const handleBulkStatus = (status: TransactionStatus) => {
    bulkUpdateStatus(selected, status);
    toast.success(`${selected.length} lançamentos atualizados`);
    setSelected([]); setShowBulkMenu(false);
  };

  const toggleSelect = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const selectAll = () => setSelected(s => s.length === filtered.length ? [] : filtered.map(t => t.id));

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Transações</h1>
              <p className="text-muted-foreground text-sm">{filtered.length} lançamentos encontrados</p>
            </div>
            <button onClick={() => { setEditTx(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Novo Lançamento
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input className="w-full pl-9 pr-4 py-2 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Buscar lançamentos..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="border border-border rounded-xl px-3 py-2 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">Todos os Tipos</option>
              <option value="receita">Receitas</option>
              <option value="despesa">Despesas</option>
            </select>
            <select className="border border-border rounded-xl px-3 py-2 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {(search || filterType || filterStatus) && (
              <button onClick={() => { setSearch(''); setFilterType(''); setFilterStatus(''); }} className="flex items-center gap-1 px-3 py-2 border border-border rounded-xl text-sm text-muted-foreground hover:bg-muted transition-colors">
                <X className="w-3 h-3" /> Limpar
              </button>
            )}
          </div>

          {/* Summary row */}
          <div className="flex items-center gap-4 mt-3 text-sm">
            <span className="text-green-600 font-medium">↑ {formatCurrency(totals.receitas)}</span>
            <span className="text-red-600 font-medium">↓ {formatCurrency(totals.despesas)}</span>
            <span className={cn('font-bold', totals.receitas - totals.despesas >= 0 ? 'text-green-600' : 'text-red-600')}>= {formatCurrency(totals.receitas - totals.despesas)}</span>
          </div>
        </div>

        {/* Bulk Actions */}
        {selected.length > 0 && (
          <div className="px-6 py-3 bg-primary/10 border-b border-primary/20 flex items-center gap-3">
            <span className="text-sm font-medium text-primary">{selected.length} selecionado{selected.length > 1 ? 's' : ''}</span>
            <div className="relative">
              <button onClick={() => setShowBulkMenu(!showBulkMenu)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium">
                Alterar status <ChevronDown className="w-3 h-3" />
              </button>
              {showBulkMenu && (
                <div className="absolute top-full mt-1 left-0 bg-card border border-border rounded-xl shadow-lg z-10 min-w-40 py-1">
                  {[['pago','Pago'],['recebido','Recebido'],['cancelado','Cancelado']].map(([v,l]) => (
                    <button key={v} onClick={() => handleBulkStatus(v as TransactionStatus)} className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors">{l}</button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setSelected([])} className="text-xs text-muted-foreground hover:text-foreground">Desmarcar</button>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">Nenhum lançamento encontrado</p>
              <p className="text-sm mt-1">Tente ajustar os filtros ou criar um novo lançamento</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur border-b border-border">
                <tr>
                  <th className="w-10 px-4 py-3"><input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={selectAll} className="rounded" /></th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descrição</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Categoria</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Vencimento</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(tx => {
                  const isReceita = tx.type === 'receita';
                  const od = tx.computedStatus === 'atrasado' ? daysOverdue(tx.dueDate) : 0;
                  const isSelected = selected.includes(tx.id);
                  return (
                    <tr key={tx.id} className={cn('hover:bg-muted/40 transition-colors', isSelected && 'bg-primary/5')} onClick={() => setDetailTx(tx)}>
                      <td className="px-4 py-3" onClick={e => { e.stopPropagation(); toggleSelect(tx.id); }}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(tx.id)} className="rounded" onClick={e => e.stopPropagation()} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', isReceita ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30')}>
                            {isReceita ? <ArrowUpRight className="w-4 h-4 text-green-600" /> : <ArrowDownRight className="w-4 h-4 text-red-600" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate max-w-[200px]">{tx.description}</p>
                            {tx.recurrence !== 'unico' && <span className="text-xs text-muted-foreground capitalize">{tx.recurrence}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-muted-foreground">{tx.categoryName || '—'}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-muted-foreground">{formatDate(tx.dueDate)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn('font-bold', isReceita ? 'text-green-600' : 'text-red-600')}>
                          {isReceita ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', getStatusColor(tx.computedStatus))}>
                          {tx.computedStatus === 'atrasado' && od > 0 ? `${od}d atraso` : getStatusLabel(tx.computedStatus)}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setEditTx(tx); setShowForm(true); }} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Side Panel */}
      {detailTx && !showForm && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-card border-l border-border shadow-2xl z-40 flex flex-col animate-slide-in-right">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h3 className="font-bold text-foreground">Detalhes</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => { setEditTx(detailTx); setShowForm(true); setDetailTx(null); }} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => { if (confirm('Excluir este lançamento?')) handleDelete(detailTx.id); }} className="p-2 hover:bg-red-50 rounded-lg text-muted-foreground hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              <button onClick={() => setDetailTx(null)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className={cn('p-4 rounded-xl', detailTx.type === 'receita' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20')}>
              <p className="text-xs text-muted-foreground mb-1">{detailTx.type === 'receita' ? 'Receita' : 'Despesa'}</p>
              <p className={cn('text-3xl font-bold', detailTx.type === 'receita' ? 'text-green-600' : 'text-red-600')}>{formatCurrency(detailTx.amount)}</p>
              <p className="font-medium text-foreground mt-1">{detailTx.description}</p>
            </div>
            {[
              ['Vencimento', formatDate(detailTx.dueDate)],
              detailTx.paymentDate && ['Pagamento', formatDate(detailTx.paymentDate)],
              ['Categoria', detailTx.categoryName || '—'],
              ['Forma de Pagamento', detailTx.paymentMethod ? getPaymentMethodLabel(detailTx.paymentMethod) : '—'],
              ['Recorrência', detailTx.recurrence === 'unico' ? 'Único' : detailTx.recurrence],
              detailTx.customerName && ['Cliente', detailTx.customerName],
              detailTx.notes && ['Observações', detailTx.notes],
            ].filter(Boolean).map((row, i) => (
              <div key={i} className="flex items-start justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{(row as string[])[0]}</span>
                <span className="text-sm font-medium text-foreground text-right max-w-[60%]">{(row as string[])[1]}</span>
              </div>
            ))}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', getStatusColor(detailTx.computedStatus))}>{getStatusLabel(detailTx.computedStatus)}</span>
            </div>
            {/* Quick mark as paid */}
            {(detailTx.computedStatus === 'pendente' || detailTx.computedStatus === 'atrasado') && (
              <button onClick={() => { updateTransaction(detailTx.id, { status: detailTx.type === 'receita' ? 'recebido' : 'pago', paymentDate: new Date().toISOString().split('T')[0] }); toast.success('Marcado como ' + (detailTx.type === 'receita' ? 'recebido' : 'pago')); setDetailTx(null); }} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors">
                ✓ Marcar como {detailTx.type === 'receita' ? 'Recebido' : 'Pago'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Form Side Panel */}
      {showForm && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-slide-in-right">
          <TransactionForm initial={editTx || (searchParams.get('tipo') ? { type: searchParams.get('tipo') as TransactionType } : {})} onSave={handleSave} onClose={() => { setShowForm(false); setEditTx(null); }} />
        </div>
      )}
    </div>
  );
}
