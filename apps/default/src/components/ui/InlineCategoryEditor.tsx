import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Category } from '../../types';

interface InlineCategoryEditorProps {
  value?: string;
  categories: Category[];
  onChange: (categoryId: string) => void;
  placeholder?: string;
  // Quando definido, a categoria pai fica fixa (ex: "Cartão de Crédito" para
  // itens de fatura) e só a subcategoria (filha desse id) fica editável.
  lockedParentId?: string;
}

export default function InlineCategoryEditor({ value, categories, onChange, placeholder = 'Sem categoria', lockedParentId }: InlineCategoryEditorProps) {
  const [editing, setEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const categorySelectRef = useRef<HTMLSelectElement>(null);
  const subcategorySelectRef = useRef<HTMLSelectElement>(null);

  const current = categories.find(c => c.id === value);
  const rootCategories = useMemo(() => categories.filter(c => !c.parentId), [categories]);

  const [parentId, setParentId] = useState(current ? (current.parentId || current.id) : '');
  const subcategories = useMemo(() => categories.filter(c => c.parentId === (lockedParentId ?? parentId)), [categories, parentId, lockedParentId]);

  useEffect(() => {
    if (editing) {
      setParentId(current ? (current.parentId || current.id) : '');
      (lockedParentId ? subcategorySelectRef : categorySelectRef).current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  if (editing) {
    if (lockedParentId) {
      return (
        <div
          ref={containerRef}
          className="flex items-center gap-1"
          onBlur={e => {
            if (!containerRef.current?.contains(e.relatedTarget as Node)) setEditing(false);
          }}
        >
          <select
            ref={subcategorySelectRef}
            autoFocus
            className="text-xs border border-border rounded-lg px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary max-w-[160px]"
            value={current?.parentId === lockedParentId ? current.id : ''}
            onChange={e => { onChange(e.target.value || lockedParentId); setEditing(false); }}
          >
            <option value="">Sem subcategoria</option>
            {subcategories.map(c => <option key={c.id} value={c.id}>{c.emoji ? `${c.emoji} ` : ''}{c.name}</option>)}
          </select>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className="flex items-center gap-1"
        onBlur={e => {
          if (!containerRef.current?.contains(e.relatedTarget as Node)) setEditing(false);
        }}
      >
        <select
          ref={categorySelectRef}
          autoFocus
          className="text-xs border border-border rounded-lg px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary max-w-[140px]"
          value={parentId}
          onChange={e => {
            const newParentId = e.target.value;
            setParentId(newParentId);
            if (!newParentId) { onChange(''); setEditing(false); return; }
            onChange(newParentId);
            const hasChildren = categories.some(c => c.parentId === newParentId);
            if (!hasChildren) setEditing(false);
          }}
        >
          <option value="">Sem categoria</option>
          {rootCategories.map(c => <option key={c.id} value={c.id}>{c.emoji ? `${c.emoji} ` : ''}{c.name}</option>)}
        </select>
        {parentId && subcategories.length > 0 && (
          <select
            className="text-xs border border-border rounded-lg px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary max-w-[140px]"
            value={current?.parentId === parentId ? current.id : ''}
            onChange={e => { onChange(e.target.value || parentId); setEditing(false); }}
          >
            <option value="">Sem subcategoria</option>
            {subcategories.map(c => <option key={c.id} value={c.id}>{c.emoji ? `${c.emoji} ` : ''}{c.name}</option>)}
          </select>
        )}
      </div>
    );
  }

  const parentOfCurrent = current?.parentId ? categories.find(c => c.id === current.parentId) : undefined;

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium hover:bg-muted transition-colors border border-transparent hover:border-border max-w-[220px]"
      title="Clique para editar a categoria"
    >
      {current ? (
        <>
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: current.color }} />
          <span className="text-foreground truncate">
            {lockedParentId ? current.name : (parentOfCurrent ? `${parentOfCurrent.name} › ${current.name}` : current.name)}
          </span>
        </>
      ) : (
        <span className="text-muted-foreground italic">{placeholder}</span>
      )}
    </button>
  );
}
