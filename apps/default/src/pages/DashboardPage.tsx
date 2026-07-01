import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, Wallet, AlertCircle, AlertTriangle,
  Plus, Upload, ArrowUpRight, ArrowDownRight, Clock,
  DollarSign, Receipt, Users, Eye
} from 'lucide-react';
import { useAppStore } from '../store/useStore';
import { formatCurrency, formatDate, getMonthName, getStatusColor, getStatusLabel } from '../lib/utils';
import { cn } from '../lib/utils';
import { computeStatus as cs, daysOverdue as dov } from '../types';

const COLORS = ['#1565C0','#ef4444','#f97316','#eab308','#8b5cf6','#06b6d4'];

function KPICard({ title, value, sub, icon: Icon, color, trend }: { title: string; value: string; sub?: string; icon: React.ElementType; color: string; trend?: 'up' | 'down' | null }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-start justify-between group hover:shadow-md transition-shadow">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
        <p className="text-2xl font-bold text-foreground truncate">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ml-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium text-foreground">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { transactions, bankAccounts, categories } = useAppStore();

  const today = new Date();
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();

  const txWithStatus = useMemo(() => transactions.map(t => ({ ...t, status: cs(t) })), [transactions]);

  const kpis = useMemo(() => {
    const saldoTotal = bankAccounts.reduce((s, b) => s + b.balance, 0);
    const receitasMes = txWithStatus.filter(t => t.type === 'receita' && (t.status === 'recebido' || t.status === 'pago') && (t.paymentDate || t.dueDate) && new Date((t.paymentDate || t.dueDate) as string).getMonth() === thisMonth && new Date((t.paymentDate || t.dueDate) as string).getFullYear() === thisYear).reduce((s, t) => s + t.amount, 0);
    const despesasMes = txWithStatus.filter(t => t.type === 'despesa' && t.status === 'pago' && (t.paymentDate || t.dueDate) && new Date((t.paymentDate || t.dueDate) as string).getMonth() === thisMonth && new Date((t.paymentDate || t.dueDate) as string).getFullYear() === thisYear).reduce((s, t) => s + t.amount, 0);
    const resultadoMes = receitasMes - despesasMes;
    const aReceberD30 = txWithStatus.filter(t => t.type === 'receita' && (t.status === 'pendente' || t.status === 'atrasado' || t.status === 'agendado')).reduce((s, t) => s + t.amount, 0);
    // Pendências sem data (isUndated) não têm previsão de saída de caixa — mesma regra do Fluxo de Caixa/Calendário
    const aPagarD30 = txWithStatus.filter(t => t.type === 'despesa' && !t.isUndated && (t.status === 'pendente' || t.status === 'atrasado' || t.status === 'agendado')).reduce((s, t) => s + t.amount, 0);
    const atrasados = txWithStatus.filter(t => t.status === 'atrasado');
    return { saldoTotal, receitasMes, despesasMes, resultadoMes, aReceberD30, aPagarD30, atrasados };
  }, [txWithStatus, bankAccounts, thisMonth, thisYear]);

  // 6-month area chart
  const areaData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(thisYear, thisMonth - 5 + i, 1);
      const mo = d.getMonth(); const yr = d.getFullYear();
      const receitas = txWithStatus.filter(t => t.type === 'receita' && (t.status === 'recebido' || t.status === 'pago') && (t.paymentDate || t.dueDate) && new Date((t.paymentDate || t.dueDate) as string).getMonth() === mo && new Date((t.paymentDate || t.dueDate) as string).getFullYear() === yr).reduce((s, t) => s + t.amount, 0);
      const despesas = txWithStatus.filter(t => t.type === 'despesa' && t.status === 'pago' && (t.paymentDate || t.dueDate) && new Date((t.paymentDate || t.dueDate) as string).getMonth() === mo && new Date((t.paymentDate || t.dueDate) as string).getFullYear() === yr).reduce((s, t) => s + t.amount, 0);
      return { name: getMonthName(mo), receitas, despesas };
    });
  }, [txWithStatus, thisMonth, thisYear]);

  // Top 5 expense categories pie
  const pieData = useMemo(() => {
    const map = new Map<string, number>();
    txWithStatus.filter(t => t.type === 'despesa' && t.status === 'pago' && (t.paymentDate || t.dueDate) && new Date((t.paymentDate || t.dueDate) as string).getMonth() === thisMonth).forEach(t => {
      const name = t.categoryName || 'Outros';
      map.set(name, (map.get(name) || 0) + t.amount);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value }));
  }, [txWithStatus, thisMonth]);

  // Last 10 transactions
  const lastTen = useMemo(() => [...txWithStatus].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10), [txWithStatus]);

  const overdue = kpis.atrasados;
  const hasNegativeProjection = kpis.saldoTotal + kpis.aReceberD30 - kpis.aPagarD30 < 0;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/financeiro/transacoes?tipo=receita&new=true')} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Nova Receita
          </button>
          <button onClick={() => navigate('/financeiro/transacoes?tipo=despesa&new=true')} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Nova Despesa
          </button>
          <button onClick={() => navigate('/financeiro/conciliacao')} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Upload className="w-4 h-4" /> Importar Extrato
          </button>
        </div>
      </div>

      {/* Alerts */}
      {(overdue.length > 0 || hasNegativeProjection) && (
        <div className="space-y-2">
          {overdue.length > 0 && (
            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span><strong>{overdue.length} lançamento{overdue.length > 1 ? 's' : ''} atrasado{overdue.length > 1 ? 's'  : ''}</strong> — Total: <strong>{formatCurrency(overdue.reduce((s, t) => s + t.amount, 0))}</strong></span>
              <button onClick={() => navigate('/financeiro/transacoes?status=atrasado')} className="ml-auto text-red-600 hover:text-red-800 font-medium flex-shrink-0">Ver →</button>
            </div>
          )}
          {hasNegativeProjection && (
            <div className="flex items-center gap-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 rounded-xl px-4 py-3 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span><strong>Saldo projetado negativo</strong> — verifique seu fluxo de caixa para evitar problemas de liquidez.</span>
              <button onClick={() => navigate('/financeiro/fluxo')} className="ml-auto text-yellow-600 hover:text-yellow-800 font-medium flex-shrink-0">Ver Fluxo →</button>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard title="Saldo Atual" value={formatCurrency(kpis.saldoTotal)} sub={`${bankAccounts.length} conta${bankAccounts.length > 1 ? 's' : ''}`} icon={Wallet} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
        <KPICard title="Receitas do Mês" value={formatCurrency(kpis.receitasMes)} sub="Recebidas" icon={ArrowUpRight} color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" trend="up" />
        <KPICard title="Despesas do Mês" value={formatCurrency(kpis.despesasMes)} sub="Pagas" icon={ArrowDownRight} color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" trend="down" />
        <KPICard title="A Receber" value={formatCurrency(kpis.aReceberD30)} sub="Em aberto" icon={TrendingUp} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <KPICard title="A Pagar" value={formatCurrency(kpis.aPagarD30)} sub="Em aberto" icon={TrendingDown} color="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" />
        <KPICard title="Resultado do Mês" value={formatCurrency(kpis.resultadoMes)} sub={kpis.resultadoMes >= 0 ? 'Lucro' : 'Prejuízo'} icon={DollarSign} color={kpis.resultadoMes >= 0 ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Area Chart */}
        <div className="xl:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Fluxo de Caixa — 6 Meses</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Receitas vs Despesas</p>
            </div>
            <button onClick={() => navigate('/financeiro/fluxo')} className="text-xs text-primary hover:underline flex items-center gap-1">Ver completo <Eye className="w-3 h-3" /></button>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={areaData} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
              <defs>
                <linearGradient id="gradReceitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradDespesas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="receitas" name="Receitas" stroke="#22c55e" strokeWidth={2} fill="url(#gradReceitas)" />
              <Area type="monotone" dataKey="despesas" name="Despesas" stroke="#ef4444" strokeWidth={2} fill="url(#gradDespesas)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">Top Despesas</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Por categoria — mês atual</p>
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {pieData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground truncate">{item.name}</span>
                    </div>
                    <span className="font-medium text-foreground ml-2 flex-shrink-0">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Receipt className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Sem despesas no mês</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats + Last Transactions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Bank Accounts */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Contas Bancárias</h3>
          <div className="space-y-3">
            {bankAccounts.map(acc => (
              <div key={acc.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: acc.color + '20' }}>
                    <Wallet className="w-4 h-4" style={{ color: acc.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{acc.name}</p>
                    <p className="text-xs text-muted-foreground">{acc.bank}</p>
                  </div>
                </div>
                <span className={cn('text-sm font-bold', acc.balance >= 0 ? 'text-green-600' : 'text-red-600')}>{formatCurrency(acc.balance)}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total consolidado</span>
              <span className="font-bold text-foreground">{formatCurrency(bankAccounts.reduce((s, b) => s + b.balance, 0))}</span>
            </div>
          </div>
        </div>

        {/* Last Transactions */}
        <div className="xl:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Últimos Lançamentos</h3>
            <button onClick={() => navigate('/financeiro/transacoes')} className="text-xs text-primary hover:underline">Ver todos →</button>
          </div>
          <div className="space-y-2">
            {lastTen.map(tx => {
              const isReceita = tx.type === 'receita';
              const overdueDays = tx.status === 'atrasado' ? dov(tx.dueDate) : 0;
              return (
                <div key={tx.id} className="flex items-center gap-3 p-2.5 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer group" onClick={() => navigate(`/financeiro/transacoes?id=${tx.id}`)}>
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', isReceita ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30')}>
                    {isReceita ? <ArrowUpRight className="w-4 h-4 text-green-600" /> : <ArrowDownRight className="w-4 h-4 text-red-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.categoryName || '—'} · {formatDate(tx.dueDate)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn('text-sm font-bold', isReceita ? 'text-green-600' : 'text-red-600')}>{isReceita ? '+' : '-'}{formatCurrency(tx.amount)}</p>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', getStatusColor(tx.status))}>
                      {tx.status === 'atrasado' && overdueDays > 0 ? `${overdueDays}d atraso` : getStatusLabel(tx.status)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
