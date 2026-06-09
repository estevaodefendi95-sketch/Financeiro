import React from 'react';
import { Boxes, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../store/useStore';
import { formatCurrency } from '../lib/utils';
import { cn } from '../lib/utils';

export default function EstoquePage() {
  const { products, stockMovements } = useAppStore();
  const baixoEstoque = products.filter(p => p.type === 'produto' && p.stock <= p.minStock);
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Boxes className="w-6 h-6 text-primary" />Estoque</h1></div>
      {baixoEstoque.length > 0 && (
        <div className="flex items-center gap-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 rounded-xl px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4" /><span><strong>{baixoEstoque.length} produto{baixoEstoque.length > 1 ? 's' : ''}</strong> com estoque abaixo do mínimo</span>
        </div>
      )}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b border-border"><tr>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Produto</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Categoria</th>
            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Estoque</th>
            <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Mín.</th>
            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Preço</th>
            <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {products.filter(p => p.type === 'produto').map(p => {
              const low = p.stock <= p.minStock;
              return (
                <tr key={p.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3"><p className="font-medium text-foreground">{p.name}</p><p className="text-xs text-muted-foreground">{p.code}</p></td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.category}</td>
                  <td className="px-4 py-3 text-right font-bold text-foreground">{p.stock} {p.unit}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">{p.minStock} {p.unit}</td>
                  <td className="px-4 py-3 text-right text-foreground">{formatCurrency(p.unitPrice)}</td>
                  <td className="px-4 py-3 text-center"><span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', low ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')}>{low ? 'Baixo' : 'Normal'}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border"><h3 className="font-semibold text-foreground">Últimas Movimentações</h3></div>
        <div className="divide-y divide-border">
          {stockMovements.slice(0, 10).map(m => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3">
              <div><p className="text-sm font-medium text-foreground">{m.productName}</p><p className="text-xs text-muted-foreground">{m.reason}</p></div>
              <span className={cn('text-sm font-bold', m.type === 'entrada' ? 'text-green-600' : 'text-red-600')}>{m.type === 'entrada' ? '+' : '-'}{m.quantity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
