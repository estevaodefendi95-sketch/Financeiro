import React, { useState } from 'react';
import { Users, Plus, Search } from 'lucide-react';
import { useAppStore } from '../../store/useStore';
import { formatDocument, formatPhone } from '../../lib/utils';

export default function ClientesPage() {
  const { customers } = useAppStore();
  const [search, setSearch] = useState('');
  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.document?.includes(search) || c.email?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Users className="w-6 h-6 text-primary" />Clientes</h1><p className="text-muted-foreground text-sm">{customers.length} cadastrados</p></div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold transition-colors shadow-sm"><Plus className="w-4 h-4" />Novo Cliente</button>
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input className="w-full pl-9 pr-4 py-2 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Buscar clientes..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b border-border"><tr>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Documento</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">E-mail</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Telefone</th>
            <th className="text-center px-4 py-3 font-medium text-muted-foreground">Tipo</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-muted/40 cursor-pointer">
                <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.document ? formatDocument(c.document) : '—'}</td>
                <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{c.email || '—'}</td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{c.phone ? formatPhone(c.phone) : '—'}</td>
                <td className="px-4 py-3 text-center"><span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">{c.type === 'pessoa_fisica' ? 'PF' : 'PJ'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
