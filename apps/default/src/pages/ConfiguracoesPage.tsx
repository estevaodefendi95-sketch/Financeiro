import React, { useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Settings, Building2, Landmark, Database, Plus, Pencil, Trash2, CornerDownRight } from 'lucide-react';
import { useAppStore, useAuthStore } from '../store/useStore';
import { formatCurrency } from '../lib/utils';
import Modal, { ConfirmModal } from '../components/ui/Modal';
import { toast } from 'sonner';
import type { Category } from '../types';

const CATEGORY_TYPES: { value: Category['type']; label: string }[] = [
  { value: 'despesa', label: 'Despesa' },
  { value: 'receita', label: 'Receita' },
  { value: 'both', label: 'Ambos' },
];

interface CategoryFormState {
  id?: string;
  name: string;
  type: Category['type'];
  color: string;
  emoji: string;
  parentId: string;
}

function emptyForm(parentId?: string, type?: Category['type']): CategoryFormState {
  return { name: '', type: type || 'despesa', color: '#6366f1', emoji: '', parentId: parentId || '' };
}

function CategoryFormModal({ open, onClose, initial, rootCategories, onSave }: {
  open: boolean;
  onClose: () => void;
  initial: CategoryFormState;
  rootCategories: Category[];
  onSave: (form: CategoryFormState) => void;
}) {
  const [form, setForm] = useState(initial);
  React.useEffect(() => { if (open) setForm(initial); }, [open, initial]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={form.id ? 'Editar categoria' : 'Nova categoria'}
      size="sm"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors">Cancelar</button>
          <button
            onClick={() => {
              if (!form.name.trim()) { toast.error('Informe um nome'); return; }
              onSave(form);
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
          >
            Salvar
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Nome</label>
          <input
            autoFocus
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Categoria pai</label>
          <select
            value={form.parentId}
            onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
          >
            <option value="">Nenhuma (categoria raiz)</option>
            {rootCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Tipo</label>
          <select
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value as Category['type'] }))}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
          >
            {CATEGORY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground mb-1.5">Emoji</label>
            <input
              value={form.emoji}
              onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
              maxLength={2}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground mb-1.5">Cor</label>
            <input
              type="color"
              value={form.color}
              onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
              className="w-full h-[38px] border border-border rounded-lg bg-background"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function ConfiguracoesPage() {
  const { company, bankAccounts, categories, transactions, creditCardItems, addCategory, updateCategory, deleteCategory } = useAppStore();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'empresa'|'contas'|'categorias'|'integrações'>('empresa');

  const [formOpen, setFormOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<CategoryFormState>(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteBlockedMessage, setDeleteBlockedMessage] = useState<string | null>(null);

  const rootCategories = useMemo(() => categories.filter(c => !c.parentId), [categories]);
  const childrenByParent = useMemo(() => {
    const map = new Map<string, Category[]>();
    categories.filter(c => c.parentId).forEach(c => {
      if (!map.has(c.parentId!)) map.set(c.parentId!, []);
      map.get(c.parentId!)!.push(c);
    });
    return map;
  }, [categories]);

  const openNewRoot = () => { setFormInitial(emptyForm()); setFormOpen(true); };
  const openNewChild = (parent: Category) => { setFormInitial(emptyForm(parent.id, parent.type === 'both' ? 'despesa' : parent.type)); setFormOpen(true); };
  const openEdit = (cat: Category) => { setFormInitial({ id: cat.id, name: cat.name, type: cat.type, color: cat.color, emoji: cat.emoji || '', parentId: cat.parentId || '' }); setFormOpen(true); };

  const handleSave = (form: CategoryFormState) => {
    if (form.id) {
      // parentId precisa ir como null (não undefined) para conseguir limpar
      // uma categoria pai já existente ao mover a subcategoria para raiz —
      // undefined é descartado pelo toSnake e o valor antigo ficaria preso.
      updateCategory(form.id, {
        name: form.name.trim(), type: form.type, color: form.color,
        emoji: form.emoji || undefined,
        parentId: (form.parentId || null) as unknown as string | undefined,
      });
      toast.success('Categoria atualizada');
    } else {
      addCategory({
        id: uuidv4(), companyId: company.id, active: true,
        name: form.name.trim(), type: form.type, color: form.color,
        emoji: form.emoji || undefined, parentId: form.parentId || undefined,
      });
      toast.success('Categoria criada');
    }
    setFormOpen(false);
  };

  const requestDelete = (cat: Category) => {
    const childCount = (childrenByParent.get(cat.id) || []).length;
    if (childCount > 0) {
      setDeleteBlockedMessage(`Esta categoria tem ${childCount} subcategoria${childCount > 1 ? 's' : ''}. Exclua ou mova as subcategorias antes de excluir a categoria pai.`);
      return;
    }
    const itemsUsing = creditCardItems.filter(i => i.categoryId === cat.id).length;
    const txUsing = transactions.filter(t => t.categoryId === cat.id).length;
    if (itemsUsing > 0 || txUsing > 0) {
      const parts: string[] = [];
      if (txUsing > 0) parts.push(`${txUsing} lançamento${txUsing > 1 ? 's' : ''}`);
      if (itemsUsing > 0) parts.push(`${itemsUsing} item${itemsUsing > 1 ? 's' : ''} de fatura de cartão`);
      setDeleteBlockedMessage(`Esta categoria está em uso por ${parts.join(' e ')}. Recategorize-os antes de excluir.`);
      return;
    }
    setDeleteTarget(cat);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteCategory(deleteTarget.id);
    toast.success('Categoria excluída');
    setDeleteTarget(null);
  };

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
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={openNewRoot} className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold transition-colors shadow-sm">
              <Plus className="w-4 h-4" />Nova categoria
            </button>
          </div>
          <div className="space-y-2">
            {rootCategories.map(root => {
              const children = childrenByParent.get(root.id) || [];
              return (
                <div key={root.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="p-3 flex items-center gap-3">
                    <span className="text-lg">{root.emoji || '📁'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{root.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{root.type}</p>
                    </div>
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: root.color }} />
                    <button onClick={() => openNewChild(root)} title="Nova subcategoria" className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"><Plus className="w-4 h-4" /></button>
                    <button onClick={() => openEdit(root)} title="Editar" className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => requestDelete(root)} title="Excluir" className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-muted-foreground hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  {children.length > 0 && (
                    <div className="divide-y divide-border border-t border-border">
                      {children.map(child => (
                        <div key={child.id} className="p-3 pl-8 flex items-center gap-3">
                          <CornerDownRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-lg">{child.emoji || '📁'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{child.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{child.type}</p>
                          </div>
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: child.color }} />
                          <button onClick={() => openEdit(child)} title="Editar" className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => requestDelete(child)} title="Excluir" className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-muted-foreground hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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

      <CategoryFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={formInitial}
        rootCategories={rootCategories}
        onSave={handleSave}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Excluir categoria"
        message={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
      />

      {deleteBlockedMessage && (
        <Modal
          open
          onClose={() => setDeleteBlockedMessage(null)}
          title="Não é possível excluir"
          size="sm"
          footer={<button onClick={() => setDeleteBlockedMessage(null)} className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors">Entendi</button>}
        >
          <p className="text-muted-foreground text-sm">{deleteBlockedMessage}</p>
        </Modal>
      )}
    </div>
  );
}
