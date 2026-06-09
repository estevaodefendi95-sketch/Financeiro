import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useAppStore } from '../../store/useStore';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '../../lib/utils';
import { cn } from '../../lib/utils';
export default function PedidosPage() {
  const { salesOrders } = useAppStore();
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><ShoppingCart className="w-6 h-6 text-primary" />Pedidos de Venda</h1></div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b border-border"><tr>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Número</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Data</th>
            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
            <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {salesOrders.map(o => (
              <tr key={o.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 font-medium text-foreground">{o.number}</td>
                <td className="px-4 py-3 text-muted-foreground">{o.customerName}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{formatDate(o.createdAt)}</td>
                <td className="px-4 py-3 text-right font-bold text-foreground">{formatCurrency(o.total)}</td>
                <td className="px-4 py-3 text-center"><span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', getStatusColor(o.status))}>{getStatusLabel(o.status)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
