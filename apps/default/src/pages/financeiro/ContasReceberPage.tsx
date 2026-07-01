import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowUpRight } from 'lucide-react';
import { useAppStore } from '../../store/useStore';
import { cn, formatCurrency, formatDate, getStatusColor, getStatusLabel } from '../../lib/utils';
import { computeStatus, daysOverdue } from '../../types';

export default function ContasReceberPage() {
  const navigate = useNavigate();
  const { transactions } = useAppStore();
  const receitas = transactions.filter(t => t.type === 'receita').map(t => ({ ...t, computedStatus: computeStatus(t) })).sort((a, b) => new Date(a.dueDate as string).getTime() - new Date(b.dueDate as string).getTime());
  const totals = { pendente: receitas.filter(t => t.computedStatus === 'pendente' || t.computedStatus === 'atrasado').reduce((s, t) => s + t.amount, 0), recebido: receitas.filter(t => t.computedStatus === 'recebido' || t.computedStatus === 'pago').reduce((s, t) => s + t.amount, 0) };
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><ArrowUpRight className="w-6 h-6 text-green-500" />Contas a Receber</h1><p className="text-muted-foreground text-sm">{receitas.length} lançamentos</p></div>
        <button onClick={() => navigate('/financeiro/transacoes?tipo=receita&new=true')} className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"><Plus className="w-4 h-4" />Nova Receita</button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4"><p className="text-xs text-muted-foreground mb-1">A Receber</p><p className="text-xl font-bold text-blue-600">{formatCurrency(totals.pendente)}</p></div>
        <div className="bg-card border border-border rounded-xl p-4"><p className="text-xs text-muted-foreground mb-1">Recebido no Período</p><p className="text-xl font-bold text-green-600">{formatCurrency(totals.recebido)}</p></div>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border"><tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descrição</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Cliente</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vencimento</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {receitas.map(tx => {
                const od = tx.computedStatus === 'atrasado' ? daysOverdue(tx.dueDate) : 0;
                return (
                  <tr key={tx.id} className="hover:bg-muted/40 cursor-pointer" onClick={() => navigate('/financeiro/transacoes')}>
                    <td className="px-4 py-3 font-medium text-foreground">{tx.description}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{tx.customerName || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(tx.dueDate)}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(tx.amount)}</td>
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
