import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, ArrowUpRight, ArrowDownRight, Calendar as CalIcon } from 'lucide-react';
import { useAppStore } from '../../store/useStore';
import { cn, formatCurrency, formatDate, getStatusColor, getStatusLabel, isSameDay, getDaysInMonth, getMonthFullName } from '../../lib/utils';
import { computeStatus, daysOverdue } from '../../types';
import type { Transaction } from '../../types';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface DayData {
  date: Date;
  receitas: number;
  despesas: number;
  transactions: (Transaction & { computedStatus: string })[];
}

export default function CalendarioPage() {
  const { transactions } = useAppStore();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [filter, setFilter] = useState<'ambos' | 'receita' | 'despesa'>('ambos');

  const txWithStatus = useMemo(() => transactions.map(t => ({ ...t, computedStatus: computeStatus(t) })), [transactions]);

  const days = useMemo(() => getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth()), [currentMonth]);

  const dayDataMap = useMemo(() => {
    const map = new Map<string, DayData>();
    txWithStatus.forEach(tx => {
      const dateStr = tx.dueDate;
      if (!dateStr) return;
      if (!map.has(dateStr)) map.set(dateStr, { date: new Date(dateStr + 'T00:00:00'), receitas: 0, despesas: 0, transactions: [] });
      const d = map.get(dateStr)!;
      if (tx.type === 'receita') d.receitas += tx.amount;
      else if (tx.type === 'despesa') d.despesas += tx.amount;
      d.transactions.push(tx);
    });
    return map;
  }, [txWithStatus]);

  const periodSummary = useMemo(() => {
    const monthTx = txWithStatus.filter(tx => { if (!tx.dueDate) return false; const d = new Date(tx.dueDate + 'T00:00:00'); return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear(); });
    const receitas = monthTx.filter(t => t.type === 'receita').reduce((s, t) => s + t.amount, 0);
    const despesas = monthTx.filter(t => t.type === 'despesa').reduce((s, t) => s + t.amount, 0);
    const pagas = monthTx.filter(t => t.type === 'despesa' && (t.computedStatus === 'pago' || t.computedStatus === 'recebido')).reduce((s, t) => s + t.amount, 0);
    const recebidas = monthTx.filter(t => t.type === 'receita' && (t.computedStatus === 'pago' || t.computedStatus === 'recebido')).reduce((s, t) => s + t.amount, 0);
    return { receitas, despesas, saldo: receitas - despesas, recebidas, pagas };
  }, [txWithStatus, currentMonth]);

  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><CalIcon className="w-6 h-6 text-primary" /> Calendário Financeiro</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Visualize entradas e saídas por dia</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border overflow-hidden text-sm">
            {(['ambos','receita','despesa'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={cn('px-3 py-1.5 transition-colors capitalize', filter === f ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground')}>{f === 'ambos' ? 'Tudo' : f === 'receita' ? 'Receitas' : 'Despesas'}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Period Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Entradas', value: periodSummary.receitas, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' },
          { label: 'Saídas', value: periodSummary.despesas, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
          { label: 'Saldo', value: periodSummary.saldo, color: periodSummary.saldo >= 0 ? 'text-green-600' : 'text-red-600', bg: 'bg-card border-border' },
          { label: 'Realizado', value: periodSummary.recebidas - periodSummary.pagas, color: 'text-primary', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
        ].map(item => (
          <div key={item.label} className={cn('rounded-xl border p-4', item.bg)}>
            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
            <p className={cn('text-lg font-bold', item.color)}>{formatCurrency(item.value)}</p>
          </div>
        ))}
      </div>

      {/* Calendar Header Nav */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <button onClick={prevMonth} className="p-2 hover:bg-muted rounded-lg transition-colors"><ChevronLeft className="w-5 h-5 text-muted-foreground" /></button>
          <div className="text-center">
            <h2 className="font-bold text-foreground text-lg">{getMonthFullName(currentMonth.getMonth())} {currentMonth.getFullYear()}</h2>
            <button onClick={() => { setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1)); }} className="text-xs text-primary hover:underline">Hoje</button>
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-muted rounded-lg transition-colors"><ChevronRight className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map(wd => (
            <div key={wd} className="py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">{wd}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {/* Empty cells */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-24 border-r border-b border-border bg-muted/20" />
          ))}

          {days.map((date, idx) => {
            const dateStr = date.toISOString().split('T')[0];
            const data = dayDataMap.get(dateStr);
            const isToday = isSameDay(date, today);
            const isSelected = selectedDay && isSameDay(date, selectedDay.date);
            const hasData = data && data.transactions.length > 0;
            const atrasados = data?.transactions.filter(t => t.computedStatus === 'atrasado').length || 0;

            const showReceitas = filter === 'ambos' || filter === 'receita';
            const showDespesas = filter === 'ambos' || filter === 'despesa';

            return (
              <div
                key={dateStr}
                onClick={() => setSelectedDay(hasData ? (data ? { ...data, date } : null) : null)}
                className={cn(
                  'min-h-24 border-r border-b border-border p-1.5 transition-colors relative',
                  hasData ? 'cursor-pointer hover:bg-muted/30' : 'cursor-default',
                  isSelected && 'bg-primary/5 ring-1 ring-inset ring-primary',
                  isToday && !isSelected && 'bg-blue-50/50 dark:bg-blue-900/10'
                )}
              >
                {/* Day number */}
                <div className={cn('w-7 h-7 flex items-center justify-center text-sm font-medium rounded-full mb-1', isToday ? 'bg-primary text-primary-foreground' : 'text-foreground')}>
                  {date.getDate()}
                </div>
                {/* Pills */}
                {data && (
                  <div className="space-y-0.5">
                    {showReceitas && data.receitas > 0 && (
                      <div className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded px-1.5 py-0.5 flex items-center gap-1 truncate">
                        <ArrowUpRight className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate font-medium">{formatCurrency(data.receitas)}</span>
                      </div>
                    )}
                    {showDespesas && data.despesas > 0 && (
                      <div className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded px-1.5 py-0.5 flex items-center gap-1 truncate">
                        <ArrowDownRight className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate font-medium">{formatCurrency(data.despesas)}</span>
                      </div>
                    )}
                    {/* Net balance */}
                    {hasData && (
                      <div className={cn('text-xs font-bold px-1.5', data.receitas - data.despesas >= 0 ? 'text-green-600' : 'text-red-600')}>
                        {data.receitas - data.despesas >= 0 ? '+' : ''}{formatCurrency(data.receitas - data.despesas)}
                      </div>
                    )}
                    {atrasados > 0 && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[9px] font-bold">{atrasados}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Side panel */}
      {selectedDay && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-slide-in-right">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h3 className="font-bold text-foreground text-lg">{selectedDay.date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
              <div className="flex items-center gap-3 mt-1">
                {selectedDay.receitas > 0 && <span className="text-xs text-green-600 font-medium">+{formatCurrency(selectedDay.receitas)}</span>}
                {selectedDay.despesas > 0 && <span className="text-xs text-red-600 font-medium">-{formatCurrency(selectedDay.despesas)}</span>}
              </div>
            </div>
            <button onClick={() => setSelectedDay(null)} className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {selectedDay.transactions.map(tx => {
              const isReceita = tx.type === 'receita';
              const od = tx.computedStatus === 'atrasado' ? daysOverdue(tx.dueDate) : 0;
              return (
                <div key={tx.id} className="bg-muted/50 rounded-xl p-4 border border-border">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', isReceita ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30')}>
                        {isReceita ? <ArrowUpRight className="w-4 h-4 text-green-600" /> : <ArrowDownRight className="w-4 h-4 text-red-600" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{tx.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{tx.categoryName || '—'}</p>
                        {tx.paymentMethod && <p className="text-xs text-muted-foreground capitalize">{tx.paymentMethod.replace('_', ' ')}</p>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={cn('font-bold', isReceita ? 'text-green-600' : 'text-red-600')}>{isReceita ? '+' : '-'}{formatCurrency(tx.amount)}</p>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block', getStatusColor(tx.computedStatus))}>
                        {tx.computedStatus === 'atrasado' && od > 0 ? `${od}d atraso` : getStatusLabel(tx.computedStatus)}
                      </span>
                    </div>
                  </div>
                  {tx.notes && <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">{tx.notes}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
