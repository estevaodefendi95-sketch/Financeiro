import React, { useEffect, useRef, useState } from 'react';
import type { Category } from '../../types';

interface InlineCategoryEditorProps {
  value?: string;
  categories: Category[];
  onChange: (categoryId: string) => void;
  placeholder?: string;
}

export default function InlineCategoryEditor({ value, categories, onChange, placeholder = 'Sem categoria' }: InlineCategoryEditorProps) {
  const [editing, setEditing] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);
  const current = categories.find(c => c.id === value);

  useEffect(() => {
    if (editing) selectRef.current?.focus();
  }, [editing]);

  if (editing) {
    return (
      <select
        ref={selectRef}
        autoFocus
        className="text-xs border border-border rounded-lg px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary max-w-[180px]"
        value={value || ''}
        onChange={e => { onChange(e.target.value); setEditing(false); }}
        onBlur={() => setEditing(false)}
      >
        <option value="">Sem categoria</option>
        {categories.map(c => <option key={c.id} value={c.id}>{c.emoji ? `${c.emoji} ` : ''}{c.name}</option>)}
      </select>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium hover:bg-muted transition-colors border border-transparent hover:border-border max-w-[180px]"
      title="Clique para editar a categoria"
    >
      {current ? (
        <>
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: current.color }} />
          <span className="text-foreground truncate">{current.name}</span>
        </>
      ) : (
        <span className="text-muted-foreground italic">{placeholder}</span>
      )}
    </button>
  );
}
