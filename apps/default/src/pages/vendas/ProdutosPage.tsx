import React from 'react';
import { Package } from 'lucide-react';
import { useAppStore } from '../../store/useStore';
import { formatCurrency } from '../../lib/utils';
import { cn } from '../../lib/utils';
export default function ProdutosPage() {
  const { products } = useAppStore();
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Package className="w-6 h-6 text-primary" />Produtos e Serviços</h1></div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b border-border"><tr>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Código</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Categoria</th>
            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Preço</th>
            <th className="text-center px-4 py-3 font-medium text-muted-foreground">Tipo</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.code}</td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{p.category}</td>
                <td className="px-4 py-3 text-right font-bold text-foreground">{formatCurrency(p.unitPrice)}</td>
                <td className="px-4 py-3 text-center"><span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', p.type === 'produto' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700')}>{p.type === 'produto' ? 'Produto' : 'Serviço'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
