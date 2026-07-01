import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowDownRight, AlertTriangle, CalendarPlus, Check, Trash2, X } from 'lucide-react';
import { useAppStore } from '../../store/useStore';
import { cn, formatCurrency, formatDate, getStatusColor, getStatusLabel } from '../../lib/utils';
import { computeStatus, daysOverdue } from '../../types';
import { toast } from 'sonner';

export default function ContasPagarPage() {
  const navigate = useNavigate();
  const { transactions, updateTransaction, deleteTransaction } = useAppStore();
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignDate, setAssignDate] = useState('');

  const allDespesas = transactions.filter(t => t.type === 'despesa');
  const despesas = allDespesas
    .filter(t => !t.isUndated && t.dueDate)
    .map(t => ({ ...t, computedStatus: computeStatus(t) }))
    .sort((a, b) => new Date(a.dueDate as string).getTime() - new Date(b.dueDate as string).getTime());
  const semPrevisao = allDespesas.filter(t => t.isUndated && t.status === 'pendente');
  const totals = { pendente: despesas.filter(t => t.computedStatus === 'pendente' || t.computedStatus === 'atrasado').reduce((s, t) => s + t.amount, 0), pago: despesas.filter(t => t.computedStatus === 'pago').reduce((s, t) => s + t.amount, 0) };
  const totalSemPrevisao = semPrevisao.reduce((s, t) => s + t.amount, 0);

  const startAssign = (id: string) => { setAssigningId(id); setAssignDate(new Date().toISOString().split('T')[0]); };
  const cancelAssign = () => { setAssigningId(null); setAssignDate(''); };
  const confirmAssign = (id: string) => {
    if (!assignDate) { toast.error('Selecione uma data'); return; }
    updateTransaction(id, { dueDate: assignDate, isUndated: false });
    toast.success('Data de vencimento atribuída!');
    cancelAssign();
  };
  const markPaid = (id: string) => {
    updateTransaction(id, { status: 'pago', paymentDate: new Date().toISOString().split('T')[0] });
    toast.success('Marcado como pago');
  };
  const handleDeleteUndated = (id: string) => {
    if (confirm('Excluir este lançamento?')) { deleteTransaction(id); toast.success('Lançamento excluído'); }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><ArrowDownRight className="w-6 h-6 text-red-500" />Contas a Pagar</h1><p className="text-muted-foreground text-sm">{despesas.length} lançamentos</p></div>
        <button onClick={() => navigate('/financeiro/transacoes?tipo=despesa&new=true')} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"><Plus className="w-4 h-4" />Nova Despesa</button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4"><p className="text-xs text-muted-foreground mb-1">Em Aberto</p><p className="text-xl font-bold text-red-600">{formatCurrency(totals.pendente)}</p></div>
        <div className="bg-card border border-border rounded-xl p-4"><p className="text-xs text-muted-foreground mb-1">Pago no Período</p><p className="text-xl font-bold text-green-600">{formatCurrency(totals.pago)}</p></div>
      </div>

      {/* Pendências sem previsão */}
      {semPrevisao.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-300 dark:border-amber-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200 dark:border-amber-800 bg-amber-100/60 dark:bg-amber-900/20 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <h2 className="font-bold text-amber-900 dark:text-amber-300">Pendências sem previsão</h2>
                <p className="text-xs text-amber-700 dark:text-amber-400">{semPrevisao.length} lançamento{semPrevisao.length > 1 ? 's' : ''} sem data de vencimento — não entram no Calendário nem no Fluxo de Caixa</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-amber-700 dark:text-amber-400">Total</p>
              <p className="text-lg font-bold text-amber-900 dark:text-amber-300">{formatCurrency(totalSemPrevisao)}</p>
            </div>
          </div>
          <div className="divide-y divide-amber-200 dark:divide-amber-800">
            {semPrevisao.map(tx => (
              <div key={tx.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{tx.description}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                    <span>{tx.supplierName || 'Sem fornecedor'}</span>
                    <span>{tx.categoryName || 'Sem categoria'}</span>
                    <span>Criado em {formatDate(tx.createdAt.split('T')[0])}</span>
                  </div>
                </div>
                <div className="text-right font-bold text-red-600 sm:w-32 flex-shrink-0">{formatCurrency(tx.amount)}</div>
                {assigningId === tx.id ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <input type="date" value={assignDate} onChange={e => setAssignDate(e.target.value)} className="border border-border rounded-lg px-2 py-1.5 text-sm bg-background text-foreground" />
                    <button onClick={() => confirmAssign(tx.id)} className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors" title="Confirmar"><Check className="w-4 h-4" /></button>
                    <button onClick={cancelAssign} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground transition-colors" title="Cancelar"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => startAssign(tx.id)} className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"><CalendarPlus className="w-3.5 h-3.5" />Atribuir data</button>
                    <button onClick={() => markPaid(tx.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"><Check className="w-3.5 h-3.5" />Marcar como pago</button>
                    <button onClick={() => handleDeleteUndated(tx.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-muted-foreground hover:text-red-600 transition-colors" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border"><tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descrição</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Categoria</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vencimento</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {despesas.map(tx => {
                const od = tx.computedStatus === 'atrasado' ? daysOverdue(tx.dueDate) : 0;
                return (
                  <tr key={tx.id} className="hover:bg-muted/40 cursor-pointer" onClick={() => navigate('/financeiro/transacoes')}>
                    <td className="px-4 py-3 font-medium text-foreground">{tx.description}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{tx.categoryName || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(tx.dueDate)}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(tx.amount)}</td>
                    <td className="px-4 py-3 text-center"><span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', getStatusColor(tx.computedStatus))}>{tx.computedStatus === 'atrasado' && od > 0 ? `${od}d atraso` : getStatusLabel(tx.computedStatus)}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
