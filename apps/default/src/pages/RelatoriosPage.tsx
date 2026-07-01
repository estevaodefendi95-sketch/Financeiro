import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAppStore } from '../store/useStore';
import { formatCurrency, getMonthName } from '../lib/utils';
import { computeStatus } from '../types';

const COLORS = ['#1565C0','#ef4444','#f97316','#eab308','#8b5cf6','#06b6d4','#14b8a6'];

export default function RelatoriosPage() {
  const { transactions, categories, creditCardItems } = useAppStore();
  const today = new Date(); const thisMonth = today.getMonth(); const thisYear = today.getFullYear();

  const txs = useMemo(() => transactions.map(t => ({ ...t, cs: computeStatus(t) })), [transactions]);
  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  // Compras individuais de cartão entram na DRE por invoice_month (mês da
  // compra/fatura), independente de status de pagamento — regime de
  // competência, já que a despesa existe contabilmente assim que a compra
  // acontece (mesmo critério aplicado às pendências "sem data").
  const cardItemsOfMonth = (mo: number, yr: number) => creditCardItems.filter(i => {
    const d = new Date(i.invoiceMonth);
    return d.getMonth() === mo && d.getFullYear() === yr;
  });

  const dre = useMemo(() => {
    const receitas = txs.filter(t => t.type === 'receita' && (t.cs === 'recebido' || t.cs === 'pago') && t.dueDate && new Date(t.dueDate).getMonth() === thisMonth).reduce((s, t) => s + t.amount, 0);
    const despesasTx = txs.filter(t => t.type === 'despesa' && t.cs === 'pago' && !t.isUndated && !t.creditCardId && t.dueDate && new Date(t.dueDate).getMonth() === thisMonth).reduce((s, t) => s + t.amount, 0);
    const despesasCartao = cardItemsOfMonth(thisMonth, thisYear).reduce((s, i) => s + i.amount, 0);
    const despesas = despesasTx + despesasCartao;
    return { receitas, despesas, despesasCartao, resultado: receitas - despesas };
  }, [txs, thisMonth, thisYear, creditCardItems]);

  // Despesas sem data (is_undated): custo já incorrido contabilmente, mas sem período definido —
  // bloco separado, não entra no resultado do mês corrente acima.
  const semData = useMemo(() => {
    const items = txs.filter(t => t.type === 'despesa' && t.isUndated && t.status !== 'cancelado');
    return { count: items.length, total: items.reduce((s, t) => s + t.amount, 0) };
  }, [txs]);

  const barData = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = new Date(thisYear, thisMonth - 5 + i, 1);
    const mo = d.getMonth(); const yr = d.getFullYear();
    const r = txs.filter(t => t.type === 'receita' && (t.cs === 'recebido' || t.cs === 'pago') && t.dueDate && new Date(t.dueDate).getMonth() === mo && new Date(t.dueDate).getFullYear() === yr).reduce((s, t) => s + t.amount, 0);
    const d2Tx = txs.filter(t => t.type === 'despesa' && t.cs === 'pago' && !t.isUndated && !t.creditCardId && t.dueDate && new Date(t.dueDate).getMonth() === mo && new Date(t.dueDate).getFullYear() === yr).reduce((s, t) => s + t.amount, 0);
    const d2Cartao = cardItemsOfMonth(mo, yr).reduce((s, i) => s + i.amount, 0);
    return { name: getMonthName(mo), receitas: r, despesas: d2Tx + d2Cartao };
  }), [txs, thisMonth, thisYear, creditCardItems]);

  const catData = useMemo(() => {
    const map = new Map<string, number>();
    txs.filter(t => t.type === 'despesa' && t.cs === 'pago' && !t.isUndated && !t.creditCardId && t.dueDate && new Date(t.dueDate).getMonth() === thisMonth).forEach(t => { const n = t.categoryName || 'Outros'; map.set(n, (map.get(n) || 0) + t.amount); });
    cardItemsOfMonth(thisMonth, thisYear).forEach(i => { const n = (i.categoryId && categoryMap.get(i.categoryId)?.name) || 'Outros'; map.set(n, (map.get(n) || 0) + i.amount); });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));
  }, [txs, thisMonth, thisYear, creditCardItems, categoryMap]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><BarChart3 className="w-6 h-6 text-primary" />Relatórios Financeiros</h1></div>

      {/* DRE Summary */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-4">DRE — {getMonthName(thisMonth)}/{thisYear}</h3>
        <div className="space-y-3">
          {[['(+) Receitas Brutas', dre.receitas, 'text-green-600'], ['(-) Despesas Operacionais', dre.despesas, 'text-red-600'], ['(=) Resultado do Período', dre.resultado, dre.resultado >= 0 ? 'text-green-600' : 'text-red-600']].map(([l, v, c]) => (
            <div key={l as string} className={`flex items-center justify-between py-2 ${l === '(=) Resultado do Período' ? 'border-t-2 border-foreground pt-3 mt-2' : 'border-b border-border'}`}>
              <span className={`text-sm ${l === '(=) Resultado do Período' ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>{l}</span>
              <span className={`font-bold ${c}`}>{formatCurrency(v as number)}</span>
            </div>
          ))}
        </div>
        {dre.despesasCartao > 0 && (
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
            Inclui {formatCurrency(dre.despesasCartao)} de compras de cartão de crédito do mês (por competência —
            independente de a fatura já ter sido paga).
          </p>
        )}
      </div>

      {/* DRE — Despesas sem data (custo já incorrido, sem previsão de pagamento) */}
      {semData.count > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-300 dark:border-amber-800 rounded-xl p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-300">Despesas Sem Data — Custo Incorrido</h3>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">{semData.count} lançamento{semData.count > 1 ? 's' : ''} sem previsão de pagamento. Contabilmente já existem como custo, mas não entram no resultado do mês acima.</p>
              </div>
            </div>
            <p className="text-xl font-bold text-amber-900 dark:text-amber-300">{formatCurrency(semData.total)}</p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Receitas vs Despesas — 6 Meses</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="receitas" name="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Despesas por Categoria</h3>
          {catData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart><Pie data={catData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">{catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v: number) => formatCurrency(v)} /></PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">{catData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="text-muted-foreground truncate max-w-32">{item.name}</span></div>
                  <span className="font-medium text-foreground">{formatCurrency(item.value)}</span>
                </div>
              ))}</div>
            </>
          ) : <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Sem dados no mês</div>}
        </div>
      </div>
    </div>
  );
}
