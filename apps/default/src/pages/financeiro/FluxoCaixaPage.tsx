import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../store/useStore';
import { formatCurrency, getMonthName } from '../../lib/utils';
import { computeStatus } from '../../types';

export default function FluxoCaixaPage() {
  const { transactions, bankAccounts } = useAppStore();
  const [period, setPeriod] = useState<30|60|90>(90);
  const today = new Date(); const thisMonth = today.getMonth(); const thisYear = today.getFullYear();

  const monthlyData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(thisYear, thisMonth - 5 + i, 1);
      const mo = d.getMonth(); const yr = d.getFullYear();
      const txs = transactions.map(t => ({ ...t, cs: computeStatus(t) }));
      const receitas = txs.filter(t => t.type === 'receita' && (t.cs === 'recebido' || t.cs === 'pago') && new Date(t.dueDate).getMonth() === mo && new Date(t.dueDate).getFullYear() === yr).reduce((s, t) => s + t.amount, 0);
      const despesas = txs.filter(t => t.type === 'despesa' && t.cs === 'pago' && new Date(t.dueDate).getMonth() === mo && new Date(t.dueDate).getFullYear() === yr).reduce((s, t) => s + t.amount, 0);
      return { name: `${getMonthName(mo)}/${yr.toString().slice(2)}`, receitas, despesas, saldo: receitas - despesas };
    });
  }, [transactions, thisMonth, thisYear]);

  const saldoInicial = bankAccounts.reduce((s, b) => s + b.balance, 0);
  const projectedNegative = saldoInicial - transactions.filter(t => { const cs = computeStatus(t); return t.type === 'despesa' && (cs === 'pendente' || cs === 'atrasado'); }).reduce((s, t) => s + t.amount, 0) < 0;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><TrendingUp className="w-6 h-6 text-primary" />Fluxo de Caixa</h1></div>
        <div className="flex rounded-xl border border-border overflow-hidden text-sm">
          {([30,60,90] as const).map(p => <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 transition-colors ${period === p ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}>{p}d</button>)}
        </div>
      </div>
      {projectedNegative && (
        <div className="flex items-center gap-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 rounded-xl px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span><strong>Atenção:</strong> Saldo projetado pode ficar negativo com base nas despesas pendentes.</span>
        </div>
      )}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-4">Fluxo Mensal — 6 Meses</h3>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
              <linearGradient id="gd" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="receitas" name="Receitas" stroke="#22c55e" strokeWidth={2} fill="url(#gr)" />
            <Area type="monotone" dataKey="despesas" name="Despesas" stroke="#ef4444" strokeWidth={2} fill="url(#gd)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {monthlyData.slice(-3).map(d => (
          <div key={d.name} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-2">{d.name}</p>
            <div className="space-y-1">
              <p className="text-sm text-green-600">+{formatCurrency(d.receitas)}</p>
              <p className="text-sm text-red-600">-{formatCurrency(d.despesas)}</p>
              <p className={`text-sm font-bold border-t border-border pt-1 mt-1 ${d.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(d.saldo)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
