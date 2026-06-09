import React, { useState } from 'react';
import { Settings, Building2, Landmark, Tag, MapPin, Database } from 'lucide-react';
import { useAppStore, useAuthStore } from '../store/useStore';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';

export default function ConfiguracoesPage() {
  const { company, bankAccounts, categories } = useAppStore();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'empresa'|'contas'|'categorias'|'integrações'>('empresa');

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Settings className="w-6 h-6" />Configurações</h1></div>
      <div className="flex gap-2 border-b border-border pb-0 flex-wrap">
        {(['empresa','contas','categorias','integrações'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>{t}</button>
        ))}
      </div>

      {tab === 'empresa' && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4 max-w-xl">
          <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><Building2 className="w-5 h-5 text-blue-600" /></div><h3 className="font-semibold text-foreground">Dados da Empresa</h3></div>
          {[['Razão Social', company.name], ['CNPJ', company.cnpj || '—'], ['Segmento', company.segment || '—'], ['E-mail', company.email], ['Telefone', company.phone]].map(([l, v]) => (
            <div key={l} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm text-muted-foreground">{l}</span>
              <span className="text-sm font-medium text-foreground">{v}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'contas' && (
        <div className="space-y-3">
          {bankAccounts.map(acc => (
            <div key={acc.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: (acc.color || '#1565C0') + '20' }}><Landmark className="w-5 h-5" style={{ color: acc.color || '#1565C0' }} /></div>
                <div><p className="font-medium text-foreground">{acc.name}</p><p className="text-xs text-muted-foreground">{acc.bank} · Ag {acc.agency} · CC {acc.account}</p></div>
              </div>
              <span className={`font-bold ${acc.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(acc.balance)}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'categorias' && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            {categories.map(cat => (
              <div key={cat.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                <span className="text-lg">{cat.emoji || '📁'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{cat.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{cat.type}</p>
                </div>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'integrações' && (
        <div className="space-y-4 max-w-xl">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3"><Database className="w-5 h-5 text-emerald-500" /><h3 className="font-semibold text-foreground">Supabase</h3><span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">Conectado</span></div>
            <p className="text-sm text-muted-foreground">Banco de dados conectado em <code className="text-xs bg-muted px-1.5 py-0.5 rounded">jcqpuqhdfveleusjsxeo.supabase.co</code></p>
            <p className="text-xs text-muted-foreground mt-2">Execute o SQL Schema no Supabase SQL Editor para criar as tabelas do ERP.</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-2">Claude AI</h3>
            <p className="text-sm text-muted-foreground mb-3">Para ativar sugestões de categoria e análise de extratos com IA, configure a chave Anthropic.</p>
            <p className="text-xs bg-muted rounded-lg p-3 text-muted-foreground"><strong>Como configurar:</strong> Vá em Space Settings → Secrets → Adicione a chave <code>anthropic</code> com seu API key da Anthropic.</p>
          </div>
        </div>
      )}
    </div>
  );
}
